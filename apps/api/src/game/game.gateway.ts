import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseInterceptors } from '@nestjs/common';
import { TokenService, TokenPayload } from '../auth/token.service';
import { SocketLoggingInterceptor } from '../common/interceptors/socket-logging.interceptor';
import { PrismaService } from '../database/prisma.service';
import { RedisRoomRepository } from '../redis/redis-room.repository';

/** Grace period (ms) before an unexpectedly disconnected player is removed. */
const DISCONNECT_CLEANUP_DELAY_MS = 30_000;

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
})
@UseInterceptors(SocketLoggingInterceptor)
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(GameGateway.name);

  @WebSocketServer()
  server!: Server;

  /**
   * Tracks pending cleanup timers keyed by playerId.
   * When a player disconnects unexpectedly, a timer is scheduled to remove them
   * from Redis after the grace period. If they reconnect in time the timer is
   * cancelled here before it fires.
   */
  readonly disconnectTimers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(
    private readonly tokenService: TokenService,
    private readonly prisma: PrismaService,
    private readonly redisRoomRepository: RedisRoomRepository,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    const token = this.extractToken(client);
    if (!token) {
      this.logger.warn(
        `Connection rejected: Missing token for socket ${client.id}`,
      );
      client.disconnect(true);
      return;
    }

    try {
      const payload = await this.tokenService.verifyToken(token);

      const clientData = client.data as { user?: TokenPayload };
      clientData.user = payload;

      this.logger.log(
        `Socket connected and authenticated: id=${client.id}, userId=${payload.sub}, name=${payload.name}, role=${payload.role || 'host'}`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid token';
      this.logger.warn(
        `Connection rejected: ${message} for socket ${client.id}`,
      );
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    const clientData = client.data as
      | {
          user?: TokenPayload;
          roomCode?: string;
        }
      | undefined;
    const user = clientData?.user;
    const userId = user?.sub || 'unauthenticated';
    const roomCode = clientData?.roomCode;

    this.logger.log(`Socket disconnected: id=${client.id}, userId=${userId}`);

    // Only schedule cleanup for guest players who were actively in a room
    if (!roomCode || !user || user.role === 'host') {
      return;
    }

    const playerId = user.sub;

    this.logger.log(
      `Scheduling cleanup for player ${playerId} in room ${roomCode} after ${DISCONNECT_CLEANUP_DELAY_MS}ms`,
    );

    // Mark player as disconnected in Redis metadata (for UI indication, not removal yet)
    void this.redisRoomRepository.updateRoomMetadata(roomCode, {
      [`player:${playerId}:disconnected`]: Date.now().toString(),
    });

    // Schedule delayed cleanup
    const timer = setTimeout(() => {
      void this.executeCleanup(playerId, roomCode);
    }, DISCONNECT_CLEANUP_DELAY_MS);

    this.disconnectTimers.set(playerId, timer);
  }

  /**
   * Executes the actual player removal after the grace period expires.
   * Removes the player from Redis and broadcasts state updates.
   */
  private async executeCleanup(
    playerId: string,
    roomCode: string,
  ): Promise<void> {
    this.logger.log(
      `Executing cleanup for player ${playerId} in room ${roomCode}`,
    );

    // Clear the timer reference
    this.disconnectTimers.delete(playerId);

    try {
      // Remove player from Redis
      await this.redisRoomRepository.removePlayer(roomCode, playerId);

      // Broadcast PlayerLeft to remaining clients
      this.server.to(roomCode).emit('PlayerLeft', { playerId });

      // Fetch updated room state and broadcast
      const roomStatePayload = await this.buildRoomStatePayload(roomCode);

      // Cleanup empty room
      if (roomStatePayload.playerCount === 0) {
        await this.redisRoomRepository.deleteRoomState(roomCode);
        this.logger.log(`Room ${roomCode} is now empty and has been deleted`);
      } else {
        this.server.to(roomCode).emit('RoomStateUpdated', roomStatePayload);
      }

      this.logger.log(`Player ${playerId} removed from room ${roomCode}`);
    } catch (error) {
      this.logger.error(
        `Failed to cleanup player ${playerId} from room ${roomCode}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  /**
   * Builds the complete RoomStateUpdated payload including players, ready status,
   * host information, room status, and player count.
   */
  private async buildRoomStatePayload(
    roomCode: string,
    fallbackStatus: string = 'LOBBY',
  ): Promise<{
    players: Record<string, unknown>[];
    status: string;
    hostId: string | null;
    playerCount: number;
  }> {
    const [playersMap, roomMeta] = await Promise.all([
      this.redisRoomRepository.getPlayers(roomCode),
      this.redisRoomRepository.getRoomMetadata(roomCode),
    ]);

    const players = Object.values(playersMap)
      .map((playerJson) => {
        try {
          return JSON.parse(playerJson) as Record<string, unknown>;
        } catch {
          return null;
        }
      })
      .filter((p): p is Record<string, unknown> => p !== null);

    return {
      players,
      status: roomMeta?.status ?? fallbackStatus,
      hostId: roomMeta?.hostId ?? null,
      playerCount: players.length,
    };
  }

  private extractToken(client: Socket): string | null {
    const auth = client.handshake.auth as Record<string, unknown> | undefined;
    let token = auth?.token;

    if (!token) {
      token = client.handshake.headers.authorization;
    }

    if (typeof token !== 'string') return null;

    if (token.startsWith('Bearer ')) {
      return token.substring(7);
    }
    return token;
  }

  @SubscribeMessage('ping')
  handlePing(): { status: string } {
    return { status: 'pong' };
  }

  @SubscribeMessage('JoinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: { roomCode: string; displayName?: string; guestToken?: string },
  ): Promise<void> {
    if (!payload || !payload.roomCode) {
      const err = new WsException('Room code is required');
      client.emit('error', {
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: err.message,
        },
      });
      throw err;
    }

    const roomCode = payload.roomCode.toUpperCase();
    const clientData = client.data as {
      user?: TokenPayload;
      roomCode?: string;
    };
    let user = clientData.user;

    if (!user && payload.guestToken) {
      try {
        user = await this.tokenService.verifyToken(payload.guestToken);
        clientData.user = user;
      } catch {
        const err = new WsException('Invalid guest token');
        client.emit('error', {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: err.message,
          },
        });
        throw err;
      }
    }

    if (!user) {
      const err = new WsException('Unauthorized connection');
      client.emit('error', {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: err.message,
        },
      });
      throw err;
    }

    try {
      const room = await this.prisma.room.findUnique({
        where: { code: roomCode },
      });

      if (!room) {
        const err = new WsException(`Room with code ${roomCode} not found`);
        client.emit('error', {
          success: false,
          error: {
            code: 'ROOM_NOT_FOUND',
            message: err.message,
          },
        });
        throw err;
      }

      if (user.role === 'guest' && room.status !== 'LOBBY') {
        const err = new WsException('Room is no longer accepting players');
        client.emit('error', {
          success: false,
          error: {
            code: 'ROOM_CLOSED',
            message: err.message,
          },
        });
        throw err;
      }

      if (user.role === 'guest' && user.roomId !== room.id) {
        const err = new WsException('Token room mismatch');
        client.emit('error', {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: err.message,
          },
        });
        throw err;
      }

      let roomMeta = await this.redisRoomRepository.getRoomMetadata(roomCode);
      if (!roomMeta) {
        await this.redisRoomRepository.createRoomState(roomCode, {
          id: room.id,
          hostId: room.hostId,
          status: room.status,
        });
        roomMeta = await this.redisRoomRepository.getRoomMetadata(roomCode);
      }

      const status = roomMeta?.status || room.status;

      if (user.role === 'host') {
        await client.join(roomCode);
        clientData.roomCode = roomCode;
        this.logger.log(`Host joined Socket.IO room: ${roomCode}`);
        return;
      }

      const playerId = user.sub;
      const playersMap = await this.redisRoomRepository.getPlayers(roomCode);
      const MAX_ROOM_CAPACITY = 30;

      const isAlreadyInRoom = !!playersMap[playerId];
      if (
        !isAlreadyInRoom &&
        Object.keys(playersMap).length >= MAX_ROOM_CAPACITY
      ) {
        const err = new WsException('Room is full');
        client.emit('error', {
          success: false,
          error: {
            code: 'ROOM_FULL',
            message: err.message,
          },
        });
        throw err;
      }

      const sockets = await this.server.fetchSockets();
      for (const socket of sockets) {
        const socketData = socket.data as {
          user?: TokenPayload;
          roomCode?: string;
        };
        if (socket.id !== client.id && socketData.user?.sub === playerId) {
          this.logger.log(
            `Disconnecting duplicate connection for player ${playerId}: old socket ${socket.id}`,
          );
          socket.disconnect(true);
        }
      }

      let playerState = {
        id: playerId,
        displayName: user.name || payload.displayName || 'Guest',
        score: 0,
        isReady: false,
      };

      const existingPlayerJson = playersMap[playerId];
      if (existingPlayerJson) {
        try {
          const parsed = JSON.parse(existingPlayerJson) as Record<
            string,
            unknown
          >;
          playerState = {
            ...playerState,
            score: typeof parsed.score === 'number' ? parsed.score : 0,
            isReady:
              typeof parsed.isReady === 'boolean' ? parsed.isReady : false,
          };
        } catch {
          // Ignore JSON parsing errors
        }
      }

      await this.redisRoomRepository.setPlayer(
        roomCode,
        playerId,
        JSON.stringify(playerState),
      );

      await this.redisRoomRepository.updateLeaderboardScore(
        roomCode,
        playerId,
        playerState.score,
      );

      await client.join(roomCode);
      clientData.roomCode = roomCode;

      client.to(roomCode).emit('PlayerJoined', { player: playerState });

      const roomStatePayload = await this.buildRoomStatePayload(
        roomCode,
        status,
      );
      this.server.to(roomCode).emit('RoomStateUpdated', roomStatePayload);

      this.logger.log(
        `Player ${playerState.displayName} (${playerId}) joined room ${roomCode}`,
      );
    } catch (error) {
      if (error instanceof WsException) {
        throw error;
      }
      const message =
        error instanceof Error ? error.message : 'Failed to join room';
      const err = new WsException(message);
      client.emit('error', {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: err.message,
        },
      });
      throw err;
    }
  }

  @SubscribeMessage('LeaveRoom')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; playerId: string },
  ): Promise<void> {
    if (!payload?.roomId || !payload?.playerId) {
      const err = new WsException('roomId and playerId are required');
      client.emit('error', {
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: err.message,
        },
      });
      throw err;
    }

    const clientData = client.data as {
      user?: TokenPayload;
      roomCode?: string;
    };
    const user = clientData.user;

    if (!user) {
      const err = new WsException('Unauthorized connection');
      client.emit('error', {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: err.message,
        },
      });
      throw err;
    }

    try {
      const room = await this.prisma.room.findUnique({
        where: { id: payload.roomId },
      });

      if (!room) {
        const err = new WsException('Room does not exist');
        client.emit('error', {
          success: false,
          error: {
            code: 'ROOM_NOT_FOUND',
            message: err.message,
          },
        });
        throw err;
      }

      const roomCode = room.code.toUpperCase();
      const isHost = user.role === 'host';

      if (isHost && user.sub !== room.hostId) {
        const err = new WsException('Only room host can manage host session');
        client.emit('error', {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: err.message,
          },
        });
        throw err;
      }

      if (!isHost) {
        if (user.sub !== payload.playerId) {
          const err = new WsException(
            'Cannot leave room on behalf of another player',
          );
          client.emit('error', {
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: err.message,
            },
          });
          throw err;
        }

        if (user.roomId !== room.id) {
          const err = new WsException('Token room mismatch');
          client.emit('error', {
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: err.message,
            },
          });
          throw err;
        }
      }

      if (!isHost) {
        // Cancel any pending cleanup timer for this player since they're leaving intentionally
        const pendingTimer = this.disconnectTimers.get(payload.playerId);
        if (pendingTimer) {
          clearTimeout(pendingTimer);
          this.disconnectTimers.delete(payload.playerId);
          this.logger.log(
            `Cancelled pending cleanup timer for intentionally leaving player ${payload.playerId}`,
          );
        }

        await this.redisRoomRepository.removePlayer(roomCode, payload.playerId);
      }

      await client.leave(roomCode);
      delete clientData.roomCode;

      this.server
        .to(roomCode)
        .emit('PlayerLeft', { playerId: payload.playerId });

      if (!isHost) {
        const updatedPlayersMap =
          await this.redisRoomRepository.getPlayers(roomCode);
        const remainingCount = Object.keys(updatedPlayersMap).length;

        if (remainingCount === 0) {
          await this.redisRoomRepository.deleteRoomState(roomCode);
        } else {
          const roomStatePayload = await this.buildRoomStatePayload(
            roomCode,
            room.status,
          );
          this.server.to(roomCode).emit('RoomStateUpdated', roomStatePayload);
        }
      }

      this.logger.log(
        `Socket ${client.id} left room ${roomCode} as player ${payload.playerId}`,
      );
    } catch (error) {
      if (error instanceof WsException) {
        throw error;
      }

      const message =
        error instanceof Error ? error.message : 'Failed to leave room';
      const err = new WsException(message);
      client.emit('error', {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: err.message,
        },
      });
      throw err;
    }
  }

  @SubscribeMessage('ReconnectRequest')
  async handleReconnectRequest(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { playerId: string; roomId: string },
  ): Promise<void> {
    if (!payload?.playerId || !payload?.roomId) {
      const err = new WsException('playerId and roomId are required');
      client.emit('error', {
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: err.message,
        },
      });
      throw err;
    }

    const clientData = client.data as {
      user?: TokenPayload;
      roomCode?: string;
    };
    const user = clientData.user;
    if (!user) {
      const err = new WsException('Unauthorized connection');
      client.emit('error', {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: err.message,
        },
      });
      throw err;
    }

    if (user.sub !== payload.playerId) {
      const err = new WsException('Cannot reconnect as another player');
      client.emit('error', {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: err.message,
        },
      });
      throw err;
    }

    if (user.role === 'guest' && user.roomId !== payload.roomId) {
      const err = new WsException('Token room mismatch');
      client.emit('error', {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: err.message,
        },
      });
      throw err;
    }

    try {
      const room = await this.prisma.room.findUnique({
        where: { id: payload.roomId },
      });

      if (!room) {
        const err = new WsException('Room does not exist');
        client.emit('error', {
          success: false,
          error: {
            code: 'ROOM_NOT_FOUND',
            message: err.message,
          },
        });
        throw err;
      }

      const roomCode = room.code.toUpperCase();

      // Cancel any pending cleanup timers for this player
      const pendingTimer = this.disconnectTimers.get(payload.playerId);
      if (pendingTimer) {
        clearTimeout(pendingTimer);
        this.disconnectTimers.delete(payload.playerId);
        this.logger.log(
          `Cancelled pending cleanup timer for reconnecting player ${payload.playerId}`,
        );
      }

      let roomMeta = await this.redisRoomRepository.getRoomMetadata(roomCode);
      if (!roomMeta) {
        await this.redisRoomRepository.createRoomState(roomCode, {
          id: room.id,
          hostId: room.hostId,
          status: room.status,
        });
        roomMeta = await this.redisRoomRepository.getRoomMetadata(roomCode);
      }

      const sockets = await this.server.fetchSockets();
      for (const socket of sockets) {
        const socketData = socket.data as { user?: TokenPayload };
        if (
          socket.id !== client.id &&
          socketData.user?.sub === payload.playerId
        ) {
          socket.disconnect(true);
        }
      }

      await client.join(roomCode);
      clientData.roomCode = roomCode;

      const playersMap = await this.redisRoomRepository.getPlayers(roomCode);
      const playerJson = playersMap[payload.playerId];

      if (user.role !== 'host' && !playerJson) {
        const err = new WsException('Player not found in room state');
        client.emit('error', {
          success: false,
          error: {
            code: 'PLAYER_NOT_FOUND',
            message: err.message,
          },
        });
        throw err;
      }

      const players = Object.values(playersMap)
        .map((entry) => {
          try {
            return JSON.parse(entry) as Record<string, unknown>;
          } catch {
            return null;
          }
        })
        .filter(Boolean);

      const leaderboard =
        await this.redisRoomRepository.getLeaderboard(roomCode);

      client.emit('StateSync', {
        room: {
          id: room.id,
          code: roomCode,
          status: roomMeta?.status || room.status,
        },
        playerId: payload.playerId,
        players,
        leaderboard,
      });
    } catch (error) {
      if (error instanceof WsException) {
        throw error;
      }

      const message =
        error instanceof Error ? error.message : 'Failed to reconnect player';
      const err = new WsException(message);
      client.emit('error', {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: err.message,
        },
      });
      throw err;
    }
  }

  @SubscribeMessage('PlayerReady')
  async handlePlayerReady(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; playerId: string },
  ): Promise<void> {
    if (!payload?.roomId || !payload?.playerId) {
      const err = new WsException('roomId and playerId are required');
      client.emit('error', {
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: err.message,
        },
      });
      throw err;
    }

    const clientData = client.data as {
      user?: TokenPayload;
      roomCode?: string;
    };
    const user = clientData.user;

    if (!user) {
      const err = new WsException('Unauthorized connection');
      client.emit('error', {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: err.message,
        },
      });
      throw err;
    }

    // Only the player themselves can toggle their ready status
    if (user.sub !== payload.playerId) {
      const err = new WsException(
        'Cannot change ready status for another player',
      );
      client.emit('error', {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: err.message,
        },
      });
      throw err;
    }

    if (user.role === 'guest' && user.roomId !== payload.roomId) {
      const err = new WsException('Token room mismatch');
      client.emit('error', {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: err.message,
        },
      });
      throw err;
    }

    try {
      const room = await this.prisma.room.findUnique({
        where: { id: payload.roomId },
      });

      if (!room) {
        const err = new WsException('Room does not exist');
        client.emit('error', {
          success: false,
          error: {
            code: 'ROOM_NOT_FOUND',
            message: err.message,
          },
        });
        throw err;
      }

      const roomCode = room.code.toUpperCase();
      const playersMap = await this.redisRoomRepository.getPlayers(roomCode);
      const playerJson = playersMap[payload.playerId];

      if (!playerJson) {
        const err = new WsException('Player not found in room');
        client.emit('error', {
          success: false,
          error: {
            code: 'PLAYER_NOT_FOUND',
            message: err.message,
          },
        });
        throw err;
      }

      let playerState: {
        id: string;
        displayName: string;
        score: number;
        isReady: boolean;
      };

      try {
        const parsed = JSON.parse(playerJson) as Record<string, unknown>;
        playerState = {
          id: typeof parsed.id === 'string' ? parsed.id : payload.playerId,
          displayName:
            typeof parsed.displayName === 'string'
              ? parsed.displayName
              : 'Guest',
          score: typeof parsed.score === 'number' ? parsed.score : 0,
          isReady: typeof parsed.isReady === 'boolean' ? parsed.isReady : false,
        };
      } catch {
        const err = new WsException('Invalid player state in Redis');
        client.emit('error', {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: err.message,
          },
        });
        throw err;
      }

      // Toggle ready status
      playerState.isReady = !playerState.isReady;

      // Update in Redis
      await this.redisRoomRepository.setPlayer(
        roomCode,
        payload.playerId,
        JSON.stringify(playerState),
      );

      // Broadcast updated room state to all clients in the room
      const roomStatePayload = await this.buildRoomStatePayload(
        roomCode,
        room.status,
      );
      this.server.to(roomCode).emit('RoomStateUpdated', roomStatePayload);

      this.logger.log(
        `Player ${payload.playerId} in room ${roomCode} toggled ready status to ${playerState.isReady}`,
      );
    } catch (error) {
      if (error instanceof WsException) {
        throw error;
      }

      const message =
        error instanceof Error
          ? error.message
          : 'Failed to update ready status';
      const err = new WsException(message);
      client.emit('error', {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: err.message,
        },
      });
      throw err;
    }
  }
}
