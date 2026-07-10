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
 * Displays emoji prompts in a large, playful format.
 */
const EmojiPromptRenderer: React.FC<PromptRendererProps> = ({ prompt }) => (
  <div className="space-y-3">
    <span className="text-xs text-purple-400 font-bold uppercase tracking-wider">
      🎭 Decode the Emojis
    </span>
    <div className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-wide py-4 select-none drop-shadow-lg break-words leading-tight">
      {prompt}
    </div>
    <p className="text-xs text-slate-500 mt-2">
      What movie, show, or phrase do these emojis represent?
    </p>
  </div>
);

/**
 * Description Text Renderer
 * Displays a text description (e.g. bad movie description) in a readable format.
 */
const DescriptionTextRenderer: React.FC<PromptRendererProps> = ({ prompt }) => (
  <div className="space-y-3">
    <span className="text-xs text-amber-400 font-bold uppercase tracking-wider">
      🎬 What Movie Is This?
    </span>
    <div className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-wide py-4 select-none break-words leading-relaxed text-slate-200 italic">
      &ldquo;{prompt}&rdquo;
    </div>
    <p className="text-xs text-slate-500 mt-2">
      Name the movie from this hilariously bad description.
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
