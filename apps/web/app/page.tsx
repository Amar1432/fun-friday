'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@heroui/react';
import { config } from '@/lib/config';

const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    ),
    title: 'Zero Sign-Up for Players',
    description:
      'Guests join with just a room code and display name. No accounts, no friction, no barriers.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    ),
    title: 'Real-Time Gameplay',
    description:
      'Synchronized multiplayer action with live leaderboards, timers, and instant feedback. Built on Socket.IO and Redis.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    title: 'Team Building, Gamified',
    description:
      'From Emoji Guess to Gibberish, our game library turns virtual meetings into memorable team experiences.',
  },
];

export default function Home() {
  const searchParams =
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const wasKicked = searchParams?.get('kicked') === 'true';
  const [kickedAlert, setKickedAlert] = React.useState(wasKicked);

  React.useEffect(() => {
    if (wasKicked) {
      const url = new URL(window.location.href);
      url.searchParams.delete('kicked');
      window.history.replaceState({}, '', url.toString());
    }
  }, [wasKicked]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative overflow-hidden">
      {/* Animated Geometric Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Large floating circle */}
        <div className="absolute top-[8%] left-[5%] w-72 h-72 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/10 blur-3xl animate-float" />
        {/* Medium floating circle */}
        <div className="absolute top-[15%] right-[8%] w-56 h-56 rounded-full bg-gradient-to-br from-purple-500/15 to-pink-500/10 blur-3xl animate-float-delayed" />
        {/* Small floating circle */}
        <div className="absolute bottom-[20%] left-[12%] w-48 h-48 rounded-full bg-gradient-to-br from-indigo-400/10 to-cyan-400/10 blur-3xl animate-float-slow" />
        {/* Diamond shape */}
        <div className="absolute top-[45%] right-[20%] w-32 h-32 rotate-45 border border-indigo-500/10 rounded-2xl bg-indigo-500/5 blur-sm animate-float-delayed" />
        {/* Ring shape */}
        <div className="absolute bottom-[30%] right-[10%] w-40 h-40 rounded-full border border-purple-500/10 animate-float-slow" />
        {/* Small accent dots */}
        <div className="absolute top-[25%] left-[45%] w-3 h-3 rounded-full bg-indigo-400/30 animate-float" />
        <div className="absolute top-[60%] left-[30%] w-2 h-2 rounded-full bg-purple-400/30 animate-float-delayed" />
        <div className="absolute top-[10%] right-[35%] w-2.5 h-2.5 rounded-full bg-pink-400/25 animate-float-slow" />
      </div>

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

      {/* Header */}
      <header className="border-b border-slate-800/50 bg-slate-950/60 backdrop-blur-xl sticky top-0 z-50 px-4 sm:px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 rounded-xl"
          >
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-lg shadow-lg shadow-indigo-500/20 text-white group-hover:scale-105 transition-transform">
              F
            </div>
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              {config.appName}
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/room/join"
              className="text-sm font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              Join Game
            </Link>
            <Link
              href="/login"
              className="text-sm font-semibold px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-md hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              Host Game
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col">
        <section className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12 sm:py-16 lg:py-24 relative z-10">
          <div className="max-w-4xl mx-auto w-full text-center space-y-8 animate-fade-in">
            {/* Glassmorphism hero card */}
            <div className="bg-slate-900/40 border border-slate-800/50 backdrop-blur-2xl rounded-3xl p-8 sm:p-12 lg:p-16 shadow-2xl shadow-indigo-500/5 relative overflow-hidden">
              {/* Inner glow */}
              <div className="absolute -top-20 -right-20 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-purple-500/8 rounded-full blur-3xl pointer-events-none" />

              <div className="relative space-y-8">
                {/* Headline */}
                <div className="space-y-4">
                  <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]">
                    <span className="text-white">The easiest way to host</span>
                    <br />
                    <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
                      multiplayer games
                    </span>
                    <br />
                    <span className="text-white">with your team.</span>
                  </h1>
                  <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
                    Create a room, share the code, and start playing in under a minute.
                    <br className="hidden sm:block" />
                    No sign-ups required for players. Just pure, real-time fun.
                  </p>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link href="/login" className="w-full sm:w-auto">
                    <Button
                      size="lg"
                      className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-base px-8 py-6 shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-300"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      Host a Game
                    </Button>
                  </Link>
                  <Link href="/room/join" className="w-full sm:w-auto">
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full sm:w-auto text-slate-200 border-slate-700 hover:border-slate-500 hover:bg-slate-800/50 font-semibold text-base px-8 py-6 transition-all duration-300"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                        />
                      </svg>
                      Join a Game
                    </Button>
                  </Link>
                </div>

                {/* Status badge */}
                <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/8 border border-emerald-500/15 text-emerald-400/80">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Active — rooms available now
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="px-4 sm:px-6 pb-16 sm:pb-20 lg:pb-24 relative z-10">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              {features.map((feature, index) => (
                <div
                  key={feature.title}
                  className="group bg-slate-900/30 border border-slate-800/50 backdrop-blur-xl rounded-2xl p-6 hover:bg-slate-900/50 hover:border-slate-700/60 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/5 animate-slide-up"
                  style={{ animationDelay: `${index * 150}ms`, animationFillMode: 'backwards' }}
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/10 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 px-4 sm:px-6 py-6 relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-600">
            © {new Date().getFullYear()} {config.appName}. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link
              href="/login"
              className="text-xs text-slate-600 hover:text-slate-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 rounded"
            >
              Host Login
            </Link>
            <a
              href="https://nextjs.org/docs"
              className="text-xs text-slate-600 hover:text-slate-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 rounded"
              target="_blank"
              rel="noreferrer"
            >
              Docs
            </a>
            <a
              href="/api/v1"
              className="text-xs text-slate-600 hover:text-slate-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 rounded"
            >
              API
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
