'use client';

import * as React from 'react';
import { useSocket } from '@/lib/socket/socket-context';

export function SocketStatusIndicator() {
  const { status } = useSocket();

  const config = React.useMemo(() => {
    switch (status) {
      case 'connected':
        return {
          bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          dot: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]',
          text: 'Connected',
          desc: 'Connected to real-time game server',
        };
      case 'connecting':
        return {
          bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse',
          dot: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]',
          text: 'Connecting',
          desc: 'Establishing real-time connection...',
        };
      case 'reconnecting':
        return {
          bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse',
          dot: 'bg-amber-400 animate-ping shadow-[0_0_8px_rgba(251,191,36,0.5)]',
          text: 'Reconnecting',
          desc: 'Connection lost. Retrying automatically...',
        };
      case 'restoring':
        return {
          bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 animate-pulse',
          dot: 'bg-indigo-400 animate-ping shadow-[0_0_8px_rgba(99,102,241,0.5)]',
          text: 'Restoring',
          desc: 'Reconnected. Restoring game state...',
        };
      case 'auth_failed':
        return {
          bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
          dot: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]',
          text: 'Auth Failed',
          desc: 'Real-time session authorization failed',
        };
      case 'disconnected':
      default:
        return {
          bg: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
          dot: 'bg-slate-400',
          text: 'Disconnected',
          desc: 'Disconnected from real-time server',
        };
    }
  }, [status]);

  return (
    <div
      className={`inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 rounded-full border text-xs font-semibold select-none transition-all duration-300 backdrop-blur-sm cursor-help ${config.bg}`}
      title={config.desc}
      data-testid="socket-status-indicator"
    >
      <span className={`h-2 w-2 rounded-full transition-all duration-300 ${config.dot}`} />
      <span className="tracking-wide hidden sm:inline">{config.text}</span>
    </div>
  );
}
