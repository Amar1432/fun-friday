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

  it('renders correctly in empty state when there are no connected players', () => {
    render(<LobbyControls />);

    expect(screen.getByTestId('player-count')).toHaveTextContent('0');
    expect(screen.getByTestId('ready-count')).toHaveTextContent('0 / 0');

    const startButton = screen.getByTestId('start-game-button');
    expect(startButton).toBeDisabled();
    expect(startButton).toHaveTextContent('Start Game');

    expect(screen.getByTestId('lobby-status-message')).toHaveTextContent(
      'Waiting for players to join the lobby...',
    );
  });

  it('renders correctly when some players are not ready', () => {
    mockPlayers = [
      { id: 'p-1', displayName: 'Alice', score: 0, isReady: true, isConnected: true },
      { id: 'p-2', displayName: 'Bob', score: 0, isReady: false, isConnected: true },
    ];

    render(<LobbyControls />);

    expect(screen.getByTestId('player-count')).toHaveTextContent('2');
    expect(screen.getByTestId('ready-count')).toHaveTextContent('1 / 2');

    const startButton = screen.getByTestId('start-game-button');
    expect(startButton).toBeDisabled();

    expect(screen.getByTestId('lobby-status-message')).toHaveTextContent(
      'Waiting for all connected players to mark themselves as ready.',
    );
  });

  it('renders enabled Start Game button when all connected players are ready', () => {
    const onStartGameSpy = jest.fn();
    mockPlayers = [
      { id: 'p-1', displayName: 'Alice', score: 0, isReady: true, isConnected: true },
      { id: 'p-2', displayName: 'Bob', score: 0, isReady: true, isConnected: true },
    ];

    render(<LobbyControls onStartGame={onStartGameSpy} />);

    expect(screen.getByTestId('player-count')).toHaveTextContent('2');
    expect(screen.getByTestId('ready-count')).toHaveTextContent('2 / 2');

    const startButton = screen.getByTestId('start-game-button');
    expect(startButton).toBeEnabled();

    expect(screen.getByTestId('lobby-status-message')).toHaveTextContent(
      'All players are ready! You can now start the game.',
    );

    fireEvent.click(startButton);
    expect(onStartGameSpy).toHaveBeenCalledTimes(1);
  });

  it('renders loading state when starting is true', () => {
    mockPlayers = [{ id: 'p-1', displayName: 'Alice', score: 0, isReady: true, isConnected: true }];

    render(<LobbyControls isStarting={true} />);

    const startButton = screen.getByTestId('start-game-button');
    expect(startButton).toBeDisabled();
    expect(startButton).toHaveTextContent('Starting Game...');
  });

  it('renders error message when error prop is provided', () => {
    render(<LobbyControls error="Failed to launch game session due to connection error" />);

    expect(screen.getByTestId('lobby-error-message')).toHaveTextContent(
      'Failed to launch game session due to connection error',
    );
  });
});
