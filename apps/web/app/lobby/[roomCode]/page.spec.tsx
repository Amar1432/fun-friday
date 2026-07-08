/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
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
  submittedAnswer: null,
};
let mockStorePlayers: any[] = [];
let mockStoreLeaderboard: any[] = [];
const mockSetRoomSpy = jest.fn();
const mockSetSubmittedAnswerSpy = jest.fn();

jest.mock('@/lib/store/use-game-store', () => ({
  useGameStore: Object.assign(
    (selector: (state: any) => any) =>
      selector({
        room: mockRoomState,
        game: mockGameState,
        players: mockStorePlayers,
        leaderboard: mockStoreLeaderboard,
        setRoom: mockSetRoomSpy,
        setSubmittedAnswer: mockSetSubmittedAnswerSpy,
      }),
    {
      getState: () => ({
        room: mockRoomState,
        game: mockGameState,
        players: mockStorePlayers,
        leaderboard: mockStoreLeaderboard,
        setRoom: mockSetRoomSpy,
        setSubmittedAnswer: mockSetSubmittedAnswerSpy,
      }),
    },
  ),
}));

const mockDispatcher = {
  joinRoom: jest.fn(),
  leaveRoom: jest.fn(),
  playerReady: jest.fn(),
  startGame: jest.fn(),
  nextRound: jest.fn(),
  endGame: jest.fn(),
  submitAnswer: jest.fn(),
  reconnectRequest: jest.fn(),
};

jest.mock('@/lib/socket/socket-context', () => ({
  useSocket: jest.fn(),
  useSocketEvent: jest.fn(),
  useSocketDispatcher: jest.fn(() => mockDispatcher),
}));

jest.mock('@/lib/config', () => ({
  config: {
    appName: 'Fun Friday Hub',
  },
}));

