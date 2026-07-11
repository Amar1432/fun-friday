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
      render(<DescriptionTextRenderer prompt="A movie about a sinking ship" />);
      expect(screen.getByText('Name That Movie')).toBeInTheDocument();
      expect(screen.getByText(/A movie about a sinking ship/)).toBeInTheDocument();
    });

    it('renders hint text', () => {
      const { container } = render(<DescriptionTextRenderer prompt="Test desc" />);
      expect(container.textContent).toContain(
        'Can you name the movie from this hilariously bad description?',
      );
    });

    it('wraps description in italic and quotes', () => {
      const { container } = render(<DescriptionTextRenderer prompt="A bad description" />);
      const italicEl = container.querySelector('.italic');
      expect(italicEl).toBeInTheDocument();
      expect(italicEl?.textContent).toContain('A bad description');
      // Assert the quoted style (left/right double quotes)
      expect(italicEl?.textContent).toMatch(/[\u201C\u201D]/);
    });

    it('shows decorative film-reel dots', () => {
      const { container } = render(<DescriptionTextRenderer prompt="Test" />);
      // The film-reel decorative element uses amber-400 rounded-full divs
      const filmReelDots = container.querySelectorAll('.rounded-full.bg-amber-400');
      expect(filmReelDots.length).toBeGreaterThanOrEqual(5);
    });

    it('has decorative background glow', () => {
      const { container } = render(<DescriptionTextRenderer prompt="Test" />);
      const glow = container.querySelector('.animate-pulse');
      expect(glow).toBeInTheDocument();
      expect(glow?.className).toContain('from-amber-500');
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
      expect(container.textContent).toContain(
        'What real words are hiding in this scrambled gibberish?',
      );
    });

    it('has pill badge with border styling', () => {
      const { container } = render(<GibberishTextRenderer prompt="Test" />);
      const pillBadge = container.querySelector('.rounded-full');
      expect(pillBadge).toBeInTheDocument();
      expect(pillBadge?.textContent).toContain('🔤');
      expect(pillBadge?.textContent).toContain('Decipher the Gibberish');
    });

    it('has decorative background glow', () => {
      const { container } = render(<GibberishTextRenderer prompt="Test" />);
      const glow = container.querySelector('.animate-pulse');
      expect(glow).toBeInTheDocument();
      expect(glow?.className).toContain('from-cyan-500');
      expect(glow?.className).toContain('via-teal-500');
      expect(glow?.className).toContain('to-emerald-500');
    });

    it('shows scrambled decorative dots', () => {
      const { container } = render(<GibberishTextRenderer prompt="Test" />);
      // The scrambled decorative dots use rounded-full divs in multiple colors
      const dots = container.querySelectorAll('.rounded-full');
      // At least 7 decorative dots + the pill badge
      expect(dots.length).toBeGreaterThanOrEqual(8);
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
      expect(container.textContent).toContain('Name That Movie');
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

  it('returns description-text for known Bad Movie Description game ID', () => {
    expect(getStrategyForGameId('2f8b9a1c-4d5e-6f70-81a2-b3c4d5e6f708')).toBe('description-text');
  });

  it('returns gibberish-text for known Gibberish game ID', () => {
    expect(getStrategyForGameId('3a9b1c2d-5e6f-4070-81a2-b3c4d5e6f709')).toBe('gibberish-text');
  });

  it('falls back to emoji-prompt for unknown game ID', () => {
    expect(getStrategyForGameId('unknown-game-id')).toBe('emoji-prompt');
  });
});
