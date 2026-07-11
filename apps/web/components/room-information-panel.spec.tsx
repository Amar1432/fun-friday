/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { RoomInformationPanel } from './room-information-panel';

let mockState = {
  room: {
    id: null as string | null,
    code: null as string | null,
    status: null as 'LOBBY' | 'IN_PROGRESS' | 'FINISHED' | null,
    hostId: null as string | null,
    hostName: null as string | null,
  },
  players: [] as any[],
  game: {
    gameId: null as string | null,
    totalRounds: 0,
    currentRoundIndex: 0,
    currentRoundId: null as string | null,
    currentQuestion: null as any,
    timerRemaining: null as number | null,
    correctAnswer: null as string | null,
    submittedAnswer: null as string | null,
  },
  user: null as any,
};

jest.mock('@/lib/store/use-game-store', () => ({
  useGameStore: (selector: (state: any) => any) => selector(mockState),
}));

describe('RoomInformationPanel Component', () => {
  beforeEach(() => {
    // Reset mock state
    mockState = {
      room: {
        id: null,
        code: null,
        status: null,
        hostId: null,
        hostName: null,
      },
      players: [],
      game: {
        gameId: null,
        totalRounds: 0,
        currentRoundIndex: 0,
        currentRoundId: null,
        currentQuestion: null,
        timerRemaining: null,
        correctAnswer: null,
        submittedAnswer: null,
      },
      user: null,
    };
    jest.clearAllMocks();
  });

  it('renders null when there is no room code', () => {
    const { container } = render(<RoomInformationPanel />);
    expect(container.firstChild).toBeNull();
  });

  it('renders room code, status (LOBBY), host info via hostName, and empty player list when room code is present', () => {
    mockState.room = {
      id: 'room-123',
      code: 'ABCDEF',
      status: 'LOBBY',
      hostId: 'host-123',
      hostName: 'Host User',
    };

    render(<RoomInformationPanel />);

    expect(screen.getByText('Room')).toBeInTheDocument();
    expect(screen.getByText('ABCDEF')).toBeInTheDocument();
    expect(screen.getByText('Lobby')).toBeInTheDocument();

    expect(screen.getByText('Host User')).toBeInTheDocument();
    expect(screen.getByText('Host')).toBeInTheDocument();
  });

  it('renders In Progress status correctly', () => {
    mockState.room = {
      id: 'room-123',
      code: 'ABCDEF',
      status: 'IN_PROGRESS',
      hostId: 'host-123',
      hostName: null,
    };

    render(<RoomInformationPanel />);

    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });

  it('renders Finished status correctly', () => {
    mockState.room = {
      id: 'room-123',
      code: 'ABCDEF',
      status: 'FINISHED',
      hostId: 'host-123',
      hostName: null,
    };

    render(<RoomInformationPanel />);

    expect(screen.getByText('Finished')).toBeInTheDocument();
  });

  it('renders game progress when game is in progress', () => {
    mockState.room = {
      id: 'room-123',
      code: 'ABCDEF',
      status: 'IN_PROGRESS',
      hostId: 'host-123',
      hostName: null,
    };
    mockState.game = {
      gameId: 'game-123',
      totalRounds: 5,
      currentRoundIndex: 2, // 3rd round (2 + 1)
      currentRoundId: 'round-3',
      currentQuestion: {
        id: 'q-1',
        prompt: 'Test Question',
        timeLimitSeconds: 15,
        difficulty: 'EASY',
      },
      timerRemaining: 12,
      correctAnswer: null,
      submittedAnswer: null,
    };

    render(<RoomInformationPanel />);

    expect(screen.getByText('Round')).toBeInTheDocument();
    expect(screen.getByText('3/5')).toBeInTheDocument();
    expect(screen.getByText('Time')).toBeInTheDocument();
    expect(screen.getByText('12s')).toBeInTheDocument();
  });
});
