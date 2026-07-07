import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from './../src/app.module';
import { TokenService } from './../src/auth/token.service';
import { PrismaService } from './../src/database/prisma.service';
import { RedisRoomRepository } from './../src/redis/redis-room.repository';
import { io, Socket as ClientSocket } from 'socket.io-client';

interface PlayerState {
  id: string;
  displayName: string;
  score: number;
  isReady: boolean;
}

interface RoomStatePayload {
  players: PlayerState[];
  status: string;
  hostId: string | null;
  playerCount: number;
}

interface QuestionPayload {
  roundNumber: number;
  questionId: string;
  prompt: string;
  metadata: Record<string, any>;
  timeLimitSeconds: number;
  difficulty: string;
}

class InMemoryRedisRoomRepository {
  public rooms = new Map<
    string,
    {
      metadata: Record<string, string>;
      players: Record<string, string>;
      leaderboard: Record<string, number>;
      answers: Record<string, Record<string, string>>;
      questions: any[];
    }
  >();

  private getOrCreateRoom(roomCode: string) {
    const code = roomCode.toUpperCase();
    let room = this.rooms.get(code);
    if (!room) {
      room = {
        metadata: {},
        players: {},
        leaderboard: {},
        answers: {},
        questions: [],
      };
      this.rooms.set(code, room);
    }
    return room;
  }

  async createRoomState(
    roomCode: string,
    metadata: Record<string, string>,
  ): Promise<void> {
    const room = this.getOrCreateRoom(roomCode);
    room.metadata = { ...metadata };
    await Promise.resolve();
  }

  async getRoomMetadata(
    roomCode: string,
  ): Promise<Record<string, string> | null> {
    const room = this.rooms.get(roomCode.toUpperCase());
    await Promise.resolve();
    return room && Object.keys(room.metadata).length > 0 ? room.metadata : null;
  }

  async updateRoomMetadata(
    roomCode: string,
    metadata: Record<string, string>,
  ): Promise<void> {
    const room = this.getOrCreateRoom(roomCode);
    room.metadata = { ...room.metadata, ...metadata };
    await Promise.resolve();
  }

  async removePlayer(roomCode: string, playerId: string): Promise<void> {
    const room = this.getOrCreateRoom(roomCode);
    delete room.players[playerId];
    delete room.leaderboard[playerId];
    await Promise.resolve();
  }

  async deleteRoomState(roomCode: string): Promise<void> {
    this.rooms.delete(roomCode.toUpperCase());
    await Promise.resolve();
  }

  async loadQuestions(roomCode: string, questions: any[]): Promise<boolean> {
    const room = this.getOrCreateRoom(roomCode);
    room.questions = questions;
    await Promise.resolve();
    return true;
  }

  async getQuestion(roomCode: string, index: number): Promise<any> {
    const room = this.getOrCreateRoom(roomCode);
    await Promise.resolve();
    return room.questions[index] || null;
  }

  async hasQuestions(roomCode: string): Promise<boolean> {
    const room = this.rooms.get(roomCode.toUpperCase());
    await Promise.resolve();
    return room ? room.questions.length > 0 : false;
  }

  async getAnswers(
    roomCode: string,
    roundId: string,
  ): Promise<Record<string, string>> {
    const room = this.getOrCreateRoom(roomCode);
    await Promise.resolve();
    return room.answers[roundId] || {};
  }

  async setAnswer(
    roomCode: string,
    roundId: string,
    playerId: string,
    answerJson: string,
  ): Promise<void> {
    const room = this.getOrCreateRoom(roomCode);
    if (!room.answers[roundId]) {
      room.answers[roundId] = {};
    }
    room.answers[roundId][playerId] = answerJson;
    await Promise.resolve();
  }

  async getPlayers(roomCode: string): Promise<Record<string, string>> {
    const room = this.rooms.get(roomCode.toUpperCase());
    await Promise.resolve();
    return room ? room.players : {};
  }

  async setPlayer(
    roomCode: string,
    playerId: string,
    playerJson: string,
  ): Promise<void> {
    const room = this.getOrCreateRoom(roomCode);
    room.players[playerId] = playerJson;
    await Promise.resolve();
  }

