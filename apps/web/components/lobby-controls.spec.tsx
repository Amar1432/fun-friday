/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { LobbyControls } from './lobby-controls';
import { Player } from '@/lib/socket/types';

let mockPlayers: Player[] = [];

jest.mock('@/lib/store/use-game-store', () => ({
  useGameStore: (selector: (state: any) => any) => selector({ players: mockPlayers }),
}));

describe('LobbyControls Component', () => {
  beforeEach(() => {
    mockPlayers = [];
    jest.clearAllMocks();
  });

  // ── Host Views ───────────────────────────────────────────────────────

  it('shows disabled Start Game button for host when no players', () => {
    render(<LobbyControls isHost={true} />);

    expect(screen.getByTestId('player-count')).toHaveTextContent('0');
    expect(screen.getByTestId('ready-count')).toHaveTextContent('0/0');

    const startButton = screen.getByTestId('start-game-button');
    expect(startButton).toBeDisabled();
    expect(startButton).toHaveTextContent('Start Game');

    expect(screen.getByTestId('lobby-status-message')).toHaveTextContent('Waiting for players...');
  });

  it('shows disabled Start Game button for host when some players are not ready', () => {
    mockPlayers = [
      { id: 'p-1', displayName: 'Alice', score: 0, isReady: true, isConnected: true },
      { id: 'p-2', displayName: 'Bob', score: 0, isReady: false, isConnected: true },
    ];

    render(<LobbyControls isHost={true} />);

    expect(screen.getByTestId('player-count')).toHaveTextContent('2');
    expect(screen.getByTestId('ready-count')).toHaveTextContent('1/2');

    const startButton = screen.getByTestId('start-game-button');
    expect(startButton).toBeDisabled();

    expect(screen.getByTestId('lobby-status-message')).toHaveTextContent('Waiting for ready...');
  });

  it('shows enabled Start Game button for host when all players ready', () => {
    const onStartGameSpy = jest.fn();
    mockPlayers = [
      { id: 'p-1', displayName: 'Alice', score: 0, isReady: true, isConnected: true },
      { id: 'p-2', displayName: 'Bob', score: 0, isReady: true, isConnected: true },
    ];

    render(<LobbyControls onStartGame={onStartGameSpy} isHost={true} />);

    expect(screen.getByTestId('player-count')).toHaveTextContent('2');
    expect(screen.getByTestId('ready-count')).toHaveTextContent('2/2');

    const startButton = screen.getByTestId('start-game-button');
    expect(startButton).toBeEnabled();

    expect(screen.getByTestId('lobby-status-message')).toHaveTextContent('All players ready!');

    fireEvent.click(startButton);
    expect(onStartGameSpy).toHaveBeenCalledTimes(1);
  });

  it('shows starting-in-progress state for host when isStarting is true', () => {
    mockPlayers = [{ id: 'p-1', displayName: 'Alice', score: 0, isReady: true, isConnected: true }];

    render(<LobbyControls isHost={true} isStarting={true} />);

    const startButton = screen.getByTestId('start-game-button');
    expect(startButton).toBeDisabled();
    expect(startButton).toHaveTextContent('Starting...');
  });

  it('renders error message for host when error prop is provided', () => {
    render(
      <LobbyControls isHost={true} error="Failed to launch game session due to connection error" />,
    );

    expect(screen.getByTestId('lobby-error-message')).toHaveTextContent(
      'Failed to launch game session due to connection error',
    );
  });

  // ── Non-Host Views ───────────────────────────────────────────────────

  it('shows player stats for non-host', () => {
    mockPlayers = [
      { id: 'p-1', displayName: 'Alice', score: 0, isReady: true, isConnected: true },
      { id: 'p-2', displayName: 'Bob', score: 0, isReady: true, isConnected: true },
    ];

    render(<LobbyControls isHost={false} />);

    expect(screen.getByTestId('player-count')).toHaveTextContent('2');
    expect(screen.getByTestId('ready-count')).toHaveTextContent('2/2');
    expect(screen.getByTestId('lobby-status-message')).toHaveTextContent(
      'All players ready — waiting for host',
    );
  });

  it('does NOT render Start Game button for non-host', () => {
    render(<LobbyControls isHost={false} />);

    expect(screen.queryByTestId('start-game-button')).not.toBeInTheDocument();
  });

  it('shows "waiting for host" placeholder for non-host instead of Start Game button', () => {
    render(<LobbyControls isHost={false} />);

    expect(screen.getByText('Waiting for host to start...')).toBeInTheDocument();
  });

  it('shows correct status message progression for non-host', () => {
    // Empty state
    const { rerender } = render(<LobbyControls isHost={false} />);
    expect(screen.getByTestId('lobby-status-message')).toHaveTextContent('Waiting for players...');

    // With players, not all ready
    mockPlayers = [
      { id: 'p-1', displayName: 'Alice', score: 0, isReady: false, isConnected: true },
    ];
    rerender(<LobbyControls isHost={false} />);
    expect(screen.getByTestId('lobby-status-message')).toHaveTextContent('Waiting for ready...');

    // All ready
    mockPlayers = [{ id: 'p-1', displayName: 'Alice', score: 0, isReady: true, isConnected: true }];
    rerender(<LobbyControls isHost={false} />);
    expect(screen.getByTestId('lobby-status-message')).toHaveTextContent(
      'All players ready — waiting for host',
    );
  });
});
