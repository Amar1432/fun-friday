import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from './redis.service';

export interface RedisQuestion {
  id: string;
  prompt: string;
  answer: string;
  difficulty: string;
  category: string | null;
  metadata: unknown;
}

@Injectable()
export class RedisRoomRepository {
  private readonly logger = new Logger(RedisRoomRepository.name);

  constructor(private readonly redisService: RedisService) {}

  private getMetaKey(roomCode: string): string {
    return `room:${roomCode.toUpperCase()}:meta`;
  }

  private getPlayersKey(roomCode: string): string {
    return `room:${roomCode.toUpperCase()}:players`;
  }

  private getLeaderboardKey(roomCode: string): string {
    return `room:${roomCode.toUpperCase()}:leaderboard`;
  }

  private getAnswersKey(roomCode: string, roundId: string): string {
    return `room:${roomCode.toUpperCase()}:answers:${roundId}`;
  }

  private getQuestionsKey(roomCode: string): string {
    return `room:${roomCode.toUpperCase()}:questions`;
  }

  /**
   * Initializes room metadata in Redis and sets the default 24-hour expiration.
   */
  async createRoomState(
    roomCode: string,
    metadata: Record<string, string>,
  ): Promise<void> {
    const client = this.redisService.getClient();
    const metaKey = this.getMetaKey(roomCode);
    const playersKey = this.getPlayersKey(roomCode);
    const leaderboardKey = this.getLeaderboardKey(roomCode);

    const pipeline = client.pipeline();
    pipeline.hset(metaKey, metadata);
    // Set default 24h expiration on the keys to prevent orphan memory leakage
    pipeline.expire(metaKey, 86400);
    pipeline.expire(playersKey, 86400);
    pipeline.expire(leaderboardKey, 86400);

    await pipeline.exec();
  }

  /**
   * Fetches the entire room metadata hash.
   */
  async getRoomMetadata(
    roomCode: string,
  ): Promise<Record<string, string> | null> {
    const client = this.redisService.getClient();
    const metaKey = this.getMetaKey(roomCode);
    const result = await client.hgetall(metaKey);
    return Object.keys(result).length > 0 ? result : null;
  }

  /**
   * Updates specific fields of room metadata.
   */
  async updateRoomMetadata(
    roomCode: string,
    metadata: Record<string, string>,
  ): Promise<void> {
    const client = this.redisService.getClient();
    const metaKey = this.getMetaKey(roomCode);
    await client.hset(metaKey, metadata);
  }

  /**
   * Atomic increment of a numeric metadata field.
   */
  async incrementMetadataField(
    roomCode: string,
    field: string,
    amount: number,
  ): Promise<number> {
    const client = this.redisService.getClient();
    const metaKey = this.getMetaKey(roomCode);
    return client.hincrby(metaKey, field, amount);
  }

  /**
   * Explicitly sets a custom TTL on all room keys.
   */
  async setRoomExpiration(roomCode: string, seconds: number): Promise<void> {
    const client = this.redisService.getClient();
    const metaKey = this.getMetaKey(roomCode);
    const playersKey = this.getPlayersKey(roomCode);
    const leaderboardKey = this.getLeaderboardKey(roomCode);

    const pipeline = client.pipeline();
    pipeline.expire(metaKey, seconds);
    pipeline.expire(playersKey, seconds);
    pipeline.expire(leaderboardKey, seconds);
    await pipeline.exec();
  }

  /**
   * Deletes all Redis keys associated with a room.
   */
  async deleteRoomState(roomCode: string): Promise<void> {
    const client = this.redisService.getClient();
    const keys = await client.keys(`room:${roomCode.toUpperCase()}:*`);
    if (keys.length > 0) {
      await client.del(...keys);
    }
  }

  /**
   * Adds or updates a player's JSON details in the players hash.
   */
  async setPlayer(
    roomCode: string,
    playerId: string,
    playerJson: string,
  ): Promise<void> {
    const client = this.redisService.getClient();
    const playersKey = this.getPlayersKey(roomCode);
    await client.hset(playersKey, playerId, playerJson);
  }

  /**
   * Retrieves a single player's JSON details.
   */
  async getPlayer(roomCode: string, playerId: string): Promise<string | null> {
    const client = this.redisService.getClient();
    const playersKey = this.getPlayersKey(roomCode);
    return client.hget(playersKey, playerId);
  }

  /**
   * Retrieves all players registered in the room.
   */
  async getPlayers(roomCode: string): Promise<Record<string, string>> {
    const client = this.redisService.getClient();
    const playersKey = this.getPlayersKey(roomCode);
    return client.hgetall(playersKey);
  }

