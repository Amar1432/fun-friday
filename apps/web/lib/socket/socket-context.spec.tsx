/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import * as React from 'react';
import { render, screen, act } from '@testing-library/react';
import { SocketProvider, useSocket, useSocketEvent } from './socket-context';

// Mock socket.io-client
const mockSocketInstance = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
  onAny: jest.fn(),
  offAny: jest.fn(),
  connected: false,
  io: {
    opts: {
      auth: { token: '' },
    },
  },
};

const mockIo = jest.fn((..._args: any[]) => mockSocketInstance);

jest.mock('socket.io-client', () => ({
  io: (url: string, opts: any) => {
    mockSocketInstance.io.opts = opts;
    return mockIo(url, opts);
  },
}));

// Mock useAuth context
const mockUseAuth = jest.fn(() => ({
  token: null as string | null,
  logout: jest.fn(),
}));

jest.mock('@/lib/auth/auth-context', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock config
jest.mock('@/lib/config', () => ({
  config: {
    socketUrl: 'http://localhost:3001',
  },
}));

// Test helper component
function TestComponent() {
  const { status, connect, disconnect } = useSocket();
  return (
    <div>
      <span data-testid="status">{status}</span>
      <button onClick={() => connect('test-token')} data-testid="btn-connect">
        Connect
      </button>
      <button onClick={() => disconnect()} data-testid="btn-disconnect">
        Disconnect
      </button>
    </div>
  );
}

// Test helper for useSocketEvent hook
function ListenerComponent({ callback }: { callback: () => void }) {
  useSocketEvent('PlayerJoined', callback);
  return <div data-testid="listener">Listener Active</div>;
}

describe('SocketProvider and hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSocketInstance.connected = false;
  });

  it('renders children and starts disconnected without token', () => {
    mockUseAuth.mockReturnValue({
      token: null,
      logout: jest.fn(),
    });

    render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>,
    );

    expect(screen.getByTestId('status')).toHaveTextContent('disconnected');
    expect(mockIo).not.toHaveBeenCalled();
  });

  it('automatically connects when token is present', () => {
    mockUseAuth.mockReturnValue({
      token: 'valid-host-token',
      logout: jest.fn(),
    });

    render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>,
    );

    expect(mockIo).toHaveBeenCalledWith(
      'http://localhost:3001',
      expect.objectContaining({
        auth: { token: 'valid-host-token' },
        autoConnect: false,
      }),
    );
    expect(mockSocketInstance.connect).toHaveBeenCalled();
  });

  it('allows manual connect and disconnect', () => {
    mockUseAuth.mockReturnValue({
      token: null,
      logout: jest.fn(),
    });

    render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>,
    );

    // Initial state
    expect(screen.getByTestId('status')).toHaveTextContent('disconnected');

    // Trigger connect manually
    act(() => {
      screen.getByTestId('btn-connect').click();
    });

    expect(screen.getByTestId('status')).toHaveTextContent('connecting');
    expect(mockIo).toHaveBeenCalledWith(
      'http://localhost:3001',
      expect.objectContaining({
        auth: { token: 'test-token' },
      }),
    );

    // Trigger disconnect manually
    act(() => {
      screen.getByTestId('btn-disconnect').click();
    });

    expect(screen.getByTestId('status')).toHaveTextContent('disconnected');
    expect(mockSocketInstance.disconnect).toHaveBeenCalled();
  });

  it('registers and unregisters socket event listeners using useSocketEvent', () => {
    mockUseAuth.mockReturnValue({
      token: 'some-token',
      logout: jest.fn(),
    });

    const eventCallback = jest.fn();

    const { unmount } = render(
      <SocketProvider>
        <ListenerComponent callback={eventCallback} />
      </SocketProvider>,
    );

    // Expect the dispatcher mapping to have registered to the raw socket.on('PlayerJoined')
    expect(mockSocketInstance.on).toHaveBeenCalledWith('PlayerJoined', expect.any(Function));

    // Simulate event trigger
    const socketOnCall = mockSocketInstance.on.mock.calls.find(
      (call) => call[0] === 'PlayerJoined',
    );
    expect(socketOnCall).toBeDefined();

    const rawSocketListener = socketOnCall![1];

    // Trigger raw socket listener
    act(() => {
      rawSocketListener({ player: { id: 'p1', displayName: 'Player 1', score: 0, isReady: true } });
    });

    expect(eventCallback).toHaveBeenCalledWith({
      player: { id: 'p1', displayName: 'Player 1', score: 0, isReady: true },
    });

    // Unmount should keep registry intact, but unregistering from context should clean it up
    unmount();
  });

  it('logs unhandled events safely to console.warn', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    mockUseAuth.mockReturnValue({
      token: 'some-token',
      logout: jest.fn(),
    });

    render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>,
    );

    expect(mockSocketInstance.onAny).toHaveBeenCalledWith(expect.any(Function));
    const onAnyListener = mockSocketInstance.onAny.mock.calls[0][0];

    // Case 1: Unregistered/unhandled event
    onAnyListener('UnknownEvent', { foo: 'bar' });
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[Socket] Unhandled event received: UnknownEvent'),
      expect.any(Object),
    );

    warnSpy.mockClear();

    // Case 2: Registered event but no active listeners
    onAnyListener('PlayerJoined', { player: { id: 'p1' } });
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[Socket] Unhandled event received: PlayerJoined'),
      expect.any(Object),
    );

    warnSpy.mockRestore();
  });
});
