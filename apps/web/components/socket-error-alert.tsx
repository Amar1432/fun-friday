'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSocket } from '@/lib/socket/socket-context';
import { useAuth } from '@/lib/auth/auth-context';

export function SocketErrorAlert() {
  const { status, error, clearError, connect } = useSocket();
  const { token } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isInLobby = pathname?.includes('/lobby');

  // If we don't have a token, socket is disconnected by design, do not show any error
  if (!token) {
    return null;
  }

  // If status is connected and there is no socket error, render nothing
  if (status === 'connected' && !error) {
    return null;
  }

  // Determine active error presentation
  let title = 'Connection Issue';
  let message = 'An unexpected network error occurred.';
  let showRetry = false;
  const showDashboard = true;
  let isWarning = false;

  if (status === 'auth_failed' || (error && error.code === 'AUTH_FAILED')) {
    title = 'Authentication Failure';
    message =
      error?.message || 'Your real-time session could not be authenticated. Please log in again.';
    showRetry = true;
  } else if (status === 'reconnecting') {
    // Reconnection recovery is owned by the dedicated ReconnectionOverlay component.
    return null;
  } else if (error) {
    if (error.code === 'ROOM_NOT_FOUND') {
      title = 'Room Not Found';
      message = error.message || 'This room does not exist or has been closed by the host.';
    } else if (error.code === 'SERVER_UNAVAILABLE') {
      title = 'Server Unavailable';
      message =
        error.message ||
        'The game server is currently offline or unreachable. Please try again later.';
      showRetry = true;
    } else if (error.code === 'UNAUTHORIZED' || error.code === 'INVALID_ACTION') {
      title = 'Action Denied';
      message = error.message || 'You are not authorized to perform this action.';
      isWarning = true;
    } else {
      title = 'Socket Error';
      message = error.message || 'A real-time protocol error occurred.';
      isWarning = true;
    }
  } else if (status === 'disconnected') {
    title = 'Disconnected';
    message = 'You are disconnected from the real-time server.';
    showRetry = true;
  }

  // If we are not in the lobby, we only show warnings. Blocking connection screens
  // should only be shown inside the active lobby where real-time sync is critical.
  if (!isInLobby) {
    if (!isWarning) {
      return null;
    }
  }

  const handleRetry = () => {
    if (token) {
      connect(token);
    } else {
      router.push('/login');
    }
  };

  const handleDismiss = () => {
    clearError();
  };

  if (isWarning) {
    // Non-blocking toast/alert notification at the bottom or top
    return (
      <div
        data-testid="socket-error-toast"
        role="alert"
        className="fixed bottom-6 left-6 right-6 sm:left-auto sm:right-6 sm:bottom-6 z-[100] sm:max-w-md bg-slate-900/90 border border-slate-800 backdrop-blur-xl shadow-2xl rounded-2xl p-4 flex gap-3 animate-fade-in"
      >
        <div
          className="h-10 w-10 shrink-0 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-450 font-bold"
          aria-hidden="true"
        >
          ⚠️
        </div>
        <div className="flex-1 space-y-1">
          <h4 className="text-sm font-bold text-white" data-testid="toast-title">
            {title}
          </h4>
          <p className="text-xs text-slate-405 leading-relaxed" data-testid="toast-message">
            {message}
          </p>
          <div className="pt-2 flex gap-3">
            <button
              onClick={handleDismiss}
              className="text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800 px-3 py-1.5 rounded-lg cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Full-page blocking overlay for critical connection/authorization issues in the lobby
  return (
    <div
      data-testid="socket-error-overlay"
      className="fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="overlay-title"
        aria-describedby="overlay-message"
        className="bg-slate-900/80 border border-slate-800/80 max-w-md w-full rounded-3xl p-6 sm:p-8 space-y-6 text-center shadow-2xl relative overflow-hidden"
      >
        {/* Background ambient glow inside card */}
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-rose-500/5 blur-[80px] pointer-events-none" />

        <div
          className="mx-auto h-16 w-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-550 text-3xl font-bold shadow-lg shadow-rose-500/5"
          aria-hidden="true"
        >
          🚫
        </div>

        <div className="space-y-2">
          <h2
            id="overlay-title"
            className="text-2xl font-black tracking-tight text-white"
            data-testid="overlay-title"
          >
            {title}
          </h2>
          <p
            id="overlay-message"
            className="text-sm text-slate-400 leading-relaxed"
            data-testid="overlay-message"
          >
            {message}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          {showDashboard && (
            <button
              onClick={() => {
                clearError();
                router.push('/dashboard');
              }}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-4 py-3 rounded-xl border border-slate-750 transition-all cursor-pointer text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
              data-testid="btn-go-dashboard"
            >
              Go to Dashboard
            </button>
          )}
          {showRetry && status !== 'reconnecting' && (
            <button
              onClick={handleRetry}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-3 rounded-xl transition-all cursor-pointer text-sm shadow-lg shadow-indigo-600/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
              data-testid="btn-retry"
            >
              {status === 'auth_failed' ? 'Log In' : 'Retry'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
