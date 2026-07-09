/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react';
import { render } from '@testing-library/react';
import { useSocketSync } from './use-socket-sync';
import { useSocketEvent, useSocket } from './socket-context';

// Mock mockActions for Zustand
const mockActions = {
  setUser: jest.fn(),
  setConnectionStatus: jest.fn(),
  addPlayer: jest.fn(),
  removePlayer: jest.fn(),
  setRoom: jest.fn(),
  setPlayers: jest.fn(),
  setGameStarted: jest.fn(),
  setQuestionStarted: jest.fn(),
  setTimerTick: jest.fn(),
  setAnswerReveal: jest.fn(),
  setLeaderboard: jest.fn(),
  setGameFinished: jest.fn(),
  syncState: jest.fn(),
};

jest.mock('@/lib/store/use-game-store', () => ({
  useGameStore: (selector: any) =>
    selector({
      ...mockActions,
      room: { id: 'r-123', code: 'ABCDEF', status: 'IN_PROGRESS', hostId: 'h-123' },
    }),
}));

// Mock socket hooks
jest.mock('./socket-context', () => ({
  useSocket: jest.fn(() => ({ status: 'disconnected' })),
  useSocketEvent: jest.fn(),
}));

// Mock useAuth context
const mockUseAuth = jest.fn(() => ({
  user: { id: 'u-123', name: 'John Doe', email: 'john@example.com' },
}));

jest.mock('@/lib/auth/auth-context', () => ({
  useAuth: () => mockUseAuth(),
}));

// Helper component
function TestComponent() {
  useSocketSync();
  return <div data-testid="sync">Sync Active</div>;
}

describe('useSocketSync Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should synchronize connection status to Zustand store', () => {
    (useSocket as jest.Mock).mockReturnValue({ status: 'connected' });

    render(<TestComponent />);

    expect(mockActions.setConnectionStatus).toHaveBeenCalledWith('connected');
  });

  it('should register listeners for all ROOM_PROTOCOL events', () => {
    render(<TestComponent />);

    expect(useSocketEvent).toHaveBeenCalledWith('PlayerJoined', expect.any(Function));
    expect(useSocketEvent).toHaveBeenCalledWith('PlayerLeft', expect.any(Function));
    expect(useSocketEvent).toHaveBeenCalledWith('RoomStateUpdated', expect.any(Function));
    expect(useSocketEvent).toHaveBeenCalledWith('GameStarted', expect.any(Function));
    expect(useSocketEvent).toHaveBeenCalledWith('QuestionStarted', expect.any(Function));
    expect(useSocketEvent).toHaveBeenCalledWith('TimerTick', expect.any(Function));
    expect(useSocketEvent).toHaveBeenCalledWith('AnswerReveal', expect.any(Function));
    expect(useSocketEvent).toHaveBeenCalledWith('LeaderboardUpdated', expect.any(Function));
    expect(useSocketEvent).toHaveBeenCalledWith('GameFinished', expect.any(Function));
    expect(useSocketEvent).toHaveBeenCalledWith('StateSync', expect.any(Function));
  });

  it('should trigger store updates when events fire', () => {
    render(<TestComponent />);

    // Get registered listener callbacks from the mock calls
    const mockCalls = (useSocketEvent as jest.Mock).mock.calls;

    const findCallback = (event: string) => {
      const call = mockCalls.find((c) => c[0] === event);
      return call ? call[1] : null;
    };

    // Trigger PlayerJoined
    const playerJoinedCb = findCallback('PlayerJoined');
    expect(playerJoinedCb).toBeDefined();
    const mockPlayer = { id: 'p1', displayName: 'Player 1', score: 0, isReady: true };
    playerJoinedCb({ player: mockPlayer });
    expect(mockActions.addPlayer).toHaveBeenCalledWith(mockPlayer);

    // Trigger PlayerLeft
    const playerLeftCb = findCallback('PlayerLeft');
    expect(playerLeftCb).toBeDefined();
    playerLeftCb({ playerId: 'p1' });
    expect(mockActions.removePlayer).toHaveBeenCalledWith('p1');

    // Trigger RoomStateUpdated
    const roomStateCb = findCallback('RoomStateUpdated');
    expect(roomStateCb).toBeDefined();
    roomStateCb({ status: 'LOBBY', hostId: 'host-1', players: [mockPlayer] });
    expect(mockActions.setRoom).toHaveBeenCalledWith({ status: 'LOBBY', hostId: 'host-1' });
    expect(mockActions.setPlayers).toHaveBeenCalledWith([mockPlayer]);

    // Trigger GameStarted
    const gameStartedCb = findCallback('GameStarted');
    expect(gameStartedCb).toBeDefined();
    gameStartedCb({ gameId: 'g1', totalRounds: 5 });
    expect(mockActions.setGameStarted).toHaveBeenCalledWith('g1', 5);

    // Trigger QuestionStarted
    const questionStartedCb = findCallback('QuestionStarted');
    expect(questionStartedCb).toBeDefined();
    const mockQuestion = {
      questionId: 'q1',
      prompt: 'Prompt',
      timeLimitSeconds: 15,
      difficulty: 'MEDIUM',
    };
    questionStartedCb(mockQuestion);
    expect(mockActions.setQuestionStarted).toHaveBeenCalledWith({
      id: 'q1',
      prompt: 'Prompt',
      timeLimitSeconds: 15,
      difficulty: 'MEDIUM',
    });

    // Trigger TimerTick
    const timerTickCb = findCallback('TimerTick');
    expect(timerTickCb).toBeDefined();
    timerTickCb({ secondsRemaining: 10 });
    expect(mockActions.setTimerTick).toHaveBeenCalledWith(10);

    // Trigger AnswerReveal
    const answerRevealCb = findCallback('AnswerReveal');
    expect(answerRevealCb).toBeDefined();
    answerRevealCb({ correctAnswer: 'Revealed Answer' });
    expect(mockActions.setAnswerReveal).toHaveBeenCalledWith('Revealed Answer');

    // Trigger LeaderboardUpdated
    const lbCb = findCallback('LeaderboardUpdated');
    expect(lbCb).toBeDefined();
    const mockLb = [{ rank: 1, playerId: 'p1', displayName: 'Player 1', score: 10, streak: 1 }];
    lbCb(mockLb);
    expect(mockActions.setLeaderboard).toHaveBeenCalledWith(mockLb);

    // Trigger GameFinished
    const finishedCb = findCallback('GameFinished');
    expect(finishedCb).toBeDefined();
    finishedCb({ finalRankings: mockLb });
    expect(mockActions.setGameFinished).toHaveBeenCalledWith(mockLb);

    // Trigger StateSync
    const syncCb = findCallback('StateSync');
    expect(syncCb).toBeDefined();
    syncCb({ status: 'IN_PROGRESS', players: [mockPlayer], leaderboard: mockLb });
    expect(mockActions.syncState).toHaveBeenCalledWith({
      status: 'IN_PROGRESS',
      players: [mockPlayer],
      leaderboard: mockLb,
    });
  });
});
