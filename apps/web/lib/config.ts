/**
 * Frontend Configuration Module
 *
 * Exposes environment variables to both server-side and client-side code.
 * Performs validation to prevent running with invalid or missing configurations.
 */

const getEnv = (value: string | undefined, name: string, defaultValue?: string): string => {
  const finalValue = value ?? defaultValue;
  if (!finalValue) {
    throw new Error(`Environment variable ${name} is not defined and has no fallback.`);
  }
  return finalValue;
};

const getOptionalEnv = (value: string | undefined, defaultValue = ''): string => {
  return value ?? defaultValue;
};

const validateUrl = (url: string, name: string): string => {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error(`Protocol must be http: or https:`);
    }
    return url;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Environment variable ${name} is not a valid absolute URL. Value: "${url}". Error: ${message}`,
    );
  }
};

const rawApiUrl = getEnv(
  process.env.NEXT_PUBLIC_API_URL,
  'NEXT_PUBLIC_API_URL',
  'http://localhost:3001/api/v1',
);
const rawAuthCallbackUrl = getEnv(
  process.env.NEXT_PUBLIC_AUTH_CALLBACK_URL,
  'NEXT_PUBLIC_AUTH_CALLBACK_URL',
  'http://localhost:3000/auth/callback',
);
const rawAppName = getEnv(
  process.env.NEXT_PUBLIC_APP_NAME,
  'NEXT_PUBLIC_APP_NAME',
  'Fun Friday Hub',
);
const rawSocketUrl = getEnv(
  process.env.NEXT_PUBLIC_SOCKET_URL,
  'NEXT_PUBLIC_SOCKET_URL',
  'http://localhost:3001',
);

// Validate URLs
const apiUrl = validateUrl(rawApiUrl, 'NEXT_PUBLIC_API_URL');
const authCallbackUrl = validateUrl(rawAuthCallbackUrl, 'NEXT_PUBLIC_AUTH_CALLBACK_URL');
const socketUrl = validateUrl(rawSocketUrl, 'NEXT_PUBLIC_SOCKET_URL');
const appName = rawAppName;

// SSO Client IDs (optional — empty string means SSO is not configured)
const googleClientId = getOptionalEnv(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
const microsoftClientId = getOptionalEnv(process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID);

export const config = {
  apiUrl,
  authCallbackUrl,
  socketUrl,
  appName,
  googleClientId,
  microsoftClientId,
} as const;

export type Config = typeof config;
