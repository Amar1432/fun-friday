import * as React from 'react';
import { render, screen } from '@testing-library/react';
import {
  GameModeRenderer,
  EmojiPromptRenderer,
  DescriptionTextRenderer,
  GibberishTextRenderer,
  FallbackRenderer,
  STRATEGY_MAP,
} from './game-mode-renderer';
import {
  GAME_MODES,
  getGameModeByIdentifier,
  getGameModeByStrategy,
  getAllGameModes,
  getStrategyForGameId,
} from '@/lib/game-modes';

const mockQuestion = {
  id: 'q-1',
  prompt: 'Test prompt',
  timeLimitSeconds: 20,
  difficulty: 'MEDIUM',
};

describe('GameModeRenderer', () => {
  describe('Shared Layout', () => {
    it('renders round information correctly', () => {
      render(
        <GameModeRenderer
          renderingStrategy="emoji-prompt"
          question={mockQuestion}
          currentRoundIndex={2}
          totalRounds={5}
        />,
      );
      expect(screen.getByText('Round 3 of 5')).toBeInTheDocument();
    });

    it('renders difficulty badge', () => {
      render(
        <GameModeRenderer
          renderingStrategy="emoji-prompt"
          question={mockQuestion}
          currentRoundIndex={0}
          totalRounds={1}
        />,
      );
      expect(screen.getByText('MEDIUM')).toBeInTheDocument();
    });

    it('renders the prompt text', () => {
      render(
        <GameModeRenderer
          renderingStrategy="emoji-prompt"
          question={mockQuestion}
          currentRoundIndex={0}
          totalRounds={1}
        />,
      );
      expect(screen.getByText('Test prompt')).toBeInTheDocument();
    });

    it('falls back to FallbackRenderer for unknown strategy', () => {
      render(
        <GameModeRenderer
          renderingStrategy="unknown-strategy"
          question={mockQuestion}
          currentRoundIndex={0}
          totalRounds={1}
        />,
      );
      expect(screen.getByText('Guess the Prompt')).toBeInTheDocument();
      expect(screen.getByText('Test prompt')).toBeInTheDocument();
    });
  });

  describe('EmojiPromptRenderer', () => {
    it('renders emoji prompt with decode label', () => {
      const { container } = render(<EmojiPromptRenderer prompt="🎩⚡👦" />);
      expect(container.textContent).toContain('Decode the Emojis');
      expect(screen.getByText('🎩⚡👦')).toBeInTheDocument();
    });

    it('renders hint text', () => {
      const { container } = render(<EmojiPromptRenderer prompt="🦁👑" />);
      expect(container.textContent).toContain(
        'What movie, show, or phrase do these emojis represent?',
      );
    });
  });

  describe('DescriptionTextRenderer', () => {
    it('renders description with movie label', () => {
      const { container } = render(
        <DescriptionTextRenderer prompt="A movie about a sinking ship" />,
      );
      expect(container.textContent).toContain('What Movie Is This?');
      expect(container.textContent).toContain('A movie about a sinking ship');
    });

    it('renders hint text', () => {
      const { container } = render(<DescriptionTextRenderer prompt="Test desc" />);
      expect(container.textContent).toContain(
        'Name the movie from this hilariously bad description.',
      );
    });
  });

  describe('GibberishTextRenderer', () => {
    it('renders gibberish with decipher label', () => {
      const { container } = render(<GibberishTextRenderer prompt="Harry Rotter" />);
      expect(container.textContent).toContain('Decipher the Gibberish');
      expect(screen.getByText('Harry Rotter')).toBeInTheDocument();
    });

    it('renders hint text', () => {
      const { container } = render(<GibberishTextRenderer prompt="Test gibberish" />);
      expect(container.textContent).toContain('What real words are hiding in this gibberish?');
    });
  });

  describe('FallbackRenderer', () => {
    it('renders generic prompt display', () => {
      render(<FallbackRenderer prompt="Fallback prompt" />);
      expect(screen.getByText('Guess the Prompt')).toBeInTheDocument();
      expect(screen.getByText('Fallback prompt')).toBeInTheDocument();
    });
  });

  describe('Strategy Map', () => {
    it('maps emoji-prompt to EmojiPromptRenderer', () => {
      expect(STRATEGY_MAP['emoji-prompt']).toBe(EmojiPromptRenderer);
    });

    it('maps description-text to DescriptionTextRenderer', () => {
      expect(STRATEGY_MAP['description-text']).toBe(DescriptionTextRenderer);
    });

    it('maps gibberish-text to GibberishTextRenderer', () => {
      expect(STRATEGY_MAP['gibberish-text']).toBe(GibberishTextRenderer);
    });
  });

  describe('Per-strategy rendering', () => {
    it('renders emoji prompt when strategy is emoji-prompt', () => {
      const { container } = render(
        <GameModeRenderer
          renderingStrategy="emoji-prompt"
          question={{ ...mockQuestion, prompt: '🎩⚡👦' }}
          currentRoundIndex={0}
          totalRounds={1}
        />,
      );
      expect(container.textContent).toContain('Decode the Emojis');
      expect(screen.getByText('🎩⚡👦')).toBeInTheDocument();
    });

    it('renders description when strategy is description-text', () => {
      const { container } = render(
        <GameModeRenderer
          renderingStrategy="description-text"
          question={{ ...mockQuestion, prompt: 'A bad movie description' }}
          currentRoundIndex={0}
          totalRounds={1}
        />,
      );
      expect(container.textContent).toContain('What Movie Is This?');
      expect(container.textContent).toContain('A bad movie description');
    });

    it('renders gibberish when strategy is gibberish-text', () => {
      const { container } = render(
        <GameModeRenderer
          renderingStrategy="gibberish-text"
          question={{ ...mockQuestion, prompt: 'Hary Poter' }}
          currentRoundIndex={0}
          totalRounds={1}
        />,
      );
      expect(container.textContent).toContain('Decipher the Gibberish');
      expect(screen.getByText('Hary Poter')).toBeInTheDocument();
    });
  });
});

