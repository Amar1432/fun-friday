'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { config } from '@/lib/config';
import { ssoLogin } from '@/lib/api';
import { requestGoogleCredential } from '@/lib/auth/google';
import { requestMicrosoftCredential } from '@/lib/auth/microsoft';

import { useAuth } from '@/lib/auth/auth-context';

type Provider = 'google' | 'microsoft';

// ---------------------------------------------------------------------------
// Session Expired Banner
// ---------------------------------------------------------------------------

function SessionExpiredBanner() {
  const searchParams = useSearchParams();
  const isExpired = searchParams.get('session_expired') === 'true';

  if (!isExpired) return null;

  return (
    <div
      className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-sm flex items-start gap-3 animate-fade-in relative"
      role="alert"
    >
      <svg
        className="w-5 h-5 text-amber-400 shrink-0 mt-0.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 15v2m0 0v2m0-2h2m-2 0H10m9.364-7.364A9 9 0 1112 3a9 9 0 017.364 4.636z"
        />
      </svg>
      <div className="flex-1 pr-6">
        <strong className="font-semibold">Session expired.</strong> Your authentication token is no
        longer valid. Please sign in again to continue hosting.
      </div>
    </div>
  );
}

export default function LoginPage() {
  const { login } = useAuth();
  const [loadingProvider, setLoadingProvider] = React.useState<Provider | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const handleLogin = React.useCallback(
    async (provider: Provider) => {
      if (loadingProvider) return;
      setError(null);
      setLoadingProvider(provider);

      try {
        // Step 1: Get ID token from the SSO provider
        let idToken: string;

        if (provider === 'google') {
          if (!config.googleClientId) {
            throw new Error(
              'Google Client ID is not configured. Set NEXT_PUBLIC_GOOGLE_CLIENT_ID in your .env.local file.',
            );
          }
          idToken = await requestGoogleCredential(config.googleClientId);
        } else {
          if (!config.microsoftClientId) {
            throw new Error(
              'Microsoft Client ID is not configured. Set NEXT_PUBLIC_MICROSOFT_CLIENT_ID in your .env.local file.',
            );
          }
          idToken = await requestMicrosoftCredential(
            config.microsoftClientId,
            config.authCallbackUrl,
          );
        }

        // Step 2: Exchange the ID token with our backend for an app JWT
        const result = await ssoLogin(provider, idToken);

        // Step 3: Show success state, then log in and redirect
        setSuccess(true);
        setTimeout(() => {
          login(result.accessToken, result.user);
        }, 1200);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : `Failed to authenticate with ${provider === 'google' ? 'Google' : 'Microsoft'}`;
        setError(message);
      } finally {
        setLoadingProvider(null);
      }
    },
    [loadingProvider, login],
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative overflow-hidden justify-between">
      {/* Background ambient glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/50 backdrop-blur-md px-4 sm:px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 rounded-xl"
          >
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-xl shadow-lg shadow-indigo-500/20 text-white group-hover:scale-105 transition-transform">
              F
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent hidden sm:inline">
              {config.appName}
            </span>
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-slate-400 hover:text-white transition-colors flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 rounded-md"
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
          </Link>
        </div>
      </header>

      {/* Main Login Card Section */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12 relative z-10">
        <div className="max-w-md w-full">
          {/* Card Container */}
          <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Session Expired Banner */}
            <React.Suspense fallback={null}>
              <SessionExpiredBanner />
            </React.Suspense>

            {/* Application Branding */}
            <div className="text-center mb-8">
              <div className="inline-flex h-14 w-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 items-center justify-center font-bold text-2xl shadow-xl shadow-indigo-500/20 text-white mb-4">
                F
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Host Sign In</h2>
              <p className="text-sm text-slate-400">
                Authenticate with your corporate identity provider to host team games.
              </p>
            </div>

            {/* Error State Banner */}
            {error && (
              <div
                className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm flex items-start gap-3 animate-fade-in relative"
                role="alert"
              >
                <svg
                  className="w-5 h-5 text-red-400 shrink-0 mt-0.5"
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
                <div className="flex-1 pr-6">{error}</div>
                <button
                  onClick={() => setError(null)}
                  className="absolute top-3 right-3 text-red-400 hover:text-red-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 rounded-md"
                  aria-label="Dismiss error"
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            )}

            {/* Success State */}
            {success ? (
              <div className="text-center py-6 space-y-4">
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
                <div>
                  <h3 className="text-lg font-bold text-white">Login Successful</h3>
                  <p className="text-sm text-slate-400 mt-1">
                    Redirecting you to the host dashboard...
                  </p>
                </div>
              </div>
            ) : (
              /* Main Buttons List */
              <div className="space-y-4">
                {/* Dev Mock Login Button */}
                <button
                  id="dev-login-button"
                  onClick={async () => {
                    setError(null);
                    setLoadingProvider('google');
                    try {
                      const result = await ssoLogin('google', 'mock_token_host@funfriday.com');
                      setSuccess(true);
                      setTimeout(() => {
                        login(result.accessToken, result.user);
                      }, 1200);
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'Dev login failed');
                    } finally {
                      setLoadingProvider(null);
                    }
                  }}
                  className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-slate-900 cursor-pointer shadow-md"
                >
                  Dev / Mock Login (host@funfriday.com)
                </button>

                {/* Google SSO Button */}
                <button
                  id="google-login-button"
                  onClick={() => handleLogin('google')}
                  disabled={loadingProvider !== null}
                  className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-xl bg-white text-slate-900 font-semibold text-sm hover:bg-slate-100 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md"
                >
                  {loadingProvider === 'google' ? (
                    <svg
                      className="animate-spin h-5 w-5 text-slate-900"
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
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      width="20"
                      height="20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                  )}
                  {loadingProvider === 'google' ? 'Signing in...' : 'Sign in with Google'}
                </button>

                {/* Microsoft SSO Button */}
                <button
                  id="microsoft-login-button"
                  onClick={() => handleLogin('microsoft')}
                  disabled={loadingProvider !== null}
                  className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-xl bg-slate-950 text-white font-semibold text-sm hover:bg-slate-900 border border-slate-800 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md"
                >
                  {loadingProvider === 'microsoft' ? (
                    <svg
                      className="animate-spin h-5 w-5 text-white"
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
                  ) : (
                    <svg
                      viewBox="0 0 23 23"
                      width="20"
                      height="20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path fill="#F25022" d="M1 1h10v10H1z" />
                      <path fill="#7FBA00" d="M12 1h10v10H12z" />
                      <path fill="#00A4EF" d="M1 12h10v10H1z" />
                      <path fill="#FFB900" d="M12 12h10v10H12z" />
                    </svg>
                  )}
                  {loadingProvider === 'microsoft' ? 'Signing in...' : 'Sign in with Microsoft'}
                </button>
              </div>
            )}

            {/* Help text */}
            <div className="mt-8 pt-6 border-t border-slate-800/60">
              <p className="text-xs text-slate-500 text-center leading-relaxed">
                By signing in, you agree to our{' '}
                <Link
                  href="/"
                  className="text-indigo-400 hover:text-indigo-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 rounded"
                >
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link
                  href="/"
                  className="text-indigo-400 hover:text-indigo-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 rounded"
                >
                  Privacy Policy
                </Link>
                . Only corporate identity providers are supported.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 px-4 sm:px-6 py-6 text-center text-xs text-slate-600 z-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>
            © {new Date().getFullYear()} {config.appName}. Secure connection verified.
          </p>
          <div className="flex gap-4">
            <Link href="/" className="hover:text-slate-400 transition-colors">
              Terms of Service
            </Link>
            <Link href="/" className="hover:text-slate-400 transition-colors">
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
