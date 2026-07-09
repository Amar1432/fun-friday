'use client';

import * as React from 'react';
import Link from 'next/link';
import { config } from '@/lib/config';

export default function Home() {
  const searchParams =
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const wasKicked = searchParams?.get('kicked') === 'true';
  const [kickedAlert, setKickedAlert] = React.useState(wasKicked);
  const [copiedKey, setCopiedKey] = React.useState<'api' | 'auth' | null>(null);

  // Clear the kicked param from URL without causing a re-render loop
  React.useEffect(() => {
    if (wasKicked) {
      const url = new URL(window.location.href);
      url.searchParams.delete('kicked');
      window.history.replaceState({}, '', url.toString());
    }
  }, [wasKicked]);

  const handleCopy = (text: string, key: 'api' | 'auth') => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative overflow-hidden">
      {/* Kicked Alert Banner */}
      {kickedAlert && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] max-w-md w-full px-4 animate-fade-in">
          <div className="bg-rose-500/15 border border-rose-500/30 backdrop-blur-xl rounded-2xl p-4 flex items-start gap-3 shadow-2xl shadow-rose-500/10">
            <div className="shrink-0 mt-0.5">
              <svg
                className="w-5 h-5 text-rose-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-rose-300">
                You have been removed by the host.
              </p>
              <p className="text-xs text-rose-400/70 mt-1">
                You can join a different room or create your own.
              </p>
            </div>
            <button
              onClick={() => setKickedAlert(false)}
              className="shrink-0 text-rose-400/60 hover:text-rose-300 p-1 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 cursor-pointer"
              aria-label="Dismiss notification"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
      {/* Background ambient glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/10 blur-[120px]" />

      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-xl shadow-lg shadow-indigo-500/20 text-white">
              F
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              {config.appName}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Dev Environment Active
            </span>
            <Link
              href="/login"
              className="text-sm font-medium text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 px-4 py-2 rounded-lg transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              Host Login
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-6xl mx-auto px-6 py-12 w-full flex flex-col justify-center">
        <div className="grid md:grid-cols-12 gap-12 items-center">
          {/* Left Column: Welcome / Description */}
          <div className="md:col-span-7 space-y-6">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.1] text-white">
              The easiest way to host{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
                multiplayer games
              </span>{' '}
              with your team.
            </h1>
            <p className="text-lg text-slate-455 leading-relaxed max-w-xl">
              Establish connections, synchronize lobby states, and compete in real-time. Fun Friday
              Hub is designed to boost employee engagement in under a minute.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                href="/login"
                className="px-4 py-2 rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 bg-indigo-600 hover:bg-indigo-700 text-white focus-visible:ring-indigo-500 focus-visible:ring-offset-slate-950 shadow-md hover:shadow-lg inline-block"
              >
                Create a Room
              </Link>
              <Link
                href="/room/join"
                className="px-4 py-2 rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 bg-gray-100 hover:bg-gray-200 text-gray-800 focus-visible:ring-gray-400 focus-visible:ring-offset-slate-950 border border-gray-200 inline-block"
              >
                Join Room
              </Link>
            </div>
          </div>

          {/* Right Column: Environment Variables & Infrastructure Card */}
          <div className="md:col-span-5">
            <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl" />

              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  Runtime Configuration
                </h2>
                <span className="text-xs text-slate-500 font-mono">v1.0.0-dev</span>
              </div>

              <div className="space-y-4">
                {/* App Name Variable */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-slate-400">
                    <span>Application Name</span>
                    <span className="font-mono text-[10px] text-indigo-400">
                      NEXT_PUBLIC_APP_NAME
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 border border-slate-800/60 rounded-lg px-3 py-2.5 font-medium text-sm text-slate-200">
                    {config.appName}
                  </div>
                </div>

                {/* API URL Variable */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-slate-400">
                    <span>API Endpoint</span>
                    <span className="font-mono text-[10px] text-indigo-400">
                      NEXT_PUBLIC_API_URL
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-slate-950 border border-slate-800/60 rounded-lg px-3 py-2.5 font-mono text-xs text-slate-300 truncate">
                      {config.apiUrl}
                    </div>
                    <button
                      onClick={() => handleCopy(config.apiUrl, 'api')}
                      aria-label="Copy API Endpoint URL"
                      className="px-3 bg-slate-850 hover:bg-slate-800 border border-slate-800/60 hover:border-slate-700/80 rounded-lg text-xs font-medium text-slate-350 hover:text-white transition-all cursor-pointer flex items-center justify-center min-w-[70px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                    >
                      {copiedKey === 'api' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                {/* Auth Callback Variable */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-slate-400">
                    <span>Auth Callback URL</span>
                    <span className="font-mono text-[10px] text-indigo-400">
                      NEXT_PUBLIC_AUTH_CALLBACK_URL
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-slate-950 border border-slate-800/60 rounded-lg px-3 py-2.5 font-mono text-xs text-slate-300 truncate">
                      {config.authCallbackUrl}
                    </div>
                    <button
                      onClick={() => handleCopy(config.authCallbackUrl, 'auth')}
                      aria-label="Copy Auth Callback URL"
                      className="px-3 bg-slate-850 hover:bg-slate-800 border border-slate-800/60 hover:border-slate-700/80 rounded-lg text-xs font-medium text-slate-350 hover:text-white transition-all cursor-pointer flex items-center justify-center min-w-[70px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                    >
                      {copiedKey === 'auth' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-500">
                <span>Verification check</span>
                <span className="font-mono text-emerald-400 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Loaded
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 px-6 py-6 text-center text-sm text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>
            © {new Date().getFullYear()} {config.appName}. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a
              href="https://nextjs.org/docs"
              className="hover:text-slate-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 rounded-md"
              target="_blank"
              rel="noreferrer"
            >
              Next.js Docs
            </a>
            <a
              href="/api/v1"
              className="hover:text-slate-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 rounded-md"
            >
              REST API
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
