/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import LobbyPage from './page';
import { useSocket } from '@/lib/socket/socket-context';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock('@/lib/auth/auth-context', () => ({
  useAuth: jest.fn(),
}));

// Mock Zustand Store
const mockRoomState = {
  id: 'room-123',
  code: 'ABCDEF',
  status: 'LOBBY',
  hostId: 'host-123',
};
const mockGameState: any = {
  gameId: null,
  totalRounds: 5,
  currentRoundIndex: 0,
  currentQuestion: null,
  timerRemaining: null,
  correctAnswer: null,
};
let mockStorePlayers: any[] = [];
let mockStoreLeaderboard: any[] = [];
const mockSetRoomSpy = jest.fn();

jest.mock('@/lib/store/use-game-store', () => ({
  useGameStore: Object.assign(
    (selector: (state: any) => any) =>
      selector({
        room: mockRoomState,
        game: mockGameState,
        players: mockStorePlayers,
        leaderboard: mockStoreLeaderboard,
        setRoom: mockSetRoomSpy,
      }),
    {
      getState: () => ({
        room: mockRoomState,
        game: mockGameState,
        players: mockStorePlayers,
        leaderboard: mockStoreLeaderboard,
        setRoom: mockSetRoomSpy,
      }),
    },
  ),
}));

jest.mock('@/lib/socket/socket-context', () => ({
  useSocket: jest.fn(),
  useSocketEvent: jest.fn(),
}));

jest.mock('@/lib/config', () => ({
  config: {
    appName: 'Fun Friday Hub',
  },
}));