  async updateLeaderboardScore(
    roomCode: string,
    playerId: string,
    score: number,
  ): Promise<void> {
    const room = this.getOrCreateRoom(roomCode);
    room.leaderboard[playerId] = score;
    await Promise.resolve();
  }

  async updatePlayerScores(
    roomCode: string,
    scoreUpdates: { playerId: string; newScore: number; playerJson: string }[],
  ): Promise<void> {
    const room = this.getOrCreateRoom(roomCode);
    for (const update of scoreUpdates) {
      room.players[update.playerId] = update.playerJson;
      room.leaderboard[update.playerId] = update.newScore;
    }
    await Promise.resolve();
  }

  async getLeaderboard(
    roomCode: string,
  ): Promise<{ playerId: string; score: number }[]> {
    const room = this.getOrCreateRoom(roomCode);
    await Promise.resolve();
    return Object.entries(room.leaderboard)
      .map(([playerId, score]) => ({ playerId, score }))
      .sort((a, b) => b.score - a.score);
  }

  async expireAllRoomKeys(): Promise<void> {
    // No-op in memory
    await Promise.resolve();
  }
}

interface AddressWithPort {
  port: number;
}

interface ServerWithAddress {
  address(): string | AddressWithPort | null;
}

describe('Socket Gateway (Integration)', () => {
  let app: INestApplication;
  let tokenService: TokenService;
  let redisRepository: InMemoryRedisRoomRepository;
  let port: number;

  const prismaMock = {
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
    room: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    game: {
      findUnique: jest.fn(),
    },
    round: {
      create: jest.fn(),
      update: jest.fn(),
    },
    answer: {
      createMany: jest.fn(),
    },
    question: {
      findMany: jest.fn(),
    },
    player: {
      update: jest.fn(),
    },
  };

  beforeAll(async () => {
    redisRepository = new InMemoryRedisRoomRepository();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .overrideProvider(RedisRoomRepository)
      .useValue(redisRepository)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    await app.listen(0);

    tokenService = moduleFixture.get<TokenService>(TokenService);
    const server = app.getHttpServer() as ServerWithAddress;
    const address = server.address() as AddressWithPort;
    port = address.port;
  });

  afterAll(async () => {
    await app.close();
  });

  const createSocket = (token: string): ClientSocket => {
    return io(`http://localhost:${port}`, {
      transports: ['websocket'],
      auth: { token: `Bearer ${token}` },
      forceNew: true,
    });
  };

  describe('Connection & Authentication', () => {
    it('should reject connection with missing token', (done) => {
      const socket = io(`http://localhost:${port}`, {
        transports: ['websocket'],
        forceNew: true,
      });

      socket.on('disconnect', () => {
        done();
      });
    });

    it('should reject connection with invalid token', (done) => {
      const socket = io(`http://localhost:${port}`, {
        transports: ['websocket'],
        auth: { token: 'Bearer invalid-token' },
        forceNew: true,
      });

      socket.on('disconnect', () => {
        done();
      });
    });

    it('should authenticate client with a valid token', async () => {
      const token = await tokenService.signToken({
        sub: 'player-1',
        name: 'Alice',
        role: 'guest',
        roomId: 'room-1',
      });

      const socket = createSocket(token);

      await new Promise<void>((resolve, reject) => {
        socket.on('connect', () => {
          socket.disconnect();
          resolve();
        });
        socket.on('connect_error', (err) => {
          reject(err);
        });
      });
    });
  });

  describe('Lobby & Game Loop Flow', () => {
    let hostSocket: ClientSocket;
    let playerSocket: ClientSocket;
    let hostToken: string;
    let playerToken: string;
    const roomCode = 'TEST12';
    const roomId = 'room-123';
    const gameId = 'game-456';
    const hostId = 'host-1';
    const playerId = 'player-2';

    beforeAll(async () => {
      hostToken = await tokenService.signToken({
        sub: hostId,
        name: 'Host User',
        role: 'host',
      });
      playerToken = await tokenService.signToken({
        sub: playerId,
        name: 'Bob',
        role: 'guest',
        roomId,
      });
    });

    afterEach(() => {
      if (hostSocket && hostSocket.connected) hostSocket.disconnect();
      if (playerSocket && playerSocket.connected) playerSocket.disconnect();
    });

    it('should run full game lifecycle flow successfully', async () => {
      // 1. Setup Mock DB responses
      prismaMock.room.findUnique.mockResolvedValue({
        id: roomId,
        code: roomCode,
        hostId,
        status: 'LOBBY',
      });

      prismaMock.game.findUnique.mockResolvedValue({
        id: gameId,
        title: 'Trivia challenge',
        questions: [
          {
            id: 'q-1',
            prompt: 'What is 2 + 2?',
            answer: '4',
            difficulty: 'EASY',
            category: 'Math',
          },
        ],
        _count: { questions: 1 },
      });

      prismaMock.round.create.mockResolvedValue({
        id: 'round-1',
      });

      prismaMock.question.findMany.mockResolvedValue([
        {
          id: 'q-1',
          prompt: 'What is 2 + 2?',
          answer: '4',
          difficulty: 'EASY',
          category: 'Math',
          metadata: {},
        },
      ]);

      // 2. Connect sockets
      hostSocket = createSocket(hostToken);
      playerSocket = createSocket(playerToken);

      await Promise.all([
        new Promise<void>((res) => hostSocket.on('connect', res)),
        new Promise<void>((res) => playerSocket.on('connect', res)),
      ]);

      // 3. Host joins room
      hostSocket.emit('JoinRoom', { roomCode });
      // Allow host to join
      await new Promise((resolve) => setTimeout(resolve, 50));

      // 4. Player joins room and receives RoomStateUpdated
      let playerJoinedPayload: { player: PlayerState } | null = null;
      let roomStateUpdatedPayload: RoomStatePayload | null = null;

      hostSocket.on('PlayerJoined', (data: any) => {
        playerJoinedPayload = data as { player: PlayerState };
      });

      playerSocket.on('RoomStateUpdated', (data: any) => {
        roomStateUpdatedPayload = data as RoomStatePayload;
      });

      playerSocket.emit('JoinRoom', { roomCode, displayName: 'Bob' });

      // Wait for join logic to propagate
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          clearInterval(check);
          reject(
            new Error('Timed out waiting for PlayerJoined / RoomStateUpdated'),
          );
        }, 3000);
        const check = setInterval(() => {
          if (playerJoinedPayload && roomStateUpdatedPayload) {
            clearInterval(check);
            clearTimeout(timeout);
            resolve();
          }
        }, 10);
      });

      expect(playerJoinedPayload).not.toBeNull();
      expect(playerJoinedPayload!.player.displayName).toBe('Bob');
      expect(roomStateUpdatedPayload).not.toBeNull();
      expect(roomStateUpdatedPayload!.status).toBe('LOBBY');

      // 5. Player ready status toggle
      let playerReadyState: RoomStatePayload | null = null;
      playerSocket.on('RoomStateUpdated', (data: any) => {
        playerReadyState = data as RoomStatePayload;
      });

      playerSocket.emit('PlayerReady', { roomId, playerId });

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          clearInterval(check);
          reject(new Error('Timed out waiting for PlayerReady'));
        }, 3000);
        const check = setInterval(() => {
          if (
            playerReadyState?.players?.some(
              (p) => p.id === playerId && p.isReady,
            )
          ) {
            clearInterval(check);
            clearTimeout(timeout);
            resolve();
          }
        }, 10);
      });

      // 6. Host starts game
      let gameStartedPayload: {
        gameId: string;
        totalRounds: number;
      } | null = null;
      let questionStartedPayload: QuestionPayload | null = null;

      playerSocket.on('GameStarted', (data: any) => {
        gameStartedPayload = data as { gameId: string; totalRounds: number };
      });

      playerSocket.on('QuestionStarted', (data: any) => {
        questionStartedPayload = data as QuestionPayload;
      });

      hostSocket.emit('StartGame', { roomId, gameId });

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          clearInterval(check);
          reject(
            new Error('Timed out waiting for GameStarted / QuestionStarted'),
          );
        }, 3000);
        const check = setInterval(() => {
          if (gameStartedPayload && questionStartedPayload) {
            clearInterval(check);
            clearTimeout(timeout);
            resolve();
          }
        }, 10);
      });

      expect(gameStartedPayload).not.toBeNull();
      expect(gameStartedPayload!.gameId).toBe(gameId);
      expect(questionStartedPayload).not.toBeNull();
      expect(questionStartedPayload!.questionId).toBe('q-1');

      // 7. Player submits answer and receives ACK
      const submitAnswerAckPromise = new Promise<{ success: boolean }>(
        (resolve) => {
          playerSocket.on('SubmitAnswerAck', (data: unknown) => {
            resolve(data as { success: boolean });
          });
        },
      );

      playerSocket.emit('SubmitAnswer', {
        roomId,
        questionId: 'q-1',
        answer: '4',
        responseTimeMs: 1200,
      });

      const submitAnswerAck = await submitAnswerAckPromise;
      expect(submitAnswerAck).toBeDefined();
      expect(submitAnswerAck.success).toBe(true);

      // 8. Reconnect Scenario
      // Simulate player dropping connection
      playerSocket.disconnect();
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Reconnect and send ReconnectRequest
      playerSocket = createSocket(playerToken);
      await new Promise<void>((res) => playerSocket.on('connect', res));

      const reconnectAckPromise = new Promise<{ room: { id: string } }>(
        (resolve) => {
          playerSocket.on('StateSync', (data: unknown) => {
            resolve(data as { room: { id: string } });
          });
        },
      );

      playerSocket.emit('ReconnectRequest', { playerId, roomId });

      const reconnectAck = await reconnectAckPromise;
      expect(reconnectAck.room.id).toBe(roomId);

      // 9. Host ends/completes game
      prismaMock.room.update.mockResolvedValue({
        id: roomId,
        status: 'FINISHED',
      });

      let gameFinishedPayload: { finalRankings: any[] } | null = null;
      playerSocket.on('GameFinished', (data: any) => {
        gameFinishedPayload = data as { finalRankings: any[] };
      });

      hostSocket.emit('EndGame', { roomId });

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          clearInterval(check);
          reject(new Error('Timed out waiting for GameFinished'));
        }, 3000);
        const check = setInterval(() => {
          if (gameFinishedPayload) {
            clearInterval(check);
            clearTimeout(timeout);
            resolve();
          }
        }, 10);
      });

      expect(gameFinishedPayload).not.toBeNull();
      expect(gameFinishedPayload!.finalRankings).toBeDefined();
    });

    it('should allow player to leave the room intentionally', async () => {
      // Setup Mock DB responses
      prismaMock.room.findUnique.mockResolvedValue({
        id: roomId,
        code: roomCode,
        hostId,
        status: 'LOBBY',
      });

      // Connect sockets
      hostSocket = createSocket(hostToken);
      playerSocket = createSocket(playerToken);

      await Promise.all([
        new Promise<void>((res) => hostSocket.on('connect', res)),
        new Promise<void>((res) => playerSocket.on('connect', res)),
      ]);

      // Host joins room
      hostSocket.emit('JoinRoom', { roomCode });
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Player joins room
      playerSocket.emit('JoinRoom', { roomCode, displayName: 'Bob' });
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Player leaves room
      let playerLeftPayload: { playerId: string } | null = null;
      hostSocket.on('PlayerLeft', (data: any) => {
        playerLeftPayload = data as { playerId: string };
      });

      playerSocket.emit('LeaveRoom', { roomId, playerId });

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          clearInterval(check);
          reject(new Error('Timed out waiting for PlayerLeft'));
        }, 3000);
        const check = setInterval(() => {
          if (playerLeftPayload) {
            clearInterval(check);
            clearTimeout(timeout);
            resolve();
          }
        }, 10);
      });

      expect(playerLeftPayload).not.toBeNull();
      expect(playerLeftPayload!.playerId).toBe(playerId);
    });

    it('should reject invalid events using WsValidationPipe', async () => {
      hostSocket = createSocket(hostToken);
      await new Promise<void>((res) => hostSocket.on('connect', res));

      // Emit JoinRoom with empty roomCode (should fail validation)
      const errorPromise = new Promise<{ code: string; message: string }>(
        (resolve) => {
          // Nest emits validation errors as 'exception'
          hostSocket.on('exception', (err: unknown) => {
            resolve(err as { code: string; message: string });
          });
        },
      );

      hostSocket.emit('JoinRoom', { roomCode: '' });

      const errorResponse = await errorPromise;
      expect(errorResponse.code).toBe('BAD_REQUEST');
      expect(errorResponse.message).toContain('roomCode');
    });
  });
});
