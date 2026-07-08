import * as React from 'react';

export interface CountdownTimerProps {
  timerRemaining: number | null;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ timerRemaining }) => {
  if (timerRemaining === null) {
    return null;
  }

  const isLowTime = timerRemaining <= 5;

  return (
    <div className="flex flex-col items-center">
      <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
        Time Remaining
      </span>
      <span
        className={`text-3xl font-extrabold tabular-nums transition-colors duration-300 ${
          isLowTime ? 'text-rose-500 animate-pulse' : 'text-slate-100'
        }`}
      >
        {timerRemaining}s
      </span>
    </div>
  );
};
