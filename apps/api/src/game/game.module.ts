import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { AuthModule } from '../auth/auth.module';
import { AnswerEvaluationModule } from './answer-evaluation/answer-evaluation.module';
import { GameModeRegistryModule } from './game-mode-registry/game-mode-registry.module';

@Module({
  imports: [AuthModule, AnswerEvaluationModule, GameModeRegistryModule],
  providers: [GameGateway],
  exports: [GameGateway],
})
export class GameModule {}
