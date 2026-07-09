'use client';

import * as React from 'react';
import { useGameStore } from '@/lib/store/use-game-store';
import { SocketDispatcher } from '@/lib/socket/socket-dispatcher';

interface PlayerListProps {
  dispatcher?: SocketDispatcher | null;
  currentUserId?: string | null;
  currentUserIsGuest?: boolean;
  roomId?: string | null;
}

export function PlayerList({
  dispatcher,
  currentUserId,
  currentUserIsGuest = false,
  roomId,
}: PlayerListProps) {
  const players = useGameStore((state) => state.players);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
          <span>Players</span>
          <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-full font-medium">
            {players.length}
          </span>
        </h2>
      </div>

      {players.length === 0 ? (
        <div className="text-center py-6 bg-slate-900/40 border border-slate-800/60 rounded-xl border-dashed">
          <p className="text-xs text-slate-500 font-medium">Waiting for players to join...</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-1.5" data-testid="player-list-grid">
          {players.map((player) => {
            const isConnected = player.isConnected !== false;
            const initials = player.displayName.charAt(0).toUpperCase();

            const colors = [
              'from-rose-500 to-orange-500',
              'from-green-400 to-blue-500',
              'from-pink-500 to-rose-500',
              'from-amber-400 to-amber-600',
              'from-violet-500 to-purple-500',
              'from-cyan-500 to-blue-600',
            ];
            const hash = player.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const avatarGradient = colors[hash % colors.length];

            return (
              <li
                key={player.id}
                data-testid={`player-card-${player.id}`}
                className={`flex items-center justify-between gap-2 px-3 py-2 bg-slate-900/60 border rounded-xl transition-all duration-200 ${
                  isConnected
                    ? 'border-slate-800/80 hover:border-slate-700/80'
                    : 'border-red-500/20 bg-red-950/5'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div
                      className={`h-7 w-7 rounded-lg bg-gradient-to-tr ${avatarGradient} flex items-center justify-center font-bold text-[10px] text-white`}
                      aria-hidden="true"
                    >
                      {initials}
                    </div>
                    <div
                      data-testid={`player-conn-dot-${player.id}`}
                      className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-[1.5px] border-slate-900 ${
                        isConnected ? 'bg-green-500' : 'bg-amber-500'
                      }`}
                      title={isConnected ? 'Connected' : 'Disconnected'}
                      aria-label={isConnected ? 'Connected' : 'Disconnected'}
                    />
                  </div>

                  {/* Player Info */}
                  <div className="min-w-0 flex items-center gap-2">
                    <p className="text-xs font-semibold text-slate-100 truncate">
                      {player.displayName}
                    </p>
                    {!isConnected && (
                      <span className="text-[9px] font-semibold text-amber-400 bg-amber-400/10 px-1 py-0.5 rounded border border-amber-400/20 uppercase tracking-wider">
                        Offline
                      </span>
                    )}
                    <span className="text-[10px] text-slate-500 font-medium">
                      {player.score} pts
                    </span>
                  </div>
                </div>

                {/* Ready Status / Toggle */}
                <div className="shrink-0">
                  {currentUserIsGuest && player.id === currentUserId ? (
                    <button
                      type="button"
                      data-testid={`player-ready-toggle-${player.id}`}
                      onClick={() => {
                        if (dispatcher && roomId) {
                          dispatcher.playerReady({ roomId, playerId: player.id });
                        }
                      }}
                      aria-pressed={player.isReady}
                      aria-label={
                        player.isReady
                          ? 'You are ready, click to unready'
                          : 'Mark yourself as ready'
                      }
                      className={`text-[10px] px-2 py-1 rounded-lg border font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 cursor-pointer ${
                        player.isReady
                          ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20'
                          : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/20'
                      }`}
                    >
                      {player.isReady ? 'Ready ✓' : 'Ready up'}
                    </button>
                  ) : (
                    <div
                      data-testid={`player-ready-badge-${player.id}`}
                      className={`text-[10px] px-2 py-1 rounded-lg border font-semibold ${
                        player.isReady
                          ? 'bg-green-500/10 text-green-400 border-green-500/20'
                          : 'bg-slate-900/40 text-slate-500 border-slate-800'
                      }`}
                      aria-label={player.isReady ? 'Ready' : 'Waiting to be ready'}
                    >
                      {player.isReady ? 'Ready' : 'Waiting'}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
