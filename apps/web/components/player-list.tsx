'use client';

import * as React from 'react';
import { useGameStore } from '@/lib/store/use-game-store';
import { SocketDispatcher } from '@/lib/socket/socket-dispatcher';

interface PlayerListProps {
  dispatcher?: SocketDispatcher | null;
  currentUserId?: string | null;
  currentUserIsGuest?: boolean;
  roomId?: string | null;
  isHost?: boolean;
}

export function PlayerList({
  dispatcher,
  currentUserId,
  currentUserIsGuest = false,
  roomId,
  isHost = false,
}: PlayerListProps) {
  const players = useGameStore((state) => state.players);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
          <svg
            className="w-3.5 h-3.5 text-indigo-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span>Players</span>
          <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded-full font-semibold border border-indigo-500/20">
            {players.length}
          </span>
        </h2>
      </div>

      {players.length === 0 ? (
        <div className="text-center py-8 bg-slate-900/40 border border-dashed border-slate-800/60 rounded-xl">
          <div className="flex flex-col items-center gap-2">
            <svg
              className="w-6 h-6 text-slate-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
            <p className="text-xs text-slate-500 font-medium">Waiting for players to join...</p>
          </div>
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

            const isOwnCard = player.id === currentUserId;
            const showActions = isHost && !isOwnCard;

            return (
              <li
                key={player.id}
                data-testid={`player-card-${player.id}`}
                className={`flex items-center gap-2.5 px-3 py-2.5 bg-slate-900/60 border rounded-xl transition-all duration-200 ${
                  isConnected
                    ? 'border-slate-800/80 hover:border-slate-700/80'
                    : 'border-red-500/20 bg-red-950/5 opacity-50 grayscale'
                }`}
              >
                {/* ===== Left: Avatar + Player Info ===== */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {/* Avatar with connection dot */}
                  <div className="relative shrink-0">
                    <div
                      className={`h-8 w-8 rounded-xl bg-gradient-to-tr ${avatarGradient} flex items-center justify-center font-bold text-xs text-white shadow-sm shadow-${avatarGradient.split(' ')[0]}/20`}
                      aria-hidden="true"
                    >
                      {initials}
                    </div>
                    <div
                      data-testid={`player-conn-dot-${player.id}`}
                      className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-[1.5px] border-slate-900 transition-all duration-200 ${
                        isConnected ? 'bg-green-500 shadow-sm shadow-green-500/40' : 'bg-amber-500'
                      }`}
                      title={isConnected ? 'Connected' : 'Disconnected'}
                      aria-label={isConnected ? 'Connected' : 'Disconnected'}
                    />
                  </div>

                  {/* Name + Score + Offline badge */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-slate-100 truncate leading-tight">
                        {player.displayName}
                      </p>
                      {!isConnected && (
                        <span className="text-[9px] font-semibold text-amber-400 bg-amber-400/10 px-1 py-0.5 rounded border border-amber-400/20 uppercase tracking-wider leading-none">
                          Offline
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">
                      {player.score} pts
                    </p>
                  </div>
                </div>

                {/* ===== Right: Unified Actions Group ===== */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* Case A: Guest player's own card → interactive ready toggle */}
                  {currentUserIsGuest && isOwnCard && (
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
                      className={`flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-lg border font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 cursor-pointer ${
                        player.isReady
                          ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20 hover:border-green-500/30'
                          : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/20 hover:border-indigo-500/50'
                      }`}
                    >
                      {player.isReady ? (
                        <>
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2.5}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          <span>Ready</span>
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            />
                          </svg>
                          <span>Ready up</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Case B: Host viewing another player's card → ready badge + separator + kick */}
                  {showActions && (
                    <>
                      <div
                        data-testid={`player-ready-badge-${player.id}`}
                        className={`flex items-center gap-1 text-[10px] px-2 py-1.5 rounded-lg border font-semibold ${
                          player.isReady
                            ? 'bg-green-500/10 text-green-400 border-green-500/20'
                            : 'bg-slate-900/40 text-slate-500 border-slate-800'
                        }`}
                        aria-label={player.isReady ? 'Ready' : 'Waiting to be ready'}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${player.isReady ? 'bg-green-400' : 'bg-slate-500'}`}
                        />
                        <span>{player.isReady ? 'Ready' : 'Waiting'}</span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <div className="w-px h-5 bg-slate-800/60" aria-hidden="true" />

                        <button
                          type="button"
                          data-testid={`player-kick-btn-${player.id}`}
                          onClick={() => {
                            if (dispatcher && roomId) {
                              dispatcher.kickPlayer({ roomId, playerId: player.id });
                            }
                          }}
                          aria-label={`Kick ${player.displayName}`}
                          title={`Remove ${player.displayName} from the room`}
                          className="flex items-center justify-center h-7 w-7 rounded-lg text-slate-600 hover:bg-rose-500/15 hover:text-rose-400 active:bg-rose-500/25 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </>
                  )}

                  {/* Case C: Everything else (host own card, guest viewing others, non-host viewing anyone) → ready badge */}
                  {(!currentUserIsGuest || !isOwnCard) && !showActions && (
                    <div
                      data-testid={`player-ready-badge-${player.id}`}
                      className={`flex items-center gap-1 text-[10px] px-2 py-1.5 rounded-lg border font-semibold ${
                        player.isReady
                          ? 'bg-green-500/10 text-green-400 border-green-500/20'
                          : 'bg-slate-900/40 text-slate-500 border-slate-800'
                      }`}
                      aria-label={player.isReady ? 'Ready' : 'Waiting to be ready'}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${player.isReady ? 'bg-green-400' : 'bg-slate-500'}`}
                      />
                      <span>{player.isReady ? 'Ready' : 'Waiting'}</span>
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
