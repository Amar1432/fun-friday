'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { loginAsGuest, ApiError } from '@/lib/api';
import { config } from '@/lib/config';

function JoinRoomLoading() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center font-sans">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-2xl shadow-lg shadow-indigo-500/20 text-white animate-bounce">
          F
        </div>
        <div className="flex items-center gap-2">
          <svg
            className="animate-spin h-4 w-4 text-indigo-500"
            fill="none"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
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
          <span className="text-sm font-medium text-slate-400">Loading form...</span>
        </div>
      </div>
    </div>
  );
}

function JoinRoomForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [roomCode, setRoomCode] = React.useState('');
  const [displayName, setDisplayName] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [apiError, setApiError] = React.useState<string | null>(null);
  const [isCodeFromInvite, setIsCodeFromInvite] = React.useState(false);

  // Validation errors
  const [errors, setErrors] = React.useState<{
    roomCode?: string;
    displayName?: string;
  }>({});

  // Pre-populate room code from query parameter if present
  React.useEffect(() => {
    const codeParam = searchParams.get('code') || searchParams.get('roomCode');
    if (codeParam) {
      setRoomCode(codeParam.toUpperCase());
      setIsCodeFromInvite(true);
    }
  }, [searchParams]);

  const validateForm = (): boolean => {
    const newErrors: { roomCode?: string; displayName?: string } = {};

    // Room code validation
    const trimmedCode = roomCode.trim();
    if (!trimmedCode) {
      newErrors.roomCode = 'Room code is required';
    } else if (trimmedCode.length !== 6) {
      newErrors.roomCode = 'Room code must be exactly 6 characters';
    } else if (!/^[a-zA-Z0-9]+$/.test(trimmedCode)) {
      newErrors.roomCode = 'Room code must contain only alphanumeric characters';
    }

    // Display name validation
    const trimmedName = displayName.trim();
    if (!trimmedName) {
      newErrors.displayName = 'Display name is required';
    } else if (trimmedName.length < 2 || trimmedName.length > 20) {
      newErrors.displayName = 'Display name must be between 2 and 20 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await loginAsGuest(roomCode.trim().toUpperCase(), displayName.trim());

      // Update local auth context with guest credentials
      login(response.accessToken, {
        id: response.player.id,
        name: response.player.displayName,
        email: '', // Guests don't have emails
      });

      // Navigate to the lobby
      router.push(`/lobby/${response.room.code}?roomId=${response.room.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setApiError(err.message);
      } else {
        setApiError('Failed to join room. Please check the room code and try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative overflow-hidden">
      {/* Background ambient glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/5 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/50 backdrop-blur-md px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-3 group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 rounded-xl"
          >
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-xl shadow-lg shadow-indigo-500/20 text-white group-hover:scale-105 transition-transform">
              F
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              {config.appName}
            </span>
          </button>

          <button
            onClick={() => router.push('/')}
            className="text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800 hover:border-slate-700 px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Home
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-md">
          <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl rounded-3xl p-8 space-y-6 shadow-2xl">
            <div className="text-center space-y-2">
              <div className="inline-flex h-16 w-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 items-center justify-center mx-auto shadow-lg shadow-indigo-500/20">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Join a Game Room</h1>
              <p className="text-sm text-slate-400">
                Enter the 6-character room code and pick your display name to join.
              </p>
            </div>

            {apiError && (
              <div
                className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3"
                role="alert"
                id="api-error-message"
              >
                <svg
                  className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm text-red-300">{apiError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Room Code Field */}
              <div className="space-y-1.5">
                <label htmlFor="room-code-input" className="text-xs font-semibold text-slate-300">
                  Room Code
                </label>
                <input
                  type="text"
                  id="room-code-input"
                  name="roomCode"
                  value={roomCode}
                  onChange={(e) => {
                    setRoomCode(e.target.value.toUpperCase());
                    if (errors.roomCode) {
                      setErrors((prev) => ({ ...prev, roomCode: undefined }));
                    }
                  }}
                  placeholder={isCodeFromInvite ? 'Auto-filled from invite' : 'E.g., ABCDEF'}
                  maxLength={6}
                  required
                  disabled={isSubmitting || isCodeFromInvite}
                  readOnly={isCodeFromInvite}
                  aria-invalid={!!errors.roomCode}
                  aria-describedby={errors.roomCode ? 'room-code-error' : undefined}
                  className={`w-full bg-slate-950/80 border ${
                    errors.roomCode
                      ? 'border-red-500/50 focus:border-red-500'
                      : 'border-slate-800 focus:border-indigo-500'
                  } rounded-xl px-4 py-3 text-base text-white placeholder-slate-600 focus:outline-none focus:ring-2 ${
                    errors.roomCode ? 'focus:ring-red-500/50' : 'focus:ring-indigo-500/50'
                  } transition-all font-mono tracking-widest text-center uppercase disabled:opacity-50 disabled:cursor-not-allowed`}
                />
                {isCodeFromInvite && !errors.roomCode && (
                  <p className="text-xs text-indigo-400 flex items-center gap-1 mt-1">
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                      />
                    </svg>
                    Room code auto-filled from invite link
                  </p>
                )}
                {errors.roomCode && (
                  <p
                    id="room-code-error"
                    className="text-xs text-red-400 flex items-center gap-1 mt-1"
                  >
                    <span>⚠️</span> {errors.roomCode}
                  </p>
                )}
              </div>

              {/* Display Name Field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="display-name-input"
                  className="text-xs font-semibold text-slate-350"
                >
                  Your Name
                </label>
                <input
                  type="text"
                  id="display-name-input"
                  name="displayName"
                  value={displayName}
                  onChange={(e) => {
                    setDisplayName(e.target.value);
                    if (errors.displayName) {
                      setErrors((prev) => ({ ...prev, displayName: undefined }));
                    }
                  }}
                  placeholder="Choose a cool nickname"
                  minLength={2}
                  maxLength={20}
                  required
                  disabled={isSubmitting}
                  aria-invalid={!!errors.displayName}
                  aria-describedby={errors.displayName ? 'display-name-error' : undefined}
                  className={`w-full bg-slate-950/80 border ${
                    errors.displayName
                      ? 'border-red-500/50 focus:border-red-500'
                      : 'border-slate-800 focus:border-indigo-500'
                  } rounded-xl px-4 py-3 text-base text-white placeholder-slate-600 focus:outline-none focus:ring-2 ${
                    errors.displayName ? 'focus:ring-red-500/50' : 'focus:ring-indigo-500/50'
                  } transition-all disabled:opacity-50`}
                />
                {errors.displayName && (
                  <p
                    id="display-name-error"
                    className="text-xs text-red-400 flex items-center gap-1 mt-1"
                  >
                    <span>⚠️</span> {errors.displayName}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                id="join-room-button"
                disabled={isSubmitting}
                className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:from-slate-700 disabled:to-slate-800 text-white rounded-xl font-semibold text-base shadow-xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] disabled:scale-100 disabled:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed mt-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
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
                    Joining Room...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                      />
                    </svg>
                    Join Room
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function JoinRoomPage() {
  return (
    <React.Suspense fallback={<JoinRoomLoading />}>
      <JoinRoomForm />
    </React.Suspense>
  );
}
