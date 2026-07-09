/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { PlayerList } from './player-list';
import { Player } from '@/lib/socket/types';

let mockPlayers: Player[] = [];

jest.mock('@/lib/store/use-game-store', () => ({
  useGameStore: (selector: (state: any) => any) => selector({ players: mockPlayers }),
}));

describe('PlayerList Component', () => {
  beforeEach(() => {
    mockPlayers = [];
    jest.clearAllMocks();
  });

  it('renders waiting state when no players are in the list', () => {
    render(<PlayerList />);

    expect(screen.getByText('Players')).toBeInTheDocument();
    // Badge now shows just the number without 'connected' suffix
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('Waiting for players to join...')).toBeInTheDocument();
  });

  it('renders a list of players with correct details', () => {
    mockPlayers = [
      { id: 'p-1', displayName: 'Alice', score: 120, isReady: true, isConnected: true },
      { id: 'p-2', displayName: 'Bob', score: 80, isReady: false, isConnected: true },
    ];

    render(<PlayerList />);

    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('120 pts')).toBeInTheDocument();
    expect(screen.getByText('Ready')).toBeInTheDocument();

    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('80 pts')).toBeInTheDocument();
    expect(screen.getByText('Waiting')).toBeInTheDocument();

    // Check connection dots are green (connected)
    const aliceDot = screen.getByTestId('player-conn-dot-p-1');
    const bobDot = screen.getByTestId('player-conn-dot-p-2');
    expect(aliceDot).toHaveClass('bg-green-500');
    expect(bobDot).toHaveClass('bg-green-500');
  });

  it('renders disconnected player status correctly', () => {
    mockPlayers = [
      { id: 'p-1', displayName: 'Charlie', score: 250, isReady: false, isConnected: false },
    ];

    render(<PlayerList />);

    expect(screen.getByText('Charlie')).toBeInTheDocument();
    expect(screen.getByText('Offline')).toBeInTheDocument();

    // Check connection dot is amber (disconnected)
    const charlieDot = screen.getByTestId('player-conn-dot-p-1');
    expect(charlieDot).toHaveClass('bg-amber-500');
  });
});
