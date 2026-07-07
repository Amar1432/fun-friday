/**
 * Google Identity Services (GIS) Integration
 *
 * Uses the Google Sign-In for Web (GIS) library to show the One Tap / popup
 * credential picker and return a JWT `credential` (id_token).
 *
 * @see https://developers.google.com/identity/gsi/web/reference/js-reference
 */

// ---------------------------------------------------------------------------
// Types — Google GIS callback response
// ---------------------------------------------------------------------------

interface CredentialResponse {
  credential: string; // JWT id_token
  select_by: string;
}

interface GoogleAccounts {
  id: {
    initialize: (config: {
      client_id: string;
      callback: (response: CredentialResponse) => void;
      auto_select?: boolean;
      cancel_on_tap_outside?: boolean;
    }) => void;
    prompt: (notification?: (n: { isNotDisplayed: () => boolean }) => void) => void;
  };
}

declare global {
  interface Window {
    google?: {
      accounts: GoogleAccounts;
    };
  }
}

// ---------------------------------------------------------------------------
// Script Loader
// ---------------------------------------------------------------------------

let scriptLoaded = false;
let scriptLoadPromise: Promise<void> | null = null;

function loadGoogleScript(): Promise<void> {
  if (scriptLoaded && window.google?.accounts) {
    return Promise.resolve();
  }

  if (scriptLoadPromise) {
    return scriptLoadPromise;
  }

  scriptLoadPromise = new Promise<void>((resolve, reject) => {
    // Check if already present in DOM
    if (document.querySelector('script[src*="accounts.google.com/gsi/client"]')) {
      if (window.google?.accounts) {
        scriptLoaded = true;
        resolve();
        return;
      }
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;

    script.onload = () => {
      scriptLoaded = true;
      resolve();
    };

    script.onerror = () => {
      scriptLoadPromise = null;
      reject(new Error('Failed to load Google Identity Services script'));
    };

    document.head.appendChild(script);
  });

  return scriptLoadPromise;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Requests Google SSO credentials via the One Tap / popup flow.
 * Returns the JWT id_token string on success.
 *
 * @param clientId  Google OAuth 2.0 Client ID
 * @throws Error if the script fails to load or user cancels
 */
export async function requestGoogleCredential(clientId: string): Promise<string> {
  await loadGoogleScript();

  const google = window.google;
  if (!google?.accounts) {
    throw new Error('Google Identity Services not available');
  }

  return new Promise<string>((resolve, reject) => {
    google.accounts.id.initialize({
      client_id: clientId,
      callback: (response: CredentialResponse) => {
        if (response.credential) {
          resolve(response.credential);
        } else {
          reject(new Error('Google sign-in did not return a credential'));
        }
      },
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    // Trigger the prompt
    google.accounts.id.prompt((notification) => {
      // If One Tap is not displayed (e.g. user dismissed it before),
      // the prompt will not show. In that case we can fall back or reject.
      if (notification.isNotDisplayed()) {
        reject(
          new Error(
            'Google One Tap not displayed. Please check your browser settings and try again.',
          ),
        );
      }
    });
  });
}
