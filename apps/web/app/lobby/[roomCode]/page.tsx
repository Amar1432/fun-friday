'use client';

import * as React from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { config } from '@/lib/config';
import { RoomInformationPanel } from '@/components/room-information-panel';
import { PlayerList } from '@/components/player-list';
import { LobbyControls } from '@/components/lobby-controls';
import { useGameStore } from '@/lib/store/use-game-store';
import { useSocket, useSocketEvent, useSocketDispatcher } from '@/lib/socket/socket-context';
import { QuestionDisplay } from '@/components/question-display';
import { CountdownTimer } from '@/components/countdown-timer';
import { AnswerSubmission } from '@/components/answer-submission';
import { LiveLeaderboard } from '@/components/live-leaderboard';
import { SocketStatusIndicator } from '@/components/socket-status-indicator';

export default function LobbyPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { roomCode } = useParams();
  const searchParams = useSearchParams();
  const roomIdParam = searchParams.get('roomId');

  const setRoom = useGameStore((state) => state.setRoom);
  const room = useGameStore((state) => state.room);
  const game = useGameStore((state) => state.game);
  const players = useGameStore((state) => state.players);
  const leaderboard = useGameStore((state) => state.leaderboard);
  const setSubmittedAnswer = useGameStore((state) => state.setSubmittedAnswer);

  const isHost = user?.id === room.hostId;

  const { status: socketStatus, registerListener, unregisterListener } = useSocket();
  const dispatcher = useSocketDispatcher();

  const [isStarting, setIsStarting] = React.useState(false);
  const [startError, setStartError] = React.useState<string | null>(null);

  const isMounted = React.useRef(true);
  const questionStartedAtRef = React.useRef<number | null>(null);

  // Set room code and ID from URL params
  React.useEffect(() => {
    isMounted.current = true;
    if (roomCode) {
      setRoom({
        code: roomCode as string,
        id: roomIdParam || room.id || null,
      });
    }
    // Cleanup room state when component unmounts
    return () => {
      isMounted.current = false;
      setRoom({ code: null, id: null, status: null, hostId: null });
    };
  }, [roomCode, roomIdParam, setRoom, room.id]);

  // Track question start time
  React.useEffect(() => {
    if (game.currentQuestion) {
      questionStartedAtRef.current = Date.now();
    } else {
      questionStartedAtRef.current = null;
    }
  }, [game.currentQuestion]);

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!authLoading && !user) {
      if (roomCode) {
        router.push(`/room/join?code=${roomCode}`);
      } else {
        router.push('/login');
      }
    }
  }, [user, authLoading, roomCode, router]);

  // Emit JoinRoom when socket is connected
  React.useEffect(() => {
    if (socketStatus === 'connected' && roomCode) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsStarting(false);
      setStartError(null);

      // Only join room if we are not already synced inside this room session
      if (!room.status) {
        const isGuest = user && (!user.email || user.email.trim() === '');
        dispatcher.joinRoom({
          roomCode: roomCode as string,
          displayName: user?.name || '',
          guestToken: isGuest ? token || '' : '',
        });
      }
    }
  }, [socketStatus, roomCode, user, token, dispatcher, room.status]);

  // Socket event listener for game start success
  useSocketEvent(
    'GameStarted',
    React.useCallback(() => {
      setIsStarting(false);
      setStartError(null);
    }, []),
  );

  // Socket event listener for errors
  useSocketEvent(
    'error',
    React.useCallback((err) => {
      setIsStarting(false);
      setStartError(err.message || 'An error occurred.');
    }, []),
  );

  const handleStartGame = React.useCallback(() => {
    const activeRoomId = room.id || roomIdParam;
    if (socketStatus !== 'connected') {
      setStartError('Real-time connection is not active. Please wait.');
      return;
    }

    if (!activeRoomId) {
      setStartError('Room ID is missing. Cannot start the game.');
      return;
    }

    setIsStarting(true);
    setStartError(null);

    // Default to the seeded Emoji Guess game
    const gameId = '1cd83808-737f-4c29-ab51-adff5c6a1ef5';
    dispatcher.startGame({ roomId: activeRoomId, gameId });
  }, [socketStatus, room.id, roomIdParam, dispatcher]);

  const handleNextRound = React.useCallback(() => {
    const activeRoomId = room.id || roomIdParam;
    if (activeRoomId) {
      dispatcher.nextRound({ roomId: activeRoomId });
    }
  }, [room.id, roomIdParam, dispatcher]);

  const handleEndGame = React.useCallback(() => {
    const activeRoomId = room.id || roomIdParam;
    if (activeRoomId) {
      dispatcher.endGame({ roomId: activeRoomId });
    }
  }, [room.id, roomIdParam, dispatcher]);

  const handleSubmitAnswer = React.useCallback(
    (answer: string) => {
      return new Promise<void>((resolve, reject) => {
        if (!game.currentQuestion) {
          reject(new Error('No active question to submit answer for.'));
          return;
        }

        const activeRoomId = room.id || roomIdParam;
        if (socketStatus !== 'connected' || !activeRoomId) {
          reject(new Error('Real-time connection is not active. Please wait.'));
          return;
        }

        const limitMs = (game.currentQuestion.timeLimitSeconds || 20) * 1000;
        const responseTimeMs = questionStartedAtRef.current
          ? Math.min(Math.max(0, Date.now() - questionStartedAtRef.current), limitMs)
          : 0;

        const handleAck = (data: {
          success: boolean;
          data: {
            playerId: string;
            roundId: string;
            questionId: string;
            answerText: string;
            responseTimeMs: number;
          };
        }) => {
          if (data?.data?.questionId === game.currentQuestion?.id) {
            cleanup();
            setSubmittedAnswer(answer);
            resolve();
          }
        };

        const handleErr = (
          err:
            | { code: string; message: string }
            | { success: boolean; error: { code: string; message: string } },
        ) => {
          cleanup();
          let errorMsg = 'Failed to submit answer.';
          if (err && typeof err === 'object') {
            if (
              'error' in err &&
              err.error &&
              typeof err.error === 'object' &&
              'message' in err.error
            ) {
              errorMsg = (err.error as { message: string }).message;
            } else if ('message' in err && typeof err.message === 'string') {
              errorMsg = err.message;
            }
          }
          reject(new Error(errorMsg));
        };

        const cleanup = () => {
          unregisterListener('SubmitAnswerAck', handleAck);
          unregisterListener('error', handleErr);
        };

        registerListener('SubmitAnswerAck', handleAck);
        registerListener('error', handleErr);

        dispatcher.submitAnswer({
          roomId: activeRoomId,
          questionId: game.currentQuestion.id,
          answer: answer,
          responseTimeMs,
        });
      });
    },
    [
      game.currentQuestion,
      socketStatus,
      room.id,
      roomIdParam,
      registerListener,
      unregisterListener,
      setSubmittedAnswer,
      dispatcher,
    ],
  );

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-2xl shadow-lg shadow-indigo-500/20 text-white animate-bounce">
            F
          </div>
          <div className="flex items-center gap-2">
            <svg
              className="animate-spin h-4 w-4 text-indigo-500"
              fill="none"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="text-sm font-medium text-slate-400">Loading session...</span>
          </div>
        </div>
      </div>
    );
  }

  // Render Podium / Results view when finished
  if (room.status === 'FINISHED') {
    const podiumWinners = leaderboard.slice(0, 3);
    const otherRankings = leaderboard.slice(3);

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative overflow-hidden">
        {/* Background ambient glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/5 blur-[120px] pointer-events-none" />

        {/* Header */}
        <header className="border-b border-slate-800/80 bg-slate-950/50 backdrop-blur-md px-4 sm:px-6 py-4 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-3 group cursor-pointer"
            >
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-xl shadow-lg shadow-indigo-500/20 text-white group-hover:scale-105 transition-transform">
                F
              </div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent hidden sm:inline">
                {config.appName}
              </span>
            </button>
            <SocketStatusIndicator />
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative z-10">
          <div className="w-full max-w-4xl space-y-8">
            <div className="text-center space-y-3">
              <span className="px-3 py-1 bg-purple-500/10 text-purple-400 rounded-full border border-purple-500/20 text-xs font-semibold uppercase tracking-wider">
                Session Completed
              </span>
              <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight bg-gradient-to-r from-white via-indigo-200 to-purple-400 bg-clip-text text-transparent">
                Game Over!
              </h1>
              <p className="text-slate-400 max-w-md mx-auto text-sm md:text-base">
                Congratulations to all players! Here are the final standings for this session.
              </p>
            </div>

            {/* Podium Display */}
            {podiumWinners.length > 0 && (
              <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end max-w-xl mx-auto pt-8">
                {/* 2nd Place */}
                {podiumWinners[1] && (
                  <div className="flex flex-col items-center space-y-2 min-w-0">
                    <span className="text-xs sm:text-sm font-semibold text-slate-300 truncate w-full text-center block px-1">
                      {podiumWinners[1].displayName}
                    </span>
                    <span className="text-xs text-indigo-400 font-medium">
                      {podiumWinners[1].score} pts
                    </span>
                    <div className="w-full bg-gradient-to-t from-slate-900 to-indigo-950 border border-indigo-500/10 rounded-t-2xl h-28 flex items-center justify-center shadow-lg shadow-indigo-950/20">
                      <span className="text-4xl font-black text-slate-400">2</span>
                    </div>
                  </div>
                )}

                {/* 1st Place */}
                {podiumWinners[0] && (
                  <div className="flex flex-col items-center space-y-2 min-w-0">
                    <div className="animate-bounce text-sm sm:text-base">👑</div>
                    <span className="text-sm sm:text-base font-bold text-white text-center truncate w-full block px-1">
                      {podiumWinners[0].displayName}
                    </span>
                    <span className="text-sm text-yellow-400 font-semibold">
                      {podiumWinners[0].score} pts
                    </span>
                    <div className="w-full bg-gradient-to-t from-slate-900 via-purple-950 to-indigo-900 border-t-2 border-indigo-500/30 rounded-t-2xl h-36 flex items-center justify-center shadow-2xl shadow-purple-500/10">
                      <span className="text-5xl font-black text-yellow-400">1</span>
                    </div>
                  </div>
                )}

                {/* 3rd Place */}
                {podiumWinners[2] && (
                  <div className="flex flex-col items-center space-y-2 min-w-0">
                    <span className="text-xs sm:text-sm font-semibold text-slate-300 truncate w-full text-center block px-1">
                      {podiumWinners[2].displayName}
                    </span>
                    <span className="text-xs text-indigo-400 font-medium">
                      {podiumWinners[2].score} pts
                    </span>
                    <div className="w-full bg-gradient-to-t from-slate-900 to-slate-950 border border-slate-800/80 rounded-t-2xl h-20 flex items-center justify-center shadow-md">
                      <span className="text-3xl font-bold text-amber-600">3</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Other Standings List */}
            {otherRankings.length > 0 && (
              <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl rounded-2xl p-6 max-w-xl mx-auto space-y-3">
                <h3 className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                  Remaining Standings
                </h3>
                <div className="divide-y divide-slate-800/50">
                  {otherRankings.map((entry) => (
                    <div key={entry.playerId} className="py-3 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-slate-500 font-semibold">#{entry.rank}</span>
                        <span className="text-sm font-medium text-slate-200">
                          {entry.displayName}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-slate-300">{entry.score} pts</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-4 rounded-xl shadow-xl shadow-indigo-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Render Active Gameplay View when in progress
  if (room.status === 'IN_PROGRESS') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative overflow-hidden">
        {/* Background ambient glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/5 blur-[120px] pointer-events-none" />

        {/* Header */}
        <header className="border-b border-slate-800/80 bg-slate-950/50 backdrop-blur-md px-4 sm:px-6 py-4 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <button
              onClick={handleEndGame}
              className="flex items-center gap-3 group cursor-pointer"
            >
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-xl shadow-lg shadow-indigo-500/20 text-white">
                F
              </div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent hidden sm:inline">
                {config.appName}
              </span>
            </button>

            <div className="flex items-center gap-4">
              <SocketStatusIndicator />
              {isHost && (
                <button
                  onClick={handleEndGame}
                  className="text-sm font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 px-4 py-2 rounded-xl transition-all cursor-pointer"
                >
                  End Game
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 relative z-10">
          {/* Question / Gameplay Controller (Left 2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 space-y-6 sm:space-y-8 flex flex-col justify-between min-h-[380px] sm:min-h-[450px]">
              <div className="flex justify-end items-center border-b border-slate-800/50 pb-4">
                <CountdownTimer timerRemaining={game.timerRemaining} />
              </div>

              {/* Active Question Display */}
              {game.currentQuestion ? (
                <div className="text-center space-y-6">
                  <QuestionDisplay
                    question={game.currentQuestion}
                    currentRoundIndex={game.currentRoundIndex}
                    totalRounds={game.totalRounds}
                  />

                  {game.correctAnswer ? (
                    <div className="space-y-3 max-w-sm mx-auto p-5 bg-green-500/10 border border-green-500/20 rounded-2xl animate-fade-in">
                      <span className="text-xs text-green-400 font-bold uppercase tracking-wider">
                        Answer Revealed
                      </span>
                      <p className="text-2xl font-black text-white">{game.correctAnswer}</p>
                    </div>
                  ) : game.timerRemaining === 0 ? (
                    <div
                      data-testid="round-completion-state"
                      className="space-y-6 max-w-md mx-auto p-6 bg-slate-900/80 border border-slate-800 rounded-3xl animate-fade-in flex flex-col items-center text-center shadow-2xl"
                    >
                      {/* Transition Indicator */}
                      <div
                        className="relative flex items-center justify-center"
                        data-testid="transition-indicator"
                      >
                        <div className="absolute animate-ping h-8 w-8 rounded-full bg-indigo-500/30 opacity-75"></div>
                        <svg
                          className="animate-spin h-8 w-8 text-indigo-500 relative z-10"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                      </div>

                      <div className="space-y-2">
                        {/* Waiting Message */}
                        <h4 className="text-lg font-bold text-white">Round Completed!</h4>
                        <p className="text-sm text-slate-400" data-testid="waiting-message">
                          {isHost
                            ? 'Waiting for results calculations...'
                            : 'Waiting for the host to reveal the results...'}
                        </p>
                      </div>

                      {/* Submission Status */}
                      {!isHost && (
                        <div
                          className="w-full pt-4 border-t border-slate-800/80 mt-2"
                          data-testid="submission-status"
                        >
                          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block mb-2">
                            Submission Status
                          </span>
                          {game.submittedAnswer ? (
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full text-sm font-semibold">
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2.5"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              Answer Submitted: &quot;{game.submittedAnswer}&quot;
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full text-sm font-semibold">
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2.5"
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                              No Answer Submitted
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : isHost ? (
                    <p className="text-sm font-medium text-slate-400 animate-pulse">
                      Waiting for players to submit answers...
                    </p>
                  ) : game.submittedAnswer ? (
                    <div className="space-y-3 max-w-sm mx-auto p-5 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl animate-fade-in">
                      <span className="text-xs text-indigo-400 font-bold uppercase tracking-wider">
                        Your Answer
                      </span>
                      <p className="text-2xl font-black text-white">{game.submittedAnswer}</p>
                      <p className="text-xs text-slate-400 mt-2 animate-pulse">
                        Waiting for other players...
                      </p>
                    </div>
                  ) : (
                    <AnswerSubmission
                      key={game.currentQuestion.id}
                      onSubmit={handleSubmitAnswer}
                      timerRemaining={game.timerRemaining}
                    />
                  )}
                </div>
              ) : (
                <div className="text-center py-12 space-y-4">
                  <svg
                    className="animate-spin h-10 w-10 text-indigo-500 mx-auto"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <p className="text-sm font-medium text-slate-400">Loading round prompt...</p>
                </div>
              )}

              {/* Host Control Actions */}
              {isHost && (
                <div className="border-t border-slate-800/50 pt-6 flex justify-end gap-4">
                  <button
                    onClick={handleEndGame}
                    className="px-5 py-3 border border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-white font-semibold text-sm rounded-xl cursor-pointer transition-colors"
                  >
                    End Game Early
                  </button>

                  {game.correctAnswer && (
                    <button
                      onClick={handleNextRound}
                      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/20 hover:scale-[1.01] active:scale-[0.99] cursor-pointer transition-all"
                    >
                      Next Round
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Real-time Standings (Right 1 col) */}
          <div className="space-y-6">
            {/* Live Leaderboard */}
            <LiveLeaderboard entries={leaderboard} />

            {/* Connected players presence list */}
            <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl rounded-3xl p-6 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800/50 pb-3">
                Players in Room ({players.length})
              </h3>
              <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto pr-1">
                {players.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-2 p-2 bg-slate-950/30 rounded-lg border border-slate-800/50 text-xs font-medium text-slate-300"
                  >
                    <div
                      className={`h-2 w-2 rounded-full ${
                        p.isConnected ? 'bg-green-500' : 'bg-slate-600 animate-pulse'
                      }`}
                    />
                    <span className="truncate">{p.displayName}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Default Lobby view (Lobby status: LOBBY or null)
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative overflow-hidden">
      {/* Background ambient glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/5 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/50 backdrop-blur-md px-4 sm:px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-3 group cursor-pointer"
          >
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-xl shadow-lg shadow-indigo-500/20 text-white group-hover:scale-105 transition-transform">
              F
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent hidden sm:inline">
              {config.appName}
            </span>
          </button>

          <div className="flex items-center gap-4">
            <SocketStatusIndicator />
            <button
              onClick={() => router.push('/dashboard')}
              className="text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800 hover:border-slate-700 px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Leave Room
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12 relative z-10">
        <div className="w-full max-w-2xl">
          <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 space-y-6 sm:space-y-8">
            <div className="text-center space-y-4">
              <div className="inline-flex h-16 w-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 items-center justify-center mx-auto shadow-lg shadow-indigo-500/20">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-white">Lobby</h1>
              </div>
            </div>

            <RoomInformationPanel />
            <PlayerList />

            <LobbyControls
              onStartGame={handleStartGame}
              isStarting={isStarting}
              error={startError}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
