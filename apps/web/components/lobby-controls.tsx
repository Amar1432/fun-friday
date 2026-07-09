'use client';

import * as React from 'react';
import { useGameStore } from '@/lib/store/use-game-store';

interface LobbyControlsProps {
  onStartGame?: () => void;
  isStarting?: boolean;
  error?: string | null;
}

export function LobbyControls({
  onStartGame,
  isStarting = false,
  error = null,
}: LobbyControlsProps) {
  const players = useGameStore((state) => state.players);

  const totalCount = players.length;
  const readyCount = players.filter((p) => p.isReady).length;
  const allReady = totalCount > 0 && readyCount === totalCount;
  const isStartDisabled = !allReady || isStarting;

  return (
    <div className="flex items-center gap-3" data-testid="lobby-controls">
      {/* Error Message — compact */}
      {error && (
        <div
          className="px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium rounded-lg flex items-center gap-1.5"
          data-testid="lobby-error-message"
          role="alert"
        >
          <svg
            className="w-3.5 h-3.5 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Player Stats — inline */}
      <div className="flex items-center gap-2 text-xs text-slate-400 shrink-0">
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span data-testid="player-count">{totalCount}</span>
        </span>
        <span className="text-slate-700">|</span>
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span data-testid="ready-count">
            {readyCount}/{totalCount}
          </span>
        </span>
      </div>

      {/* Status Message */}
      <p
        className={`text-[10px] font-medium flex-1 text-center ${
          totalCount === 0 ? 'text-slate-500' : allReady ? 'text-green-400' : 'text-amber-400'
        }`}
        data-testid="lobby-status-message"
      >
        {totalCount === 0
          ? 'Waiting for players...'
          : allReady
            ? 'All players ready!'
            : 'Waiting for ready...'}
      </p>

      {/* Start Button — compact */}
      <button
        onClick={onStartGame}
        disabled={isStartDisabled}
        data-testid="start-game-button"
        className={`px-4 py-2 rounded-lg font-bold text-xs tracking-wide shadow-lg flex items-center gap-1.5 cursor-pointer transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 shrink-0 ${
          isStartDisabled
            ? 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed shadow-none'
            : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:brightness-110 active:scale-[0.97]'
        }`}
      >
        {isStarting ? (
          <>
            <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Starting...</span>
          </>
        ) : (
          <>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Start Game</span>
          </>
        )}
      </button>
    </div>
  );
}
