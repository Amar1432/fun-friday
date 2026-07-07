import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { RedisRoomRepository } from './redis-room.repository';

@Global()
@Module({
  providers: [RedisService, RedisRoomRepository],
  exports: [RedisService, RedisRoomRepository],
})
export class RedisModule {}
