import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import JoinRoomPage from './page';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock('@/lib/auth/auth-context', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  loginAsGuest: jest.fn(),
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

describe('JoinRoomPage', () => {
  const mockPush = jest.fn();
  const mockLogin = jest.fn();
  const mockGetSearchParams = jest.fn();

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mockUseAuth = require('@/lib/auth/auth-context').useAuth as jest.Mock;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mockLoginAsGuest = require('@/lib/api').loginAsGuest as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });

    (useSearchParams as jest.Mock).mockReturnValue({
      get: mockGetSearchParams,
    });

    mockUseAuth.mockReturnValue({
      user: null,
      login: mockLogin,
    });

    mockGetSearchParams.mockReturnValue(null);
  });

  it('renders the join room form elements correctly', () => {
    render(<JoinRoomPage />);

    expect(screen.getByText('Join a Game Room')).toBeInTheDocument();
    expect(screen.getByLabelText('Room Code')).toBeInTheDocument();
    expect(screen.getByLabelText('Your Name')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Join Room/ })).toBeInTheDocument();
  });

  it('pre-populates room code from search params if code is present', () => {
    mockGetSearchParams.mockImplementation((param) => {
      if (param === 'code') return 'XYZ789';
      return null;
    });

    render(<JoinRoomPage />);

    const roomCodeInput = screen.getByLabelText('Room Code') as HTMLInputElement;
    expect(roomCodeInput.value).toBe('XYZ789');
  });

  it('pre-populates room code from search params if roomCode is present', () => {
    mockGetSearchParams.mockImplementation((param) => {
      if (param === 'roomCode') return 'ABC123';
      return null;
    });

    render(<JoinRoomPage />);

    const roomCodeInput = screen.getByLabelText('Room Code') as HTMLInputElement;
    expect(roomCodeInput.value).toBe('ABC123');
  });

  it('displays validation errors when fields are empty on submit', async () => {
    render(<JoinRoomPage />);

    const joinButton = screen.getByRole('button', { name: /Join Room/ });
    fireEvent.click(joinButton);

    await waitFor(() => {
      expect(screen.getByText('Room code is required')).toBeInTheDocument();
      expect(screen.getByText('Display name is required')).toBeInTheDocument();
    });

    expect(mockLoginAsGuest).not.toHaveBeenCalled();
  });

  it('displays validation error when room code is not 6 characters', async () => {
    render(<JoinRoomPage />);

    const roomCodeInput = screen.getByLabelText('Room Code');
    const displayNameInput = screen.getByLabelText('Your Name');
    const joinButton = screen.getByRole('button', { name: /Join Room/ });

    fireEvent.change(roomCodeInput, { target: { value: 'ABC' } });
    fireEvent.change(displayNameInput, { target: { value: 'GuestPlayer' } });
    fireEvent.click(joinButton);

    await waitFor(() => {
      expect(screen.getByText('Room code must be exactly 6 characters')).toBeInTheDocument();
    });

    expect(mockLoginAsGuest).not.toHaveBeenCalled();
  });

  it('displays validation error when room code is not alphanumeric', async () => {
    render(<JoinRoomPage />);

    const roomCodeInput = screen.getByLabelText('Room Code');
    const displayNameInput = screen.getByLabelText('Your Name');
    const joinButton = screen.getByRole('button', { name: /Join Room/ });

    fireEvent.change(roomCodeInput, { target: { value: 'AB-123' } });
    fireEvent.change(displayNameInput, { target: { value: 'GuestPlayer' } });
    fireEvent.click(joinButton);

    await waitFor(() => {
      expect(
        screen.getByText('Room code must contain only alphanumeric characters'),
      ).toBeInTheDocument();
    });

    expect(mockLoginAsGuest).not.toHaveBeenCalled();
  });

  it('displays validation error when display name is too short', async () => {
    render(<JoinRoomPage />);

    const roomCodeInput = screen.getByLabelText('Room Code');
    const displayNameInput = screen.getByLabelText('Your Name');
    const joinButton = screen.getByRole('button', { name: /Join Room/ });

    fireEvent.change(roomCodeInput, { target: { value: 'ABCDEF' } });
    fireEvent.change(displayNameInput, { target: { value: 'A' } });
    fireEvent.click(joinButton);

    await waitFor(() => {
      expect(
        screen.getByText('Display name must be between 2 and 20 characters'),
      ).toBeInTheDocument();
    });

    expect(mockLoginAsGuest).not.toHaveBeenCalled();
  });

  it('displays validation error when display name is too long', async () => {
    render(<JoinRoomPage />);

    const roomCodeInput = screen.getByLabelText('Room Code');
    const displayNameInput = screen.getByLabelText('Your Name');
    const joinButton = screen.getByRole('button', { name: /Join Room/ });

    fireEvent.change(roomCodeInput, { target: { value: 'ABCDEF' } });
    fireEvent.change(displayNameInput, { target: { value: 'A'.repeat(21) } });
    fireEvent.click(joinButton);

    await waitFor(() => {
      expect(
        screen.getByText('Display name must be between 2 and 20 characters'),
      ).toBeInTheDocument();
    });

    expect(mockLoginAsGuest).not.toHaveBeenCalled();
  });

  it('joins room successfully and navigates to the lobby', async () => {
    mockLoginAsGuest.mockResolvedValue({
      player: { id: 'player-1', displayName: 'Cool Guest' },
      room: { id: 'room-1', code: 'ABCDEF' },
      accessToken: 'guest-token-123',
      expiresIn: 14400,
    });

    render(<JoinRoomPage />);

    const roomCodeInput = screen.getByLabelText('Room Code');
    const displayNameInput = screen.getByLabelText('Your Name');
    const joinButton = screen.getByRole('button', { name: /Join Room/ });

    fireEvent.change(roomCodeInput, { target: { value: 'abcdef' } }); // lowercase should be converted to uppercase
    fireEvent.change(displayNameInput, { target: { value: 'Cool Guest' } });
    fireEvent.click(joinButton);

    await waitFor(() => {
      expect(mockLoginAsGuest).toHaveBeenCalledWith('ABCDEF', 'Cool Guest');
    });

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('guest-token-123', {
        id: 'player-1',
        name: 'Cool Guest',
        email: '',
      });
      expect(mockPush).toHaveBeenCalledWith('/lobby/ABCDEF?roomId=room-1');
    });
  });

  it('displays API error when room join fails', async () => {
    const errorMsg = 'Room is no longer accepting players';
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ApiErrorClass = require('@/lib/api').ApiError;
    mockLoginAsGuest.mockRejectedValue(new ApiErrorClass(422, errorMsg));

    render(<JoinRoomPage />);

    const roomCodeInput = screen.getByLabelText('Room Code');
    const displayNameInput = screen.getByLabelText('Your Name');
    const joinButton = screen.getByRole('button', { name: /Join Room/ });

    fireEvent.change(roomCodeInput, { target: { value: 'ABCDEF' } });
    fireEvent.change(displayNameInput, { target: { value: 'Cool Guest' } });
    fireEvent.click(joinButton);

    await waitFor(() => {
      expect(screen.getByText(errorMsg)).toBeInTheDocument();
    });

    expect(mockLogin).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('displays generic error message when request fails due to network error', async () => {
    mockLoginAsGuest.mockRejectedValue(new Error('Failed to fetch'));

    render(<JoinRoomPage />);

    const roomCodeInput = screen.getByLabelText('Room Code');
    const displayNameInput = screen.getByLabelText('Your Name');
    const joinButton = screen.getByRole('button', { name: /Join Room/ });

    fireEvent.change(roomCodeInput, { target: { value: 'ABCDEF' } });
    fireEvent.change(displayNameInput, { target: { value: 'Cool Guest' } });
    fireEvent.click(joinButton);

    await waitFor(() => {
      expect(screen.getByText(/Failed to join room/)).toBeInTheDocument();
    });

    expect(mockLogin).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
