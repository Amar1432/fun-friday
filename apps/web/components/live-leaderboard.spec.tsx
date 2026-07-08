import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { LiveLeaderboard } from './live-leaderboard';
import { LeaderboardEntry } from '@/lib/socket/types';

const mockUseAuth = jest.fn();
jest.mock('@/lib/auth/auth-context', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('LiveLeaderboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { id: 'player-1', displayName: 'Player One' },
    });
  });

  it('renders waiting state when no entries are provided', () => {
    render(<LiveLeaderboard entries={[]} />);
    expect(screen.getByText('Live Leaderboard')).toBeInTheDocument();
    expect(screen.getByText('Waiting for score calculations...')).toBeInTheDocument();
  });

  it('renders ranking list correctly with ranks, badges, names, and scores', () => {
    const entries: LeaderboardEntry[] = [
      { rank: 1, playerId: 'player-gold', displayName: 'Gold Medal', score: 3000, streak: 3 },
      { rank: 2, playerId: 'player-silver', displayName: 'Silver Medal', score: 2000, streak: 1 },
      { rank: 3, playerId: 'player-bronze', displayName: 'Bronze Medal', score: 1000, streak: 0 },
      { rank: 4, playerId: 'player-normal', displayName: 'Normal Player', score: 500, streak: 0 },
    ];

    render(<LiveLeaderboard entries={entries} />);

    expect(screen.getByText('Gold Medal')).toBeInTheDocument();
    expect(screen.getByText('3,000 pts')).toBeInTheDocument();
    expect(screen.getByTestId('rank-badge-1')).toBeInTheDocument();

    expect(screen.getByText('Silver Medal')).toBeInTheDocument();
    expect(screen.getByText('2,000 pts')).toBeInTheDocument();
    expect(screen.getByTestId('rank-badge-2')).toBeInTheDocument();

    expect(screen.getByText('Bronze Medal')).toBeInTheDocument();
    expect(screen.getByText('1,000 pts')).toBeInTheDocument();
    expect(screen.getByTestId('rank-badge-3')).toBeInTheDocument();

    expect(screen.getByText('Normal Player')).toBeInTheDocument();
    expect(screen.getByText('500 pts')).toBeInTheDocument();
    expect(screen.getByText('#4')).toBeInTheDocument();

    // Check streak rendering
    expect(screen.getByText('🔥 3 STREAK')).toBeInTheDocument();
  });

  it('highlights the current user row and displays a "YOU" badge', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'player-1' },
    });

    const entries: LeaderboardEntry[] = [
      { rank: 1, playerId: 'player-gold', displayName: 'Gold Medal', score: 3000, streak: 0 },
      { rank: 2, playerId: 'player-1', displayName: 'Current User Player', score: 2000, streak: 0 },
    ];

    render(<LiveLeaderboard entries={entries} />);

    const currentUserRow = screen.getByTestId('leaderboard-row-player-1');
    expect(currentUserRow).toHaveClass('ring-2 ring-indigo-500/60');
    expect(screen.getByText('You')).toBeInTheDocument();
  });

  it('calculates and displays score change indicators when scores increase', () => {
    const entriesInitial: LeaderboardEntry[] = [
      { rank: 1, playerId: 'player-1', displayName: 'Player 1', score: 1000, streak: 0 },
      { rank: 2, playerId: 'player-2', displayName: 'Player 2', score: 800, streak: 0 },
    ];

    const { rerender } = render(<LiveLeaderboard entries={entriesInitial} />);

    // No score change should render initially
    expect(screen.queryByTestId('score-change-player-1')).not.toBeInTheDocument();

    const entriesUpdated: LeaderboardEntry[] = [
      { rank: 1, playerId: 'player-1', displayName: 'Player 1', score: 1500, streak: 0 },
      { rank: 2, playerId: 'player-2', displayName: 'Player 2', score: 800, streak: 0 },
    ];

    rerender(<LiveLeaderboard entries={entriesUpdated} />);

    // Score change should be calculated and displayed for player-1 (+500)
    const changeIndicator = screen.getByTestId('score-change-player-1');
    expect(changeIndicator).toBeInTheDocument();
    expect(changeIndicator).toHaveTextContent('+500');

    // No score change for player-2
    expect(screen.queryByTestId('score-change-player-2')).not.toBeInTheDocument();
  });

  it('deduplicates input entries by playerId to avoid duplicate elements and React key conflicts', () => {
    const duplicateEntries: LeaderboardEntry[] = [
      { rank: 1, playerId: 'player-1', displayName: 'Player 1', score: 1000, streak: 0 },
      { rank: 2, playerId: 'player-2', displayName: 'Player 2', score: 800, streak: 0 },
      { rank: 3, playerId: 'player-1', displayName: 'Player 1 Duplicate', score: 1000, streak: 0 },
    ];

    render(<LiveLeaderboard entries={duplicateEntries} />);

    // Player 1 should only be rendered once
    const player1Rows = screen.getAllByTestId('leaderboard-row-player-1');
    expect(player1Rows).toHaveLength(1);
    expect(screen.getByText('Player 1')).toBeInTheDocument();
    expect(screen.queryByText('Player 1 Duplicate')).not.toBeInTheDocument();

    // The player count pill should display the count of unique players (2)
    expect(screen.getByText('2 Players')).toBeInTheDocument();
  });
});
