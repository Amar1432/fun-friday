import { Injectable } from '@nestjs/common';

/**
 * Service responsible for evaluating player answers independently of any
 * specific game mode. Currently performs a basic case-insensitive,
 * whitespace-trimmed equality comparison.
 *
 * This service is intentionally isolated from Socket.IO handlers and the
 * game loop. Future iterations will add fuzzy matching, typo tolerance,
 * and support for multiple accepted answers — all without changing the
 * public interface.
 */
@Injectable()
export class AnswerEvaluationService {
  /**
   * Evaluates whether a player's input matches the expected target answer.
   *
   * The current implementation normalises both strings (trim + lowercase)
   * and performs an exact match. This will be extended in FFH-115+ with
   * answer normalisation and typo-tolerant matching.
   *
   * @param input  - The raw answer submitted by the player.
   * @param target - The correct/expected answer for the current question.
   * @returns `true` if the input matches the target, `false` otherwise.
   */
  evaluate(input: string, target: string): boolean {
    return input.trim().toLowerCase() === target.trim().toLowerCase();
  }
}
