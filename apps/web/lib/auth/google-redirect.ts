/**
 * Google OAuth2 Redirect Flow (PKCE)
 *
 * Alternative to GIS (Google Identity Services) popup/One Tap for browsers
 * that block third-party scripts (e.g. Brave with Shields enabled).
 *
 * Uses the OAuth2 authorization code flow with PKCE:
 * 1. Generate code_verifier + code_challenge
 * 2. Redirect to Google's authorization page
 * 3. User authenticates on Google
 * 4. Google redirects back to /auth/callback with a code
 * 5. Send the code to our backend (has GOOGLE_CLIENT_SECRET) for token exchange
 * 6. Backend returns the access token + user info directly
 *
 * @see https://developers.google.com/identity/protocols/oauth2/web-server#httprest
 */

import { config } from '@/lib/config';
import { exchangeGoogleCode, type SsoLoginResponse } from '@/lib/api';

// ---------------------------------------------------------------------------
// PKCE Helpers
// ---------------------------------------------------------------------------

/**
 * Generates a cryptographically random code verifier string.
 * The verifier must be between 43 and 128 characters (RFC 7636).
 * Uses 96 bytes → base64url → ~128 characters.
 */
function generateCodeVerifier(): string {
  const array = new Uint8Array(96);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

/**
 * Computes the SHA-256 hash of the code verifier and returns
 * the base64url-encoded code challenge.
 */
async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(new Uint8Array(digest));
}

/**
 * Base64url encoding as specified in RFC 4648 §5.
 * Uses URL-safe characters and strips padding.
 */
function base64UrlEncode(buffer: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...buffer));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// ---------------------------------------------------------------------------
// State management (stored in sessionStorage for redirect round-trip)
// ---------------------------------------------------------------------------

const STORAGE_KEY_PREFIX = 'google_oauth_';

function storeState(verifier: string): void {
  sessionStorage.setItem(`${STORAGE_KEY_PREFIX}code_verifier`, verifier);
}

function getAndClearState(): string | null {
  const verifier = sessionStorage.getItem(`${STORAGE_KEY_PREFIX}code_verifier`);
  sessionStorage.removeItem(`${STORAGE_KEY_PREFIX}code_verifier`);
  return verifier;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Initiates the Google OAuth2 redirect flow.
 *
 * Generates PKCE parameters, stores them in sessionStorage, and redirects
 * the browser to Google's authorization endpoint. The user authenticates on
 * Google's page and gets redirected back to the configured callback URL.
 *
 * @throws Error if the client ID or callback URL is misconfigured
 */
export function redirectToGoogle(): void {
  if (!config.googleClientId) {
    throw new Error(
      'Google Client ID is not configured. Set NEXT_PUBLIC_GOOGLE_CLIENT_ID in your .env.local file.',
    );
  }

  // Generate PKCE parameters
  const codeVerifier = generateCodeVerifier();
  storeState(codeVerifier);

  // Build the auth URL
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', config.googleClientId);
  authUrl.searchParams.set('redirect_uri', config.authCallbackUrl);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'openid profile email');
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'select_account');

  // code_challenge is generated asynchronously, so we chain it
  generateCodeChallenge(codeVerifier).then((codeChallenge) => {
    authUrl.searchParams.set('code_challenge_method', 'S256');
    authUrl.searchParams.set('code_challenge', codeChallenge);

    // Redirect to Google
    window.location.href = authUrl.toString();
  });
}

/**
 * Handles the OAuth2 redirect callback.
 *
 * To be called from the /auth/callback page. Extracts the authorization code
 * from the URL, sends it to the backend for server-side token exchange, and
 * returns the login response (access token + user info).
 *
 * @returns Object containing accessToken, expiresIn, and user info
 * @throws Error if the code exchange fails or state is invalid
 */
export async function handleGoogleCallback(): Promise<SsoLoginResponse> {
  // Extract the authorization code from the URL
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const error = params.get('error');

  if (error) {
    throw new Error(`Google sign-in was cancelled: ${error}`);
  }

  if (!code) {
    throw new Error('No authorization code received from Google');
  }

  // Retrieve the PKCE code verifier from sessionStorage
  const codeVerifier = getAndClearState();
  if (!codeVerifier) {
    throw new Error('Sign-in session expired. Please try signing in again.');
  }

  // Clean URL — remove OAuth params from the address bar
  window.history.replaceState({}, '', window.location.pathname);

  // Send the code and the redirect URI to our backend for server-side token
  // exchange. The backend uses this exact redirect_uri when calling Google's
  // token endpoint, which ensures it matches the one sent in the original
  // authorization request (important when the same backend serves multiple
  // frontend domains like localhost, preview, and production).
  return exchangeGoogleCode(code, codeVerifier, config.authCallbackUrl);
}
