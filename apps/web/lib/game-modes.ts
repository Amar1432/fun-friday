/**
 * Frontend game mode types and registry.
 *
 * Mirrors the backend GameModeRegistry (apps/api/src/game/game-mode-registry)
 * to provide a single source of truth for game mode metadata on the client.
 *
 * To add a new game mode:
 * 1. Add an entry to the GAME_MODES array below.
 * 2. Create a renderer component for the new renderingStrategy.
 * 3. Register it in the STRATEGY_MAP inside game-mode-renderer.tsx.
 */

export interface GameModeDefinition {
  /** Unique machine-readable identifier (e.g. 'emoji-guess') */
  identifier: string;
  /** Human-readable display name (e.g. 'Emoji Guess') */
  displayName: string;
  /** Short description of the game mode */
  description: string;
  /** Emoji or icon reference for UI display */
  iconRef: string;
  /**
   * Rendering strategy identifier that the GameModeRenderer uses to
   * choose the correct presentation component.
   */
  renderingStrategy: string;
}

/**
 * All registered game modes.
 *
 * This array is read-only at runtime. To add a new mode, append a new
 * entry following the existing pattern — no other code changes are required
 * beyond registering a renderer for the new strategy.
 */
export const GAME_MODES: readonly GameModeDefinition[] = [
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
    description: 'Figure out the movie from a hilariously terrible description.',
    iconRef: '🎬',
    renderingStrategy: 'description-text',
  },
  {
    identifier: 'gibberish',
    displayName: 'Gibberish',
    description: 'Decode the funny-sounding gibberish phrase into real words.',
    iconRef: '🔤',
    renderingStrategy: 'gibberish-text',
  },
] as const;

/**
 * Returns the game mode definition for a given identifier.
 * Returns `undefined` if no matching mode exists.
 */
export function getGameModeByIdentifier(identifier: string): GameModeDefinition | undefined {
  return GAME_MODES.find((mode) => mode.identifier === identifier);
}

/**
 * Returns the game mode definition for a given rendering strategy.
 * Returns `undefined` if no matching mode exists.
 */
export function getGameModeByStrategy(strategy: string): GameModeDefinition | undefined {
  return GAME_MODES.find((mode) => mode.renderingStrategy === strategy);
}

/**
 * Returns all registered game modes as a mutable array.
 */
export function getAllGameModes(): GameModeDefinition[] {
  return [...GAME_MODES];
}

/**
 * Maps known game IDs (from the database seed) to their rendering strategy.
 * Used by the socket sync layer to determine how to render questions
 * when a GameStarted event arrives.
 *
 * This mapping is the frontend-side bridge between the database gameId
 * and the rendering strategy, since the backend GameStarted event does
 * not currently include the rendering strategy.
 */
export const GAME_ID_TO_STRATEGY: Record<string, string> = {
  '1cd83808-737f-4c29-ab51-adff5c6a1ef5': 'emoji-prompt',
  '2f8b9a1c-4d5e-6f70-81a2-b3c4d5e6f708': 'description-text',
  '3a9b1c2d-5e6f-4070-81a2-b3c4d5e6f709': 'gibberish-text',
};

/**
 * Returns the rendering strategy for a given game ID.
 * Falls back to 'emoji-prompt' for unknown game IDs.
 */
export function getStrategyForGameId(gameId: string): string {
  return GAME_ID_TO_STRATEGY[gameId] ?? 'emoji-prompt';
}
