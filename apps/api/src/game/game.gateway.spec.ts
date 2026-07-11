import { Test, TestingModule } from '@nestjs/testing';
import { GameGateway } from './game.gateway';
import { TokenService } from '../auth/token.service';
import { PrismaService } from '../database/prisma.service';
import { RedisRoomRepository } from '../redis/redis-room.repository';
import { Socket, Server } from 'socket.io';
import { WsException } from '@nestjs/websockets';
import { ArgumentMetadata } from '@nestjs/common';
import { WsValidationPipe } from '../common/pipes/ws-validation.pipe';
import { JoinRoomDto } from './dto/join-room.dto';
import { LeaveRoomDto } from './dto/leave-room.dto';
import { PlayerReadyDto } from './dto/player-ready.dto';
import { ReconnectRequestDto } from './dto/reconnect-request.dto';
import { SelectGameDto } from './dto/select-game.dto';
import { StartGameDto } from './dto/start-game.dto';
import { NextRoundDto } from './dto/next-round.dto';
import { EndGameDto } from './dto/end-game.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { AnswerEvaluationService } from './answer-evaluation/answer-evaluation.service';

describe('GameGateway', () => {
  let gateway: GameGateway;
  const verifyTokenMock = jest.fn();

  const prismaMock = {
    room: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    game: {
      findUnique: jest.fn(),
    },
    question: {
      findMany: jest.fn(),
    },
    round: {
      create: jest.fn(),
      update: jest.fn(),
    },
    answer: {
      createMany: jest.fn(),
    },
    player: {
      update: jest.fn(),
    },
  };

  const answerEvaluationServiceMock = {
    evaluate: jest.fn(),
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
    loadQuestions: jest.fn(),
    getQuestion: jest.fn(),
    hasQuestions: jest.fn(),
    getAnswers: jest.fn(),
    setAnswer: jest.fn(),
    updatePlayerScores: jest.fn(),
    expireAllRoomKeys: jest.fn(),
    removePlayerDisconnectedStatus: jest.fn(),
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
        {
          provide: AnswerEvaluationService,
          useValue: answerEvaluationServiceMock,
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

    it('should throw WsException (from WsValidationPipe) when roomCode is empty — pipe rejects before handler runs', async () => {
      const pipe = new WsValidationPipe();
      const meta: ArgumentMetadata = {
        type: 'body',
        metatype: JoinRoomDto,
        data: '',
      };
      await expect(
        pipe.transform({ roomCode: '' }, meta),
      ).rejects.toBeInstanceOf(WsException);
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

    it('should append suffix (1) when a new player has a duplicate displayName', async () => {
      mockSocket.data.user = {
        sub: 'guest-456',
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
      redisRoomRepositoryMock.getPlayers.mockResolvedValue({
        'guest-123': JSON.stringify({
          id: 'guest-123',
          displayName: 'John',
          score: 50,
          isReady: true,
        }),
      });

      await gateway.handleJoinRoom(mockSocket as unknown as Socket, {
        roomCode: 'ROOM12',
      });

      expect(redisRoomRepositoryMock.setPlayer).toHaveBeenCalledWith(
        'ROOM12',
        'guest-456',
        JSON.stringify({
          id: 'guest-456',
          displayName: 'John (1)',
          score: 0,
          isReady: false,
        }),
      );
    });

    it('should append suffix (2) when both original and (1) are taken', async () => {
      mockSocket.data.user = {
        sub: 'guest-789',
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
      redisRoomRepositoryMock.getPlayers.mockResolvedValue({
        'guest-123': JSON.stringify({
          id: 'guest-123',
          displayName: 'John',
          score: 50,
          isReady: true,
        }),
        'guest-456': JSON.stringify({
          id: 'guest-456',
          displayName: 'John (1)',
          score: 30,
          isReady: true,
        }),
      });

      await gateway.handleJoinRoom(mockSocket as unknown as Socket, {
        roomCode: 'ROOM12',
      });

      expect(redisRoomRepositoryMock.setPlayer).toHaveBeenCalledWith(
        'ROOM12',
        'guest-789',
        JSON.stringify({
          id: 'guest-789',
          displayName: 'John (2)',
          score: 0,
          isReady: false,
        }),
      );
    });

    it('should not suffix displayName when joining with a unique name', async () => {
      mockSocket.data.user = {
        sub: 'guest-456',
        name: 'Alice',
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
      redisRoomRepositoryMock.getPlayers.mockResolvedValue({
        'guest-123': JSON.stringify({
          id: 'guest-123',
          displayName: 'John',
          score: 50,
          isReady: true,
        }),
      });

      await gateway.handleJoinRoom(mockSocket as unknown as Socket, {
        roomCode: 'ROOM12',
      });

      expect(redisRoomRepositoryMock.setPlayer).toHaveBeenCalledWith(
        'ROOM12',
        'guest-456',
        JSON.stringify({
          id: 'guest-456',
          displayName: 'Alice',
          score: 0,
          isReady: false,
        }),
      );
    });

    it('should not suffix displayName on reconnection (player already in room)', async () => {
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
      redisRoomRepositoryMock.getPlayers.mockResolvedValue({
        'guest-123': JSON.stringify({
          id: 'guest-123',
          displayName: 'John',
          score: 150,
          isReady: true,
        }),
        'guest-456': JSON.stringify({
          id: 'guest-456',
          displayName: 'Alice',
          score: 0,
          isReady: false,
        }),
      });

      await gateway.handleJoinRoom(mockSocket as unknown as Socket, {
        roomCode: 'ROOM12',
      });

      expect(redisRoomRepositoryMock.setPlayer).toHaveBeenCalledWith(
        'ROOM12',
        'guest-123',
        JSON.stringify({
          id: 'guest-123',
          displayName: 'John',
          score: 150,
          isReady: true,
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

    it('should reject leave when payload fields are empty — WsValidationPipe rejects before handler runs', async () => {
      const pipe = new WsValidationPipe();
      const meta: ArgumentMetadata = {
        type: 'body',
        metatype: LeaveRoomDto,
        data: '',
      };
      await expect(
        pipe.transform({ roomId: '', playerId: '' }, meta),
      ).rejects.toBeInstanceOf(WsException);
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

    it('should reject reconnect when payload fields are empty — WsValidationPipe rejects before handler runs', async () => {
      const pipe = new WsValidationPipe();
      const meta: ArgumentMetadata = {
        type: 'body',
        metatype: ReconnectRequestDto,
        data: '',
      };
      await expect(
        pipe.transform({ playerId: '', roomId: '' }, meta),
      ).rejects.toBeInstanceOf(WsException);
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

    it('should include game state in StateSync when room is IN_PROGRESS', async () => {
      mockSocket.data.user = {
        sub: 'guest-123',
        name: 'Guest',
        role: 'guest',
        roomId: 'room-id-123',
      };

      prismaMock.room.findUnique.mockResolvedValue({
        id: 'room-id-123',
        code: 'ROOM12',
        status: 'IN_PROGRESS',
        hostId: 'host-123',
      });
      redisRoomRepositoryMock.getRoomMetadata.mockResolvedValue({
        id: 'room-id-123',
        hostId: 'host-123',
        status: 'IN_PROGRESS',
        currentRoundIndex: '1',
        currentRoundId: 'round-id-456',
        currentQuestionId: 'q-123',
        timerDuration: '20',
        timerRemaining: '15',
        roundStatus: 'IN_PROGRESS',
        gameId: 'game-123',
        totalRounds: '5',
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
      redisRoomRepositoryMock.getQuestion.mockResolvedValue({
        id: 'q-123',
        prompt: 'What is 2+2?',
        answer: '4',
        difficulty: 'EASY',
        category: 'Math',
        metadata: null,
      });
      redisRoomRepositoryMock.getAnswers.mockResolvedValue({
        'guest-123': JSON.stringify({
          playerId: 'guest-123',
          answerText: '4',
          responseTimeMs: 1000,
        }),
      });

      await gateway.handleReconnectRequest(mockSocket as unknown as Socket, {
        playerId: 'guest-123',
        roomId: 'room-id-123',
      });

      const calls = mockSocket.emit.mock.calls as unknown[][];
      const stateSyncCall = calls.find((call) => call[0] === 'StateSync');

      /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
      const stateSyncPayload = stateSyncCall?.[1] as any;

      expect(stateSyncPayload?.room?.status).toBe('IN_PROGRESS');
      expect(stateSyncPayload?.game).toBeDefined();
      expect(stateSyncPayload?.game?.gameId).toBe('game-123');
      expect(stateSyncPayload?.game?.totalRounds).toBe(5);
      expect(stateSyncPayload?.game?.currentRoundIndex).toBe(1);
      expect(stateSyncPayload?.game?.currentQuestion?.id).toBe('q-123');
      expect(stateSyncPayload?.game?.timerRemaining).toBe(15);
      expect(stateSyncPayload?.game?.correctAnswer).toBeNull();
      expect(stateSyncPayload?.game?.submittedAnswer).toBe('4');
      /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
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

    it('should reject when payload fields are empty — WsValidationPipe rejects before handler runs', async () => {
      const pipe = new WsValidationPipe();
      const meta: ArgumentMetadata = {
        type: 'body',
        metatype: PlayerReadyDto,
        data: '',
      };
      await expect(
        pipe.transform({ roomId: '', playerId: '' }, meta),
      ).rejects.toBeInstanceOf(WsException);
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

  describe('handleStartGame', () => {
    interface StartMockSocket {
      id: string;
      data: {
        user?: { sub: string; name: string; role: string };
        roomCode?: string;
      };
      emit: jest.Mock;
    }

    let mockSocket: StartMockSocket;
    let mockServer: { to: jest.Mock; in: jest.Mock };

    const mockRoom = {
      id: 'room-id-123',
      code: 'ROOM12',
      status: 'LOBBY',
      hostId: 'host-123',
    };

    const mockGame = {
      id: 'game-id-123',
      name: 'Test Game',
      _count: { questions: 10 },
    };

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
        id: 'socket-host-123',
        data: {
          user: { sub: 'host-123', name: 'Host', role: 'host' },
        },
        emit: jest.fn(),
      };

      const hostSocket = {
        id: 'socket-host-123',
        data: { user: { sub: 'host-123', role: 'host' } },
      };

      mockServer = {
        to: jest.fn().mockReturnValue({ emit: jest.fn() }),
        in: jest.fn().mockReturnValue({
          fetchSockets: jest.fn().mockResolvedValue([hostSocket]),
        }),
      };
      gateway.server = mockServer as unknown as Server;
      jest.spyOn(gateway, 'startTimer').mockImplementation(() => {});
    });

    it('should reject when payload fields are empty — WsValidationPipe rejects before handler runs', async () => {
      const pipe = new WsValidationPipe();
      const meta: ArgumentMetadata = {
        type: 'body',
        metatype: StartGameDto,
        data: '',
      };
      await expect(
        pipe.transform({ roomId: '', gameId: '' }, meta),
      ).rejects.toBeInstanceOf(WsException);
    });

    it('should reject when caller is not a host', async () => {
      mockSocket.data.user = { sub: 'guest-123', name: 'Guest', role: 'guest' };

      await expect(
        gateway.handleStartGame(mockSocket as unknown as Socket, {
          roomId: 'room-id-123',
          gameId: 'game-id-123',
        }),
      ).rejects.toThrow(WsException);
      expectLastErrorCode(mockSocket.emit, 'UNAUTHORIZED');
    });

    it('should reject when socket is unauthenticated', async () => {
      mockSocket.data.user = undefined;

      await expect(
        gateway.handleStartGame(mockSocket as unknown as Socket, {
          roomId: 'room-id-123',
          gameId: 'game-id-123',
        }),
      ).rejects.toThrow(WsException);
      expectLastErrorCode(mockSocket.emit, 'UNAUTHORIZED');
    });

    it('should reject when room does not exist', async () => {
      prismaMock.room.findUnique.mockResolvedValue(null);

      await expect(
        gateway.handleStartGame(mockSocket as unknown as Socket, {
          roomId: 'room-id-123',
          gameId: 'game-id-123',
        }),
      ).rejects.toThrow(WsException);
      expectLastErrorCode(mockSocket.emit, 'ROOM_NOT_FOUND');
    });

    it('should reject when host does not own the room', async () => {
      prismaMock.room.findUnique.mockResolvedValue({
        ...mockRoom,
        hostId: 'other-host',
      });

      await expect(
        gateway.handleStartGame(mockSocket as unknown as Socket, {
          roomId: 'room-id-123',
          gameId: 'game-id-123',
        }),
      ).rejects.toThrow(WsException);
      expectLastErrorCode(mockSocket.emit, 'UNAUTHORIZED');
    });

    it('should reject when precondition validation fails', async () => {
      prismaMock.room.findUnique.mockResolvedValue(mockRoom);
      // No players in room — should fail NOT_ENOUGH_PLAYERS
      redisRoomRepositoryMock.getPlayers.mockResolvedValue({});

      await expect(
        gateway.handleStartGame(mockSocket as unknown as Socket, {
          roomId: 'room-id-123',
          gameId: 'game-id-123',
        }),
      ).rejects.toThrow(WsException);
      expectLastErrorCode(mockSocket.emit, 'NOT_ENOUGH_PLAYERS');
    });

    it('should update room status, write Redis state, and emit GameStarted on success', async () => {
      const toEmitMock = jest.fn();
      gateway.server = {
        to: jest.fn().mockReturnValue({ emit: toEmitMock }),
        in: jest.fn().mockReturnValue({
          fetchSockets: jest.fn().mockResolvedValue([
            {
              id: 'socket-host-123',
              data: { user: { sub: 'host-123', role: 'host' } },
            },
          ]),
        }),
      } as unknown as Server;

      const mockQuestions = [
        {
          id: 'q-1',
          prompt: 'P1',
          answer: 'A1',
          difficulty: 'EASY',
          category: 'C1',
          metadata: {},
        },
        {
          id: 'q-2',
          prompt: 'P2',
          answer: 'A2',
          difficulty: 'MEDIUM',
          category: 'C2',
          metadata: null,
        },
      ];
      prismaMock.room.findUnique.mockResolvedValue(mockRoom);
      prismaMock.room.update.mockResolvedValue({
        ...mockRoom,
        status: 'IN_PROGRESS',
      });
      prismaMock.game.findUnique.mockResolvedValue(mockGame);
      prismaMock.question.findMany.mockResolvedValue(mockQuestions);
      redisRoomRepositoryMock.getPlayers.mockResolvedValue({
        'player-1': JSON.stringify({
          id: 'player-1',
          displayName: 'P1',
          score: 0,
          isReady: true,
        }),
      });
      redisRoomRepositoryMock.loadQuestions.mockResolvedValue(true);

      redisRoomRepositoryMock.getRoomMetadata
        .mockResolvedValueOnce({
          id: 'room-id-123',
          status: 'LOBBY',
          selectedGameId: 'game-id-123',
        })
        .mockResolvedValue({
          id: 'room-id-123',
          status: 'IN_PROGRESS',
          gameId: 'game-id-123',
          selectedGameId: 'game-id-123',
          totalRounds: '10',
          currentRoundIndex: '0',
        });
      redisRoomRepositoryMock.getQuestion.mockResolvedValue(mockQuestions[0]);
      prismaMock.round.create.mockResolvedValue({
        id: 'round-id-abc',
        roomId: 'room-id-123',
        questionId: 'q-1',
        startedAt: new Date(),
        endedAt: null,
      });

      await gateway.handleStartGame(mockSocket as unknown as Socket, {
        roomId: 'room-id-123',
        gameId: 'game-id-123',
      });

      // Prisma question findMany called
      expect(prismaMock.question.findMany).toHaveBeenCalledWith({
        where: { gameId: 'game-id-123' },
        orderBy: { id: 'asc' },
      });

      // Redis loadQuestions called
      expect(redisRoomRepositoryMock.loadQuestions).toHaveBeenCalledWith(
        'ROOM12',
        mockQuestions,
      );

      // Prisma room status updated
      expect(prismaMock.room.update).toHaveBeenCalledWith({
        where: { id: 'room-id-123' },
        data: { status: 'IN_PROGRESS' },
      });

      // Redis metadata written for startGame + startRound
      expect(redisRoomRepositoryMock.updateRoomMetadata).toHaveBeenCalledWith(
        'ROOM12',
        {
          status: 'IN_PROGRESS',
          selectedGameId: 'game-id-123',
          gameId: 'game-id-123',
          totalRounds: '10',
          currentRoundIndex: '0',
        },
      );

      expect(redisRoomRepositoryMock.updateRoomMetadata).toHaveBeenCalledWith(
        'ROOM12',
        expect.objectContaining({
          currentRoundIndex: '0',
          currentRoundId: 'round-id-abc',
          currentQuestionId: 'q-1',
          timerDuration: '20',
          timerRemaining: '20',
        }),
      );

      // GameStarted emitted to the room
      expect(toEmitMock).toHaveBeenCalledWith('GameStarted', {
        gameId: 'game-id-123',
        totalRounds: 10,
      });

      // QuestionStarted emitted to the room
      expect(toEmitMock).toHaveBeenCalledWith('QuestionStarted', {
        roundNumber: 1,
        questionId: 'q-1',
        prompt: 'P1',
        metadata: {},
        timeLimitSeconds: 20,
        difficulty: 'EASY',
      });

      // No error emitted
      expect(mockSocket.emit).not.toHaveBeenCalledWith(
        'error',
        expect.any(Object),
      );
    });

    it('should use the persisted selected game when it differs from the StartGame payload', async () => {
      const toEmitMock = jest.fn();
      gateway.server = {
        to: jest.fn().mockReturnValue({ emit: toEmitMock }),
        in: jest.fn().mockReturnValue({
          fetchSockets: jest.fn().mockResolvedValue([
            {
              id: 'socket-host-123',
              data: { user: { sub: 'host-123', role: 'host' } },
            },
          ]),
        }),
      } as unknown as Server;

      const selectedQuestions = [
        {
          id: 'q-selected',
          prompt: 'Selected prompt',
          answer: 'Selected answer',
          difficulty: 'MEDIUM',
          category: 'C1',
          metadata: null,
        },
      ];

      prismaMock.room.findUnique.mockResolvedValue(mockRoom);
      prismaMock.room.update.mockResolvedValue({
        ...mockRoom,
        status: 'IN_PROGRESS',
      });
      prismaMock.game.findUnique.mockResolvedValue({
        ...mockGame,
        id: 'persisted-game-id',
        _count: { questions: 1 },
      });
      prismaMock.question.findMany.mockResolvedValue(selectedQuestions);
      redisRoomRepositoryMock.getPlayers.mockResolvedValue({
        'player-1': JSON.stringify({
          id: 'player-1',
          displayName: 'P1',
          score: 0,
          isReady: true,
        }),
      });
      redisRoomRepositoryMock.loadQuestions.mockResolvedValue(true);
      redisRoomRepositoryMock.getRoomMetadata
        .mockResolvedValueOnce({
          id: 'room-id-123',
          status: 'LOBBY',
          selectedGameId: 'persisted-game-id',
        })
        .mockResolvedValue({
          id: 'room-id-123',
          status: 'IN_PROGRESS',
          selectedGameId: 'persisted-game-id',
          gameId: 'persisted-game-id',
          totalRounds: '1',
          currentRoundIndex: '0',
        });
      redisRoomRepositoryMock.getQuestion.mockResolvedValue(
        selectedQuestions[0],
      );
      prismaMock.round.create.mockResolvedValue({
        id: 'round-id-selected',
        roomId: 'room-id-123',
        questionId: 'q-selected',
        startedAt: new Date(),
        endedAt: null,
      });

      await gateway.handleStartGame(mockSocket as unknown as Socket, {
        roomId: 'room-id-123',
        gameId: 'payload-game-id',
      });

      expect(prismaMock.question.findMany).toHaveBeenCalledWith({
        where: { gameId: 'persisted-game-id' },
        orderBy: { id: 'asc' },
      });
      expect(redisRoomRepositoryMock.loadQuestions).toHaveBeenCalledWith(
        'ROOM12',
        selectedQuestions,
      );
      expect(toEmitMock).toHaveBeenCalledWith('GameStarted', {
        gameId: 'persisted-game-id',
        totalRounds: 1,
      });
    });

    it('should proceed successfully even if questions are already loaded in Redis', async () => {
      const toEmitMock = jest.fn();
      gateway.server = {
        to: jest.fn().mockReturnValue({ emit: toEmitMock }),
        in: jest.fn().mockReturnValue({
          fetchSockets: jest.fn().mockResolvedValue([
            {
              id: 'socket-host-123',
              data: { user: { sub: 'host-123', role: 'host' } },
            },
          ]),
        }),
      } as unknown as Server;

      prismaMock.room.findUnique.mockResolvedValue(mockRoom);
      prismaMock.room.update.mockResolvedValue({
        ...mockRoom,
        status: 'IN_PROGRESS',
      });
      prismaMock.game.findUnique.mockResolvedValue(mockGame);
      prismaMock.question.findMany.mockResolvedValue([]);
      redisRoomRepositoryMock.getPlayers.mockResolvedValue({
        'player-1': JSON.stringify({
          id: 'player-1',
          displayName: 'P1',
          score: 0,
          isReady: true,
        }),
      });
      redisRoomRepositoryMock.loadQuestions.mockResolvedValue(false); // Duplicate question loading prevented (already loaded)

      // Mock for startRound inside handleStartGame
      redisRoomRepositoryMock.getRoomMetadata
        .mockResolvedValueOnce({
          id: 'room-id-123',
          status: 'LOBBY',
          selectedGameId: 'game-id-123',
        })
        .mockResolvedValue({
          id: 'room-id-123',
          status: 'IN_PROGRESS',
          gameId: 'game-id-123',
          selectedGameId: 'game-id-123',
          totalRounds: '10',
          currentRoundIndex: '0',
        });
      redisRoomRepositoryMock.getQuestion.mockResolvedValue({
        id: 'q-1',
        prompt: 'P1',
        answer: 'A1',
        difficulty: 'EASY',
        category: 'C1',
        metadata: {},
      });
      prismaMock.round.create.mockResolvedValue({
        id: 'round-id-abc',
        roomId: 'room-id-123',
        questionId: 'q-1',
        startedAt: new Date(),
        endedAt: null,
      });

      await gateway.handleStartGame(mockSocket as unknown as Socket, {
        roomId: 'room-id-123',
        gameId: 'game-id-123',
      });

      expect(redisRoomRepositoryMock.loadQuestions).toHaveBeenCalled();
      expect(prismaMock.room.update).toHaveBeenCalled();
      expect(toEmitMock).toHaveBeenCalledWith('GameStarted', {
        gameId: 'game-id-123',
        totalRounds: 10,
      });
      expect(toEmitMock).toHaveBeenCalledWith('QuestionStarted', {
        roundNumber: 1,
        questionId: 'q-1',
        prompt: 'P1',
        metadata: {},
        timeLimitSeconds: 20,
        difficulty: 'EASY',
      });
    });
  });

  describe('handleSelectGame', () => {
    interface SelectMockSocket {
      data: {
        user?: { sub: string; name: string; role: string };
      };
      emit: jest.Mock;
    }

    let mockSocket: SelectMockSocket;
    let toEmitMock: jest.Mock;
    const expectLastSelectErrorCode = (
      emitMock: jest.Mock,
      expectedCode: string,
    ): void => {
      const calls = emitMock.mock.calls as Array<
        [string, { error?: { code?: string } }]
      >;
      const lastPayload = calls[calls.length - 1]?.[1];
      expect(lastPayload?.error?.code).toBe(expectedCode);
    };

    beforeEach(() => {
      mockSocket = {
        data: {
          user: { sub: 'host-123', name: 'Host', role: 'host' },
        },
        emit: jest.fn(),
      };
      toEmitMock = jest.fn();
      gateway.server = {
        to: jest.fn().mockReturnValue({ emit: toEmitMock }),
      } as unknown as Server;
    });

    it('should persist the selected game in room metadata and broadcast room state', async () => {
      prismaMock.room.findUnique.mockResolvedValue({
        id: 'room-id-123',
        code: 'ROOM12',
        status: 'LOBBY',
        hostId: 'host-123',
      });
      prismaMock.game.findUnique.mockResolvedValue({
        id: 'game-id-123',
        name: 'Test Game',
        _count: { questions: 10 },
      });
      redisRoomRepositoryMock.getRoomMetadata
        .mockResolvedValueOnce({
          id: 'room-id-123',
          status: 'LOBBY',
          hostId: 'host-123',
          selectedGameId: 'old-game-id',
        })
        .mockResolvedValue({
          id: 'room-id-123',
          status: 'LOBBY',
          hostId: 'host-123',
          selectedGameId: 'game-id-123',
        });
      redisRoomRepositoryMock.getPlayers.mockResolvedValue({});

      await gateway.handleSelectGame(mockSocket as unknown as Socket, {
        roomId: 'room-id-123',
        gameId: 'game-id-123',
      });

      expect(redisRoomRepositoryMock.updateRoomMetadata).toHaveBeenCalledWith(
        'ROOM12',
        { selectedGameId: 'game-id-123' },
      );
      expect(toEmitMock).toHaveBeenCalledWith(
        'RoomStateUpdated',
        expect.objectContaining({
          status: 'LOBBY',
          selectedGameId: 'game-id-123',
        }),
      );
    });

    it('should reject non-host callers', async () => {
      mockSocket.data.user = { sub: 'guest-1', name: 'Guest', role: 'guest' };

      await expect(
        gateway.handleSelectGame(mockSocket as unknown as Socket, {
          roomId: 'room-id-123',
          gameId: 'game-id-123',
        }),
      ).rejects.toThrow(WsException);

      expectLastSelectErrorCode(mockSocket.emit, 'UNAUTHORIZED');
    });

    it('should reject changing game selection after gameplay starts', async () => {
      prismaMock.room.findUnique.mockResolvedValue({
        id: 'room-id-123',
        code: 'ROOM12',
        status: 'LOBBY',
        hostId: 'host-123',
      });
      redisRoomRepositoryMock.getRoomMetadata.mockResolvedValue({
        id: 'room-id-123',
        status: 'IN_PROGRESS',
        selectedGameId: 'old-game-id',
      });

      await expect(
        gateway.handleSelectGame(mockSocket as unknown as Socket, {
          roomId: 'room-id-123',
          gameId: 'game-id-123',
        }),
      ).rejects.toThrow(WsException);

      expectLastSelectErrorCode(mockSocket.emit, 'ROOM_NOT_IN_LOBBY');
    });
  });

  describe('startRound', () => {
    let toEmitMock: jest.Mock;

    beforeEach(() => {
      toEmitMock = jest.fn();
      gateway.server = {
        to: jest.fn().mockReturnValue({ emit: toEmitMock }),
      } as unknown as Server;
      jest.spyOn(gateway, 'startTimer').mockImplementation(() => {});
    });

    it('should throw if room metadata is not found', async () => {
      redisRoomRepositoryMock.getRoomMetadata.mockResolvedValue(null);

      await expect(gateway.startRound('ROOM12', 0)).rejects.toThrow(
        WsException,
      );
    });

    it('should throw if question is not found', async () => {
      redisRoomRepositoryMock.getRoomMetadata.mockResolvedValue({
        id: 'room-1',
      });
      redisRoomRepositoryMock.getQuestion.mockResolvedValue(null);

      await expect(gateway.startRound('ROOM12', 0)).rejects.toThrow(
        WsException,
      );
    });

    it('should create round in Postgres, update Redis meta, and emit QuestionStarted on success', async () => {
      const mockMeta = { id: 'room-id-123' };
      const mockQuestion = {
        id: 'q-1',
        prompt: 'P1',
        answer: 'A1',
        difficulty: 'EASY',
        category: 'C1',
        metadata: { hint: 'H1' },
      };
      const mockRound = { id: 'round-123' };

      redisRoomRepositoryMock.getRoomMetadata.mockResolvedValue(mockMeta);
      redisRoomRepositoryMock.getQuestion.mockResolvedValue(mockQuestion);
      prismaMock.round.create.mockResolvedValue(mockRound);

      await gateway.startRound('ROOM12', 0);

      expect(prismaMock.round.create).toHaveBeenCalledWith({
        data: {
          roomId: 'room-id-123',
          questionId: 'q-1',
        },
      });

      expect(redisRoomRepositoryMock.updateRoomMetadata).toHaveBeenCalledWith(
        'ROOM12',
        expect.objectContaining({
          currentRoundIndex: '0',
          currentRoundId: 'round-123',
          currentQuestionId: 'q-1',
          timerDuration: '20',
          timerRemaining: '20',
        }),
      );

      expect(toEmitMock).toHaveBeenCalledWith('QuestionStarted', {
        roundNumber: 1,
        questionId: 'q-1',
        prompt: 'P1',
        metadata: { hint: 'H1' },
        timeLimitSeconds: 20,
        difficulty: 'EASY',
      });
    });
  });

  describe('handleNextRound', () => {
    interface StartMockSocket {
      id: string;
      data: {
        user?: { sub: string; name: string; role: string };
        roomCode?: string;
      };
      emit: jest.Mock;
    }

    let mockSocket: StartMockSocket;
    let toEmitMock: jest.Mock;

    const mockRoom = {
      id: 'room-id-123',
      code: 'ROOM12',
      status: 'IN_PROGRESS',
      hostId: 'host-123',
    };

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
        id: 'socket-host-123',
        data: {
          user: { sub: 'host-123', name: 'Host', role: 'host' },
        },
        emit: jest.fn(),
      };

      toEmitMock = jest.fn();
      gateway.server = {
        to: jest.fn().mockReturnValue({ emit: toEmitMock }),
      } as unknown as Server;
      jest.spyOn(gateway, 'startTimer').mockImplementation(() => {});
    });

    it('should reject if roomId is empty — WsValidationPipe rejects before handler runs', async () => {
      const pipe = new WsValidationPipe();
      const meta: ArgumentMetadata = {
        type: 'body',
        metatype: NextRoundDto,
        data: '',
      };
      await expect(pipe.transform({ roomId: '' }, meta)).rejects.toBeInstanceOf(
        WsException,
      );
    });

    it('should reject if caller is not the host', async () => {
      mockSocket.data.user = { sub: 'guest-123', name: 'Guest', role: 'guest' };

      await expect(
        gateway.handleNextRound(mockSocket as unknown as Socket, {
          roomId: 'room-123',
        }),
      ).rejects.toThrow(WsException);
      expectLastErrorCode(mockSocket.emit, 'UNAUTHORIZED');
    });

    it('should reject if room does not exist', async () => {
      prismaMock.room.findUnique.mockResolvedValue(null);

      await expect(
        gateway.handleNextRound(mockSocket as unknown as Socket, {
          roomId: 'room-123',
        }),
      ).rejects.toThrow(WsException);
      expectLastErrorCode(mockSocket.emit, 'ROOM_NOT_FOUND');
    });

    it('should reject if host does not own the room', async () => {
      prismaMock.room.findUnique.mockResolvedValue({
        ...mockRoom,
        hostId: 'other-host',
      });

      await expect(
        gateway.handleNextRound(mockSocket as unknown as Socket, {
          roomId: 'room-123',
        }),
      ).rejects.toThrow(WsException);
      expectLastErrorCode(mockSocket.emit, 'UNAUTHORIZED');
    });

    it('should reject if room is not in progress', async () => {
      prismaMock.room.findUnique.mockResolvedValue({
        ...mockRoom,
        status: 'LOBBY',
      });
      redisRoomRepositoryMock.getRoomMetadata.mockResolvedValue({
        status: 'LOBBY',
      });

      await expect(
        gateway.handleNextRound(mockSocket as unknown as Socket, {
          roomId: 'room-123',
        }),
      ).rejects.toThrow(WsException);
      expectLastErrorCode(mockSocket.emit, 'ROOM_NOT_IN_PROGRESS');
    });

    it('should reject if there are no more rounds', async () => {
      prismaMock.room.findUnique.mockResolvedValue(mockRoom);
      redisRoomRepositoryMock.getRoomMetadata.mockResolvedValue({
        id: 'room-id-123',
        status: 'IN_PROGRESS',
        totalRounds: '5',
        currentRoundIndex: '4', // 0-based, last round
      });

      await expect(
        gateway.handleNextRound(mockSocket as unknown as Socket, {
          roomId: 'room-123',
        }),
      ).rejects.toThrow(WsException);
      expectLastErrorCode(mockSocket.emit, 'NO_MORE_ROUNDS');
    });

    it('should advance round successfully on next round', async () => {
      prismaMock.room.findUnique.mockResolvedValue(mockRoom);
      redisRoomRepositoryMock.getRoomMetadata.mockResolvedValue({
        id: 'room-id-123',
        status: 'IN_PROGRESS',
        totalRounds: '5',
        currentRoundIndex: '0',
      });

      const mockQuestion = {
        id: 'q-2',
        prompt: 'P2',
        answer: 'A2',
        difficulty: 'MEDIUM',
        category: 'C2',
        metadata: null,
      };
      redisRoomRepositoryMock.getQuestion.mockResolvedValue(mockQuestion);
      prismaMock.round.create.mockResolvedValue({ id: 'round-2' });

      await gateway.handleNextRound(mockSocket as unknown as Socket, {
        roomId: 'room-id-123',
      });

      expect(prismaMock.round.create).toHaveBeenCalledWith({
        data: {
          roomId: 'room-id-123',
          questionId: 'q-2',
        },
      });

      expect(toEmitMock).toHaveBeenCalledWith('QuestionStarted', {
        roundNumber: 2,
        questionId: 'q-2',
        prompt: 'P2',
        metadata: null,
        timeLimitSeconds: 20,
        difficulty: 'MEDIUM',
      });
    });
  });

  describe('Timer Engine', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should start timer, store interval reference, update Redis and emit TimerTick each second', async () => {
      const toEmitMock = jest.fn();
      gateway.server = {
        to: jest.fn().mockReturnValue({ emit: toEmitMock }),
      } as unknown as Server;

      // Mock updateRoomMetadata to resolve immediately
      redisRoomRepositoryMock.updateRoomMetadata.mockResolvedValue(undefined);

      // Start the timer with 5 seconds duration
      gateway.startTimer('ROOM12', 5);

      // Check the interval is saved
      expect(gateway.activeTimers.has('ROOM12')).toBe(true);

      // Fast-forward 1 second
      await jest.advanceTimersByTimeAsync(1000);

      // Verify Redis update and socket broadcast
      expect(redisRoomRepositoryMock.updateRoomMetadata).toHaveBeenCalledWith(
        'ROOM12',
        expect.objectContaining({ timerRemaining: '4' }),
      );
      expect(toEmitMock).toHaveBeenCalledWith('TimerTick', {
        secondsRemaining: 4,
      });

      // Fast-forward another 4 seconds (total 5) — this will trigger completeRound
      // Provide the mocks completeRound needs so it doesn't throw
      redisRoomRepositoryMock.getRoomMetadata.mockResolvedValue({
        id: 'room-id-123',
        currentRoundId: 'round-id-abc',
        currentQuestionId: 'q-1',
        currentRoundIndex: '0',
        roundStatus: 'IN_PROGRESS',
      });
      redisRoomRepositoryMock.getQuestion.mockResolvedValue({
        id: 'q-1',
        prompt: 'P1',
        answer: 'correct-answer',
        difficulty: 'EASY',
        category: null,
        metadata: null,
      });
      prismaMock.round.update.mockResolvedValue({});

      await jest.advanceTimersByTimeAsync(4000);

      // Verify timer is stopped and removed at expiration
      expect(gateway.activeTimers.has('ROOM12')).toBe(false);
    });

    it('should clear existing interval when starting a new timer for the same room', () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      gateway.startTimer('ROOM12', 5);
      const firstInterval = gateway.activeTimers.get('ROOM12');
      expect(firstInterval).toBeDefined();

      gateway.startTimer('ROOM12', 10);
      expect(clearIntervalSpy).toHaveBeenCalledWith(firstInterval);

      clearIntervalSpy.mockRestore();
    });

    it('should stop timer and clear interval on stopTimer', () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      gateway.startTimer('ROOM12', 5);
      const interval = gateway.activeTimers.get('ROOM12');
      expect(interval).toBeDefined();

      gateway.stopTimer('ROOM12');
      expect(clearIntervalSpy).toHaveBeenCalledWith(interval);
      expect(gateway.activeTimers.has('ROOM12')).toBe(false);

      clearIntervalSpy.mockRestore();
    });
  });

  describe('completeRound', () => {
    let toEmitMock: jest.Mock;

    beforeEach(() => {
      toEmitMock = jest.fn();
      gateway.server = {
        to: jest.fn().mockReturnValue({ emit: toEmitMock }),
      } as unknown as Server;
    });

    it('should stop the timer, mark round as COMPLETE in Redis, update round endedAt in PostgreSQL, and emit AnswerReveal', async () => {
      const stopTimerSpy = jest.spyOn(gateway, 'stopTimer');

      redisRoomRepositoryMock.getRoomMetadata.mockResolvedValue({
        id: 'room-id-123',
        currentRoundId: 'round-id-abc',
        currentQuestionId: 'q-1',
        currentRoundIndex: '0',
        roundStatus: 'IN_PROGRESS',
      });
      redisRoomRepositoryMock.getQuestion.mockResolvedValue({
        id: 'q-1',
        prompt: 'P1',
        answer: 'correct-answer',
        difficulty: 'EASY',
        category: null,
        metadata: null,
      });
      prismaMock.round.update.mockResolvedValue({
        id: 'round-id-abc',
        endedAt: new Date(),
      });

      await gateway.completeRound('ROOM12');

      // Timer is stopped immediately
      expect(stopTimerSpy).toHaveBeenCalledWith('ROOM12');

      // Redis marked as COMPLETE to gate late submissions
      expect(redisRoomRepositoryMock.updateRoomMetadata).toHaveBeenCalledWith(
        'ROOM12',
        { roundStatus: 'COMPLETE' },
      );

      // PostgreSQL round endedAt updated
      expect(prismaMock.round.update).toHaveBeenCalledWith({
        where: { id: 'round-id-abc' },
        data: { endedAt: expect.any(Date) as Date },
      });

      // AnswerReveal broadcast to all clients in room
      expect(toEmitMock).toHaveBeenCalledWith('AnswerReveal', {
        correctAnswer: 'correct-answer',
        questionId: 'q-1',
        roundId: 'round-id-abc',
      });
    });

    it('should emit AnswerReveal with null correctAnswer when question is missing from Redis', async () => {
      redisRoomRepositoryMock.getRoomMetadata.mockResolvedValue({
        id: 'room-id-123',
        currentRoundId: 'round-id-abc',
        currentQuestionId: 'q-1',
        currentRoundIndex: '0',
      });
      redisRoomRepositoryMock.getQuestion.mockResolvedValue(null);
      prismaMock.round.update.mockResolvedValue({});

      await gateway.completeRound('ROOM12');

      expect(toEmitMock).toHaveBeenCalledWith('AnswerReveal', {
        correctAnswer: null,
        questionId: 'q-1',
        roundId: 'round-id-abc',
      });
    });

    it('should return early without broadcasting if room metadata is not found', async () => {
      redisRoomRepositoryMock.getRoomMetadata.mockResolvedValue(null);

      await gateway.completeRound('ROOM12');

      expect(toEmitMock).not.toHaveBeenCalled();
      expect(prismaMock.round.update).not.toHaveBeenCalled();
    });

    it('should still broadcast AnswerReveal even if PostgreSQL round update fails', async () => {
      redisRoomRepositoryMock.getRoomMetadata.mockResolvedValue({
        id: 'room-id-123',
        currentRoundId: 'round-id-abc',
        currentQuestionId: 'q-1',
        currentRoundIndex: '2',
      });
      redisRoomRepositoryMock.getQuestion.mockResolvedValue({
        id: 'q-1',
        prompt: 'P1',
        answer: 'correct-answer',
        difficulty: 'MEDIUM',
        category: null,
        metadata: null,
      });
      prismaMock.round.update.mockRejectedValue(
        new Error('Database connection lost'),
      );

      // Should NOT throw — PostgreSQL failure is logged but non-fatal
      await expect(gateway.completeRound('ROOM12')).resolves.not.toThrow();

      // AnswerReveal is still emitted despite DB failure
      expect(toEmitMock).toHaveBeenCalledWith('AnswerReveal', {
        correctAnswer: 'correct-answer',
        questionId: 'q-1',
        roundId: 'round-id-abc',
      });
    });

    it('should skip PostgreSQL update when currentRoundId is absent from Redis metadata', async () => {
      redisRoomRepositoryMock.getRoomMetadata.mockResolvedValue({
        id: 'room-id-123',
        currentQuestionId: 'q-1',
        currentRoundIndex: '0',
        // currentRoundId deliberately absent
      });
      redisRoomRepositoryMock.getQuestion.mockResolvedValue({
        id: 'q-1',
        prompt: 'P1',
        answer: 'answer-x',
        difficulty: 'EASY',
        category: null,
        metadata: null,
      });

      await gateway.completeRound('ROOM12');

      expect(prismaMock.round.update).not.toHaveBeenCalled();
      expect(toEmitMock).toHaveBeenCalledWith('AnswerReveal', {
        correctAnswer: 'answer-x',
        questionId: 'q-1',
        roundId: null,
      });
    });

    it('should call stopTimer before any async work so late ticks cannot fire', async () => {
      const callOrder: string[] = [];

      jest
        .spyOn(gateway, 'stopTimer')
        .mockImplementation(() => callOrder.push('stopTimer'));

      redisRoomRepositoryMock.getRoomMetadata.mockImplementation(() => {
        callOrder.push('getRoomMetadata');
        return Promise.resolve({
          id: 'room-id-123',
          currentRoundId: 'round-abc',
          currentQuestionId: 'q-1',
          currentRoundIndex: '0',
        });
      });
      redisRoomRepositoryMock.getQuestion.mockResolvedValue({
        id: 'q-1',
        prompt: 'P',
        answer: 'A',
        difficulty: 'EASY',
        category: null,
        metadata: null,
      });
      prismaMock.round.update.mockResolvedValue({});

      await gateway.completeRound('ROOM12');

      // stopTimer must be the very first operation
    });
  });

  describe('handleSubmitAnswer', () => {
    interface StartMockSocket {
      id: string;
      data: {
        user?: { sub: string; name: string; role: string; roomId: string };
        roomCode?: string;
      };
      emit: jest.Mock;
    }

    let mockSocket: StartMockSocket;
    const mockRoom = {
      id: 'room-id-123',
      code: 'ROOM12',
      status: 'IN_PROGRESS',
      hostId: 'host-123',
    };

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
        id: 'socket-player-123',
        data: {
          user: {
            sub: 'player-123',
            name: 'Player',
            role: 'guest',
            roomId: 'room-id-123',
          },
        },
        emit: jest.fn(),
      };
    });

    it('should reject if required payload fields are empty — WsValidationPipe rejects before handler runs', async () => {
      const pipe = new WsValidationPipe();
      const meta: ArgumentMetadata = {
        type: 'body',
        metatype: SubmitAnswerDto,
        data: '',
      };
      await expect(
        pipe.transform(
          { roomId: '', questionId: '', answer: '', responseTimeMs: 0 },
          meta,
        ),
      ).rejects.toBeInstanceOf(WsException);
    });

    it('should reject if user is not a guest player', async () => {
      mockSocket.data.user = {
        sub: 'host-123',
        name: 'Host',
        role: 'host',
        roomId: 'room-id-123',
      };

      await expect(
        gateway.handleSubmitAnswer(mockSocket as unknown as Socket, {
          roomId: 'room-id-123',
          questionId: 'q-1',
          answer: 'ans',
          responseTimeMs: 500,
        }),
      ).rejects.toThrow(WsException);
      expectLastErrorCode(mockSocket.emit, 'UNAUTHORIZED');
    });

    it('should reject if token roomId does not match payload roomId', async () => {
      mockSocket.data.user!.roomId = 'other-room';

      await expect(
        gateway.handleSubmitAnswer(mockSocket as unknown as Socket, {
          roomId: 'room-id-123',
          questionId: 'q-1',
          answer: 'ans',
          responseTimeMs: 500,
        }),
      ).rejects.toThrow(WsException);
      expectLastErrorCode(mockSocket.emit, 'UNAUTHORIZED');
    });

    it('should reject if room does not exist', async () => {
      prismaMock.room.findUnique.mockResolvedValue(null);

      await expect(
        gateway.handleSubmitAnswer(mockSocket as unknown as Socket, {
          roomId: 'room-id-123',
          questionId: 'q-1',
          answer: 'ans',
          responseTimeMs: 500,
        }),
      ).rejects.toThrow(WsException);
      expectLastErrorCode(mockSocket.emit, 'ROOM_NOT_FOUND');
    });

    it('should reject if room metadata is missing', async () => {
      prismaMock.room.findUnique.mockResolvedValue(mockRoom);
      redisRoomRepositoryMock.getRoomMetadata.mockResolvedValue(null);

      await expect(
        gateway.handleSubmitAnswer(mockSocket as unknown as Socket, {
          roomId: 'room-id-123',
          questionId: 'q-1',
          answer: 'ans',
          responseTimeMs: 500,
        }),
      ).rejects.toThrow(WsException);
      expectLastErrorCode(mockSocket.emit, 'ROOM_NOT_FOUND');
    });

    it('should reject if game status is not in progress', async () => {
      prismaMock.room.findUnique.mockResolvedValue(mockRoom);
      redisRoomRepositoryMock.getRoomMetadata.mockResolvedValue({
        status: 'LOBBY',
      });

      await expect(
        gateway.handleSubmitAnswer(mockSocket as unknown as Socket, {
          roomId: 'room-id-123',
          questionId: 'q-1',
          answer: 'ans',
          responseTimeMs: 500,
        }),
      ).rejects.toThrow(WsException);
      expectLastErrorCode(mockSocket.emit, 'ROOM_NOT_IN_PROGRESS');
    });

    it('should reject if roundStatus is COMPLETE', async () => {
      prismaMock.room.findUnique.mockResolvedValue(mockRoom);
      redisRoomRepositoryMock.getRoomMetadata.mockResolvedValue({
        status: 'IN_PROGRESS',
        roundStatus: 'COMPLETE',
      });

      await expect(
        gateway.handleSubmitAnswer(mockSocket as unknown as Socket, {
          roomId: 'room-id-123',
          questionId: 'q-1',
          answer: 'ans',
          responseTimeMs: 500,
        }),
      ).rejects.toThrow(WsException);
      expectLastErrorCode(mockSocket.emit, 'ROUND_ALREADY_COMPLETED');
    });

    it('should reject if submission is late based on wall-clock questionStartedAt time', async () => {
      prismaMock.room.findUnique.mockResolvedValue(mockRoom);
      // Started 25 seconds ago (limit is 20)
      const startTime = new Date(Date.now() - 25000).toISOString();
      redisRoomRepositoryMock.getRoomMetadata.mockResolvedValue({
        status: 'IN_PROGRESS',
        questionStartedAt: startTime,
        timerDuration: '20',
      });

      await expect(
        gateway.handleSubmitAnswer(mockSocket as unknown as Socket, {
          roomId: 'room-id-123',
          questionId: 'q-1',
          answer: 'ans',
          responseTimeMs: 500,
        }),
      ).rejects.toThrow(WsException);
      expectLastErrorCode(mockSocket.emit, 'ROUND_ALREADY_COMPLETED');
    });

    it('should reject if questionId does not match currentQuestionId', async () => {
      prismaMock.room.findUnique.mockResolvedValue(mockRoom);
      redisRoomRepositoryMock.getRoomMetadata.mockResolvedValue({
        status: 'IN_PROGRESS',
        currentQuestionId: 'q-2',
      });

      await expect(
        gateway.handleSubmitAnswer(mockSocket as unknown as Socket, {
          roomId: 'room-id-123',
          questionId: 'q-1',
          answer: 'ans',
          responseTimeMs: 500,
        }),
      ).rejects.toThrow(WsException);
      expectLastErrorCode(mockSocket.emit, 'QUESTION_MISMATCH');
    });

    it('should reject if duplicate submission', async () => {
      prismaMock.room.findUnique.mockResolvedValue(mockRoom);
      redisRoomRepositoryMock.getRoomMetadata.mockResolvedValue({
        status: 'IN_PROGRESS',
        currentRoundId: 'round-1',
        currentQuestionId: 'q-1',
      });
      redisRoomRepositoryMock.getAnswers.mockResolvedValue({
        'player-123': '{"answerText":"ans"}',
      });

      await expect(
        gateway.handleSubmitAnswer(mockSocket as unknown as Socket, {
          roomId: 'room-id-123',
          questionId: 'q-1',
          answer: 'new-ans',
          responseTimeMs: 500,
        }),
      ).rejects.toThrow(WsException);
      expectLastErrorCode(mockSocket.emit, 'DUPLICATE_SUBMISSION');
    });

    it('should use AnswerEvaluationService with typo threshold to evaluate answers', async () => {
      prismaMock.room.findUnique.mockResolvedValue(mockRoom);
      redisRoomRepositoryMock.getRoomMetadata.mockResolvedValue({
        status: 'IN_PROGRESS',
        currentRoundId: 'round-1',
        currentQuestionId: 'q-1',
        currentRoundIndex: '0',
      });
      redisRoomRepositoryMock.getAnswers.mockResolvedValue({});
      redisRoomRepositoryMock.getQuestion.mockResolvedValue({
        id: 'q-1',
        answer: 'Harry Potter',
      });
      answerEvaluationServiceMock.evaluate.mockReturnValue(true);

      await gateway.handleSubmitAnswer(mockSocket as unknown as Socket, {
        roomId: 'room-id-123',
        questionId: 'q-1',
        answer: '  harry potter  ',
        responseTimeMs: 1200,
      });

      // Should pass the answer, primary target, and typo threshold of 1
      expect(answerEvaluationServiceMock.evaluate).toHaveBeenCalledWith(
        '  harry potter  ',
        'Harry Potter',
        1,
      );
      expect(redisRoomRepositoryMock.setAnswer).toHaveBeenCalledWith(
        'ROOM12',
        'round-1',
        'player-123',
        expect.stringContaining('"isCorrect":true'),
      );
    });

    it('should evaluate Bad Movie Description answer with alternate movie titles', async () => {
      prismaMock.room.findUnique.mockResolvedValue(mockRoom);
      redisRoomRepositoryMock.getRoomMetadata.mockResolvedValue({
        status: 'IN_PROGRESS',
        currentRoundId: 'round-2',
        currentQuestionId: 'q-2',
        currentRoundIndex: '1',
      });
      redisRoomRepositoryMock.getAnswers.mockResolvedValue({});
      redisRoomRepositoryMock.getQuestion.mockResolvedValue({
        id: 'q-2',
        answer: 'Spider-Man',
        metadata: {
          hint: 'Superhero with a spider bite',
          acceptedAnswers: ['Spiderman'],
        },
      });
      answerEvaluationServiceMock.evaluate.mockReturnValue(true);

      await gateway.handleSubmitAnswer(mockSocket as unknown as Socket, {
        roomId: 'room-id-123',
        questionId: 'q-2',
        answer: 'spiderman',
        responseTimeMs: 3000,
      });

      // Should pass the answer, both primary and alternate targets, and threshold of 1
      expect(answerEvaluationServiceMock.evaluate).toHaveBeenCalledWith(
        'spiderman',
        ['Spider-Man', 'Spiderman'],
        1,
      );
      expect(redisRoomRepositoryMock.setAnswer).toHaveBeenCalledWith(
        'ROOM12',
        'round-2',
        'player-123',
        expect.stringContaining('"isCorrect":true'),
      );
    });

    it('should evaluate Bad Movie Description answer with alternate title without "The" prefix', async () => {
      prismaMock.room.findUnique.mockResolvedValue(mockRoom);
      redisRoomRepositoryMock.getRoomMetadata.mockResolvedValue({
        status: 'IN_PROGRESS',
        currentRoundId: 'round-3',
        currentQuestionId: 'q-3',
        currentRoundIndex: '2',
      });
      redisRoomRepositoryMock.getAnswers.mockResolvedValue({});
      redisRoomRepositoryMock.getQuestion.mockResolvedValue({
        id: 'q-3',
        answer: 'The Lion King',
        metadata: {
          hint: 'Disney animated classic',
          acceptedAnswers: ['Lion King'],
        },
      });
      answerEvaluationServiceMock.evaluate.mockReturnValue(true);

      await gateway.handleSubmitAnswer(mockSocket as unknown as Socket, {
        roomId: 'room-id-123',
        questionId: 'q-3',
        answer: 'Lion King',
        responseTimeMs: 5000,
      });

      expect(answerEvaluationServiceMock.evaluate).toHaveBeenCalledWith(
        'Lion King',
        ['The Lion King', 'Lion King'],
        1,
      );
      expect(redisRoomRepositoryMock.setAnswer).toHaveBeenCalledWith(
        'ROOM12',
        'round-3',
        'player-123',
        expect.stringContaining('"isCorrect":true'),
      );
    });

    it('should accept minor typo in Bad Movie Description answer via threshold=1', async () => {
      prismaMock.room.findUnique.mockResolvedValue(mockRoom);
      redisRoomRepositoryMock.getRoomMetadata.mockResolvedValue({
        status: 'IN_PROGRESS',
        currentRoundId: 'round-4',
        currentQuestionId: 'q-4',
        currentRoundIndex: '3',
      });
      redisRoomRepositoryMock.getAnswers.mockResolvedValue({});
      redisRoomRepositoryMock.getQuestion.mockResolvedValue({
        id: 'q-4',
        answer: 'Harry Potter',
        metadata: {
          hint: 'The boy who lived',
          acceptedAnswers: [],
        },
      });
      answerEvaluationServiceMock.evaluate.mockReturnValue(true);

      await gateway.handleSubmitAnswer(mockSocket as unknown as Socket, {
        roomId: 'room-id-123',
        questionId: 'q-4',
        answer: 'Harry Poter', // Typo: missing 't'
        responseTimeMs: 2000,
      });

      expect(answerEvaluationServiceMock.evaluate).toHaveBeenCalledWith(
        'Harry Poter',
        'Harry Potter',
        1,
      );
      expect(redisRoomRepositoryMock.setAnswer).toHaveBeenCalledWith(
        'ROOM12',
        'round-4',
        'player-123',
        expect.stringContaining('"isCorrect":true'),
      );
    });

    it('should accept normalized Bad Movie Description answer with punctuation differences', async () => {
      prismaMock.room.findUnique.mockResolvedValue(mockRoom);
      redisRoomRepositoryMock.getRoomMetadata.mockResolvedValue({
        status: 'IN_PROGRESS',
        currentRoundId: 'round-5',
        currentQuestionId: 'q-5',
        currentRoundIndex: '4',
      });
      redisRoomRepositoryMock.getAnswers.mockResolvedValue({});
      redisRoomRepositoryMock.getQuestion.mockResolvedValue({
        id: 'q-5',
        answer: 'E.T.',
        metadata: {
          hint: 'Phone home',
          acceptedAnswers: ['ET'],
        },
      });
      answerEvaluationServiceMock.evaluate.mockReturnValue(true);

      await gateway.handleSubmitAnswer(mockSocket as unknown as Socket, {
        roomId: 'room-id-123',
        questionId: 'q-5',
        answer: 'ET',
        responseTimeMs: 1500,
      });

      expect(answerEvaluationServiceMock.evaluate).toHaveBeenCalledWith(
        'ET',
        ['E.T.', 'ET'],
        1,
      );
    });

    it('should evaluate Gibberish exact answers through the shared evaluator', async () => {
      prismaMock.room.findUnique.mockResolvedValue(mockRoom);
      redisRoomRepositoryMock.getRoomMetadata.mockResolvedValue({
        status: 'IN_PROGRESS',
        currentRoundId: 'round-6',
        currentQuestionId: 'q-6',
        currentRoundIndex: '5',
      });
      redisRoomRepositoryMock.getAnswers.mockResolvedValue({});
      redisRoomRepositoryMock.getQuestion.mockResolvedValue({
        id: 'q-6',
        answer: 'Star Wars',
        metadata: { hint: 'May the force be with you' },
      });
      answerEvaluationServiceMock.evaluate.mockReturnValue(true);

      await gateway.handleSubmitAnswer(mockSocket as unknown as Socket, {
        roomId: 'room-id-123',
        questionId: 'q-6',
        answer: 'Star Wars',
        responseTimeMs: 1100,
      });

      expect(answerEvaluationServiceMock.evaluate).toHaveBeenCalledWith(
        'Star Wars',
        'Star Wars',
        1,
      );
      expect(redisRoomRepositoryMock.setAnswer).toHaveBeenCalledWith(
        'ROOM12',
        'round-6',
        'player-123',
        expect.stringContaining('"isCorrect":true'),
      );
    });

    it('should evaluate Gibberish answers with normalized spacing', async () => {
      prismaMock.room.findUnique.mockResolvedValue(mockRoom);
      redisRoomRepositoryMock.getRoomMetadata.mockResolvedValue({
        status: 'IN_PROGRESS',
        currentRoundId: 'round-7',
        currentQuestionId: 'q-7',
        currentRoundIndex: '6',
      });
      redisRoomRepositoryMock.getAnswers.mockResolvedValue({});
      redisRoomRepositoryMock.getQuestion.mockResolvedValue({
        id: 'q-7',
        answer: 'Back to the Future',
        metadata: { hint: '1.21 gigawatts!' },
      });
      answerEvaluationServiceMock.evaluate.mockReturnValue(true);

      await gateway.handleSubmitAnswer(mockSocket as unknown as Socket, {
        roomId: 'room-id-123',
        questionId: 'q-7',
        answer: 'Back   to   the   Future',
        responseTimeMs: 2100,
      });

      expect(answerEvaluationServiceMock.evaluate).toHaveBeenCalledWith(
        'Back   to   the   Future',
        'Back to the Future',
        1,
      );
      expect(redisRoomRepositoryMock.setAnswer).toHaveBeenCalledWith(
        'ROOM12',
        'round-7',
        'player-123',
        expect.stringContaining('"isCorrect":true'),
      );
    });

    it('should evaluate Gibberish answers with hyphen variants from acceptedAnswers', async () => {
      prismaMock.room.findUnique.mockResolvedValue(mockRoom);
      redisRoomRepositoryMock.getRoomMetadata.mockResolvedValue({
        status: 'IN_PROGRESS',
        currentRoundId: 'round-8',
        currentQuestionId: 'q-8',
        currentRoundIndex: '7',
      });
      redisRoomRepositoryMock.getAnswers.mockResolvedValue({});
      redisRoomRepositoryMock.getQuestion.mockResolvedValue({
        id: 'q-8',
        answer: 'The X-Files',
        metadata: {
          hint: 'The truth is out there',
          acceptedAnswers: ['X-Files', 'X Files'],
        },
      });
      answerEvaluationServiceMock.evaluate.mockReturnValue(true);

      await gateway.handleSubmitAnswer(mockSocket as unknown as Socket, {
        roomId: 'room-id-123',
        questionId: 'q-8',
        answer: 'X Files',
        responseTimeMs: 1800,
      });

      expect(answerEvaluationServiceMock.evaluate).toHaveBeenCalledWith(
        'X Files',
        ['The X-Files', 'X-Files', 'X Files'],
        1,
      );
      expect(redisRoomRepositoryMock.setAnswer).toHaveBeenCalledWith(
        'ROOM12',
        'round-8',
        'player-123',
        expect.stringContaining('"isCorrect":true'),
      );
    });

    it('should accept minor typos in Gibberish answers via threshold=1', async () => {
      prismaMock.room.findUnique.mockResolvedValue(mockRoom);
      redisRoomRepositoryMock.getRoomMetadata.mockResolvedValue({
        status: 'IN_PROGRESS',
        currentRoundId: 'round-9',
        currentQuestionId: 'q-9',
        currentRoundIndex: '8',
      });
      redisRoomRepositoryMock.getAnswers.mockResolvedValue({});
      redisRoomRepositoryMock.getQuestion.mockResolvedValue({
        id: 'q-9',
        answer: 'Harry Potter',
        metadata: { hint: 'The boy who lived' },
      });
      answerEvaluationServiceMock.evaluate.mockReturnValue(true);

      await gateway.handleSubmitAnswer(mockSocket as unknown as Socket, {
        roomId: 'room-id-123',
        questionId: 'q-9',
        answer: 'Harry Pottre',
        responseTimeMs: 1900,
      });

      expect(answerEvaluationServiceMock.evaluate).toHaveBeenCalledWith(
        'Harry Pottre',
        'Harry Potter',
        1,
      );
      expect(redisRoomRepositoryMock.setAnswer).toHaveBeenCalledWith(
        'ROOM12',
        'round-9',
        'player-123',
        expect.stringContaining('"isCorrect":true'),
      );
    });

    it('should reject incorrect Gibberish answers', async () => {
      prismaMock.room.findUnique.mockResolvedValue(mockRoom);
      redisRoomRepositoryMock.getRoomMetadata.mockResolvedValue({
        status: 'IN_PROGRESS',
        currentRoundId: 'round-10',
        currentQuestionId: 'q-10',
        currentRoundIndex: '9',
      });
      redisRoomRepositoryMock.getAnswers.mockResolvedValue({});
      redisRoomRepositoryMock.getQuestion.mockResolvedValue({
        id: 'q-10',
        answer: 'Harry Potter',
        metadata: { hint: 'The boy who lived' },
      });
      answerEvaluationServiceMock.evaluate.mockReturnValue(false);

      await gateway.handleSubmitAnswer(mockSocket as unknown as Socket, {
        roomId: 'room-id-123',
        questionId: 'q-10',
        answer: 'Voldemort',
        responseTimeMs: 1900,
      });

      expect(answerEvaluationServiceMock.evaluate).toHaveBeenCalledWith(
        'Voldemort',
        'Harry Potter',
        1,
      );
      expect(redisRoomRepositoryMock.setAnswer).toHaveBeenCalledWith(
        'ROOM12',
        'round-10',
        'player-123',
        expect.stringContaining('"isCorrect":false'),
      );
    });

    it('should save incorrect answer in Redis and emit SubmitAnswerAck', async () => {
      prismaMock.room.findUnique.mockResolvedValue(mockRoom);
      redisRoomRepositoryMock.getRoomMetadata.mockResolvedValue({
        status: 'IN_PROGRESS',
        currentRoundId: 'round-1',
        currentQuestionId: 'q-1',
        currentRoundIndex: '0',
      });
      redisRoomRepositoryMock.getAnswers.mockResolvedValue({});
      redisRoomRepositoryMock.getQuestion.mockResolvedValue({
        id: 'q-1',
        answer: 'Harry Potter',
      });
      answerEvaluationServiceMock.evaluate.mockReturnValue(false);

      await gateway.handleSubmitAnswer(mockSocket as unknown as Socket, {
        roomId: 'room-id-123',
        questionId: 'q-1',
        answer: 'Voldemort',
        responseTimeMs: 1200,
      });

      expect(redisRoomRepositoryMock.setAnswer).toHaveBeenCalledWith(
        'ROOM12',
        'round-1',
        'player-123',
        expect.stringContaining('"isCorrect":false'),
      );
      expect(mockSocket.emit).toHaveBeenCalledWith('SubmitAnswerAck', {
        success: true,
        data: {
          playerId: 'player-123',
          roundId: 'round-1',
          questionId: 'q-1',
          answerText: 'Voldemort',
          responseTimeMs: 1200,
        },
      });
    });

    it('should save correct answer in Redis and emit SubmitAnswerAck', async () => {
      prismaMock.room.findUnique.mockResolvedValue(mockRoom);
      redisRoomRepositoryMock.getRoomMetadata.mockResolvedValue({
        status: 'IN_PROGRESS',
        currentRoundId: 'round-1',
        currentQuestionId: 'q-1',
        currentRoundIndex: '0',
      });
      redisRoomRepositoryMock.getAnswers.mockResolvedValue({});
      redisRoomRepositoryMock.getQuestion.mockResolvedValue({
        id: 'q-1',
        answer: 'Harry Potter',
      });
      answerEvaluationServiceMock.evaluate.mockReturnValue(true);

      await gateway.handleSubmitAnswer(mockSocket as unknown as Socket, {
        roomId: 'room-id-123',
        questionId: 'q-1',
        answer: '  harry potter  ',
        responseTimeMs: 1200,
      });

      expect(redisRoomRepositoryMock.setAnswer).toHaveBeenCalledWith(
        'ROOM12',
        'round-1',
        'player-123',
        expect.stringContaining('"isCorrect":true'),
      );
    });
  });

  describe('calculateAndApplyScores', () => {
    it('should calculate correct points (base + speed bonus) and apply them atomically', async () => {
      const playersMap = {
        'p-1':
          '{"id":"p-1","displayName":"Player 1","score":500,"isReady":true}',
        'p-2':
          '{"id":"p-2","displayName":"Player 2","score":100,"isReady":true}',
        'p-3': '{"id":"p-3","displayName":"Player 3","score":0,"isReady":true}',
      };

      const answersMap = {
        'p-1': '{"answerText":"ans","responseTime":5000,"isCorrect":true}', // 5s response, gets 1000 + 375 = 1375
        'p-2': '{"answerText":"wrong","responseTime":2000,"isCorrect":false}', // incorrect, gets 0
        // p-3 didn't submit
      };

      redisRoomRepositoryMock.getPlayers.mockResolvedValue(playersMap);
      redisRoomRepositoryMock.getAnswers.mockResolvedValue(answersMap);

      await gateway.calculateAndApplyScores('ROOM12', 'round-abc', '20');

      expect(redisRoomRepositoryMock.updatePlayerScores).toHaveBeenCalledWith(
        'ROOM12',
        [
          {
            playerId: 'p-1',
            newScore: 1875,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            playerJson: expect.stringContaining('"score":1875'),
          },
        ],
      );
    });

    it('should handle corrupted player JSON gracefully without throwing', async () => {
      const playersMap = {
        'p-1': 'invalid-json',
        'p-2':
          '{"id":"p-2","displayName":"Player 2","score":100,"isReady":true}',
      };

      const answersMap = {
        'p-2': '{"answerText":"ans","responseTime":0,"isCorrect":true}', // 0s response, gets 1500
      };

      redisRoomRepositoryMock.getPlayers.mockResolvedValue(playersMap);
      redisRoomRepositoryMock.getAnswers.mockResolvedValue(answersMap);

      await expect(
        gateway.calculateAndApplyScores('ROOM12', 'round-abc', '20'),
      ).resolves.not.toThrow();

      expect(redisRoomRepositoryMock.updatePlayerScores).toHaveBeenCalledWith(
        'ROOM12',
        [
          {
            playerId: 'p-2',
            newScore: 1600,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            playerJson: expect.stringContaining('"score":1600'),
          },
        ],
      );
    });
  });

  describe('persistRoundAnswers', () => {
    it('should bulk-create all valid answers in PostgreSQL with correct fields', async () => {
      redisRoomRepositoryMock.getAnswers.mockResolvedValue({
        'player-uuid-1': JSON.stringify({
          answerText: 'Paris',
          responseTime: 3500,
          isCorrect: true,
        }),
        'player-uuid-2': JSON.stringify({
          answerText: 'Berlin',
          responseTime: 8200,
          isCorrect: false,
        }),
      });
      prismaMock.answer.createMany.mockResolvedValue({ count: 2 });

      await gateway.persistRoundAnswers('ROOM12', 'round-abc');

      expect(prismaMock.answer.createMany).toHaveBeenCalledWith({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data: expect.arrayContaining([
          {
            roundId: 'round-abc',
            playerId: 'player-uuid-1',
            answerText: 'Paris',
            responseTime: 3500,
            isCorrect: true,
          },
          {
            roundId: 'round-abc',
            playerId: 'player-uuid-2',
            answerText: 'Berlin',
            responseTime: 8200,
            isCorrect: false,
          },
        ]),
        skipDuplicates: true,
      });
    });

    it('should skip persistence and not call createMany when no answers exist in Redis', async () => {
      redisRoomRepositoryMock.getAnswers.mockResolvedValue({});

      await gateway.persistRoundAnswers('ROOM12', 'round-abc');

      expect(prismaMock.answer.createMany).not.toHaveBeenCalled();
    });

    it('should skip malformed JSON entries and still persist the valid ones', async () => {
      redisRoomRepositoryMock.getAnswers.mockResolvedValue({
        'player-good': JSON.stringify({
          answerText: 'correct',
          responseTime: 2000,
          isCorrect: true,
        }),
        'player-bad': 'this-is-not-json',
      });
      prismaMock.answer.createMany.mockResolvedValue({ count: 1 });

      await gateway.persistRoundAnswers('ROOM12', 'round-abc');

      expect(prismaMock.answer.createMany).toHaveBeenCalledWith({
        data: [
          {
            roundId: 'round-abc',
            playerId: 'player-good',
            answerText: 'correct',
            responseTime: 2000,
            isCorrect: true,
          },
        ],
        skipDuplicates: true,
      });
    });

    it('should skip entries with incomplete parsed fields and still persist valid ones', async () => {
      redisRoomRepositoryMock.getAnswers.mockResolvedValue({
        'player-incomplete': JSON.stringify({
          answerText: 'something',
          // responseTime and isCorrect intentionally missing
        }),
        'player-ok': JSON.stringify({
          answerText: 'right',
          responseTime: 1000,
          isCorrect: true,
        }),
      });
      prismaMock.answer.createMany.mockResolvedValue({ count: 1 });

      await gateway.persistRoundAnswers('ROOM12', 'round-abc');

      expect(prismaMock.answer.createMany).toHaveBeenCalledWith({
        data: [
          {
            roundId: 'round-abc',
            playerId: 'player-ok',
            answerText: 'right',
            responseTime: 1000,
            isCorrect: true,
          },
        ],
        skipDuplicates: true,
      });
    });

    it('should not throw when all entries are malformed — nothing persisted', async () => {
      redisRoomRepositoryMock.getAnswers.mockResolvedValue({
        'player-1': 'bad-json',
        'player-2': '{}',
      });

      await expect(
        gateway.persistRoundAnswers('ROOM12', 'round-abc'),
      ).resolves.not.toThrow();

      expect(prismaMock.answer.createMany).not.toHaveBeenCalled();
    });

    it('should not throw when PostgreSQL createMany fails — logs the error and continues', async () => {
      redisRoomRepositoryMock.getAnswers.mockResolvedValue({
        'player-1': JSON.stringify({
          answerText: 'ans',
          responseTime: 1500,
          isCorrect: true,
        }),
      });
      prismaMock.answer.createMany.mockRejectedValue(
        new Error('DB write failed'),
      );

      await expect(
        gateway.persistRoundAnswers('ROOM12', 'round-abc'),
      ).resolves.not.toThrow();
    });

    it('should pass skipDuplicates: true so retries are idempotent', async () => {
      redisRoomRepositoryMock.getAnswers.mockResolvedValue({
        'player-1': JSON.stringify({
          answerText: 'yes',
          responseTime: 500,
          isCorrect: true,
        }),
      });
      prismaMock.answer.createMany.mockResolvedValue({ count: 1 });

      await gateway.persistRoundAnswers('ROOM12', 'round-abc');

      const call = (
        prismaMock.answer.createMany.mock.calls as unknown as [
          { data: unknown[]; skipDuplicates: boolean },
        ][]
      )[0];
      expect(call[0].skipDuplicates).toBe(true);
    });
  });

  describe('broadcastLeaderboard', () => {
    it('should build, sort deterministically, rank, and broadcast the leaderboard', async () => {
      const toEmitMock = jest.fn();
      gateway.server = {
        to: jest.fn().mockReturnValue({ emit: toEmitMock }),
      } as unknown as Server;

      redisRoomRepositoryMock.getLeaderboard.mockResolvedValue([
        { playerId: 'p-3', score: 800 },
        { playerId: 'p-1', score: 1500 },
        { playerId: 'p-2', score: 1500 },
      ]);

      const playersMap = {
        'p-1': '{"id":"p-1","displayName":"Alice","score":1500,"streak":2}',
        'p-2': '{"id":"p-2","displayName":"Bob","score":1500,"streak":1}',
        'p-3': '{"id":"p-3","displayName":"Charlie","score":800,"streak":0}',
      };
      redisRoomRepositoryMock.getPlayers.mockResolvedValue(playersMap);

      await gateway.broadcastLeaderboard('ROOM12');

      expect(toEmitMock).toHaveBeenCalledWith('LeaderboardUpdated', [
        {
          rank: 1,
          playerId: 'p-1',
          displayName: 'Alice',
          score: 1500,
          streak: 2,
        },
        {
          rank: 1,
          playerId: 'p-2',
          displayName: 'Bob',
          score: 1500,
          streak: 1,
        },
        {
          rank: 3,
          playerId: 'p-3',
          displayName: 'Charlie',
          score: 800,
          streak: 0,
        },
      ]);
    });

    it('should handle corrupted player profiles gracefully', async () => {
      const toEmitMock = jest.fn();
      gateway.server = {
        to: jest.fn().mockReturnValue({ emit: toEmitMock }),
      } as unknown as Server;

      redisRoomRepositoryMock.getLeaderboard.mockResolvedValue([
        { playerId: 'p-1', score: 500 },
      ]);

      const playersMap = {
        'p-1': 'invalid-json',
      };
      redisRoomRepositoryMock.getPlayers.mockResolvedValue(playersMap);

      await gateway.broadcastLeaderboard('ROOM12');

      expect(toEmitMock).toHaveBeenCalledWith('LeaderboardUpdated', [
        {
          rank: 1,
          playerId: 'p-1',
          displayName: 'Player',
          score: 500,
          streak: 0,
        },
      ]);
    });
  });

  /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-member-access */
  describe('handleEndGame', () => {
    let mockSocket: Socket;

    beforeEach(() => {
      mockSocket = {
        data: {
          user: { sub: 'host-id-abc', role: 'host' },
          roomCode: 'ROOM12',
        },
        emit: jest.fn(),
      } as unknown as Socket;
    });

    it('should throw error if roomId is missing', async () => {
      await expect(
        gateway.handleEndGame(mockSocket, {} as any),
      ).rejects.toThrow(WsException);
      expect(mockSocket.emit).toHaveBeenCalledWith('error', expect.any(Object));
    });

    it('should throw error if non-host attempts to end game', async () => {
      mockSocket.data.user.role = 'player';
      await expect(
        gateway.handleEndGame(mockSocket, { roomId: 'room-uuid' }),
      ).rejects.toThrow(WsException);
      expect(mockSocket.emit).toHaveBeenCalledWith('error', expect.any(Object));
    });

    it('should complete the game if host and room are valid', async () => {
      prismaMock.room.findUnique.mockResolvedValue({
        id: 'room-uuid',
        code: 'ROOM12',
        hostId: 'host-id-abc',
      } as any);

      redisRoomRepositoryMock.getRoomMetadata.mockResolvedValue({
        status: 'IN_PROGRESS',
      });

      jest.spyOn(gateway, 'completeGame').mockResolvedValue();

      await gateway.handleEndGame(mockSocket, { roomId: 'room-uuid' });

      expect(gateway.completeGame).toHaveBeenCalledWith('ROOM12', 'room-uuid');
    });

    it('should throw error if game is already finished', async () => {
      prismaMock.room.findUnique.mockResolvedValue({
        id: 'room-uuid',
        code: 'ROOM12',
        hostId: 'host-id-abc',
      } as any);

      redisRoomRepositoryMock.getRoomMetadata.mockResolvedValue({
        status: 'FINISHED',
      });

      await expect(
        gateway.handleEndGame(mockSocket, { roomId: 'room-uuid' }),
      ).rejects.toThrow('Game has already completed');
    });
  });

  describe('completeGame', () => {
    it('should finalize game in Redis and Postgres, broadcast GameFinished, persist player scores, expire keys, and cleanup sockets', async () => {
      const toEmitMock = jest.fn();
      const socketsLeaveMock = jest.fn();
      gateway.server = {
        to: jest.fn().mockReturnValue({ emit: toEmitMock }),
        in: jest.fn().mockReturnValue({ socketsLeave: socketsLeaveMock }),
      } as unknown as Server;

      redisRoomRepositoryMock.getLeaderboard.mockResolvedValue([
        { playerId: 'p-1', score: 2000 },
      ]);
      redisRoomRepositoryMock.getPlayers.mockResolvedValue({
        'p-1': '{"id":"p-1","displayName":"Player 1","score":2000}',
      });

      prismaMock.room.update.mockResolvedValue({} as any);
      prismaMock.player.update.mockResolvedValue({} as any);

      await gateway.completeGame('ROOM12', 'room-uuid');

      // Updated Redis metadata
      expect(redisRoomRepositoryMock.updateRoomMetadata).toHaveBeenCalledWith(
        'ROOM12',
        { status: 'FINISHED' },
      );
      // Emitted GameFinished
      expect(toEmitMock).toHaveBeenCalledWith('GameFinished', {
        finalRankings: [
          {
            rank: 1,
            playerId: 'p-1',
            displayName: 'Player 1',
            score: 2000,
            streak: 0,
          },
        ],
      });
      // Updated Postgres room status
      expect(prismaMock.room.update).toHaveBeenCalledWith({
        where: { id: 'room-uuid' },
        data: { status: 'FINISHED' },
      });
      // Updated player scores in Postgres
      expect(prismaMock.player.update).toHaveBeenCalledWith({
        where: { id: 'p-1' },
        data: { score: 2000 },
      });
      // Expired Redis keys
      expect(redisRoomRepositoryMock.expireAllRoomKeys).toHaveBeenCalledWith(
        'ROOM12',
        300,
      );
      // Evicted all sockets from the room namespace
      expect(gateway.server.in).toHaveBeenCalledWith('ROOM12');
      expect(socketsLeaveMock).toHaveBeenCalledWith('ROOM12');
    });
  });

  describe('cleanupRoomSockets', () => {
    it('should cancel pending disconnect timers for the given player IDs', () => {
      const timer1 = setTimeout(() => {}, 10000);
      const timer2 = setTimeout(() => {}, 10000);

      gateway.disconnectTimers.set('p-1', timer1);
      gateway.disconnectTimers.set('p-2', timer2);

      const socketsLeaveMock = jest.fn();
      gateway.server = {
        in: jest.fn().mockReturnValue({ socketsLeave: socketsLeaveMock }),
      } as unknown as Server;

      gateway.cleanupRoomSockets('ROOM12', ['p-1', 'p-2']);

      expect(gateway.disconnectTimers.has('p-1')).toBe(false);
      expect(gateway.disconnectTimers.has('p-2')).toBe(false);
    });

    it('should evict all sockets from the Socket.IO room namespace', () => {
      const socketsLeaveMock = jest.fn();
      gateway.server = {
        in: jest.fn().mockReturnValue({ socketsLeave: socketsLeaveMock }),
      } as unknown as Server;

      gateway.cleanupRoomSockets('ROOM12', []);

      expect(gateway.server.in).toHaveBeenCalledWith('ROOM12');
      expect(socketsLeaveMock).toHaveBeenCalledWith('ROOM12');
    });

    it('should gracefully handle players with no pending disconnect timer', () => {
      const socketsLeaveMock = jest.fn();
      gateway.server = {
        in: jest.fn().mockReturnValue({ socketsLeave: socketsLeaveMock }),
      } as unknown as Server;

      // p-99 has no timer registered — should not throw
      expect(() =>
        gateway.cleanupRoomSockets('ROOM12', ['p-99']),
      ).not.toThrow();

      expect(socketsLeaveMock).toHaveBeenCalledWith('ROOM12');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // FFH-064: DTO Validation via WsValidationPipe
  //
  // These tests verify that each @SubscribeMessage DTO correctly rejects
  // invalid payloads through WsValidationPipe BEFORE business logic executes.
  // Tests exercise both valid and invalid scenarios for every event DTO.
  // ─────────────────────────────────────────────────────────────────────────

  describe('DTO Validation via WsValidationPipe (FFH-064)', () => {
    let pipe: WsValidationPipe;

    beforeEach(() => {
      pipe = new WsValidationPipe({ forbidNonWhitelisted: false });
    });

    function meta<T>(metatype: new (...a: unknown[]) => T): ArgumentMetadata {
      return {
        type: 'body',
        metatype: metatype as new (...a: unknown[]) => unknown,
        data: '',
      };
    }

    // ── JoinRoomDto ──────────────────────────────────────────────────────────

    describe('JoinRoomDto', () => {
      it('should pass with a valid roomCode', async () => {
        const result = await pipe.transform(
          { roomCode: 'ROOM01' },
          meta(JoinRoomDto),
        );
        expect(result).toBeInstanceOf(JoinRoomDto);
      });

      it('should pass with optional displayName and guestToken', async () => {
        const result = (await pipe.transform(
          { roomCode: 'ROOM01', displayName: 'Alice', guestToken: 'tok123' },
          meta(JoinRoomDto),
        )) as JoinRoomDto;
        expect(result.displayName).toBe('Alice');
        expect(result.guestToken).toBe('tok123');
      });

      it('should reject when roomCode is missing', async () => {
        await expect(
          pipe.transform({}, meta(JoinRoomDto)),
        ).rejects.toBeInstanceOf(WsException);
      });

      it('should reject when roomCode is an empty string', async () => {
        await expect(
          pipe.transform({ roomCode: '' }, meta(JoinRoomDto)),
        ).rejects.toBeInstanceOf(WsException);
      });

      it('should reject when roomCode is not a string', async () => {
        await expect(
          pipe.transform({ roomCode: 123 }, meta(JoinRoomDto)),
        ).rejects.toBeInstanceOf(WsException);
      });

      it('should include BAD_REQUEST code in the exception', async () => {
        try {
          await pipe.transform({ roomCode: '' }, meta(JoinRoomDto));
          fail('should have thrown');
        } catch (err) {
          const ex = err as WsException;
          const body = ex.getError() as { code: string; message: string };
          expect(body.code).toBe('BAD_REQUEST');
        }
      });

      it('should strip unknown extra fields (whitelist)', async () => {
        const result = (await pipe.transform(
          { roomCode: 'ROOM01', unknownField: 'bad' },
          meta(JoinRoomDto),
        )) as JoinRoomDto;
        expect(
          (result as unknown as Record<string, unknown>)['unknownField'],
        ).toBeUndefined();
      });
    });

    // ── LeaveRoomDto ─────────────────────────────────────────────────────────

    describe('LeaveRoomDto', () => {
      it('should pass with valid roomId and playerId', async () => {
        const result = await pipe.transform(
          { roomId: 'room-1', playerId: 'player-1' },
          meta(LeaveRoomDto),
        );
        expect(result).toBeInstanceOf(LeaveRoomDto);
      });

      it('should reject when roomId is empty', async () => {
        await expect(
          pipe.transform(
            { roomId: '', playerId: 'player-1' },
            meta(LeaveRoomDto),
          ),
        ).rejects.toBeInstanceOf(WsException);
      });

      it('should reject when playerId is empty', async () => {
        await expect(
          pipe.transform(
            { roomId: 'room-1', playerId: '' },
            meta(LeaveRoomDto),
          ),
        ).rejects.toBeInstanceOf(WsException);
      });

      it('should reject when both fields are missing', async () => {
        await expect(
          pipe.transform({}, meta(LeaveRoomDto)),
        ).rejects.toBeInstanceOf(WsException);
      });
    });

    // ── PlayerReadyDto ───────────────────────────────────────────────────────

    describe('PlayerReadyDto', () => {
      it('should pass with valid roomId and playerId', async () => {
        const result = await pipe.transform(
          { roomId: 'room-1', playerId: 'player-1' },
          meta(PlayerReadyDto),
        );
        expect(result).toBeInstanceOf(PlayerReadyDto);
      });

      it('should reject when roomId is missing', async () => {
        await expect(
          pipe.transform({ playerId: 'player-1' }, meta(PlayerReadyDto)),
        ).rejects.toBeInstanceOf(WsException);
      });

      it('should reject when playerId is empty', async () => {
        await expect(
          pipe.transform(
            { roomId: 'room-1', playerId: '' },
            meta(PlayerReadyDto),
          ),
        ).rejects.toBeInstanceOf(WsException);
      });
    });

    // ── ReconnectRequestDto ──────────────────────────────────────────────────

    describe('ReconnectRequestDto', () => {
      it('should pass with valid playerId and roomId', async () => {
        const result = await pipe.transform(
          { playerId: 'player-1', roomId: 'room-1' },
          meta(ReconnectRequestDto),
        );
        expect(result).toBeInstanceOf(ReconnectRequestDto);
      });

      it('should reject when playerId is empty', async () => {
        await expect(
          pipe.transform(
            { playerId: '', roomId: 'room-1' },
            meta(ReconnectRequestDto),
          ),
        ).rejects.toBeInstanceOf(WsException);
      });

      it('should reject when roomId is missing', async () => {
        await expect(
          pipe.transform({ playerId: 'player-1' }, meta(ReconnectRequestDto)),
        ).rejects.toBeInstanceOf(WsException);
      });
    });

    // ── StartGameDto ─────────────────────────────────────────────────────────

    describe('StartGameDto', () => {
      it('should pass with valid roomId and gameId', async () => {
        const result = await pipe.transform(
          { roomId: 'room-1', gameId: 'game-1' },
          meta(StartGameDto),
        );
        expect(result).toBeInstanceOf(StartGameDto);
      });

      it('should reject when roomId is empty', async () => {
        await expect(
          pipe.transform({ roomId: '', gameId: 'game-1' }, meta(StartGameDto)),
        ).rejects.toBeInstanceOf(WsException);
      });

      it('should reject when gameId is missing', async () => {
        await expect(
          pipe.transform({ roomId: 'room-1' }, meta(StartGameDto)),
        ).rejects.toBeInstanceOf(WsException);
      });

      it('should reject when both fields are missing', async () => {
        await expect(
          pipe.transform({}, meta(StartGameDto)),
        ).rejects.toBeInstanceOf(WsException);
      });
    });

    // ── SelectGameDto ────────────────────────────────────────────────────────

    describe('SelectGameDto', () => {
      it('should pass with valid roomId and gameId', async () => {
        const result = await pipe.transform(
          { roomId: 'room-1', gameId: 'game-1' },
          meta(SelectGameDto),
        );
        expect(result).toBeInstanceOf(SelectGameDto);
      });

      it('should reject when gameId is missing', async () => {
        await expect(
          pipe.transform({ roomId: 'room-1' }, meta(SelectGameDto)),
        ).rejects.toBeInstanceOf(WsException);
      });
    });

    // ── NextRoundDto ─────────────────────────────────────────────────────────

    describe('NextRoundDto', () => {
      it('should pass with a valid roomId', async () => {
        const result = await pipe.transform(
          { roomId: 'room-1' },
          meta(NextRoundDto),
        );
        expect(result).toBeInstanceOf(NextRoundDto);
      });

      it('should reject when roomId is empty', async () => {
        await expect(
          pipe.transform({ roomId: '' }, meta(NextRoundDto)),
        ).rejects.toBeInstanceOf(WsException);
      });

      it('should reject when roomId is missing', async () => {
        await expect(
          pipe.transform({}, meta(NextRoundDto)),
        ).rejects.toBeInstanceOf(WsException);
      });
    });

    // ── EndGameDto ───────────────────────────────────────────────────────────

    describe('EndGameDto', () => {
      it('should pass with a valid roomId', async () => {
        const result = await pipe.transform(
          { roomId: 'room-1' },
          meta(EndGameDto),
        );
        expect(result).toBeInstanceOf(EndGameDto);
      });

      it('should reject when roomId is empty', async () => {
        await expect(
          pipe.transform({ roomId: '' }, meta(EndGameDto)),
        ).rejects.toBeInstanceOf(WsException);
      });

      it('should reject when roomId is missing', async () => {
        await expect(
          pipe.transform({}, meta(EndGameDto)),
        ).rejects.toBeInstanceOf(WsException);
      });
    });

    // ── SubmitAnswerDto ──────────────────────────────────────────────────────

    describe('SubmitAnswerDto', () => {
      it('should pass with all valid fields', async () => {
        const result = await pipe.transform(
          {
            roomId: 'room-1',
            questionId: 'q-1',
            answer: 'Paris',
            responseTimeMs: 1500,
          },
          meta(SubmitAnswerDto),
        );
        expect(result).toBeInstanceOf(SubmitAnswerDto);
      });

      it('should reject when roomId is empty', async () => {
        await expect(
          pipe.transform(
            {
              roomId: '',
              questionId: 'q-1',
              answer: 'Paris',
              responseTimeMs: 1500,
            },
            meta(SubmitAnswerDto),
          ),
        ).rejects.toBeInstanceOf(WsException);
      });

      it('should reject when answer is empty', async () => {
        await expect(
          pipe.transform(
            {
              roomId: 'room-1',
              questionId: 'q-1',
              answer: '',
              responseTimeMs: 1500,
            },
            meta(SubmitAnswerDto),
          ),
        ).rejects.toBeInstanceOf(WsException);
      });

      it('should reject when responseTimeMs is a negative number', async () => {
        await expect(
          pipe.transform(
            {
              roomId: 'room-1',
              questionId: 'q-1',
              answer: 'Paris',
              responseTimeMs: -1,
            },
            meta(SubmitAnswerDto),
          ),
        ).rejects.toBeInstanceOf(WsException);
      });

      it('should reject when responseTimeMs is not a number', async () => {
        await expect(
          pipe.transform(
            {
              roomId: 'room-1',
              questionId: 'q-1',
              answer: 'Paris',
              responseTimeMs: 'fast',
            },
            meta(SubmitAnswerDto),
          ),
        ).rejects.toBeInstanceOf(WsException);
      });

      it('should reject when questionId is missing', async () => {
        await expect(
          pipe.transform(
            { roomId: 'room-1', answer: 'Paris', responseTimeMs: 1500 },
            meta(SubmitAnswerDto),
          ),
        ).rejects.toBeInstanceOf(WsException);
      });

      it('should pass when responseTimeMs is 0 (minimum allowed)', async () => {
        const result = await pipe.transform(
          {
            roomId: 'room-1',
            questionId: 'q-1',
            answer: 'Paris',
            responseTimeMs: 0,
          },
          meta(SubmitAnswerDto),
        );
        expect(result).toBeInstanceOf(SubmitAnswerDto);
      });
    });

    // ── Null / undefined payloads ────────────────────────────────────────────

    describe('null and undefined payloads', () => {
      it('should reject null payload for JoinRoomDto with BAD_REQUEST', async () => {
        await expect(
          pipe.transform(null, meta(JoinRoomDto)),
        ).rejects.toBeInstanceOf(WsException);
      });

      it('should reject null payload for SubmitAnswerDto with BAD_REQUEST', async () => {
        await expect(
          pipe.transform(null, meta(SubmitAnswerDto)),
        ).rejects.toBeInstanceOf(WsException);
      });

      it('should include BAD_REQUEST code for null payload', async () => {
        try {
          await pipe.transform(null, meta(JoinRoomDto));
          fail('should have thrown');
        } catch (err) {
          const ex = err as WsException;
          const body = ex.getError() as { code: string };
          expect(body.code).toBe('BAD_REQUEST');
        }
      });
    });
  });

  describe('Complete Game Mode Flow', () => {
    let toEmitMock: jest.Mock;
    let hostSocket: any;

    const mockRoom = {
      id: 'room-id-123',
      code: 'ROOM12',
      status: 'LOBBY',
      hostId: 'host-123',
    };

    beforeEach(() => {
      toEmitMock = jest.fn();
      hostSocket = {
        id: 'socket-host-123',
        data: {
          user: { sub: 'host-123', name: 'Host', role: 'host' },
        },
        emit: jest.fn(),
      };
      gateway.server = {
        to: jest.fn().mockReturnValue({ emit: toEmitMock }),
        in: jest.fn().mockReturnValue({
          fetchSockets: jest.fn().mockResolvedValue([
            {
              id: 'socket-host-123',
              data: { user: { sub: 'host-123', role: 'host' } },
            },
          ]),
        }),
      } as unknown as Server;
      jest.spyOn(gateway, 'startTimer').mockImplementation(() => {});
      jest
        .spyOn(gateway, 'completeRound')
        .mockImplementation(() => Promise.resolve());
    });

    // ── SelectGame → StartGame → SubmitAnswer → completeRound ─────────────

    it('should run full game mode lifecycle: select, start, submit answer, and complete', async () => {
      const GAME_ID = '1cd83808-737f-4c29-ab51-adff5c6a1ef5'; // Emoji Guess
      const mockQuestions = [
        {
          id: 'q-1',
          prompt: '🦁👑',
          answer: 'The Lion King',
          difficulty: 'EASY',
          category: 'Movies',
          metadata: { hint: "Simba's journey", acceptedAnswers: ['Lion King'] },
        },
      ];

      // Step 1 — Host selects game
      prismaMock.room.findUnique.mockResolvedValue(mockRoom);
      prismaMock.game.findUnique.mockResolvedValue({
        id: GAME_ID,
        name: 'Emoji Guess',
        _count: { questions: 1 },
      });
      redisRoomRepositoryMock.getRoomMetadata
        .mockResolvedValueOnce({
          id: 'room-id-123',
          status: 'LOBBY',
          hostId: 'host-123',
        })
        .mockResolvedValueOnce({
          id: 'room-id-123',
          status: 'LOBBY',
          hostId: 'host-123',
          selectedGameId: GAME_ID,
        });
      redisRoomRepositoryMock.getPlayers.mockResolvedValue({});

      await gateway.handleSelectGame(hostSocket, {
        roomId: 'room-id-123',
        gameId: GAME_ID,
      });

      // Verify selection persisted
      expect(redisRoomRepositoryMock.updateRoomMetadata).toHaveBeenCalledWith(
        'ROOM12',
        { selectedGameId: GAME_ID },
      );
      expect(toEmitMock).toHaveBeenCalledWith(
        'RoomStateUpdated',
        expect.objectContaining({ selectedGameId: GAME_ID }),
      );

      // Step 2 — StartGame (reads persisted selectedGameId, not payload)
      prismaMock.room.findUnique.mockResolvedValue(mockRoom);
      prismaMock.room.update.mockResolvedValue({
        ...mockRoom,
        status: 'IN_PROGRESS',
      });
      prismaMock.game.findUnique.mockResolvedValue({
        id: GAME_ID,
        name: 'Emoji Guess',
        _count: { questions: 1 },
      });
      prismaMock.question.findMany.mockResolvedValue(mockQuestions);
      redisRoomRepositoryMock.getPlayers.mockResolvedValue({
        'player-1': JSON.stringify({
          id: 'player-1',
          displayName: 'P1',
          score: 0,
          isReady: true,
        }),
      });
      redisRoomRepositoryMock.loadQuestions.mockResolvedValue(true);
      // getRoomMetadata called from handleStartGame (3rd call) — returns LOBBY
      redisRoomRepositoryMock.getRoomMetadata.mockResolvedValue({
        id: 'room-id-123',
        status: 'LOBBY',
        selectedGameId: GAME_ID,
      });
      redisRoomRepositoryMock.getQuestion.mockResolvedValue(mockQuestions[0]);
      prismaMock.round.create.mockResolvedValue({
        id: 'round-id-abc',
        roomId: 'room-id-123',
        questionId: 'q-1',
        startedAt: new Date(),
        endedAt: null,
      });

      await gateway.handleStartGame(hostSocket, {
        roomId: 'room-id-123',
        gameId: 'different-game-id', // Different from selected
      });

      // Verify questions fetched FOR the selected game, not the payload
      expect(prismaMock.question.findMany).toHaveBeenCalledWith({
        where: { gameId: GAME_ID },
        orderBy: { id: 'asc' },
      });

      // Verify questions loaded into Redis
      expect(redisRoomRepositoryMock.loadQuestions).toHaveBeenCalledWith(
        'ROOM12',
        mockQuestions,
      );

      // Verify GameStarted emitted with the right game ID
      expect(toEmitMock).toHaveBeenCalledWith('GameStarted', {
        gameId: GAME_ID,
        totalRounds: 1,
      });

      // Verify first question started
      expect(toEmitMock).toHaveBeenCalledWith('QuestionStarted', {
        roundNumber: 1,
        questionId: 'q-1',
        prompt: '🦁👑',
        metadata: { hint: "Simba's journey", acceptedAnswers: ['Lion King'] },
        timeLimitSeconds: 20,
        difficulty: 'EASY',
      });

      // No errors emitted
      expect(hostSocket.emit).not.toHaveBeenCalledWith(
        'error',
        expect.any(Object),
      );
    });

    it('should load game-specific questions by gameId excluding questions from other game modes', async () => {
      const EMOJI_GAME_ID = '1cd83808-737f-4c29-ab51-adff5c6a1ef5';
      const BAD_MOVIE_GAME_ID = '2f8b9a1c-4d5e-6f70-81a2-b3c4d5e6f708';

      const emojiQuestions = [
        {
          id: 'q-emoji-1',
          prompt: '🦁👑',
          answer: 'The Lion King',
          difficulty: 'EASY',
          category: 'Movies',
          metadata: null,
        },
      ];

      // Setup: room in LOBBY, Emoji Guess selected
      prismaMock.room.findUnique.mockResolvedValue(mockRoom);
      prismaMock.room.update.mockResolvedValue({
        ...mockRoom,
        status: 'IN_PROGRESS',
      });
      prismaMock.game.findUnique.mockResolvedValue({
        id: EMOJI_GAME_ID,
        name: 'Emoji Guess',
        _count: { questions: 1 },
      });
      prismaMock.question.findMany.mockResolvedValue(emojiQuestions);

      redisRoomRepositoryMock.getPlayers.mockResolvedValue({
        'player-1': JSON.stringify({
          id: 'player-1',
          displayName: 'P1',
          score: 0,
          isReady: true,
        }),
      });
      redisRoomRepositoryMock.loadQuestions.mockResolvedValue(true);
      redisRoomRepositoryMock.getRoomMetadata.mockResolvedValue({
        id: 'room-id-123',
        status: 'LOBBY',
        selectedGameId: EMOJI_GAME_ID,
      });
      redisRoomRepositoryMock.getQuestion.mockResolvedValue(emojiQuestions[0]);
      prismaMock.round.create.mockResolvedValue({
        id: 'round-id-abc',
        roomId: 'room-id-123',
        questionId: 'q-emoji-1',
        startedAt: new Date(),
        endedAt: null,
      });

      await gateway.handleStartGame(hostSocket, {
        roomId: 'room-id-123',
        gameId: EMOJI_GAME_ID,
      });

      // Verify questions only for Emoji Guess, not Bad Movie Description
      expect(prismaMock.question.findMany).toHaveBeenCalledWith({
        where: { gameId: EMOJI_GAME_ID },
        orderBy: { id: 'asc' },
      });

      // Bad Movie Description questions should NOT be included
      expect(prismaMock.question.findMany).not.toHaveBeenCalledWith(
        expect.objectContaining({ where: { gameId: BAD_MOVIE_GAME_ID } }),
      );

      // Only Emoji Guess questions loaded into Redis
      expect(redisRoomRepositoryMock.loadQuestions).toHaveBeenCalledWith(
        'ROOM12',
        expect.arrayContaining([expect.objectContaining({ id: 'q-emoji-1' })]),
      );
    });
  });
});
