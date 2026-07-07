import { Test, TestingModule } from '@nestjs/testing';
import { RedisRoomRepository } from './redis-room.repository';
import { RedisService } from './redis.service';
import Redis from 'ioredis';

describe('RedisRoomRepository', () => {
  let repository: RedisRoomRepository;
  let mockRedisClient: jest.Mocked<Partial<Redis>>;
  let mockPipeline: {
    hset: jest.Mock;
    expire: jest.Mock;
    hdel: jest.Mock;
    zrem: jest.Mock;
    exec: jest.Mock;
  };

  beforeEach(async () => {
    mockPipeline = {
      hset: jest.fn().mockReturnThis(),
      expire: jest.fn().mockReturnThis(),
      hdel: jest.fn().mockReturnThis(),
      zrem: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([]),
    };

    mockRedisClient = {
      pipeline: jest.fn().mockReturnValue(mockPipeline),
      hgetall: jest.fn(),
      hset: jest.fn(),
      hincrby: jest.fn(),
      hget: jest.fn(),
      zadd: jest.fn(),
      zrevrange: jest.fn(),
      keys: jest.fn(),
      del: jest.fn(),
    };

    const mockRedisService = {
      getClient: () => mockRedisClient,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisRoomRepository,
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    repository = module.get<RedisRoomRepository>(RedisRoomRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('createRoomState', () => {
    it('should run a pipeline to initialize room metadata and default TTLs', async () => {
      const metadata = { id: 'room-1', status: 'LOBBY' };
      await repository.createRoomState('ABCDEF', metadata);

      expect(mockRedisClient.pipeline).toHaveBeenCalled();
      expect(mockPipeline.hset).toHaveBeenCalledWith(
        'room:ABCDEF:meta',
        metadata,
      );
      expect(mockPipeline.expire).toHaveBeenCalledWith(
        'room:ABCDEF:meta',
        86400,
      );
      expect(mockPipeline.expire).toHaveBeenCalledWith(
        'room:ABCDEF:players',
        86400,
      );
      expect(mockPipeline.expire).toHaveBeenCalledWith(
        'room:ABCDEF:leaderboard',
        86400,
      );
      expect(mockPipeline.exec).toHaveBeenCalled();
    });
  });

  describe('getRoomMetadata', () => {
    it('should call hgetall and return data when keys exist', async () => {
      const mockResult = { id: 'room-1', status: 'LOBBY' };
      (mockRedisClient.hgetall as jest.Mock).mockResolvedValue(mockResult);

      const result = await repository.getRoomMetadata('ABCDEF');
      expect(mockRedisClient.hgetall).toHaveBeenCalledWith('room:ABCDEF:meta');
      expect(result).toEqual(mockResult);
    });

    it('should return null when hgetall returns empty object', async () => {
      (mockRedisClient.hgetall as jest.Mock).mockResolvedValue({});

      const result = await repository.getRoomMetadata('ABCDEF');
      expect(result).toBeNull();
    });
  });

  describe('updateRoomMetadata', () => {
    it('should set metadata fields in Redis', async () => {
      await repository.updateRoomMetadata('ABCDEF', { status: 'IN_PROGRESS' });
      expect(mockRedisClient.hset).toHaveBeenCalledWith('room:ABCDEF:meta', {
        status: 'IN_PROGRESS',
      });
    });
  });

  describe('incrementMetadataField', () => {
    it('should call hincrby on metadata field', async () => {
      (mockRedisClient.hincrby as jest.Mock).mockResolvedValue(3);
      const res = await repository.incrementMetadataField('ABCDEF', 'round', 1);
      expect(res).toBe(3);
      expect(mockRedisClient.hincrby).toHaveBeenCalledWith(
        'room:ABCDEF:meta',
        'round',
        1,
      );
    });
  });

  describe('setRoomExpiration', () => {
    it('should pipeline expire commands on metadata, players, and leaderboard', async () => {
      await repository.setRoomExpiration('ABCDEF', 300);
      expect(mockPipeline.expire).toHaveBeenCalledWith('room:ABCDEF:meta', 300);
      expect(mockPipeline.expire).toHaveBeenCalledWith(
        'room:ABCDEF:players',
        300,
      );
      expect(mockPipeline.expire).toHaveBeenCalledWith(
        'room:ABCDEF:leaderboard',
        300,
      );
      expect(mockPipeline.exec).toHaveBeenCalled();
    });
  });

  describe('deleteRoomState', () => {
    it('should find all keys by prefix and delete them', async () => {
      (mockRedisClient.keys as jest.Mock).mockResolvedValue([
        'room:ABCDEF:meta',
        'room:ABCDEF:players',
      ]);
      await repository.deleteRoomState('ABCDEF');
      expect(mockRedisClient.keys).toHaveBeenCalledWith('room:ABCDEF:*');
      expect(mockRedisClient.del).toHaveBeenCalledWith(
        'room:ABCDEF:meta',
        'room:ABCDEF:players',
      );
    });

    it('should not call del if no keys are found', async () => {
      (mockRedisClient.keys as jest.Mock).mockResolvedValue([]);
      await repository.deleteRoomState('ABCDEF');
      expect(mockRedisClient.del).not.toHaveBeenCalled();
    });
  });

  describe('setPlayer', () => {
    it('should hset player JSON details', async () => {
      const playerJson = '{"id":"p1","name":"Test"}';
      await repository.setPlayer('ABCDEF', 'p1', playerJson);
      expect(mockRedisClient.hset).toHaveBeenCalledWith(
        'room:ABCDEF:players',
        'p1',
        playerJson,
      );
    });
  });

  describe('getPlayer', () => {
    it('should hget player JSON details', async () => {
      (mockRedisClient.hget as jest.Mock).mockResolvedValue('details');
      const res = await repository.getPlayer('ABCDEF', 'p1');
      expect(res).toBe('details');
      expect(mockRedisClient.hget).toHaveBeenCalledWith(
        'room:ABCDEF:players',
        'p1',
      );
    });
  });

  describe('getPlayers', () => {
    it('should return all players hash map', async () => {
      const mockResult = { p1: 'details1', p2: 'details2' };
      (mockRedisClient.hgetall as jest.Mock).mockResolvedValue(mockResult);
      const res = await repository.getPlayers('ABCDEF');
      expect(res).toEqual(mockResult);
    });
  });

  describe('removePlayer', () => {
    it('should remove player from players hash and leaderboard sorted set in pipeline', async () => {
      await repository.removePlayer('ABCDEF', 'p1');
      expect(mockPipeline.hdel).toHaveBeenCalledWith(
        'room:ABCDEF:players',
        'p1',
      );
      expect(mockPipeline.zrem).toHaveBeenCalledWith(
        'room:ABCDEF:leaderboard',
        'p1',
      );
      expect(mockPipeline.exec).toHaveBeenCalled();
    });
  });

  describe('updateLeaderboardScore', () => {
    it('should add player and score to sorted set', async () => {
      await repository.updateLeaderboardScore('ABCDEF', 'p1', 120);
      expect(mockRedisClient.zadd).toHaveBeenCalledWith(
        'room:ABCDEF:leaderboard',
        120,
        'p1',
      );
    });
  });

  describe('getLeaderboard', () => {
    it('should return parsed leaderboard array from zrevrange', async () => {
      (mockRedisClient.zrevrange as jest.Mock).mockResolvedValue([
        'p2',
        '250',
        'p1',
        '100',
      ]);
      const res = await repository.getLeaderboard('ABCDEF');
      expect(res).toEqual([
        { playerId: 'p2', score: 250 },
        { playerId: 'p1', score: 100 },
      ]);
      expect(mockRedisClient.zrevrange).toHaveBeenCalledWith(
        'room:ABCDEF:leaderboard',
        0,
        -1,
        'WITHSCORES',
      );
    });
  });

  describe('setAnswer', () => {
    it('should set answer and set 1h TTL using pipeline', async () => {
      const answerJson = '{"text":"ans"}';
      await repository.setAnswer('ABCDEF', 'round-1', 'p1', answerJson);
      expect(mockPipeline.hset).toHaveBeenCalledWith(
        'room:ABCDEF:answers:round-1',
        'p1',
        answerJson,
      );
      expect(mockPipeline.expire).toHaveBeenCalledWith(
        'room:ABCDEF:answers:round-1',
        3600,
      );
      expect(mockPipeline.exec).toHaveBeenCalled();
    });
  });

  describe('getAnswers', () => {
    it('should return answers hash map', async () => {
      const mockResult = { p1: 'ans1' };
      (mockRedisClient.hgetall as jest.Mock).mockResolvedValue(mockResult);
      const res = await repository.getAnswers('ABCDEF', 'round-1');
      expect(res).toEqual(mockResult);
      expect(mockRedisClient.hgetall).toHaveBeenCalledWith(
        'room:ABCDEF:answers:round-1',
      );
    });
  });
});