describe('LobbyPage Component', () => {
  const mockPush = jest.fn();
  const mockSocketEmit = jest.fn();
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mockUseAuth = require('@/lib/auth/auth-context').useAuth as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockStorePlayers = [];
    mockStoreLeaderboard = [];
    mockRoomState.status = 'LOBBY';
    mockRoomState.id = 'room-123';
    mockGameState.currentQuestion = null;
    mockGameState.correctAnswer = null;

    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    (useParams as jest.Mock).mockReturnValue({
      roomCode: 'ABCDEF',
    });
    (useSearchParams as jest.Mock).mockReturnValue({
      get: (key: string) => (key === 'roomId' ? 'room-123' : null),
    });

    mockUseAuth.mockReturnValue({
      user: { id: 'host-123', name: 'Host User', email: 'host@example.com' },
      token: 'host-token',
      isLoading: false,
    });

    (useSocket as jest.Mock).mockReturnValue({
      socket: {
        emit: mockSocketEmit,
      },
      status: 'connected',
    });
  });

  it('renders loading state when auth is loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      token: null,
      isLoading: true,
    });

    render(<LobbyPage />);
    expect(screen.getByText('Loading session...')).toBeInTheDocument();
  });

  it('redirects to join room page if user is not authenticated and roomCode is present', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      token: null,
      isLoading: false,
    });

    render(<LobbyPage />);
    expect(mockPush).toHaveBeenCalledWith('/room/join?code=ABCDEF');
  });

  it('redirects to login if user is not authenticated and roomCode is not present', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      token: null,
      isLoading: false,
    });
    (useParams as jest.Mock).mockReturnValue({
      roomCode: undefined,
    });

    render(<LobbyPage />);
    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('sets room state on mount and emits JoinRoom socket event', () => {
    render(<LobbyPage />);

    expect(mockSetRoomSpy).toHaveBeenCalledWith({
      code: 'ABCDEF',
      id: 'room-123',
    });
    expect(mockSocketEmit).toHaveBeenCalledWith('JoinRoom', {
      roomCode: 'ABCDEF',
      displayName: 'Host User',
      guestToken: '',
    });
  });

  it('emits StartGame socket event when Start Game button is clicked', async () => {
    mockStorePlayers = [
      { id: 'p-1', displayName: 'Player 1', score: 0, isReady: true, isConnected: true },
    ];

    render(<LobbyPage />);

    const startButton = screen.getByTestId('start-game-button');
    expect(startButton).toBeEnabled();

    fireEvent.click(startButton);

    expect(mockSocketEmit).toHaveBeenCalledWith('StartGame', {
      roomId: 'room-123',
      gameId: '1cd83808-737f-4c29-ab51-adff5c6a1ef5',
    });
  });

  it('transitions UI and renders gameplay screen when room status is IN_PROGRESS', () => {
    mockRoomState.status = 'IN_PROGRESS';
    mockGameState.currentQuestion = {
      id: 'q-1',
      prompt: '🎩⚡👦',
      timeLimitSeconds: 20,
      difficulty: 'MEDIUM',
    };
    mockGameState.timerRemaining = 15;

    render(<LobbyPage />);

    expect(screen.queryByTestId('lobby-controls')).not.toBeInTheDocument();
    expect(screen.getByText('Round 1 of 5')).toBeInTheDocument();
    expect(screen.getByText('🎩⚡👦')).toBeInTheDocument();
    expect(screen.getByText('15s')).toBeInTheDocument();
  });

  it('reveals correct answer in gameplay screen when correctAnswer is present', () => {
    mockRoomState.status = 'IN_PROGRESS';
    mockGameState.currentQuestion = {
      id: 'q-1',
      prompt: '🎩⚡👦',
      timeLimitSeconds: 20,
      difficulty: 'MEDIUM',
    };
    mockGameState.correctAnswer = 'Harry Potter';

    render(<LobbyPage />);

    expect(screen.getByText('Harry Potter')).toBeInTheDocument();
    expect(screen.getByText('Next Round')).toBeInTheDocument();
  });

  it('renders answer input form for non-host players and hides host controls', () => {
    mockRoomState.status = 'IN_PROGRESS';
    mockRoomState.hostId = 'host-123';
    mockGameState.currentQuestion = {
      id: 'q-1',
      prompt: '🎩⚡👦',
      timeLimitSeconds: 20,
      difficulty: 'MEDIUM',
    };
    mockGameState.timerRemaining = 15;

    // Override user to be a normal player
    mockUseAuth.mockReturnValue({
      user: { id: 'player-1', name: 'Player 1', email: 'player@example.com' },
      token: 'player-token',
      isLoading: false,
    });

    render(<LobbyPage />);

    // Non-host should see the input field
    expect(screen.getByPlaceholderText('Type your guess here...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit Answer' })).toBeInTheDocument();

    // Non-host should not see host controls
    expect(screen.queryByText('End Game')).not.toBeInTheDocument();
    expect(screen.queryByText('End Game Early')).not.toBeInTheDocument();
    expect(screen.queryByText('Next Round')).not.toBeInTheDocument();
  });

  it('renders submitted answer state for non-host players', () => {
    mockRoomState.status = 'IN_PROGRESS';
    mockRoomState.hostId = 'host-123';
    mockGameState.currentQuestion = {
      id: 'q-1',
      prompt: '🎩⚡👦',
      timeLimitSeconds: 20,
      difficulty: 'MEDIUM',
    };
    mockGameState.submittedAnswer = 'Harry Potter';

    // Override user to be a normal player
    mockUseAuth.mockReturnValue({
      user: { id: 'player-1', name: 'Player 1', email: 'player@example.com' },
      token: 'player-token',
      isLoading: false,
    });

    render(<LobbyPage />);

    expect(screen.getByText('Your Answer')).toBeInTheDocument();
    expect(screen.getByText('Harry Potter')).toBeInTheDocument();
    expect(screen.getByText('Waiting for other players...')).toBeInTheDocument();
  });

  it('transitions UI and renders Podium / Finished screen when room status is FINISHED', () => {
    mockRoomState.status = 'FINISHED';
    mockStoreLeaderboard = [
      { rank: 1, playerId: 'p-1', displayName: 'Alice', score: 200, streak: 3 },
      { rank: 2, playerId: 'p-2', displayName: 'Bob', score: 150, streak: 1 },
      { rank: 3, playerId: 'p-3', displayName: 'Charlie', score: 100, streak: 0 },
    ];

    render(<LobbyPage />);

    expect(screen.getByText('Game Over!')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
  });
});
