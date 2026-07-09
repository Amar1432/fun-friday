'use client';

import * as React from 'react';

const STORAGE_KEY = 'fun-friday-muted';

/**
 * Hook that provides global mute state persisted to localStorage.
 */
export function useSoundSettings() {
  const [isMuted, setIsMuted] = React.useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'true';
  });

  const toggleMute = React.useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  const setMuted = React.useCallback((muted: boolean) => {
    setIsMuted(muted);
    localStorage.setItem(STORAGE_KEY, String(muted));
  }, []);

  return { isMuted, toggleMute, setMuted };
}
