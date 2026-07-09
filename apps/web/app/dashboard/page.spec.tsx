import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import DashboardPage from './page';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock('@/lib/auth/auth-context', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  getRooms: jest.fn(),
  ApiError: class extends Error {
    constructor(
      public status: number,
      message: string,
    ) {
      super(message);
      this.name = 'ApiError';
    }
  },
}));

jest.mock('@/components/socket-status-indicator', () => ({
  SocketStatusIndicator: () => <div data-testid="socket-indicator">Socket OK</div>,
}));

describe('DashboardPage', () => {
  const mockPush = jest.fn();
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mockUseAuth = require('@/lib/auth/auth-context').useAuth as jest.Mock;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mockGetRooms = require('@/lib/api').getRooms as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows loading state when auth is loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      token: null,
      isLoading: true,
      login: jest.fn(),
      logout: jest.fn(),
    });

    render(<DashboardPage />);
    expect(screen.getByText('Loading session...')).toBeInTheDocument();
  });

  it('renders dashboard with empty state when no rooms exist', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'host-1', name: 'John Host', email: 'john@example.com' },
      token: 'test-token',
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
    });

    mockGetRooms.mockResolvedValue([]);

    render(<DashboardPage />);

    // Verify skeleton loads initially
    expect(screen.getByTestId('dashboard-skeleton')).toBeInTheDocument();

    // Wait for rooms load
    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByTestId('dashboard-empty-state')).toBeInTheDocument();
    expect(screen.getByText('No active game rooms')).toBeInTheDocument();
  });

  it('renders dashboard with rooms list when active rooms exist', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'host-1', name: 'John Host', email: 'john@example.com' },
      token: 'test-token',
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
    });

    mockGetRooms.mockResolvedValue([
      {
        id: 'room-1',
        code: 'ABCDEF',
        status: 'LOBBY',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'room-2',
        code: 'GHIJKL',
        status: 'IN_PROGRESS',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'room-3',
        code: 'PLAYED',
        status: 'FINISHED',
        createdAt: new Date().toISOString(),
      },
    ]);

    render(<DashboardPage />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByTestId('dashboard-rooms-list')).toBeInTheDocument();
    expect(screen.getByText('ABCDEF')).toBeInTheDocument();
    expect(screen.getByText('GHIJKL')).toBeInTheDocument();
    // Finished room should NOT render on active list
    expect(screen.queryByText('PLAYED')).not.toBeInTheDocument();
  });

  it('renders error state and retries successfully', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'host-1', name: 'John Host', email: 'john@example.com' },
      token: 'test-token',
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
    });

    mockGetRooms.mockRejectedValueOnce(new Error('Fetch failed'));

    render(<DashboardPage />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByTestId('dashboard-error-state')).toBeInTheDocument();
    expect(screen.getByText('Failed to fetch rooms. Please try again.')).toBeInTheDocument();

    const retryBtn = screen.getByText('Retry Loading');
    mockGetRooms.mockResolvedValueOnce([]);

    await act(async () => {
      fireEvent.click(retryBtn);
      await Promise.resolve();
    });

    expect(screen.getByTestId('dashboard-empty-state')).toBeInTheDocument();
  });

  it('switches to templates tab and shows simulated loading', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'host-1', name: 'John Host', email: 'john@example.com' },
      token: 'test-token',
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
    });
    mockGetRooms.mockResolvedValue([]);

    render(<DashboardPage />);

    await act(async () => {
      await Promise.resolve();
    });

    const templatesBtn = screen.getByRole('button', { name: /Templates/ });

    // Switch to templates tab
    await act(async () => {
      fireEvent.click(templatesBtn);
    });

    // Verify skeleton shows up
    expect(screen.getByTestId('dashboard-skeleton')).toBeInTheDocument();

    // Advance time to clear mock loading delay
    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    expect(screen.getByTestId('dashboard-templates-list')).toBeInTheDocument();
    expect(screen.getByText('Friday Tech Trivia')).toBeInTheDocument();
  });

  it('switches to analytics tab and renders past finished rooms', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'host-1', name: 'John Host', email: 'john@example.com' },
      token: 'test-token',
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
    });
    mockGetRooms.mockResolvedValue([
      {
        id: 'room-3',
        code: 'PLAYED',
        status: 'FINISHED',
        createdAt: new Date().toISOString(),
      },
    ]);

    render(<DashboardPage />);

    await act(async () => {
      await Promise.resolve();
    });

    const analyticsBtn = screen.getByRole('button', { name: /Analytics/ });

    // Switch to analytics tab
    await act(async () => {
      fireEvent.click(analyticsBtn);
    });

    expect(screen.getByTestId('dashboard-analytics-list')).toBeInTheDocument();
    expect(screen.getByText('PLAYED')).toBeInTheDocument();
  });
});
