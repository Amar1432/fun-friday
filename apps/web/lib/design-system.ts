import type { GameModeDefinition } from './game-modes';

export type GameModeIdentifier = GameModeDefinition['identifier'];

export interface GameModeVisualTokens {
  accentClassName: string;
  softSurfaceClassName: string;
  borderClassName: string;
  focusRingClassName: string;
}

export const GAME_MODE_VISUAL_TOKENS: Record<string, GameModeVisualTokens> = {
  'emoji-guess': {
    accentClassName: 'text-game-emoji',
    softSurfaceClassName: 'bg-game-emoji-soft',
    borderClassName: 'border-game-emoji/30',
    focusRingClassName: 'focus-visible:ring-game-emoji',
  },
  'bad-movie-description': {
    accentClassName: 'text-game-description',
    softSurfaceClassName: 'bg-game-description-soft',
    borderClassName: 'border-game-description/30',
    focusRingClassName: 'focus-visible:ring-game-description',
  },
  gibberish: {
    accentClassName: 'text-game-gibberish',
    softSurfaceClassName: 'bg-game-gibberish-soft',
    borderClassName: 'border-game-gibberish/30',
    focusRingClassName: 'focus-visible:ring-game-gibberish',
  },
};

export const DEFAULT_GAME_MODE_VISUAL_TOKENS: GameModeVisualTokens = {
  accentClassName: 'text-primary',
  softSurfaceClassName: 'bg-primary-soft',
  borderClassName: 'border-primary/30',
  focusRingClassName: 'focus-visible:ring-primary',
};

export function getGameModeVisualTokens(identifier: string): GameModeVisualTokens {
  return GAME_MODE_VISUAL_TOKENS[identifier] ?? DEFAULT_GAME_MODE_VISUAL_TOKENS;
}
