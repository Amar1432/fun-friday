import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.logger.log(`Initializing Redis connection to: ${redisUrl}`);

    this.client = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      retryStrategy: (times) => {
        // Exponential backoff up to 10 seconds
        const delay = Math.min(times * 200, 10000);
        this.logger.warn(
          `Redis connection lost. Reconnecting attempt #${times} in ${delay}ms`,
        );
        return delay;
      },
    });

    this.client.on('connect', () => {
      this.logger.log('Redis client initiating connection...');
    });

    this.client.on('ready', () => {
      this.logger.log('Redis connection established successfully');
    });

    this.client.on('error', (error: Error) => {
      this.logger.error(
        `Redis connection error: ${error.message}`,
        error.stack,
      );
    });

    this.client.on('close', () => {
      this.logger.warn('Redis connection closed');
    });

    this.client.on('reconnecting', (delay: number) => {
      this.logger.log(`Redis reconnecting in ${delay}ms`);
    });
  }

  async onModuleInit(): Promise<void> {
    this.logger.log('Verifying Redis connection on startup...');
    let timeoutId: NodeJS.Timeout | undefined;
    try {
      // Use a timeout to avoid blocking startup indefinitely if Redis is down
      await Promise.race([
        this.client.ping(),
        new Promise((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error('Redis connection verification timed out'));
          }, 2000);
        }),
      ]);
      this.logger.log('Redis startup check passed');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Redis connection could not be verified on startup: ${message}`,
      );
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }

  onModuleDestroy(): void {
    this.logger.log('Closing Redis connection...');
    this.client.disconnect();
  }

  getClient(): Redis {
    return this.client;
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds !== undefined) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async isHealthy(): Promise<boolean> {
    try {
      const response = await this.client.ping();
      return response === 'PONG';
    } catch {
      return false;
    }
  }
}
