/**
 * API Client
 *
 * Provides typed functions for communicating with the NestJS backend.
 * All responses follow the standard { success: boolean, data: T } envelope.
 */

import { config } from './config';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface SsoLoginResponse {
  accessToken: string;
  expiresIn: number;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

// ---------------------------------------------------------------------------
// Core Fetch Wrapper
// ---------------------------------------------------------------------------

class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${config.apiUrl}${path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message =
      (body as { message?: string }).message ?? `API request failed with status ${res.status}`;
    throw new ApiError(res.status, message);
  }

  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Auth Endpoints
// ---------------------------------------------------------------------------

export async function ssoLogin(
  provider: 'google' | 'microsoft',
  idToken: string,
): Promise<SsoLoginResponse> {
  const envelope = await request<ApiResponse<SsoLoginResponse>>('/auth/sso/login', {
    method: 'POST',
    body: JSON.stringify({ provider, idToken }),
  });
  return envelope.data;
}

export { ApiError };
