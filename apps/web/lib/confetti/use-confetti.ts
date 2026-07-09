'use client';

import * as React from 'react';
import confetti from 'canvas-confetti';
import { useGameStore } from '@/lib/store/use-game-store';

/**
 * Fires canvas-confetti whenever the correctAnswer transitions from null → value.
 */
export function useConfettiOnCorrectAnswer() {
  const correctAnswer = useGameStore((state) => state.game.correctAnswer);
  const prevRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (correctAnswer && prevRef.current === null) {
      // Fire confetti from both sides
      const defaults: confetti.Options = {
        spread: 60,
        ticks: 80,
        gravity: 0.8,
        decay: 0.94,
        startVelocity: 30,
        colors: ['#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#f59e0b'],
      };

      confetti({ ...defaults, angle: 60, origin: { x: 0, y: 0.6 } });
      confetti({ ...defaults, angle: 120, origin: { x: 1, y: 0.6 } });
    }
    prevRef.current = correctAnswer;
  }, [correctAnswer]);
}
