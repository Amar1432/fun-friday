'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { config } from '@/lib/config';
import { RoomInformationPanel } from '@/components/room-information-panel';
import { PlayerList } from '@/components/player-list';
import { useGameStore } from '@/lib/store/use-game-store';

export default function LobbyPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { roomCode } = useParams();
  const setRoom = useGameStore((state) => state.setRoom);
  const isMounted = React.useRef(true);

  // Set room code from URL params
  React.useEffect(() => {
    isMounted.current = true;
    if (roomCode) {
      setRoom({ code: roomCode as string });
    }
    // Cleanup room state when component unmounts
    return () => {
      isMounted.current = false;
      setRoom({ code: null, id: null, status: null, hostId: null });
    };
  }, [roomCode, setRoom]);

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

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
              Leave Room
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-2xl">
          <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl rounded-3xl p-8 space-y-8">
            <div className="text-center space-y-4">
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
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-white">Lobby</h1>
              </div>
            </div>

            <RoomInformationPanel />
            <PlayerList />

            <div className="text-center space-y-4">
              <p className="text-sm text-slate-400">
                Share the room code with players so they can join your session
              </p>
              <button
                className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-semibold text-sm shadow-xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer opacity-50 cursor-not-allowed"
                disabled
              >
                Start Game (Waiting for players...)
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
