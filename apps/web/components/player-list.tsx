'use client';

import * as React from 'react';
import { useGameStore } from '@/lib/store/use-game-store';

export function PlayerList() {
  const players = useGameStore((state) => state.players);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
          <span>Players</span>
          <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-medium">
            {players.length} connected
          </span>
        </h2>
      </div>

      {players.length === 0 ? (
        <div className="text-center py-10 bg-slate-900/40 border border-slate-800/60 rounded-2xl border-dashed">
          <p className="text-sm text-slate-500 font-medium">Waiting for players to join...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" data-testid="player-list-grid">
          {players.map((player) => {
            const isConnected = player.isConnected !== false;
            const initials = player.displayName.charAt(0).toUpperCase();

            // Distinctive gradient based on playerId to make avatars unique
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
              <div
                key={player.id}
                data-testid={`player-card-${player.id}`}
                className={`bg-slate-900/60 border backdrop-blur-xl rounded-2xl p-4 flex items-center justify-between hover:border-slate-700/80 hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 ${
                  isConnected ? 'border-slate-800/80' : 'border-red-500/20 bg-red-950/5'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Avatar */}
                  <div className="relative">
                    <div
                      className={`h-11 w-11 rounded-xl bg-gradient-to-tr ${avatarGradient} flex items-center justify-center font-bold text-base text-white shadow-md`}
                    >
                      {initials}
                    </div>
                    {/* Connection Status Dot */}
                    <div
                      data-testid={`player-conn-dot-${player.id}`}
                      className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-slate-900 ${
                        isConnected
                          ? 'bg-green-500 shadow-green-500/20'
                          : 'bg-amber-500 shadow-amber-500/20'
                      }`}
                      title={isConnected ? 'Connected' : 'Disconnected'}
                    />
                  </div>

                  {/* Player Info */}
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-100 truncate">
                        {player.displayName}
                      </p>
                      {!isConnected && (
                        <span className="text-[10px] font-semibold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20 uppercase tracking-wider">
                          Offline
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                      <svg
                        className="w-3.5 h-3.5 text-amber-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                      </svg>
                      <span>{player.score} pts</span>
                    </div>
                  </div>
                </div>

                {/* Ready Status Badge */}
                <div>
                  <div
                    data-testid={`player-ready-badge-${player.id}`}
                    className={`text-xs px-2.5 py-1 rounded-lg border font-semibold transition-all duration-300 ${
                      player.isReady
                        ? 'bg-green-500/10 text-green-400 border-green-500/20 shadow-sm shadow-green-500/5'
                        : 'bg-slate-900/40 text-slate-500 border-slate-800'
                    }`}
                  >
                    {player.isReady ? 'Ready' : 'Waiting'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
