import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import CreateRoomPage from './page';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}));

jest.mock('@/lib/auth/auth-context', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  createRoom: jest.fn(),
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

jest.mock('@/lib/config', () => ({
  config: {
    appName: 'Fun Friday Hub',
  },
}));

describe('CreateRoomPage', () => {
  const mockPush = jest.fn();
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mockUseAuth = require('@/lib/auth/auth-context').useAuth as jest.Mock;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mockCreateRoom = require('@/lib/api').createRoom as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });

    // Mock clipboard API
    const mockClipboard = {
      writeText: jest.fn(),
    };
    Object.defineProperty(navigator, 'clipboard', {
      value: mockClipboard,
      writable: true,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows loading state while checking auth', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      token: null,
      isLoading: true,
      login: jest.fn(),
      logout: jest.fn(),
    });

    render(<CreateRoomPage />);

    expect(screen.getByText('Loading session...')).toBeInTheDocument();
  });

  it('redirects to login if not authenticated', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      token: null,
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
    });

    render(<CreateRoomPage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('shows create room form when authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', name: 'Test User', email: 'test@example.com' },
      token: 'test-token',
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
    });

    render(<CreateRoomPage />);

    expect(screen.getByText('Choose a game')).toBeInTheDocument();
    expect(screen.getAllByText('Emoji Guess')).toHaveLength(2);
    expect(screen.getByText('Bad Movie Description')).toBeInTheDocument();
    expect(screen.getByText('Gibberish')).toBeInTheDocument();
    expect(screen.getAllByText(/questions/)).toHaveLength(3);

    expect(screen.getByText('Create Room')).toBeInTheDocument();
  });

  it('creates room successfully and shows success state', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', name: 'Test User', email: 'test@example.com' },
      token: 'test-token',
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
    });

    mockCreateRoom.mockResolvedValue({
      room: {
        id: 'room-1',
        code: 'ABC123',
        status: 'LOBBY',
        createdAt: new Date().toISOString(),
      },
    });

    render(<CreateRoomPage />);

    const createButton = screen.getByText('Create Room');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(mockCreateRoom).toHaveBeenCalledWith('test-token');
    });

    await waitFor(() => {
      expect(screen.getByText('Room Created!')).toBeInTheDocument();
      expect(screen.getByText('ABC123')).toBeInTheDocument();
    });
  });

  it('lets host choose a supported game before creating the room', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', name: 'Test User', email: 'test@example.com' },
      token: 'test-token',
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
    });

    mockCreateRoom.mockResolvedValue({
      room: {
        id: 'room-1',
        code: 'ABC123',
        status: 'LOBBY',
        createdAt: new Date().toISOString(),
      },
    });

    render(<CreateRoomPage />);

    fireEvent.click(screen.getByRole('radio', { name: /Gibberish/ }));
    fireEvent.click(screen.getByText('Create Room'));

    await waitFor(() => {
      expect(screen.getByText('Room Created!')).toBeInTheDocument();
    });

    jest.advanceTimersByTime(3000);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        '/lobby/ABC123?roomId=room-1&gameId=3a9b1c2d-5e6f-4070-81a2-b3c4d5e6f709',
      );
    });
  });

  it('shows error message when room creation fails', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', name: 'Test User', email: 'test@example.com' },
      token: 'test-token',
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
    });

    mockCreateRoom.mockRejectedValue(new Error('Network error'));

    render(<CreateRoomPage />);

    const createButton = screen.getByText('Create Room');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText(/Failed to create room/)).toBeInTheDocument();
    });
  });

  it('navigates to lobby after successful room creation', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', name: 'Test User', email: 'test@example.com' },
      token: 'test-token',
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
    });

    mockCreateRoom.mockResolvedValue({
      room: {
        id: 'room-1',
        code: 'ABC123',
        status: 'LOBBY',
        createdAt: new Date().toISOString(),
      },
    });

    render(<CreateRoomPage />);

    const createButton = screen.getByText('Create Room');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText('Room Created!')).toBeInTheDocument();
    });

    // Fast-forward timers
    jest.advanceTimersByTime(3000);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        '/lobby/ABC123?roomId=room-1&gameId=1cd83808-737f-4c29-ab51-adff5c6a1ef5',
      );
    });
  });

  it('copies room code to clipboard', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', name: 'Test User', email: 'test@example.com' },
      token: 'test-token',
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
    });

    mockCreateRoom.mockResolvedValue({
      room: {
        id: 'room-1',
        code: 'ABC123',
        status: 'LOBBY',
        createdAt: new Date().toISOString(),
      },
    });

    render(<CreateRoomPage />);

    const createButton = screen.getByText('Create Room');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText('Room Created!')).toBeInTheDocument();
    });

    const copyButton = screen.getByText('Copy Code');
    fireEvent.click(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('ABC123');
  });
});
