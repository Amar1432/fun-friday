'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@fun-friday/ui';
import { config } from '@/lib/config';

export default function Home() {
  const [copiedKey, setCopiedKey] = React.useState<'api' | 'auth' | null>(null);

  const handleCopy = (text: string, key: 'api' | 'auth') => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative overflow-hidden">
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
              className="text-sm font-medium text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 px-4 py-2 rounded-lg transition-all cursor-pointer"
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
              <Link href="/login" className="no-underline">
                <Button variant="primary">Create a Room</Button>
              </Link>
              <Button variant="secondary" onClick={() => alert('Join Room initiated!')}>
                Join Room
              </Button>
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
                      className="px-3 bg-slate-850 hover:bg-slate-800 border border-slate-800/60 hover:border-slate-700/80 rounded-lg text-xs font-medium text-slate-350 hover:text-white transition-all cursor-pointer flex items-center justify-center min-w-[70px]"
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
                      className="px-3 bg-slate-850 hover:bg-slate-800 border border-slate-800/60 hover:border-slate-700/80 rounded-lg text-xs font-medium text-slate-350 hover:text-white transition-all cursor-pointer flex items-center justify-center min-w-[70px]"
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
              className="hover:text-slate-300 transition-colors"
              target="_blank"
              rel="noreferrer"
            >
              Next.js Docs
            </a>
            <a href="/api/v1" className="hover:text-slate-300 transition-colors">
              REST API
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
