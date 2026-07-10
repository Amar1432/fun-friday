import { Injectable } from '@nestjs/common';

/**
 * Service responsible for evaluating player answers independently of any
 * specific game mode. Currently performs exact matching after normalizing
 * both the input and target answers.
 *
 * This service is intentionally isolated from Socket.IO handlers and the
 * game loop. Future iterations (FFH-116+) will add typo-tolerant matching
 * and support for multiple accepted answers — all without changing the
 * public interface.
 */
@Injectable()
export class AnswerEvaluationService {
  /**
   * Normalizes a raw answer string by applying the following transformations
   * in order:
   *
   * 1. Lowercase conversion.
   * 2. Remove hyphens (`-`).
   * 3. Remove underscores (`_`).
   * 4. Remove punctuation (any character that is not a letter, digit, or
   *    whitespace).
   * 5. Trim leading and trailing whitespace.
   * 6. Collapse multiple consecutive whitespace characters into a single
   *    space.
   * 7. Trim again in case collapsing left leading/trailing whitespace.
   *
   * @param input - The raw answer string to normalize.
   * @returns The normalized answer string.
   */
  normalize(input: string): string {
    return input
      .toLowerCase()
      .replace(/-/g, '')
      .replace(/_/g, '')
      .replace(/[^\p{L}\p{N}\s]/gu, '')
      .trim()
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Evaluates whether a player's input matches the expected target answer.
   *
   * Both strings are normalized via {@link normalize} before comparison,
   * ensuring that punctuation, case, whitespace, hyphens, and underscores
   * do not affect the result.
   *
   * @param input  - The raw answer submitted by the player.
   * @param target - The correct/expected answer for the current question.
   * @returns `true` if the input matches the target, `false` otherwise.
   */
  evaluate(input: string, target: string): boolean {
    return this.normalize(input) === this.normalize(target);
  }
}
