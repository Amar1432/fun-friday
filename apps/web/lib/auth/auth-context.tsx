'use client';
/* eslint-disable react-hooks/set-state-in-effect, no-console */

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { setOnUnauthorizedHandler } from '@/lib/api';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: UserProfile) => void;
  logout: () => void;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

const PUBLIC_ROUTES = ['/login', '/', '/room/join'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<UserProfile | null>(null);
  const [token, setToken] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Register global 401 handler to auto-logout on expired tokens
  React.useEffect(() => {
    setOnUnauthorizedHandler(() => {
      // Securely wipe local auth state
      setToken(null);
      setUser(null);
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      // Full redirect to login with session_expired indicator
      window.location.href = '/login?session_expired=true';
    });
    return () => setOnUnauthorizedHandler(null);
  }, []);

  // Restore session on mount
  React.useEffect(() => {
    try {
      const storedToken = localStorage.getItem('access_token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error('Failed to restore authentication session:', e);
      // Clean up corrupted storage
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle protected route redirection
  React.useEffect(() => {
    if (isLoading) return;

    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
    const isAuthenticated = !!token;

    if (!isAuthenticated && !isPublicRoute) {
      // User is not authenticated and trying to access a protected route
      router.push('/login');
    } else if (isAuthenticated && pathname === '/login') {
      // Authenticated user trying to access login page, redirect to dashboard
      router.push('/dashboard');
    }
  }, [token, isLoading, pathname, router]);

  const login = React.useCallback((newToken: string, newUser: UserProfile) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('access_token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
  }, []);

  const logout = React.useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    router.push('/login');
  }, [router]);

  const value = React.useMemo(
    () => ({
      user,
      token,
      isLoading,
      login,
      logout,
    }),
    [user, token, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
