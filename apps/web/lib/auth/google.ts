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
      use_fedcm_for_button?: boolean;
    }) => void;
    prompt: (
      notification?: (n: {
        isDisplayMoment: () => boolean;
        isDisplayed: () => boolean;
        isNotDisplayed: () => boolean;
        getNotDisplayedReason: () => string;
        isSkippedMoment: () => boolean;
        getSkippedReason: () => string;
        isDismissedMoment: () => boolean;
        getDismissedReason: () => string;
      }) => void,
    ) => void;
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
    // Track if prompt was already handled to avoid double resolve/reject
    let resolved = false;

    google.accounts.id.initialize({
      client_id: clientId,
      callback: (response: CredentialResponse) => {
        if (resolved) return;
        if (response.credential) {
          resolved = true;
          resolve(response.credential);
        } else {
          resolved = true;
          reject(new Error('Google sign-in did not return a credential'));
        }
      },
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    // Trigger the prompt
    // Note: Under FedCM, the notification callback no longer returns display
    // moment info (isDisplayed/isNotDisplayed are deprecated).
    // We just let the prompt happen and catch timeout if user never responds.
    google.accounts.id.prompt();

    // Set a timeout so the promise doesn't hang indefinitely
    // if the user dismisses the prompt or never interacts
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        reject(new Error('Sign-in timed out. Please try again.'));
      }
    }, 120_000); // 2 minute timeout
  });
}