describe('Game Modes Registry (lib/game-modes)', () => {
  it('contains all three game modes', () => {
    expect(GAME_MODES).toHaveLength(3);
  });

  it('has unique identifiers', () => {
    const identifiers = GAME_MODES.map((m) => m.identifier);
    expect(new Set(identifiers).size).toBe(3);
  });

  it('has unique rendering strategies', () => {
    const strategies = GAME_MODES.map((m) => m.renderingStrategy);
    expect(new Set(strategies).size).toBe(3);
  });

  it('all modes have required fields', () => {
    GAME_MODES.forEach((mode) => {
      expect(mode.identifier).toBeTruthy();
      expect(mode.displayName).toBeTruthy();
      expect(mode.description).toBeTruthy();
      expect(mode.iconRef).toBeTruthy();
      expect(mode.renderingStrategy).toBeTruthy();
    });
  });

  it('getGameModeByIdentifier returns correct mode', () => {
    const mode = getGameModeByIdentifier('emoji-guess');
    expect(mode).toBeDefined();
    expect(mode?.displayName).toBe('Emoji Guess');
    expect(mode?.renderingStrategy).toBe('emoji-prompt');
  });

  it('getGameModeByIdentifier returns undefined for unknown', () => {
    expect(getGameModeByIdentifier('nonexistent')).toBeUndefined();
  });

  it('getGameModeByStrategy returns correct mode', () => {
    const mode = getGameModeByStrategy('gibberish-text');
    expect(mode).toBeDefined();
    expect(mode?.identifier).toBe('gibberish');
  });

  it('getGameModeByStrategy returns undefined for unknown', () => {
    expect(getGameModeByStrategy('nonexistent')).toBeUndefined();
  });

  it('getAllGameModes returns a copy', () => {
    const all = getAllGameModes();
    expect(all).toHaveLength(3);
    // Modifying the returned array should not affect the original
    all.push({
      identifier: 'test',
      displayName: 'Test',
      description: 'Test',
      iconRef: '🧪',
      renderingStrategy: 'test',
    });
    expect(GAME_MODES).toHaveLength(3);
  });
});

describe('getStrategyForGameId', () => {
  it('returns emoji-prompt for known Emoji Guess game ID', () => {
    expect(getStrategyForGameId('1cd83808-737f-4c29-ab51-adff5c6a1ef5')).toBe('emoji-prompt');
  });

  it('falls back to emoji-prompt for unknown game ID', () => {
    expect(getStrategyForGameId('unknown-game-id')).toBe('emoji-prompt');
  });
});
