import { Module } from '@nestjs/common';
import { GameModeRegistry } from './game-mode-registry.service';

@Module({
  providers: [GameModeRegistry],
  exports: [GameModeRegistry],
})
export class GameModeRegistryModule {}
