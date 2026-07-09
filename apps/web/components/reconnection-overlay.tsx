'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSocket } from '@/lib/socket/socket-context';
import { useAuth } from '@/lib/auth/auth-context';

/**
 * Full-page overlay shown while the real-time connection is recovering after a
 * temporary network interruption. It covers both the "reconnecting" phase
 * (transport lost, Socket.IO retrying) and the "restoring" phase (reconnected,
 * waiting for the server to re-synchronize authoritative room state).
 *
 * During recovery the overlay blocks interaction so players do not submit
 * answers or take actions against stale local state. The overlay is only shown
 * inside the active lobby where real-time sync is critical.
 */
export function ReconnectionOverlay() {
  const { status, connect } = useSocket();
  const { token } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isInLobby = typeof pathname === 'string' && pathname.includes('/lobby');

  if (!token || !isInLobby) {
    return null;
  }

  if (status !== 'reconnecting' && status !== 'restoring') {
    return null;
  }

  const isRestoring = status === 'restoring';

  const handleRetry = () => {
    if (token) {
      connect(token);
    } else {
      router.push('/login');
    }
  };

  return (
    <div
      data-testid="reconnection-overlay"
      className="fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="reconnection-title"
        aria-describedby="reconnection-message"
        className="bg-slate-900/80 border border-slate-800/80 max-w-md w-full rounded-3xl p-6 sm:p-8 space-y-6 text-center shadow-2xl relative overflow-hidden"
      >
        {/* Background ambient glow inside card */}
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-500/5 blur-[80px] pointer-events-none" />

        <div
          className="mx-auto h-16 w-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-3xl font-bold shadow-lg shadow-indigo-500/5"
          aria-hidden="true"
        >
          🔄
        </div>

        <div className="space-y-2">
          <h2
            id="reconnection-title"
            className="text-2xl font-black tracking-tight text-white"
            data-testid="reconnection-title"
          >
            {isRestoring ? 'Restoring Session' : 'Connection Lost'}
          </h2>
          <p
            id="reconnection-message"
            className="text-sm text-slate-400 leading-relaxed"
            data-testid="reconnection-message"
          >
            {isRestoring
              ? 'Reconnected! Synchronizing your game state with the server...'
              : 'We lost connection to the server. Reconnecting automatically...'}
          </p>
        </div>

        <div
          className="flex items-center justify-center gap-2 text-xs font-medium text-amber-400 animate-pulse"
          data-testid="reconnection-indicator"
        >
          <svg
            className="animate-spin h-4 w-4 text-amber-400"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
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
          {isRestoring ? 'Syncing state...' : 'Attempting reconnect...'}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-4 py-3 rounded-xl border border-slate-750 transition-all cursor-pointer text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
            data-testid="btn-go-dashboard"
          >
            Go to Dashboard
          </button>
          {!isRestoring && (
            <button
              onClick={handleRetry}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-3 rounded-xl transition-all cursor-pointer text-sm shadow-lg shadow-indigo-600/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
              data-testid="btn-retry"
            >
              Retry Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
