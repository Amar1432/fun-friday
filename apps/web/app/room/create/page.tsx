'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button } from '@heroui/react';
import { useAuth } from '@/lib/auth/auth-context';
import { createRoom, ApiError } from '@/lib/api';
import { config } from '@/lib/config';
import { getGameModeVisualTokens } from '@/lib/design-system';
import { DEFAULT_GAME_ID, getAllGameModes, getGameModeByGameId } from '@/lib/game-modes';

const supportedGameModes = getAllGameModes();

function buildLobbyUrl(roomCode: string | null, roomId: string | null, gameId: string): string {
  const params = new URLSearchParams();
  if (roomId) params.set('roomId', roomId);
  params.set('gameId', gameId);
  return `/lobby/${roomCode}?${params.toString()}`;
}

export default function CreateRoomPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [isCreating, setIsCreating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [roomCode, setRoomCode] = React.useState<string | null>(null);
  const [roomId, setRoomId] = React.useState<string | null>(null);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [selectedGameId, setSelectedGameId] = React.useState(DEFAULT_GAME_ID);

  const selectedGameMode = getGameModeByGameId(selectedGameId) ?? supportedGameModes[0];

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const handleCreateRoom = async () => {
    if (!token) {
      setError('Authentication required. Please log in again.');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const response = await createRoom(token);
      setRoomCode(response.room.code);
      setRoomId(response.room.id);
      setIsSuccess(true);

      // Auto-navigate to lobby after 3 seconds
      setTimeout(() => {
        router.push(buildLobbyUrl(response.room.code, response.room.id, selectedGameId));
      }, 3000);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to create room. Please try again.');
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyRoomCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
    }
  };

  // Show loading state while checking auth
  if (authLoading) {
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
            <span className="text-sm font-medium text-slate-400">Loading session...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative overflow-hidden">
      {/* Background ambient glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/5 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/50 backdrop-blur-md px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-3 group cursor-pointer"
          >
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-xl shadow-lg shadow-indigo-500/20 text-white group-hover:scale-105 transition-transform">
              F
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              {config.appName}
            </span>
          </button>

          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800 hover:border-slate-700 px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer"
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
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 lg:py-12 relative z-10">
        <div className="w-full max-w-5xl">
          {!isSuccess ? (
            <Card className="bg-surface/80 border border-border backdrop-blur-xl p-5 sm:p-6 lg:p-7 space-y-6 shadow-panel">
              <Card.Header className="px-0 pt-0 pb-0 block">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                      Host setup
                    </p>
                    <Card.Title className="text-2xl sm:text-3xl font-bold text-app-foreground block">
                      Choose a game
                    </Card.Title>
                    <Card.Description className="text-sm text-muted block max-w-2xl">
                      Pick the mode your team will play, then create a lobby with a shareable room
                      code.
                    </Card.Description>
                  </div>
                  <div className="rounded-panel border border-border bg-surface-muted px-4 py-3 text-sm">
                    <p className="text-xs uppercase tracking-wider text-muted">Selected</p>
                    <p className="mt-1 font-semibold text-app-foreground">
                      {selectedGameMode.displayName}
                    </p>
                  </div>
                </div>
              </Card.Header>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
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
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              <div
                className="grid grid-cols-1 gap-3 md:grid-cols-3"
                role="radiogroup"
                aria-label="Game mode"
              >
                {supportedGameModes.map((mode) => {
                  const visualTokens = getGameModeVisualTokens(mode.identifier);
                  const isSelected = mode.gameId === selectedGameId;

                  return (
                    <button
                      key={mode.identifier}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => setSelectedGameId(mode.gameId)}
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
                          <span className="block text-base font-bold text-app-foreground">
                            {mode.displayName}
                          </span>
                          <span className="mt-1 block text-sm leading-5 text-muted">
                            {mode.description}
                          </span>
                        </span>
                        <span
                          className={[
                            'mt-0.5 h-3 w-3 shrink-0 rounded-full border',
                            isSelected
                              ? `${visualTokens.softSurfaceClassName} ${visualTokens.borderClassName}`
                              : 'border-border-strong bg-surface',
                          ].join(' ')}
                        />
                      </span>
                      <span className="mt-auto pt-4 text-xs font-semibold uppercase tracking-wider text-muted">
                        {mode.questionCount
                          ? `${mode.questionCount} questions`
                          : 'Question count pending'}
                      </span>
                    </button>
                  );
                })}
              </div>

              <Button
                fullWidth
                onPress={handleCreateRoom}
                isDisabled={isCreating}
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-surface-muted disabled:text-muted font-semibold text-base shadow-panel"
              >
                {isCreating ? (
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
                    Creating Room...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Create Room
                  </>
                )}
              </Button>

              <div className="text-center">
                <p className="text-xs text-muted">
                  Players will join the lobby first. The selected game starts when the host is
                  ready.
                </p>
              </div>
            </Card>
          ) : (
            <Card className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl p-8 space-y-6 shadow-2xl">
              <Card.Header className="text-center space-y-4 px-0 pt-0 pb-0 block">
                <div className="inline-flex h-16 w-16 rounded-2xl bg-green-500/20 border border-green-500/30 items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div className="space-y-2">
                  <Card.Title className="text-2xl font-bold text-white block">
                    Room Created!
                  </Card.Title>
                  <Card.Description className="text-sm text-slate-400 block">
                    Share this code with players to let them join your session
                  </Card.Description>
                </div>
              </Card.Header>

              <Card.Content className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4 block">
                <div className="text-center">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Room Code</p>
                  <div className="text-4xl font-bold tracking-widest text-white bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                    {roomCode}
                  </div>
                </div>

                <Button
                  fullWidth
                  onPress={handleCopyRoomCode}
                  variant="secondary"
                  className="bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white font-medium text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  Copy Code
                </Button>
              </Card.Content>

              <Card.Footer className="text-center space-y-2 px-0 pb-0 block">
                <p className="text-sm text-slate-400">
                  Redirecting to lobby in{' '}
                  <span className="text-indigo-400 font-semibold">3 seconds</span>...
                </p>
                <button
                  onClick={() => router.push(buildLobbyUrl(roomCode, roomId, selectedGameId))}
                  className="text-sm text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
                >
                  Go to lobby now
                </button>
              </Card.Footer>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
