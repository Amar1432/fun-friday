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

export interface Room {
  id: string;
  code: string;
  status: 'LOBBY' | 'IN_PROGRESS' | 'FINISHED';
  createdAt: string;
}

export interface CreateRoomResponse {
  room: Room;
}

// ---------------------------------------------------------------------------
// Global 401 Unauthorized Handler
// ---------------------------------------------------------------------------

let onUnauthorizedHandler: (() => void) | null = null;

/**
 * Register a callback that fires whenever any API request receives a 401.
 * Used by AuthProvider to automatically log out on expired tokens.
 */
export function setOnUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorizedHandler = handler;
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
    // Fire the global 401 handler so AuthProvider can log out & redirect
    if (res.status === 401 && onUnauthorizedHandler) {
      onUnauthorizedHandler();
    }

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

// ---------------------------------------------------------------------------
// Room Endpoints
// ---------------------------------------------------------------------------

export async function createRoom(token: string): Promise<CreateRoomResponse> {
  const envelope = await request<ApiResponse<CreateRoomResponse>>('/rooms', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({}),
  });
  return envelope.data;
}

export interface GuestLoginResponse {
  player: {
    id: string;
    displayName: string;
  };
  room: {
    id: string;
    code: string;
  };
  accessToken: string;
  expiresIn: number;
}

export async function loginAsGuest(
  roomCode: string,
  displayName: string,
): Promise<GuestLoginResponse> {
  const envelope = await request<ApiResponse<GuestLoginResponse>>('/auth/guest', {
    method: 'POST',
    body: JSON.stringify({ roomCode, displayName }),
  });
  return envelope.data;
}

export interface GetRoomsResponse {
  id: string;
  code: string;
  status: 'LOBBY' | 'IN_PROGRESS' | 'FINISHED';
  createdAt: string;
}

export async function getRooms(token: string): Promise<GetRoomsResponse[]> {
  const envelope = await request<ApiResponse<GetRoomsResponse[]>>('/rooms', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return envelope.data;
}

// ---------------------------------------------------------------------------
// Google OAuth2 Callback (server-side token exchange)
// ---------------------------------------------------------------------------

/**
 * Sends the Google OAuth2 authorization code to the backend for server-side
 * token exchange. The backend has the GOOGLE_CLIENT_SECRET and exchanges the
 * code with Google's token endpoint securely.
 */
export async function exchangeGoogleCode(
  code: string,
  codeVerifier: string,
  redirectUri: string,
): Promise<SsoLoginResponse> {
  const envelope = await request<ApiResponse<SsoLoginResponse>>('/auth/sso/google/callback', {
    method: 'POST',
    body: JSON.stringify({ code, codeVerifier, redirectUri }),
  });
  return envelope.data;
}

export { ApiError };
