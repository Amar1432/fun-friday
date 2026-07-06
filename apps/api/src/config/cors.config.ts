import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

const DEFAULT_FRONTEND_ORIGIN = 'http://localhost:3000';

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
      if (origin === undefined || origin === configuredOrigin) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS`), false);
    },
  };
}