  /**
   * Removes a player from the players hash and leaderboard sorted set.
   */
  async removePlayer(roomCode: string, playerId: string): Promise<void> {
    const client = this.redisService.getClient();
    const playersKey = this.getPlayersKey(roomCode);
    const leaderboardKey = this.getLeaderboardKey(roomCode);

    const pipeline = client.pipeline();
    pipeline.hdel(playersKey, playerId);
    pipeline.zrem(leaderboardKey, playerId);
    await pipeline.exec();
  }

  /**
   * Updates the player's score in the leaderboard sorted set.
   */
  async updateLeaderboardScore(
    roomCode: string,
    playerId: string,
    score: number,
  ): Promise<void> {
    const client = this.redisService.getClient();
    const leaderboardKey = this.getLeaderboardKey(roomCode);
    await client.zadd(leaderboardKey, score, playerId);
  }

  /**
   * Fetches the leaderboard sorted from highest score to lowest.
   */
  async getLeaderboard(
    roomCode: string,
  ): Promise<{ playerId: string; score: number }[]> {
    const client = this.redisService.getClient();
    const leaderboardKey = this.getLeaderboardKey(roomCode);
    // zrevrange returns members with scores from high to low
    const result = await client.zrevrange(leaderboardKey, 0, -1, 'WITHSCORES');

    const leaderboard: { playerId: string; score: number }[] = [];
    for (let i = 0; i < result.length; i += 2) {
      leaderboard.push({
        playerId: result[i],
        score: parseInt(result[i + 1], 10),
      });
    }
    return leaderboard;
  }

  /**
   * Saves a player's answer for the specified round and sets a 1-hour answer TTL.
   */
  async setAnswer(
    roomCode: string,
    roundId: string,
    playerId: string,
    answerJson: string,
  ): Promise<void> {
    const client = this.redisService.getClient();
    const answersKey = this.getAnswersKey(roomCode, roundId);

    const pipeline = client.pipeline();
    pipeline.hset(answersKey, playerId, answerJson);
    pipeline.expire(answersKey, 3600); // 1h answer expiration
    await pipeline.exec();
  }

  /**
   * Fetches all submitted answers for the specified round.
   */
  async getAnswers(
    roomCode: string,
    roundId: string,
  ): Promise<Record<string, string>> {
    const client = this.redisService.getClient();
    const answersKey = this.getAnswersKey(roomCode, roundId);
    return client.hgetall(answersKey);
  }

  /**
   * Stores the list of questions in Redis.
   * To prevent duplicate question loading, we check if the key already exists.
   * Returns true if questions were loaded successfully, false if they were already loaded.
   */
  async loadQuestions(
    roomCode: string,
    questions: RedisQuestion[],
  ): Promise<boolean> {
    const client = this.redisService.getClient();
    const questionsKey = this.getQuestionsKey(roomCode);

    // Check if questions are already loaded (to prevent duplicates)
    const exists = await client.exists(questionsKey);
    if (exists === 1) {
      return false;
    }

    const pipeline = client.pipeline();
    const questionsHash: Record<string, string> = {};
    questions.forEach((q, index) => {
      questionsHash[index.toString()] = JSON.stringify({
        id: q.id,
        prompt: q.prompt,
        answer: q.answer,
        difficulty: q.difficulty,
        category: q.category,
        metadata: q.metadata,
      });
    });

    pipeline.hset(questionsKey, questionsHash);
    // Align with 24 hours TTL for rooms
    pipeline.expire(questionsKey, 86400);
    await pipeline.exec();
    return true;
  }

  /**
   * Retrieves a question by its 0-based round index.
   */
  async getQuestion(
    roomCode: string,
    roundIndex: number,
  ): Promise<RedisQuestion | null> {
    const client = this.redisService.getClient();
    const questionsKey = this.getQuestionsKey(roomCode);
    const questionJson = await client.hget(questionsKey, roundIndex.toString());
    if (!questionJson) {
      return null;
    }
    try {
      return JSON.parse(questionJson) as RedisQuestion;
    } catch {
      return null;
    }
  }

  /**
   * Checks if questions are loaded for a room.
   */
  async hasQuestions(roomCode: string): Promise<boolean> {
    const client = this.redisService.getClient();
    const questionsKey = this.getQuestionsKey(roomCode);
    const exists = await client.exists(questionsKey);
    return exists === 1;
  }
}
