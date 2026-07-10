import { Module } from '@nestjs/common';
import { AnswerEvaluationService } from './answer-evaluation.service';

/**
 * Module responsible for evaluating player answers. Exposes
 * {@link AnswerEvaluationService} for injection into the game gateway
 * and any other consumers that require answer validation.
 *
 * This module is intentionally isolated from Socket.IO to allow
 * independent testing and future extension (FFH-115+).
 */
@Module({
  providers: [AnswerEvaluationService],
  exports: [AnswerEvaluationService],
})
export class AnswerEvaluationModule {}
