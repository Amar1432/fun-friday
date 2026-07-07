'use client';
/* eslint-disable no-console */

import * as React from 'react';
import { useSocket, useSocketEvent } from './socket-context';
import { useGameStore } from '@/lib/store/use-game-store';
import { useAuth } from '@/lib/auth/auth-context';

export function useSocketSync() {
  const { status } = useSocket();
  const { user } = useAuth();
  const setUser = useGameStore((state) => state.setUser);
  const setConnectionStatus = useGameStore((state) => state.setConnectionStatus);
  const addPlayer = useGameStore((state) => state.addPlayer);
  const removePlayer = useGameStore((state) => state.removePlayer);
  const setRoom = useGameStore((state) => state.setRoom);
  const setPlayers = useGameStore((state) => state.setPlayers);
  const setGameStarted = useGameStore((state) => state.setGameStarted);
  const setQuestionStarted = useGameStore((state) => state.setQuestionStarted);
  const setTimerTick = useGameStore((state) => state.setTimerTick);
  const setAnswerReveal = useGameStore((state) => state.setAnswerReveal);
  const setLeaderboard = useGameStore((state) => state.setLeaderboard);
  const setGameFinished = useGameStore((state) => state.setGameFinished);
  const syncState = useGameStore((state) => state.syncState);

  // Sync user state
  React.useEffect(() => {
    setUser(user);
  }, [user, setUser]);

  // Sync connection status
  React.useEffect(() => {
    setConnectionStatus(status);
  }, [status, setConnectionStatus]);

  // Subscribe to all game events with stable callbacks
  useSocketEvent(
    'PlayerJoined',
    React.useCallback(
      (data) => {
        addPlayer(data.player);
      },
      [addPlayer],
    ),
  );

  useSocketEvent(
    'PlayerLeft',
    React.useCallback(
      (data) => {
        removePlayer(data.playerId);
      },
      [removePlayer],
    ),
  );

  useSocketEvent(
    'RoomStateUpdated',
    React.useCallback(
      (data) => {
        setRoom({ status: data.status, hostId: data.hostId });
        setPlayers(data.players);
      },
      [setRoom, setPlayers],
    ),
  );

  useSocketEvent(
    'GameStarted',
    React.useCallback(
      (data) => {
        setGameStarted(data.gameId, data.totalRounds);
      },
      [setGameStarted],
    ),
  );

  useSocketEvent(
    'QuestionStarted',
    React.useCallback(
      (data) => {
        setQuestionStarted({
          id: data.questionId,
          prompt: data.prompt,
          timeLimitSeconds: data.timeLimitSeconds,
          difficulty: data.difficulty,
        });
      },
      [setQuestionStarted],
    ),
  );

  useSocketEvent(
    'TimerTick',
    React.useCallback(
      (data) => {
        setTimerTick(data.secondsRemaining);
      },
      [setTimerTick],
    ),
  );

  useSocketEvent(
    'AnswerReveal',
    React.useCallback(
      (data) => {
        setAnswerReveal(data.correctAnswer);
      },
      [setAnswerReveal],
    ),
  );

  useSocketEvent(
    'LeaderboardUpdated',
    React.useCallback(
      (data) => {
        setLeaderboard(data);
      },
      [setLeaderboard],
    ),
  );

  useSocketEvent(
    'GameFinished',
    React.useCallback(
      (data) => {
        setGameFinished(data.finalRankings);
      },
      [setGameFinished],
    ),
  );

  useSocketEvent(
    'StateSync',
    React.useCallback(
      (data) => {
        syncState({
          status: data.status,
          players: data.players,
          leaderboard: data.leaderboard,
        });
      },
      [syncState],
    ),
  );

  useSocketEvent(
    'error',
    React.useCallback((error) => {
      console.error('Socket protocol error event received:', error);
    }, []),
  );
}

/**
 * A helper component that calls useSocketSync globally when mounted.
 */
export function SocketSyncRoot() {
  useSocketSync();
  return null;
}
