'use client';

import * as React from 'react';
import { LeaderboardEntry } from '@/lib/socket/types';
import { useAuth } from '@/lib/auth/auth-context';

export interface LiveLeaderboardProps {
  entries: LeaderboardEntry[];
  activeUserId?: string | null;
}

export const LiveLeaderboard: React.FC<LiveLeaderboardProps> = ({ entries, activeUserId }) => {
  const { user } = useAuth();
  const currentUserId = activeUserId ?? user?.id;

  const prevScoresRef = React.useRef<Record<string, number>>({});
  const [scoreChanges, setScoreChanges] = React.useState<Record<string, number>>({});

  // Deduplicate entries by playerId to prevent React key collisions and display anomalies
  const uniqueEntries = React.useMemo(() => {
    const seen = new Set<string>();
    return entries.filter((entry) => {
      if (!entry || !entry.playerId) return false;
      if (seen.has(entry.playerId)) return false;
      seen.add(entry.playerId);
      return true;
    });
  }, [entries]);

  React.useEffect(() => {
    if (uniqueEntries.length === 0) return;

    const newChanges: Record<string, number> = {};

    uniqueEntries.forEach((entry) => {
      const prevScore = prevScoresRef.current[entry.playerId];
      if (prevScore !== undefined) {
        const diff = entry.score - prevScore;
        if (diff > 0) {
          newChanges[entry.playerId] = diff;
        }
      }
      prevScoresRef.current[entry.playerId] = entry.score;
    });

    if (Object.keys(newChanges).length > 0) {
      setScoreChanges((prev) => ({ ...prev, ...newChanges }));

      const timer = setTimeout(() => {
        setScoreChanges((prev) => {
          const updated = { ...prev };
          Object.keys(newChanges).forEach((id) => {
            delete updated[id];
          });
          return updated;
        });
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [uniqueEntries]);

  return (
    <div
      data-testid="live-leaderboard"
      className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl rounded-3xl p-4 sm:p-6 space-y-4 shadow-xl relative overflow-hidden"
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes fade-in-up {
          0% {
            opacity: 0;
            transform: translateY(10px) scale(0.9);
          }
          15% {
            opacity: 1;
            transform: translateY(-2px) scale(1);
          }
          85% {
            opacity: 1;
            transform: translateY(-2px) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
          }
        }
        .animate-score-change {
          animation: fade-in-up 3.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `,
        }}
      />

      <div className="flex items-center justify-between border-b border-slate-800/50 pb-3">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <svg
            className="w-4 h-4 text-amber-500 animate-pulse"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
            />
          </svg>
          Live Leaderboard
        </h3>
        <span className="text-[10px] text-slate-500 font-bold bg-slate-950/80 px-2 py-0.5 rounded-full border border-slate-800">
          {uniqueEntries.length} {uniqueEntries.length === 1 ? 'Player' : 'Players'}
        </span>
      </div>

      {uniqueEntries.length > 0 ? (
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          {uniqueEntries.map((entry) => {
            const isSelf = entry.playerId === currentUserId;
            const change = scoreChanges[entry.playerId];
            const hasChange = change !== undefined && change > 0;

            let rankBadge = null;
            let rowStyles = '';
            let rankTextStyles = 'text-slate-500';

            if (entry.rank === 1) {
              rankBadge = (
                <span className="text-base" data-testid="rank-badge-1" aria-label="First Place">
                  👑
                </span>
              );
              rowStyles = 'border-yellow-500/25 bg-yellow-500/5 shadow-lg shadow-yellow-950/5';
              rankTextStyles = 'text-yellow-500 font-extrabold';
            } else if (entry.rank === 2) {
              rankBadge = (
                <span className="text-base" data-testid="rank-badge-2" aria-label="Second Place">
                  🥈
                </span>
              );
              rowStyles = 'border-slate-400/20 bg-slate-400/5';
              rankTextStyles = 'text-slate-300 font-extrabold';
            } else if (entry.rank === 3) {
              rankBadge = (
                <span className="text-base" data-testid="rank-badge-3" aria-label="Third Place">
                  🥉
                </span>
              );
              rowStyles = 'border-amber-600/20 bg-amber-600/5';
              rankTextStyles = 'text-amber-600 font-extrabold';
            } else {
              rowStyles = 'border-slate-800/50 bg-slate-950/50 hover:border-slate-700/50';
            }

            if (isSelf) {
              rowStyles = `${rowStyles} ring-2 ring-indigo-500/60 bg-indigo-950/20 shadow-indigo-950/20`;
            }

            return (
              <div
                key={entry.playerId}
                data-testid={`leaderboard-row-${entry.playerId}`}
                className={`flex items-center justify-between p-3.5 border rounded-2xl transition-all duration-300 ${rowStyles}`}
              >
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="w-6 flex items-center justify-center shrink-0">
                    {rankBadge ? (
                      rankBadge
                    ) : (
                      <span className={`text-xs font-extrabold ${rankTextStyles}`}>
                        #{entry.rank}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span
                      className={`text-sm font-semibold flex items-center gap-2 min-w-0 ${isSelf ? 'text-white font-extrabold' : 'text-slate-200'}`}
                    >
                      <span className="truncate max-w-[100px] min-[400px]:max-w-[140px] sm:max-w-[200px] inline-block">
                        {entry.displayName}
                      </span>
                      {isSelf && (
                        <span className="text-[9px] font-black tracking-widest bg-indigo-500 text-white px-1.5 py-0.5 rounded uppercase shrink-0">
                          You
                        </span>
                      )}
                    </span>
                    {entry.streak > 1 && (
                      <span className="text-[10px] text-amber-500 font-bold tracking-wide flex items-center gap-0.5 mt-0.5">
                        🔥 {entry.streak} STREAK
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Score Change */}
                  {hasChange && (
                    <div
                      data-testid={`score-change-${entry.playerId}`}
                      className="animate-score-change inline-flex items-center px-1.5 py-0.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold rounded-full"
                    >
                      +{change.toLocaleString()}
                    </div>
                  )}
                  <span
                    className={`text-sm font-extrabold ${isSelf ? 'text-indigo-300' : 'text-indigo-400'}`}
                  >
                    {entry.score.toLocaleString()} pts
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-slate-500 text-sm font-medium">
          Waiting for score calculations...
        </div>
      )}
    </div>
  );
};
