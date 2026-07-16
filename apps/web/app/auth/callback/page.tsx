'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { handleGoogleCallback } from '@/lib/auth/google-redirect';
import { ssoLogin } from '@/lib/api';
import { useAuth } from '@/lib/auth/auth-context';

export default function AuthCallbackPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [status, setStatus] = React.useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function processCallback() {
      try {
        // Step 1: Exchange the authorization code for an id_token
        const idToken = await handleGoogleCallback();

        if (cancelled) return;

        // Step 2: Exchange the id_token with our backend for an app JWT
        const result = await ssoLogin('google', idToken);

        if (cancelled) return;

        // Step 3: Log in and redirect to dashboard
        setStatus('success');
        setTimeout(() => {
          login(result.accessToken, result.user);
          router.push('/dashboard');
        }, 800);
      } catch (err) {
        if (cancelled) return;
        setStatus('error');
        setErrorMessage(
          err instanceof Error ? err.message : 'Authentication failed. Please try again.',
        );
      }
    }

    processCallback();

    return () => {
      cancelled = true;
    };
  }, [login, router]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Logo */}
        <div className="inline-flex h-14 w-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 items-center justify-center font-bold text-2xl shadow-xl shadow-indigo-500/20 text-white mb-2">
          F
        </div>

        {status === 'processing' && (
          <div className="space-y-4">
            <svg
              className="animate-spin h-8 w-8 text-indigo-400 mx-auto"
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
            <h1 className="text-xl font-bold text-white">Completing sign in...</h1>
            <p className="text-sm text-slate-400">Please wait while we authenticate you.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <div className="inline-flex h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-400 items-center justify-center border border-emerald-500/20">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-white">Sign in successful!</h1>
            <p className="text-sm text-slate-400">Redirecting to your dashboard...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="inline-flex h-12 w-12 rounded-full bg-red-500/10 text-red-400 items-center justify-center border border-red-500/20">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-white">Sign in failed</h1>
            <p className="text-sm text-red-400">{errorMessage}</p>
            <Link
              href="/login"
              className="inline-block mt-4 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors"
            >
              Try Again
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
