import { Test, TestingModule } from '@nestjs/testing';
import { GameGateway } from './game.gateway';
import { TokenService } from '../auth/token.service';
import { PrismaService } from '../database/prisma.service';
import { RedisRoomRepository } from '../redis/redis-room.repository';
import { Socket, Server } from 'socket.io';
import { WsException } from '@nestjs/websockets';

describe('GameGateway', () => {
  let gateway: GameGateway;
  const verifyTokenMock = jest.fn();

  const prismaMock = {
    room: {
      findUnique: jest.fn(),
    },
    game: {
      findUnique: jest.fn(),
    },
  };

  const redisRoomRepositoryMock = {
    getRoomMetadata: jest.fn(),
    createRoomState: jest.fn(),
    updateRoomMetadata: jest.fn(),
    getPlayers: jest.fn(),
    getPlayer: jest.fn(),
    setPlayer: jest.fn(),
    removePlayer: jest.fn(),
    deleteRoomState: jest.fn(),
    updateLeaderboardScore: jest.fn(),
    getLeaderboard: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameGateway,
        {
          provide: TokenService,
          useValue: {
            verifyToken: verifyTokenMock,
          },
        },
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: RedisRoomRepository,
          useValue: redisRoomRepositoryMock,
        },
      ],
    }).compile();

    gateway = module.get<GameGateway>(GameGateway);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleConnection', () => {
    let mockSocket: {
      id: string;
      handshake: {
        auth: Record<string, unknown>;
        headers: Record<string, string>;
      };
      data: Record<string, any>;
      disconnect: jest.Mock;
    };

    beforeEach(() => {
      mockSocket = {
        id: 'socket-123',
        handshake: {
          auth: {},
          headers: {},
        },
        data: {},
        disconnect: jest.fn(),
      };
    });

    it('should reject connection when no token is present', async () => {
      await gateway.handleConnection(mockSocket as unknown as Socket);

      expect(mockSocket.disconnect).toHaveBeenCalledWith(true);
      expect(verifyTokenMock).not.toHaveBeenCalled();
    });

    it('should reject connection when token verification fails', async () => {
      mockSocket.handshake.auth.token = 'Bearer invalid-token';
      verifyTokenMock.mockRejectedValue(new Error('Invalid signature'));

      await gateway.handleConnection(mockSocket as unknown as Socket);

      expect(verifyTokenMock).toHaveBeenCalledWith('invalid-token');
      expect(mockSocket.disconnect).toHaveBeenCalledWith(true);
      expect(mockSocket.data.user).toBeUndefined();
    });

    it('should authenticate connection when valid host token is present in auth object', async () => {
      mockSocket.handshake.auth.token = 'Bearer valid-host-token';
      const mockPayload = { sub: 'host-123', name: 'John Doe', role: 'host' };
      verifyTokenMock.mockResolvedValue(mockPayload);

      await gateway.handleConnection(mockSocket as unknown as Socket);

      expect(verifyTokenMock).toHaveBeenCalledWith('valid-host-token');
      expect(mockSocket.disconnect).not.toHaveBeenCalled();
      expect(mockSocket.data.user).toEqual(mockPayload);
    });

    it('should authenticate connection when valid guest token is present in headers', async () => {
      mockSocket.handshake.headers.authorization = 'valid-guest-token';
      const mockPayload = {
        sub: 'guest-123',
        name: 'Guest Player',
        role: 'guest',
        roomId: 'room-123',
      };
      verifyTokenMock.mockResolvedValue(mockPayload);

      await gateway.handleConnection(mockSocket as unknown as Socket);

      expect(verifyTokenMock).toHaveBeenCalledWith('valid-guest-token');
      expect(mockSocket.disconnect).not.toHaveBeenCalled();
      expect(mockSocket.data.user).toEqual(mockPayload);
    });
  });

  describe('handleDisconnect', () => {
    it('should log disconnection', () => {
      const mockSocket = {
        id: 'socket-123',
        data: {
          user: { sub: 'user-123' },
        },
      } as unknown as Socket;

      expect(() => gateway.handleDisconnect(mockSocket)).not.toThrow();
    });

    it('should handle unauthenticated disconnection safely', () => {
      const mockSocket = {
        id: 'socket-123',
        data: {},
      } as unknown as Socket;

      expect(() => gateway.handleDisconnect(mockSocket)).not.toThrow();
    });

    it('should not schedule cleanup for host disconnection', () => {
      const mockSocket = {
        id: 'socket-host',
        data: {
          user: { sub: 'host-123', name: 'Host', role: 'host' },
          roomCode: 'ROOM12',
        },
      } as unknown as Socket;

      gateway.handleDisconnect(mockSocket);

      expect(gateway.disconnectTimers.size).toBe(0);
    });

    it('should not schedule cleanup for guest without roomCode', () => {
      const mockSocket = {
        id: 'socket-guest',
        data: {
          user: {
            sub: 'guest-123',
            name: 'Guest',
            role: 'guest',
            roomId: 'room-id-123',
          },
        },
      } as unknown as Socket;

      gateway.handleDisconnect(mockSocket);

      expect(gateway.disconnectTimers.size).toBe(0);
    });

    it('should schedule cleanup timer for guest player with active roomCode', () => {
      jest.useFakeTimers();

      const mockSocket = {
        id: 'socket-guest',
        data: {
          user: {
            sub: 'guest-123',
            name: 'Guest',
            role: 'guest',
            roomId: 'room-id-123',
          },
          roomCode: 'ROOM12',
        },
      } as unknown as Socket;

      gateway.handleDisconnect(mockSocket);

      expect(gateway.disconnectTimers.has('guest-123')).toBe(true);
      expect(redisRoomRepositoryMock.updateRoomMetadata).toHaveBeenCalledWith(
        'ROOM12',
        expect.objectContaining({
          'player:guest-123:disconnected': expect.any(String) as string,
        }),
      );

      jest.useRealTimers();
    });

    it('should execute cleanup and broadcast after grace period expires', async () => {
      jest.useFakeTimers();

      const toEmitMock = jest.fn();
      gateway.server = {
        to: jest.fn().mockReturnValue({
          emit: toEmitMock,
        }),
      } as unknown as Server;

      const mockSocket = {
        id: 'socket-guest',
        data: {
          user: {
            sub: 'guest-123',
            name: 'Guest',
            role: 'guest',
            roomId: 'room-id-123',
          },
          roomCode: 'ROOM12',
        },
      } as unknown as Socket;

      redisRoomRepositoryMock.getPlayers.mockResolvedValue({
        'guest-456': JSON.stringify({
          id: 'guest-456',
          displayName: 'Another Guest',
          score: 10,
          isReady: false,
        }),
      });
      redisRoomRepositoryMock.getRoomMetadata.mockResolvedValue({
        status: 'LOBBY',
        hostId: 'host-123',
      });

      gateway.handleDisconnect(mockSocket);

      // Timer is scheduled
      expect(gateway.disconnectTimers.has('guest-123')).toBe(true);

      // Fast-forward 30 seconds and flush all pending timers and microtasks
      await jest.advanceTimersByTimeAsync(30_000);

      expect(redisRoomRepositoryMock.removePlayer).toHaveBeenCalledWith(
        'ROOM12',
        'guest-123',
      );
      expect(toEmitMock).toHaveBeenCalledWith('PlayerLeft', {
        playerId: 'guest-123',
      });
      expect(toEmitMock).toHaveBeenCalledWith(
        'RoomStateUpdated',
        expect.objectContaining({
          status: 'LOBBY',
          hostId: 'host-123',
          playerCount: 1,
          players: [expect.objectContaining({ id: 'guest-456' })],
        }),
      );
      expect(gateway.disconnectTimers.has('guest-123')).toBe(false);

      jest.useRealTimers();
    });

    it('should delete empty room after last player cleanup', async () => {
      jest.useFakeTimers();

      const toEmitMock = jest.fn();
      gateway.server = {
        to: jest.fn().mockReturnValue({
          emit: toEmitMock,
        }),
      } as unknown as Server;

      const mockSocket = {
        id: 'socket-guest',
        data: {
          user: {
            sub: 'guest-123',
            name: 'Guest',
            role: 'guest',
            roomId: 'room-id-123',
          },
          roomCode: 'ROOM12',
        },
      } as unknown as Socket;

      redisRoomRepositoryMock.getPlayers.mockResolvedValue({});

      gateway.handleDisconnect(mockSocket);

      await jest.advanceTimersByTimeAsync(30_000);

      expect(redisRoomRepositoryMock.removePlayer).toHaveBeenCalledWith(
        'ROOM12',
        'guest-123',
      );
      expect(redisRoomRepositoryMock.deleteRoomState).toHaveBeenCalledWith(
        'ROOM12',
      );

      jest.useRealTimers();
    });
  });

  describe('handlePing', () => {
    it('should return pong status', () => {
      const res = gateway.handlePing();
      expect(res).toEqual({ status: 'pong' });
    });
  });

  describe('handleJoinRoom', () => {
    interface MockSocket {
      id: string;
      data: {
        user?: {
          sub: string;
          name: string;
          role: string;
          roomId?: string;
        };
        roomCode?: string;
      };
      join: jest.Mock;
      leave: jest.Mock;
      emit: jest.Mock;
      to: jest.Mock;
      disconnect: jest.Mock;
    }

    interface MockServer {
      to: jest.Mock;
      emit: jest.Mock;
      fetchSockets: jest.Mock;
    }

    let mockSocket: MockSocket;
    let mockServer: MockServer;

    const expectLastErrorCode = (
      emitMock: jest.Mock,
      expectedCode: string,
    ): void => {
      const calls = emitMock.mock.calls as unknown[][];
      const lastPayload = calls[calls.length - 1]?.[1] as
        { error?: { code?: string; message?: string } } | undefined;
      expect(lastPayload?.error?.code).toBe(expectedCode);
    };

    beforeEach(() => {
      mockSocket = {
        id: 'socket-123',
        data: {},
        join: jest.fn().mockResolvedValue(undefined),
        leave: jest.fn().mockResolvedValue(undefined),
        emit: jest.fn(),
        to: jest.fn().mockReturnThis(),
        disconnect: jest.fn(),
      };
      mockServer = {
        to: jest.fn().mockReturnThis(),
        emit: jest.fn(),
        fetchSockets: jest.fn().mockResolvedValue([]),
      };
      gateway.server = mockServer as unknown as Server;
    });

    it('should throw WsException and emit error if roomCode is missing', async () => {
      await expect(
        gateway.handleJoinRoom(mockSocket as unknown as Socket, {
          roomCode: '',
        }),
      ).rejects.toThrow(WsException);
      expectLastErrorCode(mockSocket.emit, 'BAD_REQUEST');
    });

    it('should throw WsException and emit error if socket is unauthenticated and guestToken is invalid/missing', async () => {
      await expect(
        gateway.handleJoinRoom(mockSocket as unknown as Socket, {
          roomCode: 'ROOM12',
        }),
      ).rejects.toThrow(WsException);
      expectLastErrorCode(mockSocket.emit, 'UNAUTHORIZED');
    });

    it('should authenticate user via guestToken if guestToken is passed and socket is not already authenticated', async () => {
      mockSocket.data.user = undefined;
      const mockPayload = {
        sub: 'guest-123',
        name: 'John',
        role: 'guest',
        roomId: 'room-id-123',
      };
      verifyTokenMock.mockResolvedValue(mockPayload);
      prismaMock.room.findUnique.mockResolvedValue({
        id: 'room-id-123',
        code: 'ROOM12',
        status: 'LOBBY',
        hostId: 'host-123',
      });
      redisRoomRepositoryMock.getRoomMetadata.mockResolvedValue({
        status: 'LOBBY',
        hostId: 'host-123',
      });
      redisRoomRepositoryMock.getPlayers.mockResolvedValue({});

      await gateway.handleJoinRoom(mockSocket as unknown as Socket, {
        roomCode: 'ROOM12',
        guestToken: 'some-token',
      });

      expect(verifyTokenMock).toHaveBeenCalledWith('some-token');
      expect(mockSocket.data.user).toEqual(mockPayload);
    });

    it('should throw WsException if guestToken verification fails', async () => {
      mockSocket.data.user = undefined;
      verifyTokenMock.mockRejectedValue(new Error('Invalid token'));

      await expect(
        gateway.handleJoinRoom(mockSocket as unknown as Socket, {
          roomCode: 'ROOM12',
          guestToken: 'invalid-token',
        }),
      ).rejects.toThrow(WsException);
      const calls = mockSocket.emit.mock.calls as unknown[][];
      const lastPayload = calls[calls.length - 1]?.[1] as
        { error?: { code?: string; message?: string } } | undefined;
      expect(lastPayload?.error?.code).toBe('UNAUTHORIZED');
      expect(lastPayload?.error?.message).toBe('Invalid guest token');
    });

    it('should throw ROOM_NOT_FOUND error if room does not exist in DB', async () => {
      mockSocket.data.user = {
        sub: 'guest-123',
        name: 'John',
        role: 'guest',
        roomId: 'room-id-123',
      };
      prismaMock.room.findUnique.mockResolvedValue(null);

      await expect(
        gateway.handleJoinRoom(mockSocket as unknown as Socket, {
          roomCode: 'NOTEXS',
        }),
      ).rejects.toThrow(WsException);
      expectLastErrorCode(mockSocket.emit, 'ROOM_NOT_FOUND');
    });

    it('should throw ROOM_CLOSED error if player tries to join room not in LOBBY status', async () => {
      mockSocket.data.user = {
        sub: 'guest-123',
        name: 'John',
        role: 'guest',
        roomId: 'room-id-123',
      };
      prismaMock.room.findUnique.mockResolvedValue({
        id: 'room-id-123',
        code: 'ROOM12',
        status: 'IN_PROGRESS',
      });

      await expect(
        gateway.handleJoinRoom(mockSocket as unknown as Socket, {
          roomCode: 'ROOM12',
        }),
      ).rejects.toThrow(WsException);
      expectLastErrorCode(mockSocket.emit, 'ROOM_CLOSED');
    });

    it('should throw UNAUTHORIZED if player roomId does not match DB room.id', async () => {
      mockSocket.data.user = {
        sub: 'guest-123',
        name: 'John',
        role: 'guest',
        roomId: 'different-room',
      };
      prismaMock.room.findUnique.mockResolvedValue({
        id: 'room-id-123',
        code: 'ROOM12',
        status: 'LOBBY',
      });

      await expect(
        gateway.handleJoinRoom(mockSocket as unknown as Socket, {
          roomCode: 'ROOM12',
        }),
      ).rejects.toThrow(WsException);
      const calls = mockSocket.emit.mock.calls as unknown[][];
      const lastPayload = calls[calls.length - 1]?.[1] as
        { error?: { code?: string; message?: string } } | undefined;
      expect(lastPayload?.error?.code).toBe('UNAUTHORIZED');
      expect(lastPayload?.error?.message).toBe('Token room mismatch');
    });

    it('should initialize room state in Redis if it does not exist', async () => {
      mockSocket.data.user = {
        sub: 'guest-123',
        name: 'John',
        role: 'guest',
        roomId: 'room-id-123',
      };
      prismaMock.room.findUnique.mockResolvedValue({
        id: 'room-id-123',
        code: 'ROOM12',
        status: 'LOBBY',
        hostId: 'host-123',
      });
      redisRoomRepositoryMock.getRoomMetadata
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ status: 'LOBBY' });
      redisRoomRepositoryMock.getPlayers.mockResolvedValue({});

      await gateway.handleJoinRoom(mockSocket as unknown as Socket, {
        roomCode: 'ROOM12',
      });

      expect(redisRoomRepositoryMock.createRoomState).toHaveBeenCalledWith(
        'ROOM12',
        {
          id: 'room-id-123',
          hostId: 'host-123',
          status: 'LOBBY',
        },
      );
    });

    it('should allow host to join room without state check or capacity restrictions', async () => {
      mockSocket.data.user = {
        sub: 'host-123',
        name: 'Host User',
        role: 'host',
      };
      prismaMock.room.findUnique.mockResolvedValue({
        id: 'room-id-123',
        code: 'ROOM12',
        status: 'LOBBY',
        hostId: 'host-123',
      });
      redisRoomRepositoryMock.getRoomMetadata.mockResolvedValue({
        status: 'LOBBY',
        hostId: 'host-123',
      });

      await gateway.handleJoinRoom(mockSocket as unknown as Socket, {
        roomCode: 'ROOM12',
      });

      expect(mockSocket.join).toHaveBeenCalledWith('ROOM12');
      expect(mockSocket.data.roomCode).toBe('ROOM12');
      expect(redisRoomRepositoryMock.setPlayer).not.toHaveBeenCalled();
    });

    it('should throw ROOM_FULL if room capacity exceeds limit', async () => {
      mockSocket.data.user = {
        sub: 'guest-123',
        name: 'John',
        role: 'guest',
        roomId: 'room-id-123',
      };
      prismaMock.room.findUnique.mockResolvedValue({
        id: 'room-id-123',
        code: 'ROOM12',
        status: 'LOBBY',
        hostId: 'host-123',
      });
      redisRoomRepositoryMock.getRoomMetadata.mockResolvedValue({
        status: 'LOBBY',
        hostId: 'host-123',
      });

      const fullPlayersMap: Record<string, string> = {};
      for (let i = 0; i < 30; i++) {
        fullPlayersMap[`player-${i}`] = JSON.stringify({
          id: `player-${i}`,
          displayName: `Player ${i}`,
          score: 0,
          isReady: false,
        });
      }
      redisRoomRepositoryMock.getPlayers.mockResolvedValue(fullPlayersMap);

      await expect(
        gateway.handleJoinRoom(mockSocket as unknown as Socket, {
          roomCode: 'ROOM12',
        }),
      ).rejects.toThrow(WsException);
      expectLastErrorCode(mockSocket.emit, 'ROOM_FULL');
    });

    it('should disconnect duplicate connections for the same player', async () => {
      mockSocket.data.user = {
        sub: 'guest-123',
        name: 'John',
        role: 'guest',
        roomId: 'room-id-123',
      };
      prismaMock.room.findUnique.mockResolvedValue({
        id: 'room-id-123',
        code: 'ROOM12',
        status: 'LOBBY',
        hostId: 'host-123',
      });
      redisRoomRepositoryMock.getRoomMetadata.mockResolvedValue({
        status: 'LOBBY',
        hostId: 'host-123',
      });
      redisRoomRepositoryMock.getPlayers.mockResolvedValue({});

      const mockOldSocket: MockSocket = {
        id: 'socket-old',
        data: { user: { sub: 'guest-123', name: 'Old', role: 'guest' } },
        join: jest.fn(),
        leave: jest.fn(),
        emit: jest.fn(),
        to: jest.fn(),
        disconnect: jest.fn(),
      };
      mockServer.fetchSockets.mockResolvedValue([mockSocket, mockOldSocket]);

      await gateway.handleJoinRoom(mockSocket as unknown as Socket, {
        roomCode: 'ROOM12',
      });

      expect(mockOldSocket.disconnect).toHaveBeenCalledWith(true);
      expect(mockSocket.disconnect).not.toHaveBeenCalled();
    });

    it('should preserve score and ready state on reconnect', async () => {
      mockSocket.data.user = {
        sub: 'guest-123',
        name: 'John',
        role: 'guest',
        roomId: 'room-id-123',
      };
      prismaMock.room.findUnique.mockResolvedValue({
        id: 'room-id-123',
        code: 'ROOM12',
        status: 'LOBBY',
        hostId: 'host-123',
      });
      redisRoomRepositoryMock.getRoomMetadata.mockResolvedValue({
        status: 'LOBBY',
        hostId: 'host-123',
      });

      const existingPlayer = {
        id: 'guest-123',
        displayName: 'John',
        score: 150,
        isReady: true,
      };
      redisRoomRepositoryMock.getPlayers.mockResolvedValue({
        'guest-123': JSON.stringify(existingPlayer),
      });

      await gateway.handleJoinRoom(mockSocket as unknown as Socket, {
        roomCode: 'ROOM12',
      });

      expect(redisRoomRepositoryMock.setPlayer).toHaveBeenCalledWith(
        'ROOM12',
        'guest-123',
        JSON.stringify(existingPlayer),
      );
      expect(
        redisRoomRepositoryMock.updateLeaderboardScore,
      ).toHaveBeenCalledWith('ROOM12', 'guest-123', 150);
    });

    it('should join Socket.IO room, store player state, and emit broadcast events on success', async () => {
      mockSocket.data.user = {
        sub: 'guest-123',
        name: 'John',
        role: 'guest',
        roomId: 'room-id-123',
      };
      prismaMock.room.findUnique.mockResolvedValue({
        id: 'room-id-123',
        code: 'ROOM12',
        status: 'LOBBY',
        hostId: 'host-123',
      });
      redisRoomRepositoryMock.getRoomMetadata.mockResolvedValue({
        status: 'LOBBY',
        hostId: 'host-123',
      });
      redisRoomRepositoryMock.getPlayers.mockResolvedValue({});

      await gateway.handleJoinRoom(mockSocket as unknown as Socket, {
        roomCode: 'ROOM12',
      });

      expect(redisRoomRepositoryMock.setPlayer).toHaveBeenCalledWith(
        'ROOM12',
        'guest-123',
        JSON.stringify({
          id: 'guest-123',
          displayName: 'John',
          score: 0,
          isReady: false,
        }),
      );
      expect(mockSocket.join).toHaveBeenCalledWith('ROOM12');
      expect(mockSocket.to).toHaveBeenCalledWith('ROOM12');
      expect(mockSocket.emit).not.toHaveBeenCalledWith(
        'error',
        expect.any(Object),
      );
      expect(mockServer.to).toHaveBeenCalledWith('ROOM12');
    });

    it('should ignore malformed player JSON in Redis gracefully', async () => {
      mockSocket.data.user = {
        sub: 'guest-123',
        name: 'John',
        role: 'guest',
        roomId: 'room-id-123',
      };
      prismaMock.room.findUnique.mockResolvedValue({
        id: 'room-id-123',
        code: 'ROOM12',
        status: 'LOBBY',
        hostId: 'host-123',
      });
      redisRoomRepositoryMock.getRoomMetadata.mockResolvedValue({
        status: 'LOBBY',
        hostId: 'host-123',
      });
      redisRoomRepositoryMock.getPlayers
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({
          'guest-123':
            '{"id": "guest-123", "displayName": "John", "score": 0, "isReady": false}',
          'bad-player': 'invalid-json',
        });

      await gateway.handleJoinRoom(mockSocket as unknown as Socket, {
        roomCode: 'ROOM12',
      });

      const roomBroadcaster = mockServer.to.mock.results[0]?.value as
        { emit?: jest.Mock } | undefined;
      expect(roomBroadcaster?.emit).toHaveBeenCalledWith(
        'RoomStateUpdated',
        expect.objectContaining({
          hostId: 'host-123',
          playerCount: 1,
          players: [expect.objectContaining({ id: 'guest-123' })],
        }),
      );
    });

    it('should catch generic errors, emit internal server error event, and throw WsException', async () => {
      mockSocket.data.user = {
        sub: 'guest-123',
        name: 'John',
        role: 'guest',
        roomId: 'room-id-123',
      };
      prismaMock.room.findUnique.mockRejectedValue(
        new Error('Database query failed'),
      );

      await expect(
        gateway.handleJoinRoom(mockSocket as unknown as Socket, {
          roomCode: 'ROOM12',
        }),
      ).rejects.toThrow(WsException);
      const calls = mockSocket.emit.mock.calls as unknown[][];
      const lastPayload = calls[calls.length - 1]?.[1] as
        { error?: { code?: string; message?: string } } | undefined;
      expect(lastPayload?.error?.code).toBe('INTERNAL_SERVER_ERROR');
      expect(lastPayload?.error?.message).toBe('Database query failed');
    });
  });

  describe('handleLeaveRoom', () => {
    interface LeaveMockSocket {
      id: string;
      data: {
        user?: {
          sub: string;
          name: string;
          role: string;
          roomId?: string;
        };
        roomCode?: string;
      };
      leave: jest.Mock;
      emit: jest.Mock;
    }

    let mockSocket: LeaveMockSocket;
    const expectLastErrorCode = (
      emitMock: jest.Mock,
      expectedCode: string,
    ): void => {
      const calls = emitMock.mock.calls as unknown[][];
      const lastPayload = calls[calls.length - 1]?.[1] as
        { error?: { code?: string } } | undefined;
      expect(lastPayload?.error?.code).toBe(expectedCode);
    };

    beforeEach(() => {
      mockSocket = {
        id: 'socket-leave-123',
        data: {},
        leave: jest.fn().mockResolvedValue(undefined),
        emit: jest.fn(),
      };
      gateway.server = {
        to: jest.fn().mockReturnValue({
          emit: jest.fn(),
        }),
      } as unknown as Server;
    });

    it('should reject leave when payload is missing fields', async () => {
      await expect(
        gateway.handleLeaveRoom(mockSocket as unknown as Socket, {
          roomId: '',
          playerId: '',
        }),
      ).rejects.toThrow(WsException);
      expectLastErrorCode(mockSocket.emit, 'BAD_REQUEST');
    });

    it('should remove player, leave socket room, and emit room updates', async () => {
      const toEmitMock = jest.fn();
      gateway.server = {
        to: jest.fn().mockReturnValue({
          emit: toEmitMock,
        }),
      } as unknown as Server;

      mockSocket.data = {
        user: {
          sub: 'guest-123',
          name: 'Guest',
          role: 'guest',
          roomId: 'room-id-123',
        },
        roomCode: 'ROOM12',
      };

      prismaMock.room.findUnique.mockResolvedValue({
        id: 'room-id-123',
        code: 'ROOM12',
        status: 'LOBBY',
        hostId: 'host-123',
      });
      redisRoomRepositoryMock.getPlayers.mockResolvedValue({
        'guest-456': JSON.stringify({
          id: 'guest-456',
          displayName: 'Other Guest',
          score: 10,
          isReady: false,
        }),
      });
      redisRoomRepositoryMock.getRoomMetadata.mockResolvedValue({
        status: 'LOBBY',
        hostId: 'host-123',
      });

      await gateway.handleLeaveRoom(mockSocket as unknown as Socket, {
        roomId: 'room-id-123',
        playerId: 'guest-123',
      });

      expect(redisRoomRepositoryMock.removePlayer).toHaveBeenCalledWith(
        'ROOM12',
        'guest-123',
      );
      expect(mockSocket.leave).toHaveBeenCalledWith('ROOM12');
      expect(toEmitMock).toHaveBeenCalledWith('PlayerLeft', {
        playerId: 'guest-123',
      });
      expect(toEmitMock).toHaveBeenCalledWith(
        'RoomStateUpdated',
        expect.objectContaining({
          status: 'LOBBY',
          hostId: 'host-123',
          playerCount: 1,
          players: [expect.objectContaining({ id: 'guest-456' })],
        }),
      );
    });

    it('should cleanup room state when last player leaves', async () => {
      const toEmitMock = jest.fn();
      gateway.server = {
        to: jest.fn().mockReturnValue({
          emit: toEmitMock,
        }),
      } as unknown as Server;

      mockSocket.data.user = {
        sub: 'guest-123',
        name: 'Guest',
        role: 'guest',
        roomId: 'room-id-123',
      };
      prismaMock.room.findUnique.mockResolvedValue({
        id: 'room-id-123',
        code: 'ROOM12',
        status: 'LOBBY',
        hostId: 'host-123',
      });
      redisRoomRepositoryMock.getPlayers.mockResolvedValue({});

      await gateway.handleLeaveRoom(mockSocket as unknown as Socket, {
        roomId: 'room-id-123',
        playerId: 'guest-123',
      });

      expect(redisRoomRepositoryMock.deleteRoomState).toHaveBeenCalledWith(
        'ROOM12',
      );
      expect(toEmitMock).toHaveBeenCalledWith('PlayerLeft', {
        playerId: 'guest-123',
      });
    });

    it('should cancel pending cleanup timer on intentional leave', async () => {
      jest.useFakeTimers();

      const toEmitMock = jest.fn();
      gateway.server = {
        to: jest.fn().mockReturnValue({
          emit: toEmitMock,
        }),
      } as unknown as Server;

      mockSocket.data.user = {
        sub: 'guest-123',
        name: 'Guest',
        role: 'guest',
        roomId: 'room-id-123',
      };

      // Simulate a pending cleanup timer
      const mockTimer = setTimeout(() => {}, 30_000);
      gateway.disconnectTimers.set('guest-123', mockTimer);

      prismaMock.room.findUnique.mockResolvedValue({
        id: 'room-id-123',
        code: 'ROOM12',
        status: 'LOBBY',
        hostId: 'host-123',
      });
      redisRoomRepositoryMock.getPlayers.mockResolvedValue({});

      await gateway.handleLeaveRoom(mockSocket as unknown as Socket, {
        roomId: 'room-id-123',
        playerId: 'guest-123',
      });

      expect(gateway.disconnectTimers.has('guest-123')).toBe(false);

      jest.useRealTimers();
    });
  });

  describe('handleReconnectRequest', () => {
    interface ReconnectMockSocket {
      id: string;
      data: {
        user?: {
          sub: string;
          name: string;
          role: string;
          roomId?: string;
        };
        roomCode?: string;
      };
      join: jest.Mock;
      emit: jest.Mock;
      disconnect: jest.Mock;
    }

    let mockSocket: ReconnectMockSocket;
    let mockServer: { fetchSockets: jest.Mock };
    const expectLastErrorCode = (
      emitMock: jest.Mock,
      expectedCode: string,
    ): void => {
      const calls = emitMock.mock.calls as unknown[][];
      const lastPayload = calls[calls.length - 1]?.[1] as
        { error?: { code?: string } } | undefined;
      expect(lastPayload?.error?.code).toBe(expectedCode);
    };

    beforeEach(() => {
      mockSocket = {
        id: 'socket-reconnect-1',
        data: {},
        join: jest.fn().mockResolvedValue(undefined),
        emit: jest.fn(),
        disconnect: jest.fn(),
      };
      mockServer = {
        fetchSockets: jest.fn().mockResolvedValue([]),
      };
      gateway.server = {
        ...mockServer,
      } as unknown as Server;
    });

    it('should reject reconnect when payload is invalid', async () => {
      await expect(
        gateway.handleReconnectRequest(mockSocket as unknown as Socket, {
          playerId: '',
          roomId: '',
        }),
      ).rejects.toThrow(WsException);
      expectLastErrorCode(mockSocket.emit, 'BAD_REQUEST');
    });

    it('should reject reconnect when player identity mismatches token', async () => {
      mockSocket.data.user = {
        sub: 'guest-123',
        name: 'Guest',
        role: 'guest',
        roomId: 'room-id-123',
      };

      await expect(
        gateway.handleReconnectRequest(mockSocket as unknown as Socket, {
          playerId: 'other-player',
          roomId: 'room-id-123',
        }),
      ).rejects.toThrow(WsException);
      expectLastErrorCode(mockSocket.emit, 'UNAUTHORIZED');
    });

    it('should disconnect duplicate sockets and emit StateSync on reconnect', async () => {
      mockSocket.data.user = {
        sub: 'guest-123',
        name: 'Guest',
        role: 'guest',
        roomId: 'room-id-123',
      };

      const oldSocket = {
        id: 'socket-old',
        data: {
          user: {
            sub: 'guest-123',
            name: 'Guest',
            role: 'guest',
          },
        },
        disconnect: jest.fn(),
      };
      mockServer.fetchSockets.mockResolvedValue([mockSocket, oldSocket]);

      prismaMock.room.findUnique.mockResolvedValue({
        id: 'room-id-123',
        code: 'ROOM12',
        status: 'LOBBY',
        hostId: 'host-123',
      });
      redisRoomRepositoryMock.getRoomMetadata.mockResolvedValue({
        id: 'room-id-123',
        hostId: 'host-123',
        status: 'LOBBY',
      });
      redisRoomRepositoryMock.getPlayers.mockResolvedValue({
        'guest-123': JSON.stringify({
          id: 'guest-123',
          displayName: 'Guest',
          score: 150,
          isReady: true,
        }),
      });
      redisRoomRepositoryMock.getLeaderboard.mockResolvedValue([
        { playerId: 'guest-123', score: 150 },
      ]);

      await gateway.handleReconnectRequest(mockSocket as unknown as Socket, {
        playerId: 'guest-123',
        roomId: 'room-id-123',
      });

      expect(oldSocket.disconnect).toHaveBeenCalledWith(true);
      expect(mockSocket.join).toHaveBeenCalledWith('ROOM12');
      expect(mockSocket.data.roomCode).toBe('ROOM12');
      const calls = mockSocket.emit.mock.calls as unknown[][];
      const stateSyncCall = calls.find((call) => call[0] === 'StateSync');
      const stateSyncPayload = stateSyncCall?.[1] as
        | {
            room?: { id?: string; code?: string; status?: string };
            playerId?: string;
            players?: Array<{ id?: string }>;
            leaderboard?: Array<{ playerId: string; score: number }>;
          }
        | undefined;

      expect(stateSyncPayload?.room?.id).toBe('room-id-123');
      expect(stateSyncPayload?.room?.code).toBe('ROOM12');
      expect(stateSyncPayload?.room?.status).toBe('LOBBY');
      expect(stateSyncPayload?.playerId).toBe('guest-123');
      expect(stateSyncPayload?.players?.[0]?.id).toBe('guest-123');
      expect(stateSyncPayload?.leaderboard).toEqual([
        { playerId: 'guest-123', score: 150 },
      ]);
    });

    it('should reject guest reconnect if player is missing from redis room state', async () => {
      mockSocket.data.user = {
        sub: 'guest-123',
        name: 'Guest',
        role: 'guest',
        roomId: 'room-id-123',
      };
      prismaMock.room.findUnique.mockResolvedValue({
        id: 'room-id-123',
        code: 'ROOM12',
        status: 'LOBBY',
        hostId: 'host-123',
      });
      redisRoomRepositoryMock.getRoomMetadata.mockResolvedValue({
        status: 'LOBBY',
        hostId: 'host-123',
      });
      redisRoomRepositoryMock.getPlayers.mockResolvedValue({});

      await expect(
        gateway.handleReconnectRequest(mockSocket as unknown as Socket, {
          playerId: 'guest-123',
          roomId: 'room-id-123',
        }),
      ).rejects.toThrow(WsException);
      expectLastErrorCode(mockSocket.emit, 'PLAYER_NOT_FOUND');
    });

    it('should cancel pending cleanup timer on successful reconnect', async () => {
      jest.useFakeTimers();

      mockSocket.data.user = {
        sub: 'guest-123',
        name: 'Guest',
        role: 'guest',
        roomId: 'room-id-123',
      };

      // Simulate a pending cleanup timer
      const mockTimer = setTimeout(() => {}, 30_000);
      gateway.disconnectTimers.set('guest-123', mockTimer);

      prismaMock.room.findUnique.mockResolvedValue({
        id: 'room-id-123',
        code: 'ROOM12',
        status: 'LOBBY',
        hostId: 'host-123',
      });
      redisRoomRepositoryMock.getRoomMetadata.mockResolvedValue({
        status: 'LOBBY',
        hostId: 'host-123',
      });
      redisRoomRepositoryMock.getPlayers.mockResolvedValue({
        'guest-123': JSON.stringify({
          id: 'guest-123',
          displayName: 'Guest',
          score: 50,
          isReady: false,
        }),
      });
      redisRoomRepositoryMock.getLeaderboard.mockResolvedValue([]);

      await gateway.handleReconnectRequest(mockSocket as unknown as Socket, {
        playerId: 'guest-123',
        roomId: 'room-id-123',
      });

      expect(gateway.disconnectTimers.has('guest-123')).toBe(false);

      jest.useRealTimers();
    });
  });

  describe('handlePlayerReady', () => {
    interface ReadyMockSocket {
      id: string;
      data: {
        user?: {
          sub: string;
          name: string;
          role: string;
          roomId?: string;
        };
        roomCode?: string;
      };
      emit: jest.Mock;
    }

    let mockSocket: ReadyMockSocket;
    const expectLastErrorCode = (
      emitMock: jest.Mock,
      expectedCode: string,
    ): void => {
      const calls = emitMock.mock.calls as unknown[][];
      const lastPayload = calls[calls.length - 1]?.[1] as
        { error?: { code?: string } } | undefined;
      expect(lastPayload?.error?.code).toBe(expectedCode);
    };

    beforeEach(() => {
      mockSocket = {
        id: 'socket-ready-123',
        data: {},
        emit: jest.fn(),
      };
      gateway.server = {
        to: jest.fn().mockReturnValue({
          emit: jest.fn(),
        }),
      } as unknown as Server;
    });

    it('should reject when payload is missing fields', async () => {
      await expect(
        gateway.handlePlayerReady(mockSocket as unknown as Socket, {
          roomId: '',
          playerId: '',
        }),
      ).rejects.toThrow(WsException);
      expectLastErrorCode(mockSocket.emit, 'BAD_REQUEST');
    });

    it('should reject when socket is not authenticated', async () => {
      mockSocket.data.user = undefined;

      await expect(
        gateway.handlePlayerReady(mockSocket as unknown as Socket, {
          roomId: 'room-id-123',
          playerId: 'guest-123',
        }),
      ).rejects.toThrow(WsException);
      expectLastErrorCode(mockSocket.emit, 'UNAUTHORIZED');
    });

    it('should reject when player tries to change another player ready status', async () => {
      mockSocket.data.user = {
        sub: 'guest-123',
        name: 'Guest',
        role: 'guest',
        roomId: 'room-id-123',
      };

      await expect(
        gateway.handlePlayerReady(mockSocket as unknown as Socket, {
          roomId: 'room-id-123',
          playerId: 'other-player',
        }),
      ).rejects.toThrow(WsException);
      expectLastErrorCode(mockSocket.emit, 'UNAUTHORIZED');
    });

    it('should reject when guest token roomId mismatches payload roomId', async () => {
      mockSocket.data.user = {
        sub: 'guest-123',
        name: 'Guest',
        role: 'guest',
        roomId: 'different-room',
      };

      await expect(
        gateway.handlePlayerReady(mockSocket as unknown as Socket, {
          roomId: 'room-id-123',
          playerId: 'guest-123',
        }),
      ).rejects.toThrow(WsException);
      expectLastErrorCode(mockSocket.emit, 'UNAUTHORIZED');
    });

    it('should reject when room does not exist', async () => {
      mockSocket.data.user = {
        sub: 'guest-123',
        name: 'Guest',
        role: 'guest',
        roomId: 'room-id-123',
      };
      prismaMock.room.findUnique.mockResolvedValue(null);

      await expect(
        gateway.handlePlayerReady(mockSocket as unknown as Socket, {
          roomId: 'room-id-123',
          playerId: 'guest-123',
        }),
      ).rejects.toThrow(WsException);
      expectLastErrorCode(mockSocket.emit, 'ROOM_NOT_FOUND');
    });

    it('should reject when player not found in Redis room state', async () => {
      mockSocket.data.user = {
        sub: 'guest-123',
        name: 'Guest',
        role: 'guest',
        roomId: 'room-id-123',
      };
      prismaMock.room.findUnique.mockResolvedValue({
        id: 'room-id-123',
        code: 'ROOM12',
        status: 'LOBBY',
        hostId: 'host-123',
      });
      redisRoomRepositoryMock.getPlayers.mockResolvedValue({});

      await expect(
        gateway.handlePlayerReady(mockSocket as unknown as Socket, {
          roomId: 'room-id-123',
          playerId: 'guest-123',
        }),
      ).rejects.toThrow(WsException);
      expectLastErrorCode(mockSocket.emit, 'PLAYER_NOT_FOUND');
    });

    it('should toggle player ready status from false to true', async () => {
      const toEmitMock = jest.fn();
      gateway.server = {
        to: jest.fn().mockReturnValue({
          emit: toEmitMock,
        }),
      } as unknown as Server;

      mockSocket.data.user = {
        sub: 'guest-123',
        name: 'Guest',
        role: 'guest',
        roomId: 'room-id-123',
      };

      prismaMock.room.findUnique.mockResolvedValue({
        id: 'room-id-123',
        code: 'ROOM12',
        status: 'LOBBY',
        hostId: 'host-123',
      });

      const initialPlayer = {
        id: 'guest-123',
        displayName: 'Guest',
        score: 50,
        isReady: false,
      };

      redisRoomRepositoryMock.getPlayers
        .mockResolvedValueOnce({
          'guest-123': JSON.stringify(initialPlayer),
        })
        .mockResolvedValueOnce({
          'guest-123': JSON.stringify({ ...initialPlayer, isReady: true }),
        });

      redisRoomRepositoryMock.getRoomMetadata.mockResolvedValue({
        status: 'LOBBY',
        hostId: 'host-123',
      });

      await gateway.handlePlayerReady(mockSocket as unknown as Socket, {
        roomId: 'room-id-123',
        playerId: 'guest-123',
      });

      expect(redisRoomRepositoryMock.setPlayer).toHaveBeenCalledWith(
        'ROOM12',
        'guest-123',
        JSON.stringify({ ...initialPlayer, isReady: true }),
      );

      expect(toEmitMock).toHaveBeenCalledWith(
        'RoomStateUpdated',
        expect.objectContaining({
          status: 'LOBBY',
          hostId: 'host-123',
          playerCount: 1,
          players: [
            expect.objectContaining({ id: 'guest-123', isReady: true }),
          ],
        }),
      );
    });

    it('should toggle player ready status from true to false', async () => {
      const toEmitMock = jest.fn();
      gateway.server = {
        to: jest.fn().mockReturnValue({
          emit: toEmitMock,
        }),
      } as unknown as Server;

      mockSocket.data.user = {
        sub: 'guest-123',
        name: 'Guest',
        role: 'guest',
        roomId: 'room-id-123',
      };

      prismaMock.room.findUnique.mockResolvedValue({
        id: 'room-id-123',
        code: 'ROOM12',
        status: 'LOBBY',
        hostId: 'host-123',
      });

      const initialPlayer = {
        id: 'guest-123',
        displayName: 'Guest',
        score: 50,
        isReady: true,
      };

      redisRoomRepositoryMock.getPlayers
        .mockResolvedValueOnce({
          'guest-123': JSON.stringify(initialPlayer),
        })
        .mockResolvedValueOnce({
          'guest-123': JSON.stringify({ ...initialPlayer, isReady: false }),
        });

      redisRoomRepositoryMock.getRoomMetadata.mockResolvedValue({
        status: 'LOBBY',
        hostId: 'host-123',
      });

      await gateway.handlePlayerReady(mockSocket as unknown as Socket, {
        roomId: 'room-id-123',
        playerId: 'guest-123',
      });

      expect(redisRoomRepositoryMock.setPlayer).toHaveBeenCalledWith(
        'ROOM12',
        'guest-123',
        JSON.stringify({ ...initialPlayer, isReady: false }),
      );

      expect(toEmitMock).toHaveBeenCalledWith(
        'RoomStateUpdated',
        expect.objectContaining({
          status: 'LOBBY',
          hostId: 'host-123',
          playerCount: 1,
          players: [
            expect.objectContaining({ id: 'guest-123', isReady: false }),
          ],
        }),
      );
    });

    it('should handle multiple rapid toggles correctly (duplicate updates)', async () => {
      const toEmitMock = jest.fn();
      gateway.server = {
        to: jest.fn().mockReturnValue({
          emit: toEmitMock,
        }),
      } as unknown as Server;

      mockSocket.data.user = {
        sub: 'guest-123',
        name: 'Guest',
        role: 'guest',
        roomId: 'room-id-123',
      };

      prismaMock.room.findUnique.mockResolvedValue({
        id: 'room-id-123',
        code: 'ROOM12',
        status: 'LOBBY',
        hostId: 'host-123',
      });

      const player = {
        id: 'guest-123',
        displayName: 'Guest',
        score: 50,
        isReady: false,
      };

      // Simulate two rapid calls
      redisRoomRepositoryMock.getPlayers
        .mockResolvedValueOnce({ 'guest-123': JSON.stringify(player) })
        .mockResolvedValueOnce({
          'guest-123': JSON.stringify({ ...player, isReady: true }),
        })
        .mockResolvedValueOnce({
          'guest-123': JSON.stringify({ ...player, isReady: true }),
        })
        .mockResolvedValueOnce({
          'guest-123': JSON.stringify({ ...player, isReady: false }),
        });

      redisRoomRepositoryMock.getRoomMetadata.mockResolvedValue({
        status: 'LOBBY',
        hostId: 'host-123',
      });

      // First toggle: false -> true
      await gateway.handlePlayerReady(mockSocket as unknown as Socket, {
        roomId: 'room-id-123',
        playerId: 'guest-123',
      });

      // Second toggle: true -> false
      await gateway.handlePlayerReady(mockSocket as unknown as Socket, {
        roomId: 'room-id-123',
        playerId: 'guest-123',
      });

      expect(redisRoomRepositoryMock.setPlayer).toHaveBeenCalledTimes(2);
      expect(toEmitMock).toHaveBeenCalledTimes(2);
    });
  });

  describe('validateGameStart', () => {
    const ROOM_CODE = 'ROOM12';
    const GAME_ID = 'game-id-123';
    const HOST_ID = 'host-123';

    const mockRoom = {
      id: 'room-id-123',
      code: ROOM_CODE,
      status: 'LOBBY',
      hostId: HOST_ID,
    };

    const mockReadyPlayer = (id: string) =>
      JSON.stringify({ id, displayName: 'Player', score: 0, isReady: true });

    const mockUnreadyPlayer = (id: string) =>
      JSON.stringify({ id, displayName: 'Player', score: 0, isReady: false });

    const mockGame = {
      id: GAME_ID,
      name: 'Test Game',
      _count: { questions: 5 },
    };

    let mockServer: {
      in: jest.Mock;
    };

    beforeEach(() => {
      const hostSocket = {
        id: 'socket-host',
        data: { user: { sub: HOST_ID, role: 'host' } },
      };
      mockServer = {
        in: jest.fn().mockReturnValue({
          fetchSockets: jest.fn().mockResolvedValue([hostSocket]),
        }),
      };
      gateway.server = mockServer as unknown as Server;
    });

    it('should return valid when all preconditions are met', async () => {
      prismaMock.room.findUnique.mockResolvedValue(mockRoom);
      prismaMock.game.findUnique.mockResolvedValue(mockGame);
      redisRoomRepositoryMock.getPlayers.mockResolvedValue({
        'player-1': mockReadyPlayer('player-1'),
        'player-2': mockReadyPlayer('player-2'),
      });

      const result = await gateway.validateGameStart(
        ROOM_CODE,
        GAME_ID,
        HOST_ID,
      );

      expect(result.valid).toBe(true);
    });

    it('should fail when room does not exist', async () => {
      prismaMock.room.findUnique.mockResolvedValue(null);

      const result = await gateway.validateGameStart(
        ROOM_CODE,
        GAME_ID,
        HOST_ID,
      );

      expect(result.valid).toBe(false);
      if (!result.valid) expect(result.code).toBe('ROOM_NOT_FOUND');
    });

    it('should fail when room is not in LOBBY status', async () => {
      prismaMock.room.findUnique.mockResolvedValue({
        ...mockRoom,
        status: 'IN_PROGRESS',
      });

      const result = await gateway.validateGameStart(
        ROOM_CODE,
        GAME_ID,
        HOST_ID,
      );

      expect(result.valid).toBe(false);
      if (!result.valid) expect(result.code).toBe('ROOM_NOT_IN_LOBBY');
    });

    it('should fail when host is not connected to the room', async () => {
      prismaMock.room.findUnique.mockResolvedValue(mockRoom);
      // Override server.in to return no sockets
      gateway.server = {
        in: jest.fn().mockReturnValue({
          fetchSockets: jest.fn().mockResolvedValue([]),
        }),
      } as unknown as Server;

      const result = await gateway.validateGameStart(
        ROOM_CODE,
        GAME_ID,
        HOST_ID,
      );

      expect(result.valid).toBe(false);
      if (!result.valid) expect(result.code).toBe('HOST_NOT_CONNECTED');
    });

    it('should fail when there are no players in the room', async () => {
      prismaMock.room.findUnique.mockResolvedValue(mockRoom);
      redisRoomRepositoryMock.getPlayers.mockResolvedValue({});

      const result = await gateway.validateGameStart(
        ROOM_CODE,
        GAME_ID,
        HOST_ID,
      );

      expect(result.valid).toBe(false);
      if (!result.valid) expect(result.code).toBe('NOT_ENOUGH_PLAYERS');
    });

    it('should fail when at least one player is not ready', async () => {
      prismaMock.room.findUnique.mockResolvedValue(mockRoom);
      redisRoomRepositoryMock.getPlayers.mockResolvedValue({
        'player-1': mockReadyPlayer('player-1'),
        'player-2': mockUnreadyPlayer('player-2'),
      });

      const result = await gateway.validateGameStart(
        ROOM_CODE,
        GAME_ID,
        HOST_ID,
      );

      expect(result.valid).toBe(false);
      if (!result.valid) expect(result.code).toBe('PLAYERS_NOT_READY');
    });

    it('should fail when all players are unready', async () => {
      prismaMock.room.findUnique.mockResolvedValue(mockRoom);
      redisRoomRepositoryMock.getPlayers.mockResolvedValue({
        'player-1': mockUnreadyPlayer('player-1'),
      });

      const result = await gateway.validateGameStart(
        ROOM_CODE,
        GAME_ID,
        HOST_ID,
      );

      expect(result.valid).toBe(false);
      if (!result.valid) expect(result.code).toBe('PLAYERS_NOT_READY');
    });

    it('should fail when game does not exist in the database', async () => {
      prismaMock.room.findUnique.mockResolvedValue(mockRoom);
      redisRoomRepositoryMock.getPlayers.mockResolvedValue({
        'player-1': mockReadyPlayer('player-1'),
      });
      prismaMock.game.findUnique.mockResolvedValue(null);

      const result = await gateway.validateGameStart(
        ROOM_CODE,
        GAME_ID,
        HOST_ID,
      );

      expect(result.valid).toBe(false);
      if (!result.valid) expect(result.code).toBe('GAME_NOT_FOUND');
    });

    it('should fail when game exists but has no questions', async () => {
      prismaMock.room.findUnique.mockResolvedValue(mockRoom);
      redisRoomRepositoryMock.getPlayers.mockResolvedValue({
        'player-1': mockReadyPlayer('player-1'),
      });
      prismaMock.game.findUnique.mockResolvedValue({
        ...mockGame,
        _count: { questions: 0 },
      });

      const result = await gateway.validateGameStart(
        ROOM_CODE,
        GAME_ID,
        HOST_ID,
      );

      expect(result.valid).toBe(false);
      if (!result.valid) expect(result.code).toBe('GAME_HAS_NO_QUESTIONS');
    });
  });
});
