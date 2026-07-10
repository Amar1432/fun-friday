import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { AuthModule } from '../auth/auth.module';
import { AnswerEvaluationModule } from './answer-evaluation/answer-evaluation.module';

@Module({
  imports: [AuthModule, AnswerEvaluationModule],
  providers: [GameGateway],
  exports: [GameGateway],
})
export class GameModule {}