describe('LobbyPage Component', () => {
  const mockPush = jest.fn();
  const mockSocketEmit = jest.fn();
  const mockRegisterListener = jest.fn();
  const mockUnregisterListener = jest.fn();
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
    mockGameState.submittedAnswer = null;

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
      registerListener: mockRegisterListener,
      unregisterListener: mockUnregisterListener,
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
    expect(mockDispatcher.joinRoom).toHaveBeenCalledWith({
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

    expect(mockDispatcher.startGame).toHaveBeenCalledWith({
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

  it('navigates to dashboard when clicking Return to Dashboard on Finished screen', () => {
    mockRoomState.status = 'FINISHED';
    mockStoreLeaderboard = [
      { rank: 1, playerId: 'p-1', displayName: 'Alice', score: 200, streak: 3 },
    ];

    render(<LobbyPage />);

    const returnBtn = screen.getByRole('button', { name: 'Return to Dashboard' });
    expect(returnBtn).toBeInTheDocument();
    fireEvent.click(returnBtn);
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  it('submits answer and handles SubmitAnswerAck successfully', async () => {
    mockRoomState.status = 'IN_PROGRESS';
    mockRoomState.hostId = 'host-123';
    mockGameState.currentQuestion = {
      id: 'q-1',
      prompt: '🎩⚡👦',
      timeLimitSeconds: 20,
      difficulty: 'MEDIUM',
    };
    mockGameState.timerRemaining = 15;
    mockGameState.submittedAnswer = null;

    mockUseAuth.mockReturnValue({
      user: { id: 'player-1', name: 'Player 1', email: 'player@example.com' },
      token: 'player-token',
      isLoading: false,
    });

    render(<LobbyPage />);

    const input = screen.getByPlaceholderText('Type your guess here...');
    fireEvent.change(input, { target: { value: 'Harry Potter' } });
    const submitButton = screen.getByRole('button', { name: 'Submit Answer' });

    // Click submit
    fireEvent.click(submitButton);

    // Verify SubmitAnswer socket event is emitted
    expect(mockDispatcher.submitAnswer).toHaveBeenCalledWith({
      roomId: 'room-123',
      questionId: 'q-1',
      answer: 'Harry Potter',
      responseTimeMs: expect.any(Number),
    });

    // Verify listeners registered
    expect(mockRegisterListener).toHaveBeenCalledWith('SubmitAnswerAck', expect.any(Function));
    expect(mockRegisterListener).toHaveBeenCalledWith('error', expect.any(Function));

    // Retrieve and fire the SubmitAnswerAck callback
    const ackCall = mockRegisterListener.mock.calls.find((call) => call[0] === 'SubmitAnswerAck');
    expect(ackCall).toBeDefined();
    const ackCallback = ackCall[1];

    await act(async () => {
      ackCallback({
        success: true,
        data: {
          playerId: 'player-1',
          roundId: 'round-1',
          questionId: 'q-1',
          answerText: 'Harry Potter',
          responseTimeMs: 500,
        },
      });
      await new Promise((r) => setTimeout(r, 0));
    });

    // Check that setSubmittedAnswer is called and unregister is called
    expect(mockSetSubmittedAnswerSpy).toHaveBeenCalledWith('Harry Potter');
    expect(mockUnregisterListener).toHaveBeenCalledWith('SubmitAnswerAck', expect.any(Function));
    expect(mockUnregisterListener).toHaveBeenCalledWith('error', expect.any(Function));
  });

  it('submits answer and handles socket error during submission', async () => {
    mockRoomState.status = 'IN_PROGRESS';
    mockRoomState.hostId = 'host-123';
    mockGameState.currentQuestion = {
      id: 'q-1',
      prompt: '🎩⚡👦',
      timeLimitSeconds: 20,
      difficulty: 'MEDIUM',
    };
    mockGameState.timerRemaining = 15;
    mockGameState.submittedAnswer = null;

    mockUseAuth.mockReturnValue({
      user: { id: 'player-1', name: 'Player 1', email: 'player@example.com' },
      token: 'player-token',
      isLoading: false,
    });

    render(<LobbyPage />);

    const input = screen.getByPlaceholderText('Type your guess here...');
    fireEvent.change(input, { target: { value: 'Harry Potter' } });
    const submitButton = screen.getByRole('button', { name: 'Submit Answer' });

    // Click submit
    fireEvent.click(submitButton);

    // Retrieve and fire the error callback
    const errorCall = mockRegisterListener.mock.calls.find((call) => call[0] === 'error');
    expect(errorCall).toBeDefined();
    const errorCallback = errorCall[1];

    await act(async () => {
      errorCallback({
        success: false,
        error: { code: 'ROUND_ALREADY_COMPLETED', message: 'Round already completed.' },
      });
      await new Promise((r) => setTimeout(r, 0));
    });

    // Check that setSubmittedAnswer was NOT called, and listeners are cleaned up
    expect(mockSetSubmittedAnswerSpy).not.toHaveBeenCalled();
    expect(mockUnregisterListener).toHaveBeenCalledWith('SubmitAnswerAck', expect.any(Function));
    expect(mockUnregisterListener).toHaveBeenCalledWith('error', expect.any(Function));
  });

  it('renders round completion state for non-host player when timer expires and they submitted an answer', () => {
    mockRoomState.status = 'IN_PROGRESS';
    mockRoomState.hostId = 'host-123';
    mockGameState.currentQuestion = {
      id: 'q-1',
      prompt: '🎩⚡👦',
      timeLimitSeconds: 20,
      difficulty: 'MEDIUM',
    };
    mockGameState.timerRemaining = 0;
    mockGameState.submittedAnswer = 'Harry Potter';

    // Override user to be a normal player
    mockUseAuth.mockReturnValue({
      user: { id: 'player-1', name: 'Player 1', email: 'player@example.com' },
      token: 'player-token',
      isLoading: false,
    });

    render(<LobbyPage />);

    expect(screen.getByTestId('round-completion-state')).toBeInTheDocument();
    expect(screen.getByTestId('transition-indicator')).toBeInTheDocument();
    expect(screen.getByTestId('waiting-message')).toHaveTextContent(
      'Waiting for the host to reveal the results...',
    );
    expect(screen.getByTestId('submission-status')).toHaveTextContent(
      'Answer Submitted: "Harry Potter"',
    );
    expect(screen.queryByPlaceholderText('Type your guess here...')).not.toBeInTheDocument();
  });

  it('renders round completion state for non-host player when timer expires and they did not submit an answer', () => {
    mockRoomState.status = 'IN_PROGRESS';
    mockRoomState.hostId = 'host-123';
    mockGameState.currentQuestion = {
      id: 'q-1',
      prompt: '🎩⚡👦',
      timeLimitSeconds: 20,
      difficulty: 'MEDIUM',
    };
    mockGameState.timerRemaining = 0;
    mockGameState.submittedAnswer = null;

    // Override user to be a normal player
    mockUseAuth.mockReturnValue({
      user: { id: 'player-1', name: 'Player 1', email: 'player@example.com' },
      token: 'player-token',
      isLoading: false,
    });

    render(<LobbyPage />);

    expect(screen.getByTestId('round-completion-state')).toBeInTheDocument();
    expect(screen.getByTestId('transition-indicator')).toBeInTheDocument();
    expect(screen.getByTestId('waiting-message')).toHaveTextContent(
      'Waiting for the host to reveal the results...',
    );
    expect(screen.getByTestId('submission-status')).toHaveTextContent('No Answer Submitted');
    expect(screen.queryByPlaceholderText('Type your guess here...')).not.toBeInTheDocument();
  });

  it('renders round completion state for host when timer expires', () => {
    mockRoomState.status = 'IN_PROGRESS';
    mockRoomState.hostId = 'host-123';
    mockGameState.currentQuestion = {
      id: 'q-1',
      prompt: '🎩⚡👦',
      timeLimitSeconds: 20,
      difficulty: 'MEDIUM',
    };
    mockGameState.timerRemaining = 0;
    mockGameState.submittedAnswer = null;

    // Host user
    mockUseAuth.mockReturnValue({
      user: { id: 'host-123', name: 'Host User', email: 'host@example.com' },
      token: 'host-token',
      isLoading: false,
    });

    render(<LobbyPage />);

    expect(screen.getByTestId('round-completion-state')).toBeInTheDocument();
    expect(screen.getByTestId('transition-indicator')).toBeInTheDocument();
    expect(screen.getByTestId('waiting-message')).toHaveTextContent(
      'Waiting for results calculations...',
    );
    expect(screen.queryByTestId('submission-status')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Type your guess here...')).not.toBeInTheDocument();
  });
});
