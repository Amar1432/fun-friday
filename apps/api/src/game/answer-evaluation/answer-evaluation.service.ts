import { Injectable } from '@nestjs/common';

/**
 * Service responsible for evaluating player answers independently of any
 * specific game mode. Performs exact matching after normalizing both the
 * input and target answers, with optional typo-tolerant matching via a
 * configurable Levenshtein-distance threshold.
 *
 * This service is intentionally isolated from Socket.IO handlers and the
 * game loop. The public interface supports future game modes without
 * modification.
 */
@Injectable()
export class AnswerEvaluationService {
  /**
   * Default threshold for exact (non-fuzzy) matching.
   */
  private readonly EXACT_MATCH_THRESHOLD = 0;

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
   * Computes the Levenshtein distance between two strings using an iterative
   * two-row DP approach for O(n) memory efficiency.
   *
   * The Levenshtein distance is the minimum number of single-character edits
   * (insertions, deletions, or substitutions) required to transform one string
   * into the other.
   *
   * @param a - The first string.
   * @param b - The second string.
   * @returns The edit distance (0 = identical strings).
   */
  calculateDistance(a: string, b: string): number {
    const aLen = a.length;
    const bLen = b.length;

    // Handle empty-string edge cases
    if (aLen === 0) return bLen;
    if (bLen === 0) return aLen;

    // Use two rows for O(min(aLen, bLen)) memory
    // Ensure b is the shorter dimension for less memory usage
    if (aLen < bLen) {
      return this.calculateDistance(b, a);
    }

    let prevRow: number[] = [];
    let currRow: number[] = [];

    // Initialize previous row (edits to transform empty string into b)
    for (let j = 0; j <= bLen; j++) {
      prevRow[j] = j;
    }

    for (let i = 1; i <= aLen; i++) {
      currRow[0] = i;

      for (let j = 1; j <= bLen; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;

        currRow[j] = Math.min(
          prevRow[j] + 1, // deletion
          currRow[j - 1] + 1, // insertion
          prevRow[j - 1] + cost, // substitution
        );
      }

      // Swap rows for next iteration
      [prevRow, currRow] = [currRow, prevRow];
    }

    return prevRow[bLen];
  }

  /**
   * Evaluates whether a player's input matches one or more expected target
   * answers.
   *
   * When `target` is a single string, behavior is identical to previous
   * versions (backward compatible). When `target` is an array of strings,
   * the input is compared against **each** target independently, and the
   * method returns `true` if **any** target matches.
   *
   * Both input and each target are normalized via {@link normalize} before
   * comparison. When `threshold > 0`, the Levenshtein distance between the
   * normalized strings is computed, and the match succeeds if the distance
   * is within the threshold for that particular target.
   *
   * @param input     - The raw answer submitted by the player.
   * @param targets   - The correct/expected answer(s) for the current
   *                    question. Accepts a single string or an array of
   *                    strings.
   * @param threshold - Maximum allowed edit distance for a match.
   *                    Defaults to 0 (exact match after normalization).
   * @returns `true` if the input matches any of the targets, `false`
   *          otherwise.
   */
  evaluate(
    input: string,
    targets: string | string[],
    threshold: number = this.EXACT_MATCH_THRESHOLD,
  ): boolean {
    const normalizedInput = this.normalize(input);
    const targetList = Array.isArray(targets) ? targets : [targets];

    for (const target of targetList) {
      const normalizedTarget = this.normalize(target);

      if (threshold <= this.EXACT_MATCH_THRESHOLD) {
        if (normalizedInput === normalizedTarget) {
          return true;
        }
        continue;
      }

      // Quick win: identical strings are always a match
      if (normalizedInput === normalizedTarget) {
        return true;
      }

      const distance = this.calculateDistance(
        normalizedInput,
        normalizedTarget,
      );
      if (distance <= threshold) {
        return true;
      }
    }

    return false;
  }
}
