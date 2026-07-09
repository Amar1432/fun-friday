'use client';

import * as React from 'react';
import { useGameStore } from '@/lib/store/use-game-store';

export function RoomInformationPanel() {
  const room = useGameStore((state) => state.room);
  const game = useGameStore((state) => state.game);
  const user = useGameStore((state) => state.user);

  const statusConfig = React.useMemo(() => {
    switch (room.status) {
      case 'LOBBY':
        return {
          bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
          text: 'Lobby',
          icon: (
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          ),
        };
      case 'IN_PROGRESS':
        return {
          bg: 'bg-green-500/10 text-green-400 border-green-500/20',
          text: 'In Progress',
          icon: (
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
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
          ),
        };
      case 'FINISHED':
        return {
          bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
          text: 'Finished',
          icon: (
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
              />
            </svg>
          ),
        };
      default:
        return {
          bg: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
          text: 'Unknown',
          icon: (
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ),
        };
    }
  }, [room.status]);

  const gameInfo = React.useMemo(() => {
    if (!game.gameId || room.status !== 'IN_PROGRESS') {
      return null;
    }
    return {
      round: `${game.currentRoundIndex + 1}/${game.totalRounds}`,
      timer: game.timerRemaining !== null ? `${game.timerRemaining}s` : null,
    };
  }, [game, room.status]);

  if (!room.code) {
    return null;
  }

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl rounded-xl p-3 space-y-3">
      {/* Room Code and Status */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Room</p>
          <p className="text-lg font-bold tracking-widest text-indigo-400 truncate">{room.code}</p>
        </div>
        <div
          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-semibold shrink-0 ${statusConfig.bg}`}
        >
          {statusConfig.icon}
          <span>{statusConfig.text}</span>
        </div>
      </div>

      {/* Host Information — compact chip */}
      {user && (
        <div className="flex items-center gap-2 p-2 bg-slate-950/50 rounded-lg border border-slate-800">
          <div className="h-7 w-7 rounded-full bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center font-bold text-[10px] text-indigo-300 shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">{user.name}</p>
            <p className="text-[10px] text-slate-500">Host</p>
          </div>
        </div>
      )}

      {/* Current Game State — compact */}
      {gameInfo && (
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-950/50 rounded-lg border border-slate-800 p-2 text-center">
            <p className="text-[10px] text-slate-500">Round</p>
            <p className="text-sm font-bold text-white">{gameInfo.round}</p>
          </div>
          {gameInfo.timer && (
            <div className="bg-slate-950/50 rounded-lg border border-slate-800 p-2 text-center">
              <p className="text-[10px] text-slate-500">Time</p>
              <p className="text-sm font-bold text-white">{gameInfo.timer}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
