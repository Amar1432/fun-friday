import * as React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReconnectionOverlay } from './reconnection-overlay';

const mockUseSocket = jest.fn(() => ({
  status: 'connected' as string,
  connect: jest.fn(),
}));

const mockUseAuth = jest.fn(() => ({
  token: 'mock-token' as string | null,
}));

const mockPush = jest.fn();
const mockUseRouter = jest.fn(() => ({ push: mockPush }));
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

describe('ReconnectionOverlay Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePathname.mockReturnValue('/lobby/123456');
    mockUseAuth.mockReturnValue({ token: 'mock-token' });
  });

  it('renders nothing when connected', () => {
    mockUseSocket.mockReturnValue({ status: 'connected', connect: jest.fn() });
    const { container } = render(<ReconnectionOverlay />);
    expect(container.firstChild).toBeNull();
  });

  it('renders reconnecting overlay inside the lobby', () => {
    mockUseSocket.mockReturnValue({ status: 'reconnecting', connect: jest.fn() });
    render(<ReconnectionOverlay />);

    const overlay = screen.getByTestId('reconnection-overlay');
    expect(overlay).toBeInTheDocument();
    expect(screen.getByTestId('reconnection-title')).toHaveTextContent('Connection Lost');
    expect(screen.getByTestId('reconnection-message')).toHaveTextContent(
      'We lost connection to the server. Reconnecting automatically...',
    );
    expect(screen.getByTestId('reconnection-indicator')).toBeInTheDocument();
  });

  it('renders restoring overlay inside the lobby', () => {
    mockUseSocket.mockReturnValue({ status: 'restoring', connect: jest.fn() });
    render(<ReconnectionOverlay />);

    expect(screen.getByTestId('reconnection-title')).toHaveTextContent('Restoring Session');
    expect(screen.getByTestId('reconnection-message')).toHaveTextContent(
      'Reconnected! Synchronizing your game state with the server...',
    );
  });

  it('triggers connect on retry button click while reconnecting', () => {
    const connectMock = jest.fn();
    mockUseSocket.mockReturnValue({ status: 'reconnecting', connect: connectMock });
    render(<ReconnectionOverlay />);

    const retryBtn = screen.getByTestId('btn-retry');
    fireEvent.click(retryBtn);
    expect(connectMock).toHaveBeenCalledWith('mock-token');
  });

  it('does not show retry button while restoring', () => {
    mockUseSocket.mockReturnValue({ status: 'restoring', connect: jest.fn() });
    render(<ReconnectionOverlay />);
    expect(screen.queryByTestId('btn-retry')).toBeNull();
  });

  it('navigates to dashboard on Go to Dashboard click', () => {
    mockUseSocket.mockReturnValue({ status: 'reconnecting', connect: jest.fn() });
    render(<ReconnectionOverlay />);
    const dashBtn = screen.getByTestId('btn-go-dashboard');
    fireEvent.click(dashBtn);
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  it('renders nothing when not in a lobby', () => {
    mockUsePathname.mockReturnValue('/dashboard');
    mockUseSocket.mockReturnValue({ status: 'reconnecting', connect: jest.fn() });
    const { container } = render(<ReconnectionOverlay />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when there is no auth token', () => {
    mockUseAuth.mockReturnValue({ token: null });
    mockUseSocket.mockReturnValue({ status: 'reconnecting', connect: jest.fn() });
    const { container } = render(<ReconnectionOverlay />);
    expect(container.firstChild).toBeNull();
  });
});
