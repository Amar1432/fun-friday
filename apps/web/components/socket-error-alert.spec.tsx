import * as React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SocketErrorAlert } from './socket-error-alert';

const mockUseSocket = jest.fn(() => ({
  status: 'connected',
  error: null as { code: string; message: string } | null,
  clearError: jest.fn(),
  connect: jest.fn(),
}));

const mockUseAuth = jest.fn(() => ({
  token: 'mock-token' as string | null,
}));

const mockPush = jest.fn();
const mockUseRouter = jest.fn(() => ({
  push: mockPush,
}));

const mockUsePathname = jest.fn(() => '/lobby/123456');

jest.mock('@/lib/socket/socket-context', () => ({
  useSocket: () => mockUseSocket(),
}));

jest.mock('@/lib/auth/auth-context', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => mockUseRouter(),
  usePathname: () => mockUsePathname(),
}));

describe('SocketErrorAlert Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when token is not present', () => {
    mockUseAuth.mockReturnValue({ token: null });
    mockUseSocket.mockReturnValue({
      status: 'disconnected',
      error: null,
      clearError: jest.fn(),
      connect: jest.fn(),
    });

    const { container } = render(<SocketErrorAlert />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when connected and no error exists', () => {
    mockUseAuth.mockReturnValue({ token: 'valid-token' });
    mockUseSocket.mockReturnValue({
      status: 'connected',
      error: null,
      clearError: jest.fn(),
      connect: jest.fn(),
    });

    const { container } = render(<SocketErrorAlert />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when reconnecting (owned by ReconnectionOverlay)', () => {
    mockUseAuth.mockReturnValue({ token: 'valid-token' });
    mockUsePathname.mockReturnValue('/lobby/123456');
    mockUseSocket.mockReturnValue({
      status: 'reconnecting',
      error: null,
      clearError: jest.fn(),
      connect: jest.fn(),
    });

    const { container } = render(<SocketErrorAlert />);
    expect(container.firstChild).toBeNull();
  });

  it('renders blocking overlay for ROOM_NOT_FOUND error in lobby', () => {
    mockUseAuth.mockReturnValue({ token: 'valid-token' });
    mockUsePathname.mockReturnValue('/lobby/123456');
    mockUseSocket.mockReturnValue({
      status: 'connected',
      error: { code: 'ROOM_NOT_FOUND', message: 'Room not found custom message' },
      clearError: jest.fn(),
      connect: jest.fn(),
    });

    render(<SocketErrorAlert />);

    expect(screen.getByTestId('socket-error-overlay')).toBeInTheDocument();
    expect(screen.getByTestId('overlay-title')).toHaveTextContent('Room Not Found');
    expect(screen.getByTestId('overlay-message')).toHaveTextContent(
      'Room not found custom message',
    );
  });

  it('renders warning toast for UNAUTHORIZED action in lobby', () => {
    const clearErrorMock = jest.fn();
    mockUseAuth.mockReturnValue({ token: 'valid-token' });
    mockUsePathname.mockReturnValue('/lobby/123456');
    mockUseSocket.mockReturnValue({
      status: 'connected',
      error: { code: 'UNAUTHORIZED', message: 'Only host can start game' },
      clearError: clearErrorMock,
      connect: jest.fn(),
    });

    render(<SocketErrorAlert />);

    expect(screen.getByTestId('socket-error-toast')).toBeInTheDocument();
    expect(screen.getByTestId('toast-title')).toHaveTextContent('Action Denied');
    expect(screen.getByTestId('toast-message')).toHaveTextContent('Only host can start game');

    // Test Dismiss button
    const dismissBtn = screen.getByRole('button', { name: /dismiss/i });
    fireEvent.click(dismissBtn);
    expect(clearErrorMock).toHaveBeenCalled();
  });

  it('triggers connect on retry button click when server is unavailable', () => {
    const connectMock = jest.fn();
    mockUseAuth.mockReturnValue({ token: 'valid-token' });
    mockUsePathname.mockReturnValue('/lobby/123456');
    mockUseSocket.mockReturnValue({
      status: 'disconnected',
      error: { code: 'SERVER_UNAVAILABLE', message: 'Offline' },
      clearError: jest.fn(),
      connect: connectMock,
    });

    render(<SocketErrorAlert />);

    const retryBtn = screen.getByTestId('btn-retry');
    fireEvent.click(retryBtn);
    expect(connectMock).toHaveBeenCalledWith('valid-token');
  });

  it('triggers router push to dashboard on Go to Dashboard click', () => {
    const clearErrorMock = jest.fn();
    mockUseAuth.mockReturnValue({ token: 'valid-token' });
    mockUsePathname.mockReturnValue('/lobby/123456');
    mockUseSocket.mockReturnValue({
      status: 'disconnected',
      error: { code: 'ROOM_NOT_FOUND', message: 'Closed' },
      clearError: clearErrorMock,
      connect: jest.fn(),
    });

    render(<SocketErrorAlert />);

    const dashBtn = screen.getByTestId('btn-go-dashboard');
    fireEvent.click(dashBtn);
    expect(clearErrorMock).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  it('does not render blocking overlay when not in lobby (e.g. dashboard)', () => {
    mockUseAuth.mockReturnValue({ token: 'valid-token' });
    mockUsePathname.mockReturnValue('/dashboard');
    mockUseSocket.mockReturnValue({
      status: 'reconnecting',
      error: null,
      clearError: jest.fn(),
      connect: jest.fn(),
    });

    const { container } = render(<SocketErrorAlert />);
    expect(container.firstChild).toBeNull();
  });
});
