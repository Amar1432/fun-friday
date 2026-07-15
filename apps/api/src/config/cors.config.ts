import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

const DEFAULT_FRONTEND_ORIGIN = 'http://localhost:3000';

/**
 * Checks whether an origin is a Vercel preview deployment.
 * Vercel preview URLs follow the pattern: https://*-team-slug.vercel.app
 * Production domains on vercel.app (e.g. fun-friday-tau.vercel.app) are
 * excluded by checking for at least 3 dash-separated segments in the hostname.
 */
export function isVercelPreviewOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    if (url.protocol !== 'https:' || !url.hostname.endsWith('.vercel.app')) {
      return false;
    }
    // Production vercel.app domains typically have 2-3 parts (e.g. fun-friday-tau),
    // while preview deployments have at least 4+ (e.g. fun-friday-hash-team-slug)
    const segments = url.hostname.replace('.vercel.app', '').split('-');
    return segments.length >= 4;
  } catch {
    return false;
  }
}

export function isOriginAllowed(
  origin: string | undefined,
  configuredOrigin: string,
): boolean {
  // Allow requests with no origin (server-to-server, curl, etc.)
  if (origin === undefined) {
    return true;
  }

  // Allow the configured production origin
  if (origin === configuredOrigin) {
    return true;
  }

  // Allow localhost for development
  if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) {
    return true;
  }

  // Allow Vercel preview deployments
  if (isVercelPreviewOrigin(origin)) {
    return true;
  }

  return false;
}

export function createCorsOptions(
  frontendOrigin = process.env.FRONTEND_ORIGIN ?? DEFAULT_FRONTEND_ORIGIN,
): CorsOptions {
  const configuredUrl = new URL(frontendOrigin);
  const configuredOrigin = configuredUrl.origin;

  if (
    !['http:', 'https:'].includes(configuredUrl.protocol) ||
    configuredOrigin !== frontendOrigin
  ) {
    throw new Error(
      'FRONTEND_ORIGIN must be an absolute HTTP(S) origin without a trailing slash',
    );
  }

  return {
    credentials: true,
    origin: (origin, callback) => {
      if (isOriginAllowed(origin, configuredOrigin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS`), false);
    },
  };
}
