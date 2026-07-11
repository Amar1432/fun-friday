import * as React from 'react';
import { getGameModeVisualTokens } from '@/lib/design-system';
import type { GameModeDefinition } from '@/lib/game-modes';

export interface GameSelectionCardProps {
  mode: GameModeDefinition;
  isSelected: boolean;
  onSelect: (gameId: string) => void;
}

export function GameSelectionCard({ mode, isSelected, onSelect }: GameSelectionCardProps) {
  const visualTokens = getGameModeVisualTokens(mode.identifier);

  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      onClick={() => onSelect(mode.gameId)}
      className={[
        'group flex h-full min-h-[180px] flex-col rounded-card border p-4 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-app-background',
        visualTokens.focusRingClassName,
        isSelected
          ? `${visualTokens.borderClassName} bg-surface-raised shadow-panel`
          : 'border-border bg-surface-muted hover:border-border-strong hover:bg-surface-raised',
      ].join(' ')}
    >
      <span
        className={[
          'inline-flex h-11 w-11 items-center justify-center rounded-control border text-2xl',
          visualTokens.softSurfaceClassName,
          visualTokens.borderClassName,
        ].join(' ')}
        aria-hidden="true"
      >
        {mode.iconRef}
      </span>
      <span className="mt-4 flex items-start justify-between gap-3">
        <span>
          <span className="block text-base font-bold text-app-foreground">{mode.displayName}</span>
          <span className="mt-1 block text-sm leading-5 text-muted">{mode.description}</span>
        </span>
        <span
          className={[
            'mt-0.5 h-3 w-3 shrink-0 rounded-full border',
            isSelected
              ? `${visualTokens.softSurfaceClassName} ${visualTokens.borderClassName}`
              : 'border-border-strong bg-surface',
          ].join(' ')}
          data-testid={`${mode.identifier}-selection-indicator`}
          aria-hidden="true"
        />
      </span>
      <span className="mt-auto pt-4 text-xs font-semibold uppercase tracking-wider text-muted">
        {mode.questionCount ? `${mode.questionCount} questions` : 'Question count pending'}
      </span>
    </button>
  );
}

export interface GameSelectionGridProps {
  modes: readonly GameModeDefinition[];
  selectedGameId: string;
  onSelectGame: (gameId: string) => void;
  'aria-label'?: string;
}

export function GameSelectionGrid({
  modes,
  selectedGameId,
  onSelectGame,
  'aria-label': ariaLabel = 'Game mode',
}: GameSelectionGridProps) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3" role="radiogroup" aria-label={ariaLabel}>
      {modes.map((mode) => (
        <GameSelectionCard
          key={mode.identifier}
          mode={mode}
          isSelected={mode.gameId === selectedGameId}
          onSelect={onSelectGame}
        />
      ))}
    </div>
  );
}
