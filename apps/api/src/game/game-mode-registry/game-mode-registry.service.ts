import { Injectable } from '@nestjs/common';

/**
 * Represents a single game mode definition in the registry.
 */
export interface GameModeDefinition {
  /** Unique machine-readable identifier (e.g. 'emoji-guess') */
  identifier: string;
  /** Human-readable display name (e.g. 'Emoji Guess') */
  displayName: string;
  /** Short description of the game mode */
  description: string;
  /** Emoji or icon reference for frontend rendering */
  iconRef: string;
  /**
   * Rendering strategy identifier that the frontend renderer uses to
   * choose the correct presentation component.
   */
  renderingStrategy: string;
}

/**
 * Centralized registry of all supported game modes.
 *
 * Provides a single source of truth for game mode definitions that can be
 * queried by the frontend (via REST endpoints) and consumed internally by
 * the game loop and question loading logic.
 *
 * To add a new game mode, simply append a new entry to the `modes` array
 * following the existing pattern — no other code changes are required.
 */
@Injectable()
export class GameModeRegistry {
  private readonly modes: GameModeDefinition[] = [
    {
      identifier: 'emoji-guess',
      displayName: 'Emoji Guess',
      description: 'Guess the movie, show, or phrase from a set of emojis!',
      iconRef: '🎭',
      renderingStrategy: 'emoji-prompt',
    },
    {
      identifier: 'bad-movie-description',
      displayName: 'Bad Movie Description',
      description:
        'Figure out the movie from a hilariously terrible description.',
      iconRef: '🎬',
      renderingStrategy: 'description-text',
    },
    {
      identifier: 'gibberish',
      displayName: 'Gibberish',
      description:
        'Decode the funny-sounding gibberish phrase into real words.',
      iconRef: '🔤',
      renderingStrategy: 'gibberish-text',
    },
  ];

  /**
   * Returns all registered game mode definitions.
   * Returns a copy of the internal array to prevent external mutation.
   */
  getAll(): GameModeDefinition[] {
    return [...this.modes];
  }

  /**
   * Returns the definition for a single game mode by its identifier.
   * Returns `null` if no game mode with the given identifier exists.
   */
  getByIdentifier(identifier: string): GameModeDefinition | null {
    return this.modes.find((mode) => mode.identifier === identifier) ?? null;
  }

  /**
   * Checks whether a game mode with the given identifier exists in the registry.
   */
  exists(identifier: string): boolean {
    return this.modes.some((mode) => mode.identifier === identifier);
  }
}
