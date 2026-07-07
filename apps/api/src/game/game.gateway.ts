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

  /**
   * Tracks active game round countdown timers per room code.
   */
  readonly activeTimers = new Map<string, ReturnType<typeof setInterval>>();

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
        this.stopTimer(roomCode);
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

  @SubscribeMessage('StartGame')
  async handleStartGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; gameId: string },
  ): Promise<void> {
    if (!payload?.roomId || !payload?.gameId) {
      const err = new WsException('roomId and gameId are required');
      client.emit('error', {
        success: false,
        error: { code: 'BAD_REQUEST', message: err.message },
      });
      throw err;
    }

    const clientData = client.data as {
      user?: TokenPayload;
      roomCode?: string;
    };
    const user = clientData.user;

    // Only the host can start a game
    if (!user || user.role !== 'host') {
      const err = new WsException('Only the host can start the game');
      client.emit('error', {
        success: false,
        error: { code: 'UNAUTHORIZED', message: err.message },
      });
      throw err;
    }

    try {
      // Look up the room to get its code
      const room = await this.prisma.room.findUnique({
        where: { id: payload.roomId },
      });

      if (!room) {
        const err = new WsException('Room does not exist');
        client.emit('error', {
          success: false,
          error: { code: 'ROOM_NOT_FOUND', message: err.message },
        });
        throw err;
      }

      // Verify the host owns this room
      if (room.hostId !== user.sub) {
        const err = new WsException('You are not the host of this room');
        client.emit('error', {
          success: false,
          error: { code: 'UNAUTHORIZED', message: err.message },
        });
        throw err;
      }

      const roomCode = room.code.toUpperCase();

      // Run all precondition checks
      const validation = await this.validateGameStart(
        roomCode,
        payload.gameId,
        user.sub,
      );

      if (!validation.valid) {
        const err = new WsException(validation.message);
        client.emit('error', {
          success: false,
          error: { code: validation.code, message: validation.message },
        });
        throw err;
      }

      // Fetch the game with its question count for totalRounds
      const game = await this.prisma.game.findUnique({
        where: { id: payload.gameId },
        include: { _count: { select: { questions: true } } },
      });

      // game is guaranteed non-null at this point (validateGameStart checked it)
      const totalRounds = game!._count.questions;

      // Fetch questions from PostgreSQL ordered by ID ascending
      const questions = await this.prisma.question.findMany({
        where: { gameId: payload.gameId },
        orderBy: { id: 'asc' },
      });

      // Load questions into Redis to prepare gameplay state
      await this.redisRoomRepository.loadQuestions(roomCode, questions);

      // Transition room status to IN_PROGRESS in PostgreSQL
      await this.prisma.room.update({
        where: { id: payload.roomId },
        data: { status: 'IN_PROGRESS' },
      });

      // Write initial game state to Redis metadata
      await this.redisRoomRepository.updateRoomMetadata(roomCode, {
        status: 'IN_PROGRESS',
        gameId: payload.gameId,
        totalRounds: totalRounds.toString(),
        currentRoundIndex: '0',
      });

      // Emit GameStarted to all clients in the room
      this.server.to(roomCode).emit('GameStarted', {
        gameId: payload.gameId,
        totalRounds,
      });

      // Start the first round (round index 0)
      await this.startRound(roomCode, 0);

      this.logger.log(
        `Game started in room ${roomCode} by host ${user.sub}. gameId=${payload.gameId}, totalRounds=${totalRounds}`,
      );
    } catch (error) {
      if (error instanceof WsException) throw error;

      const message =
        error instanceof Error ? error.message : 'Failed to start game';
      const err = new WsException(message);
      client.emit('error', {
        success: false,
        error: { code: 'INTERNAL_SERVER_ERROR', message: err.message },
      });
      throw err;
    }
  }

  /**
   * Initializes and broadcasts a new round for the given room.
   */
  async startRound(roomCode: string, roundIndex: number): Promise<void> {
    const roomMeta = await this.redisRoomRepository.getRoomMetadata(roomCode);
    if (!roomMeta) {
      throw new WsException('Room metadata not found');
    }

    const question = await this.redisRoomRepository.getQuestion(
      roomCode,
      roundIndex,
    );
    if (!question) {
      throw new WsException('Question not found for this round');
    }

    // Persist new round in PostgreSQL
    const round = await this.prisma.round.create({
      data: {
        roomId: roomMeta.id,
        questionId: question.id,
      },
    });

    // Update room state in Redis metadata
    await this.redisRoomRepository.updateRoomMetadata(roomCode, {
      currentRoundIndex: roundIndex.toString(),
      currentRoundId: round.id,
      currentQuestionId: question.id,
      questionStartedAt: new Date().toISOString(),
      timerDuration: '20', // Default 20 seconds allowed response duration
      timerRemaining: '20',
      roundStatus: 'IN_PROGRESS',
    });

    // Broadcast QuestionStarted to all connected clients in the room
    this.server.to(roomCode).emit('QuestionStarted', {
      roundNumber: roundIndex + 1,
      questionId: question.id,
      prompt: question.prompt,
      metadata: question.metadata,
      timeLimitSeconds: 20,
      difficulty: question.difficulty,
    });

    // Start the countdown timer engine automatically
    this.startTimer(roomCode, 20);

    this.logger.log(
      `Round started in room ${roomCode}. Index=${roundIndex}, roundId=${round.id}, questionId=${question.id}`,
    );
  }

  /**
   * Starts the countdown timer for the specified room.
   */
  startTimer(roomCode: string, durationSeconds: number): void {
    // Ensure any existing timer is stopped first
    this.stopTimer(roomCode);

    const startTime = Date.now();

    const interval = setInterval(() => {
      void (async () => {
        try {
          const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
          const remaining = Math.max(0, durationSeconds - elapsedSeconds);

          // Update timer state in Redis
          await this.redisRoomRepository.updateRoomMetadata(roomCode, {
            timerRemaining: remaining.toString(),
          });

          // Broadcast TimerTick to all connected clients in the room
          this.server.to(roomCode).emit('TimerTick', {
            secondsRemaining: remaining,
          });

          if (remaining <= 0) {
            // Timer has expired — trigger round completion (which also stops the timer)
            await this.completeRound(roomCode);
          }
        } catch (err) {
          this.logger.error(
            `Error in timer tick for room ${roomCode}: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      })();
    }, 1000);

    this.activeTimers.set(roomCode, interval);
  }

  /**
   * Stops and clears the countdown timer for the specified room.
   */
  stopTimer(roomCode: string): void {
    const interval = this.activeTimers.get(roomCode);
    if (interval) {
      clearInterval(interval);
      this.activeTimers.delete(roomCode);
      this.logger.log(`Timer stopped for room ${roomCode}`);
    }
  }

  /**
   * Completes the current round after timer expiration.
   *
   * Responsibilities:
   * 1. Stops the countdown timer immediately (prevents further ticks).
   * 2. Marks the round as COMPLETE in Redis metadata so late answers are rejected.
   * 3. Fetches the correct answer for the current question from Redis.
   * 4. Updates the Round record in PostgreSQL with endedAt timestamp.
   * 5. Broadcasts AnswerReveal to all clients in the room.
   */
  async completeRound(roomCode: string): Promise<void> {
    // Step 1 — Stop the timer so no further ticks fire after completion
    this.stopTimer(roomCode);

    this.logger.log(`Completing round for room ${roomCode}`);

    try {
      const roomMeta = await this.redisRoomRepository.getRoomMetadata(roomCode);

      if (!roomMeta) {
        this.logger.warn(
          `completeRound called for room ${roomCode} but metadata not found — skipping`,
        );
        return;
      }

      const { currentRoundId, currentQuestionId } = roomMeta;

      // Step 2 — Mark round as COMPLETE in Redis to gate late answer submissions (FFH-057)
      await this.redisRoomRepository.updateRoomMetadata(roomCode, {
        roundStatus: 'COMPLETE',
      });

      // Step 3 — Fetch the correct answer from the question stored in Redis
      const currentRoundIndex = parseInt(roomMeta.currentRoundIndex ?? '0', 10);
      const question = await this.redisRoomRepository.getQuestion(
        roomCode,
        currentRoundIndex,
      );

      const correctAnswer = question?.answer ?? null;

      // Step 4 — Persist round end timestamp to PostgreSQL
      if (currentRoundId) {
        try {
          await this.prisma.round.update({
            where: { id: currentRoundId },
            data: { endedAt: new Date() },
          });
        } catch (err) {
          // Log but don't abort the broadcast — Redis is authoritative during gameplay
          this.logger.error(
            `Failed to update endedAt for round ${currentRoundId}: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }

      // Step 5 — Broadcast AnswerReveal to all clients
      this.server.to(roomCode).emit('AnswerReveal', {
        correctAnswer,
        questionId: currentQuestionId ?? null,
        roundId: currentRoundId ?? null,
      });

      // Step 6 — Calculate and apply scores atomically
      if (currentRoundId) {
        await this.calculateAndApplyScores(
          roomCode,
          currentRoundId,
          roomMeta.timerDuration,
        );
      }

      // Step 7 — Flush Redis answers to PostgreSQL (non-fatal; Redis is authoritative until this succeeds)
      if (currentRoundId) {
        await this.persistRoundAnswers(roomCode, currentRoundId);
      }

      // Step 8 — Broadcast updated leaderboard to all connected clients
      await this.broadcastLeaderboard(roomCode);

      this.logger.log(
        `Round completed for room ${roomCode}. roundId=${currentRoundId ?? 'unknown'}, questionId=${currentQuestionId ?? 'unknown'}`,
      );
    } catch (err) {
      this.logger.error(
        `Error completing round for room ${roomCode}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  /**
   * Calculates player round scores and updates Redis player state and leaderboard ZSET atomically.
   */
  async calculateAndApplyScores(
    roomCode: string,
    roundId: string,
    timerDurationStr?: string,
  ): Promise<void> {
    this.logger.log(
      `Calculating scores for room ${roomCode}, roundId ${roundId}`,
    );

    try {
      const answers =
        (await this.redisRoomRepository.getAnswers(roomCode, roundId)) || {};
      const playersMap =
        (await this.redisRoomRepository.getPlayers(roomCode)) || {};
      const timerDuration = parseInt(timerDurationStr || '20', 10);

      const basePoints = 1000;
      const maxSpeedBonus = 500;
      const scoreUpdates: {
        playerId: string;
        newScore: number;
        playerJson: string;
      }[] = [];

      for (const [playerId, playerJson] of Object.entries(playersMap)) {
        try {
          const player = JSON.parse(playerJson) as {
            id: string;
            displayName: string;
            score: number;
            isReady: boolean;
          };

          const oldScore = typeof player.score === 'number' ? player.score : 0;
          let pointsEarned = 0;

          const answerJson = answers[playerId];
          if (answerJson) {
            const answer = JSON.parse(answerJson) as {
              answerText: string;
              responseTime: number;
              isCorrect: boolean;
            };

            if (answer.isCorrect) {
              const responseTimeSec = answer.responseTime / 1000;
              const speedBonus = Math.max(
                0,
                Math.floor(
                  (1 - responseTimeSec / timerDuration) * maxSpeedBonus,
                ),
              );
              pointsEarned = basePoints + speedBonus;
            }
          }

          if (pointsEarned > 0) {
            const newScore = oldScore + pointsEarned;
            player.score = newScore;
            scoreUpdates.push({
              playerId,
              newScore,
              playerJson: JSON.stringify(player),
            });

            this.logger.log(
              `Player ${playerId} in room ${roomCode} earned ${pointsEarned} points. New score: ${newScore}`,
            );
          }
        } catch (err) {
          this.logger.error(
            `Error processing score for player ${playerId}: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }

      if (scoreUpdates.length > 0) {
        await this.redisRoomRepository.updatePlayerScores(
          roomCode,
          scoreUpdates,
        );
        this.logger.log(
          `Applied score updates atomically for ${scoreUpdates.length} players in room ${roomCode}`,
        );
      }
    } catch (err) {
      this.logger.error(
        `Failed to calculate and apply scores for room ${roomCode}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  /**
   * Flushes all submitted answers for a completed round from Redis into PostgreSQL.
   *
   * Design notes:
   * - The playerId stored in Redis (keyed from user.sub in the guest JWT) is the
   *   Prisma Player.id — set at guest registration time in AuthService.registerGuest.
   *   No additional lookup is required.
   * - Uses createMany with skipDuplicates so re-running on retry is safe.
   * - Entire operation is non-fatal: a failure is logged but does not block the
   *   round completion flow. Redis remains authoritative until this succeeds.
   */
  async persistRoundAnswers(roomCode: string, roundId: string): Promise<void> {
    this.logger.log(
      `Persisting round answers to PostgreSQL for room ${roomCode}, roundId ${roundId}`,
    );

    try {
      const answers =
        (await this.redisRoomRepository.getAnswers(roomCode, roundId)) || {};

      const playerIds = Object.keys(answers);

      if (playerIds.length === 0) {
        this.logger.log(
          `No answers to persist for round ${roundId} in room ${roomCode}`,
        );
        return;
      }

      // Build the createMany payload, skipping entries with malformed JSON
      const answerRows: {
        roundId: string;
        playerId: string;
        answerText: string;
        responseTime: number;
        isCorrect: boolean;
      }[] = [];

      for (const playerId of playerIds) {
        const raw = answers[playerId];
        try {
          const parsed = JSON.parse(raw) as {
            answerText: string;
            responseTime: number;
            isCorrect: boolean;
          };

          if (
            typeof parsed.answerText !== 'string' ||
            typeof parsed.responseTime !== 'number' ||
            typeof parsed.isCorrect !== 'boolean'
          ) {
            this.logger.warn(
              `Skipping malformed answer for player ${playerId} in round ${roundId}`,
            );
            continue;
          }

          answerRows.push({
            roundId,
            playerId,
            answerText: parsed.answerText,
            responseTime: parsed.responseTime,
            isCorrect: parsed.isCorrect,
          });
        } catch {
          this.logger.warn(
            `Failed to parse answer JSON for player ${playerId} in round ${roundId} — skipping`,
          );
        }
      }

      if (answerRows.length === 0) {
        this.logger.warn(
          `All answers were malformed for round ${roundId} — nothing persisted`,
        );
        return;
      }

      const result = await this.prisma.answer.createMany({
        data: answerRows,
        skipDuplicates: true,
      });

      this.logger.log(
        `Persisted ${result.count} answer(s) to PostgreSQL for round ${roundId} in room ${roomCode}`,
      );
    } catch (err) {
      // Non-fatal — Redis remains the source of truth during active gameplay
      this.logger.error(
        `Failed to persist round answers for round ${roundId} in room ${roomCode}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  /**
   * Fetches the current leaderboard from Redis, builds the ranked payload, and broadcasts it to the room.
   */
  async broadcastLeaderboard(roomCode: string): Promise<void> {
    this.logger.log(`Broadcasting leaderboard for room ${roomCode}`);

    try {
      const rawLeaderboard =
        await this.redisRoomRepository.getLeaderboard(roomCode);
      const playersMap = await this.redisRoomRepository.getPlayers(roomCode);

      const entries: {
        playerId: string;
        displayName: string;
        score: number;
        streak: number;
      }[] = [];

      for (const item of rawLeaderboard) {
        const playerJson = playersMap[item.playerId];
        if (playerJson) {
          try {
            const player = JSON.parse(playerJson) as {
              id: string;
              displayName: string;
              score: number;
              streak?: number;
            };

            entries.push({
              playerId: item.playerId,
              displayName: player.displayName || 'Player',
              score: item.score,
              streak: player.streak || 0,
            });
          } catch {
            // Graceful fallback for corrupted JSON
            entries.push({
              playerId: item.playerId,
              displayName: 'Player',
              score: item.score,
              streak: 0,
            });
          }
        }
      }

      // Sort deterministically: score descending, then displayName ascending, then playerId ascending
      entries.sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return (
          a.displayName.localeCompare(b.displayName) ||
          a.playerId.localeCompare(b.playerId)
        );
      });

      // Assign ranks
      const rankedLeaderboard = entries.map((entry, index) => ({
        rank: index + 1,
        playerId: entry.playerId,
        displayName: entry.displayName,
        score: entry.score,
        streak: entry.streak,
      }));

      // Broadcast to room
      this.server.to(roomCode).emit('LeaderboardUpdated', rankedLeaderboard);

      this.logger.log(
        `LeaderboardUpdated broadcasted for room ${roomCode} with ${rankedLeaderboard.length} entries`,
      );
    } catch (err) {
      this.logger.error(
        `Failed to broadcast leaderboard for room ${roomCode}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  @SubscribeMessage('NextRound')
  async handleNextRound(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string },
  ): Promise<void> {
    if (!payload?.roomId) {
      const err = new WsException('roomId is required');
      client.emit('error', {
        success: false,
        error: { code: 'BAD_REQUEST', message: err.message },
      });
      throw err;
    }

    const clientData = client.data as {
      user?: TokenPayload;
      roomCode?: string;
    };
    const user = clientData.user;

    // Only host can start next round
    if (!user || user.role !== 'host') {
      const err = new WsException('Only the host can advance the round');
      client.emit('error', {
        success: false,
        error: { code: 'UNAUTHORIZED', message: err.message },
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
          error: { code: 'ROOM_NOT_FOUND', message: err.message },
        });
        throw err;
      }

      if (room.hostId !== user.sub) {
        const err = new WsException('You are not the host of this room');
        client.emit('error', {
          success: false,
          error: { code: 'UNAUTHORIZED', message: err.message },
        });
        throw err;
      }

      const roomCode = room.code.toUpperCase();
      const roomMeta = await this.redisRoomRepository.getRoomMetadata(roomCode);

      if (!roomMeta) {
        const err = new WsException('Room metadata not found');
        client.emit('error', {
          success: false,
          error: { code: 'ROOM_NOT_FOUND', message: err.message },
        });
        throw err;
      }

      if (roomMeta.status !== 'IN_PROGRESS') {
        const err = new WsException('Game is not in progress');
        client.emit('error', {
          success: false,
          error: { code: 'ROOM_NOT_IN_PROGRESS', message: err.message },
        });
        throw err;
      }

      const currentRoundIndex = parseInt(roomMeta.currentRoundIndex || '0', 10);
      const totalRounds = parseInt(roomMeta.totalRounds || '0', 10);
      const nextRoundIndex = currentRoundIndex + 1;

      if (nextRoundIndex >= totalRounds) {
        const err = new WsException('No more rounds in this game');
        client.emit('error', {
          success: false,
          error: { code: 'NO_MORE_ROUNDS', message: err.message },
        });
        throw err;
      }

      await this.startRound(roomCode, nextRoundIndex);
    } catch (error) {
      if (error instanceof WsException) throw error;

      const message =
        error instanceof Error ? error.message : 'Failed to advance round';
      const err = new WsException(message);
      client.emit('error', {
        success: false,
        error: { code: 'INTERNAL_SERVER_ERROR', message: err.message },
      });
      throw err;
    }
  }

  @SubscribeMessage('SubmitAnswer')
  async handleSubmitAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: {
      roomId: string;
      questionId: string;
      answer: string;
      responseTimeMs: number;
    },
  ): Promise<void> {
    if (
      !payload?.roomId ||
      !payload?.questionId ||
      payload?.answer === undefined ||
      payload?.responseTimeMs === undefined
    ) {
      const err = new WsException(
        'roomId, questionId, answer, and responseTimeMs are required',
      );
      client.emit('error', {
        success: false,
        error: { code: 'BAD_REQUEST', message: err.message },
      });
      throw err;
    }

    const clientData = client.data as {
      user?: TokenPayload;
      roomCode?: string;
    };
    const user = clientData.user;

    // Only guest players can submit answers
    if (!user || user.role !== 'guest') {
      const err = new WsException('Only players can submit answers');
      client.emit('error', {
        success: false,
        error: { code: 'UNAUTHORIZED', message: err.message },
      });
      throw err;
    }

    // Verify token room matches the payload room
    if (user.roomId !== payload.roomId) {
      const err = new WsException('Token room mismatch');
      client.emit('error', {
        success: false,
        error: { code: 'UNAUTHORIZED', message: err.message },
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
          error: { code: 'ROOM_NOT_FOUND', message: err.message },
        });
        throw err;
      }

      const roomCode = room.code.toUpperCase();
      const roomMeta = await this.redisRoomRepository.getRoomMetadata(roomCode);

      if (!roomMeta) {
        const err = new WsException('Room metadata not found');
        client.emit('error', {
          success: false,
          error: { code: 'ROOM_NOT_FOUND', message: err.message },
        });
        throw err;
      }

      // Check if room is in progress
      if (roomMeta.status !== 'IN_PROGRESS') {
        const err = new WsException('Game is not in progress');
        client.emit('error', {
          success: false,
          error: { code: 'ROOM_NOT_IN_PROGRESS', message: err.message },
        });
        throw err;
      }

      // Check if round is complete (expired)
      if (roomMeta.roundStatus === 'COMPLETE') {
        const err = new WsException('Round has already completed');
        client.emit('error', {
          success: false,
          error: { code: 'ROUND_ALREADY_COMPLETED', message: err.message },
        });
        throw err;
      }

      // Check if timer has expired based on wall clock time (additional safety)
      if (roomMeta.questionStartedAt) {
        const questionStartedAt = new Date(
          roomMeta.questionStartedAt,
        ).getTime();
        const timerDuration = parseInt(roomMeta.timerDuration || '20', 10);
        const elapsedMs = Date.now() - questionStartedAt;
        // Allow a small grace period of 1000ms for network latency/clock skew
        if (elapsedMs > (timerDuration + 1) * 1000) {
          const err = new WsException('Submission timed out');
          client.emit('error', {
            success: false,
            error: { code: 'ROUND_ALREADY_COMPLETED', message: err.message },
          });
          throw err;
        }
      }

      // Check if question ID matches the active question ID
      if (roomMeta.currentQuestionId !== payload.questionId) {
        const err = new WsException('Question ID mismatch for current round');
        client.emit('error', {
          success: false,
          error: { code: 'QUESTION_MISMATCH', message: err.message },
        });
        throw err;
      }

      const playerId = user.sub;
      const roundId = roomMeta.currentRoundId;

      if (!roundId) {
        const err = new WsException('No active round ID found');
        client.emit('error', {
          success: false,
          error: { code: 'ROUND_NOT_FOUND', message: err.message },
        });
        throw err;
      }

      // Check if player has already submitted an answer for this round (prevent duplicates)
      const existingAnswers = await this.redisRoomRepository.getAnswers(
        roomCode,
        roundId,
      );
      if (existingAnswers[playerId]) {
        const err = new WsException('Answer already submitted for this round');
        client.emit('error', {
          success: false,
          error: { code: 'DUPLICATE_SUBMISSION', message: err.message },
        });
        throw err;
      }

      // Retrieve correct answer to determine isCorrect
      const currentRoundIndex = parseInt(roomMeta.currentRoundIndex || '0', 10);
      const question = await this.redisRoomRepository.getQuestion(
        roomCode,
        currentRoundIndex,
      );
      if (!question) {
        const err = new WsException('Current question not found');
        client.emit('error', {
          success: false,
          error: { code: 'QUESTION_NOT_FOUND', message: err.message },
        });
        throw err;
      }

      const isCorrect =
        payload.answer.trim().toLowerCase() ===
        question.answer.trim().toLowerCase();

      // Save answer in Redis
      const answerState = {
        answerText: payload.answer,
        responseTime: payload.responseTimeMs,
        isCorrect,
      };

      await this.redisRoomRepository.setAnswer(
        roomCode,
        roundId,
        playerId,
        JSON.stringify(answerState),
      );

      // Return submission acknowledgement to the client
      client.emit('SubmitAnswerAck', {
        success: true,
        data: {
          playerId,
          roundId,
          questionId: payload.questionId,
          answerText: payload.answer,
          responseTimeMs: payload.responseTimeMs,
        },
      });

      this.logger.log(
        `Answer submitted by player ${playerId} in room ${roomCode} for round ${roundId}. isCorrect=${isCorrect}`,
      );
    } catch (error) {
      if (error instanceof WsException) throw error;
      const message =
        error instanceof Error ? error.message : 'Failed to submit answer';
      const err = new WsException(message);
      client.emit('error', {
        success: false,
        error: { code: 'INTERNAL_SERVER_ERROR', message: err.message },
      });
      throw err;
    }
  }

  /**
   * Validates all preconditions required before a game can start.
   *
   * Checks (in order):
   * 1. Room exists and is in LOBBY status.
   * 2. Host socket is connected to the room.
   * 3. Minimum player count is met (at least 1 player beyond the host).
   * 4. All players in the room are ready.
   * 5. The requested game exists in the DB and has at least one question.
   *
   * Returns a validation result object. Callers are responsible for emitting
   * protocol-compliant error events on failure.
   */
  async validateGameStart(
    roomCode: string,
    gameId: string,
    hostId: string,
  ): Promise<
    { valid: true } | { valid: false; code: string; message: string }
  > {
    // Check 1 — Room must exist and be in LOBBY status
    const room = await this.prisma.room.findUnique({
      where: { code: roomCode },
    });

    if (!room) {
      return {
        valid: false,
        code: 'ROOM_NOT_FOUND',
        message: `Room ${roomCode} does not exist`,
      };
    }

    if (room.status !== 'LOBBY') {
      return {
        valid: false,
        code: 'ROOM_NOT_IN_LOBBY',
        message: 'Room is not in LOBBY status',
      };
    }

    // Check 2 — Host must be connected (their socket is in the Socket.IO room)
    const sockets = await this.server.in(roomCode).fetchSockets();
    const hostConnected = sockets.some((socket) => {
      const data = socket.data as { user?: TokenPayload };
      return data.user?.sub === hostId && data.user?.role === 'host';
    });

    if (!hostConnected) {
      return {
        valid: false,
        code: 'HOST_NOT_CONNECTED',
        message: 'Host is not connected to the room',
      };
    }

    // Check 3 — Minimum player count (at least 1 player)
    const playersMap = await this.redisRoomRepository.getPlayers(roomCode);
    const playerCount = Object.keys(playersMap).length;
    const MIN_PLAYERS = 1;

    if (playerCount < MIN_PLAYERS) {
      return {
        valid: false,
        code: 'NOT_ENOUGH_PLAYERS',
        message: `At least ${MIN_PLAYERS} player is required to start`,
      };
    }

    // Check 4 — All players must be ready
    const players = Object.values(playersMap)
      .map((pJson) => {
        try {
          return JSON.parse(pJson) as Record<string, unknown>;
        } catch {
          return null;
        }
      })
      .filter((p): p is Record<string, unknown> => p !== null);

    const allReady = players.every((p) => p.isReady === true);

    if (!allReady) {
      return {
        valid: false,
        code: 'PLAYERS_NOT_READY',
        message: 'Not all players are ready',
      };
    }

    // Check 5 — Game must exist in DB with at least one question
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
      include: { _count: { select: { questions: true } } },
    });

    if (!game) {
      return {
        valid: false,
        code: 'GAME_NOT_FOUND',
        message: `Game ${gameId} does not exist`,
      };
    }

    if (game._count.questions === 0) {
      return {
        valid: false,
        code: 'GAME_HAS_NO_QUESTIONS',
        message: 'Game has no questions configured',
      };
    }

    return { valid: true };
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
          this.stopTimer(roomCode);
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
