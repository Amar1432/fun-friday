'use client';

import * as React from 'react';

/**
 * Shared Game Mode Renderer
 *
 * A strategy-pattern component that renders game-specific prompt presentations
 * based on the active rendering strategy. All game modes share a common layout
 * (round info, difficulty badge, prompt label) while the prompt display itself
 * varies per mode.
 *
 * To add a new game mode renderer:
 * 1. Create a PromptRenderer component that accepts PromptRendererProps.
 * 2. Register it in the STRATEGY_MAP below with the matching renderingStrategy key.
 */

export interface QuestionData {
  id: string;
  prompt: string;
  timeLimitSeconds: number;
  difficulty: string;
}

export interface PromptRendererProps {
  /** The raw prompt string from the question */
  prompt: string;
}

export interface GameModeRendererProps {
  /**
   * The rendering strategy identifier (e.g. 'emoji-prompt', 'description-text').
   * Matches the renderingStrategy field in the game mode registry.
   */
  renderingStrategy: string;
  /** The current question data */
  question: QuestionData;
  /** Current round index (0-based) */
  currentRoundIndex: number;
  /** Total number of rounds */
  totalRounds: number;
}

// ─── Individual Prompt Renderers ───────────────────────────────────────────────

/**
 * Emoji Prompt Renderer
 * Displays emoji prompts in a large, playful format with enhanced visual presentation.
 */
const EmojiPromptRenderer: React.FC<PromptRendererProps> = ({ prompt }) => (
  <div className="space-y-4">
    <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full">
      <span className="text-lg" role="img" aria-hidden="true">
        🎭
      </span>
      <span className="text-xs text-purple-400 font-bold uppercase tracking-wider">
        Decode the Emojis
      </span>
    </div>
    <div className="relative">
      {/* Decorative background glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-pink-500/10 rounded-3xl blur-xl animate-pulse" />
      <div className="relative text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-wide py-6 px-4 select-none drop-shadow-lg break-words leading-tight text-white">
        {prompt}
      </div>
    </div>
    <p className="text-sm text-slate-400 mt-2 font-medium">
      What movie, show, or phrase do these emojis represent?
    </p>
  </div>
);

/**
 * Description Text Renderer
 * Displays a text description (e.g. bad movie description) in a cinematic,
 * visually polished format with a film-reel aesthetic.
 */
const DescriptionTextRenderer: React.FC<PromptRendererProps> = ({ prompt }) => (
  <div className="space-y-4">
    <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full">
      <span className="text-lg" role="img" aria-hidden="true">
        🎬
      </span>
      <span className="text-xs text-amber-400 font-bold uppercase tracking-wider">
        Name That Movie
      </span>
    </div>
    <div className="relative">
      {/* Decorative background glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-orange-500/10 rounded-3xl blur-xl animate-pulse" />
      {/* Film-reel decorative top accent */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 opacity-30">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-amber-400" />
        ))}
      </div>
      <div className="relative text-xl sm:text-2xl md:text-3xl font-semibold tracking-wide py-8 px-6 select-none break-words leading-relaxed text-amber-50 italic">
        &ldquo;{prompt}&rdquo;
      </div>
    </div>
    <p className="text-xs sm:text-sm text-amber-400/70 mt-2 font-medium">
      Can you name the movie from this hilariously bad description?
    </p>
  </div>
);

/**
 * Gibberish Text Renderer
 * Displays a gibberish phrase in a distorted, playful format.
 */
const GibberishTextRenderer: React.FC<PromptRendererProps> = ({ prompt }) => (
  <div className="space-y-3">
    <span className="text-xs text-cyan-400 font-bold uppercase tracking-wider">
      🔤 Decipher the Gibberish
    </span>
    <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-wider py-4 select-none drop-shadow-lg break-words text-cyan-200">
      {prompt}
    </div>
    <p className="text-xs text-slate-500 mt-2">What real words are hiding in this gibberish?</p>
  </div>
);

/**
 * Fallback Renderer
 * Used when no matching strategy is found. Renders the prompt as plain text.
 */
const FallbackRenderer: React.FC<PromptRendererProps> = ({ prompt }) => (
  <div className="space-y-3">
    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
      Guess the Prompt
    </span>
    <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-wide py-4 select-none drop-shadow-lg break-words">
      {prompt}
    </div>
  </div>
);

// ─── Strategy Map ──────────────────────────────────────────────────────────────

/**
 * Maps rendering strategy identifiers to their corresponding prompt renderer
 * components. Register new strategies here when adding game modes.
 */
const STRATEGY_MAP: Record<string, React.ComponentType<PromptRendererProps>> = {
  'emoji-prompt': EmojiPromptRenderer,
  'description-text': DescriptionTextRenderer,
  'gibberish-text': GibberishTextRenderer,
};

// ─── Main Renderer Component ───────────────────────────────────────────────────

/**
 * GameModeRenderer
 *
 * Renders the game-specific prompt display based on the active rendering strategy.
 * Wraps the prompt in a shared layout with round info and difficulty badge.
 */
export const GameModeRenderer: React.FC<GameModeRendererProps> = ({
  renderingStrategy,
  question,
  currentRoundIndex,
  totalRounds,
}) => {
  const PromptComponent = STRATEGY_MAP[renderingStrategy] ?? FallbackRenderer;

  return (
    <div className="space-y-6 text-center py-8">
      {/* Shared layout: Round info and difficulty */}
      <div className="space-y-1">
        <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 rounded-lg text-xs font-semibold border border-indigo-500/20 mr-2">
          <span className="sr-only">Difficulty: </span>
          {question.difficulty}
        </span>
        <h2 className="text-lg font-bold text-white mt-1.5 inline-block">
          Round {currentRoundIndex + 1} of {totalRounds}
        </h2>
      </div>

      {/* Game-specific prompt display */}
      <PromptComponent prompt={question.prompt} />
    </div>
  );
};

// ─── Exports for Testing ──────────────────────────────────────────────────────

export {
  EmojiPromptRenderer,
  DescriptionTextRenderer,
  GibberishTextRenderer,
  FallbackRenderer,
  STRATEGY_MAP,
};
