/**
 * Microsoft Authentication Library (MSAL) Integration
 *
 * Uses @azure/msal-browser to perform a popup-based login and return
 * the Microsoft id_token (JWT).
 *
 * @see https://learn.microsoft.com/en-us/entra/identity-platform/scenario-spa-sign-in
 */

import {
  PublicClientApplication,
  type Configuration,
  type AuthenticationResult,
  BrowserAuthError,
} from '@azure/msal-browser';

// ---------------------------------------------------------------------------
// MSAL Instance (singleton)
// ---------------------------------------------------------------------------

let msalInstance: PublicClientApplication | null = null;
let initPromise: Promise<void> | null = null;

function getMsalConfig(clientId: string, redirectUri: string): Configuration {
  return {
    auth: {
      clientId,
      authority: 'https://login.microsoftonline.com/common',
      redirectUri,
    },
    cache: {
      cacheLocation: 'sessionStorage',
    },
  };
}

async function getOrCreateInstance(
  clientId: string,
  redirectUri: string,
): Promise<PublicClientApplication> {
  if (msalInstance && initPromise) {
    await initPromise;
    return msalInstance;
  }

  const config = getMsalConfig(clientId, redirectUri);
  msalInstance = new PublicClientApplication(config);

  initPromise = msalInstance.initialize();
  await initPromise;

  return msalInstance;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Requests Microsoft SSO credentials via popup.
 * Returns the JWT id_token string on success.
 *
 * @param clientId     Microsoft OAuth 2.0 Client ID (Application ID)
 * @param redirectUri  Redirect URI registered in Azure Portal
 * @throws Error if authentication fails or user cancels
 */
export async function requestMicrosoftCredential(
  clientId: string,
  redirectUri: string,
): Promise<string> {
  const instance = await getOrCreateInstance(clientId, redirectUri);

  try {
    const result: AuthenticationResult = await instance.loginPopup({
      scopes: ['openid', 'profile', 'email'],
      prompt: 'select_account',
    });

    if (!result.idToken) {
      throw new Error('Microsoft sign-in did not return an ID token');
    }

    return result.idToken;
  } catch (error) {
    if (error instanceof BrowserAuthError) {
      if (error.errorCode === 'user_cancelled' || error.errorCode === 'interaction_in_progress') {
        throw new Error('Microsoft sign-in was cancelled');
      }
    }
    throw error;
  }
}
