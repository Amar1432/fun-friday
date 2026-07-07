/* eslint-disable @typescript-eslint/unbound-method */
import { EventEmitter as MockEventEmitter } from 'events';
import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from './redis.service';
import Redis from 'ioredis';

jest.mock('ioredis', () => {
  class MockRedis extends MockEventEmitter {
    status = 'connect';
    ping = jest.fn().mockResolvedValue('PONG');
    quit = jest.fn().mockResolvedValue('OK');
    get = jest.fn().mockResolvedValue(null);
    set = jest.fn().mockResolvedValue('OK');
    del = jest.fn().mockResolvedValue(1);
    disconnect = jest.fn();
    on = jest
      .fn()
      .mockImplementation((event: string, cb: (...args: unknown[]) => void) => {
        super.on(event, cb);
        return this;
      });
  }
  return {
    __esModule: true,
    default: MockRedis,
  };
});

describe('RedisService', () => {
  let service: RedisService;
  let mockRedisInstance: Redis;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RedisService],
    }).compile();

    service = module.get<RedisService>(RedisService);
    mockRedisInstance = service.getClient();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should initialize and connect', () => {
    expect(mockRedisInstance).toBeDefined();
    expect(mockRedisInstance.on).toHaveBeenCalledWith(
      'connect',
      expect.any(Function),
    );
    expect(mockRedisInstance.on).toHaveBeenCalledWith(
      'ready',
      expect.any(Function),
    );
    expect(mockRedisInstance.on).toHaveBeenCalledWith(
      'error',
      expect.any(Function),
    );
    expect(mockRedisInstance.on).toHaveBeenCalledWith(
      'close',
      expect.any(Function),
    );
    expect(mockRedisInstance.on).toHaveBeenCalledWith(
      'reconnecting',
      expect.any(Function),
    );
  });

  it('should verify connection on module init successfully', async () => {
    (mockRedisInstance.ping as unknown as jest.Mock).mockResolvedValueOnce(
      'PONG',
    );
    await service.onModuleInit();
    expect(mockRedisInstance.ping).toHaveBeenCalled();
  });

  it('should handle startup ping failures gracefully', async () => {
    (mockRedisInstance.ping as unknown as jest.Mock).mockRejectedValueOnce(
      new Error('Connection refused'),
    );
    await expect(service.onModuleInit()).resolves.not.toThrow();
  });

  it('should disconnect on module destroy', () => {
    service.onModuleDestroy();
    expect(mockRedisInstance.disconnect).toHaveBeenCalled();
  });

  it('should return true for isHealthy when ping succeeds', async () => {
    (mockRedisInstance.ping as unknown as jest.Mock).mockResolvedValueOnce(
      'PONG',
    );
    const healthy = await service.isHealthy();
    expect(healthy).toBe(true);
  });

  it('should return false for isHealthy when ping fails', async () => {
    (mockRedisInstance.ping as unknown as jest.Mock).mockRejectedValueOnce(
      new Error('Ping error'),
    );
    const healthy = await service.isHealthy();
    expect(healthy).toBe(false);
  });

  it('should call get on the redis client', async () => {
    (mockRedisInstance.get as jest.Mock).mockResolvedValueOnce('value');
    const result = await service.get('key');
    expect(result).toBe('value');
    expect(mockRedisInstance.get).toHaveBeenCalledWith('key');
  });

  it('should call set on the redis client without TTL', async () => {
    await service.set('key', 'value');
    expect(mockRedisInstance.set).toHaveBeenCalledWith('key', 'value');
  });

  it('should call set on the redis client with TTL', async () => {
    await service.set('key', 'value', 60);
    expect(mockRedisInstance.set).toHaveBeenCalledWith(
      'key',
      'value',
      'EX',
      60,
    );
  });

  it('should call del on the redis client', async () => {
    await service.del('key');
    expect(mockRedisInstance.del).toHaveBeenCalledWith('key');
  });
});
