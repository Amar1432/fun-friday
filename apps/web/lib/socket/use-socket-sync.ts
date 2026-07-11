'use client';
/* eslint-disable no-console */

import * as React from 'react';
import { useSocket, useSocketEvent } from './socket-context';
import { useGameStore } from '@/lib/store/use-game-store';
import { useAuth } from '@/lib/auth/auth-context';
import { getStrategyForGameId } from '@/lib/game-modes';

export function useSocketSync() {
  const { status, dispatcher } = useSocket();
  const { user } = useAuth();
  const room = useGameStore((state) => state.room);
  const prevStatusRef = React.useRef(status);
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

  // Handle reconnection state sync automatically
  React.useEffect(() => {
    const isReconnectingTransition =
      (status === 'restoring' || status === 'connected') &&
      prevStatusRef.current !== 'restoring' &&
      prevStatusRef.current !== 'connected';

    if (isReconnectingTransition && room.id && room.status && user?.id) {
      console.log(
        `[SocketSync] Socket reconnected (status: ${status}). Emitting ReconnectRequest...`,
      );
      dispatcher.reconnectRequest({
        playerId: user.id,
        roomId: room.id,
      });
    }
    prevStatusRef.current = status;
  }, [status, room.id, room.status, user?.id, dispatcher]);

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
        setRoom({
          status: data.status,
          hostId: data.hostId,
          hostName: data.hostName ?? null,
          selectedGameId: data.selectedGameId ?? null,
        });
        setPlayers(data.players);
      },
      [setRoom, setPlayers],
    ),
  );

  useSocketEvent(
    'GameStarted',
    React.useCallback(
      (data) => {
        const renderingStrategy = getStrategyForGameId(data.gameId);
        setGameStarted(data.gameId, data.totalRounds, renderingStrategy);
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
        syncState(data);
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
