/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import * as React from 'react';
import { render, screen, act } from '@testing-library/react';
import { SocketProvider, useSocket, useSocketEvent, useSocketDispatcher } from './socket-context';

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

function ErrorTestComponent() {
  const { error, clearError } = useSocket();
  return (
    <div>
      <span data-testid="error-code">{error?.code || 'none'}</span>
      <span data-testid="error-message">{error?.message || 'none'}</span>
      <button onClick={clearError} data-testid="btn-clear-error">
        Clear
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

  it('provides dispatcher via useSocketDispatcher hook', () => {
    mockUseAuth.mockReturnValue({
      token: 'some-token',
      logout: jest.fn(),
    });

    function TestDispatcherComponent() {
      const dispatcher = useSocketDispatcher();
      return (
        <div>
          <span data-testid="dispatcher-exists">{dispatcher ? 'exists' : 'null'}</span>
        </div>
      );
    }

    render(
      <SocketProvider>
        <TestDispatcherComponent />
      </SocketProvider>,
    );

    expect(screen.getByTestId('dispatcher-exists')).toHaveTextContent('exists');
  });

  it('updates error state on connect_error', () => {
    mockUseAuth.mockReturnValue({
      token: 'some-token',
      logout: jest.fn(),
    });

    render(
      <SocketProvider>
        <ErrorTestComponent />
      </SocketProvider>,
    );

    const connectErrorCall = mockSocketInstance.on.mock.calls.find(
      (call) => call[0] === 'connect_error',
    );
    expect(connectErrorCall).toBeDefined();

    const connectErrorListener = connectErrorCall![1];

    act(() => {
      connectErrorListener(new Error('Unauthorized token'));
    });

    expect(screen.getByTestId('error-code')).toHaveTextContent('AUTH_FAILED');
    expect(screen.getByTestId('error-message')).toHaveTextContent('Unauthorized token');
  });

  it('updates error state on socket error event', () => {
    mockUseAuth.mockReturnValue({
      token: 'some-token',
      logout: jest.fn(),
    });

    render(
      <SocketProvider>
        <ErrorTestComponent />
      </SocketProvider>,
    );

    const errorCall = mockSocketInstance.on.mock.calls.find((call) => call[0] === 'error');
    expect(errorCall).toBeDefined();

    const errorListener = errorCall![1];

    act(() => {
      errorListener({ success: false, error: { code: 'ROOM_NOT_FOUND', message: 'Room missing' } });
    });

    expect(screen.getByTestId('error-code')).toHaveTextContent('ROOM_NOT_FOUND');
    expect(screen.getByTestId('error-message')).toHaveTextContent('Room missing');
  });

  it('transitions reconnecting -> restoring -> connected after reconnection and StateSync', () => {
    jest.useFakeTimers();
    mockUseAuth.mockReturnValue({
      token: 'some-token',
      logout: jest.fn(),
    });

    render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>,
    );

    const findListener = (event: string) => {
      const call = mockSocketInstance.on.mock.calls.find((c) => c[0] === event);
      return call ? (call[1] as (...args: any[]) => void) : undefined;
    };

    // 1. Simulate a temporary disconnect (auto-reconnect path)
    act(() => {
      findListener('disconnect')?.('transport close');
    });
    expect(screen.getByTestId('status')).toHaveTextContent('reconnecting');

    // 2. Socket.IO auto-reconnects
    act(() => {
      findListener('connect')?.();
    });
    // Stuck in "restoring" until a StateSync arrives
    expect(screen.getByTestId('status')).toHaveTextContent('restoring');

    // 3. Server pushes StateSync -> fully connected
    act(() => {
      findListener('StateSync')?.({
        room: { id: 'r1', code: 'ABCDEF', status: 'IN_PROGRESS' },
        players: [],
      });
    });
    expect(screen.getByTestId('status')).toHaveTextContent('connected');

    jest.useRealTimers();
  });

  it('falls back to connected if StateSync never arrives while restoring', () => {
    jest.useFakeTimers();
    mockUseAuth.mockReturnValue({
      token: 'some-token',
      logout: jest.fn(),
    });

    render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>,
    );

    const findListener = (event: string) => {
      const call = mockSocketInstance.on.mock.calls.find((c) => c[0] === event);
      return call ? (call[1] as (...args: any[]) => void) : undefined;
    };

    act(() => {
      findListener('disconnect')?.('transport close');
    });
    act(() => {
      findListener('connect')?.();
    });
    expect(screen.getByTestId('status')).toHaveTextContent('restoring');

    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(screen.getByTestId('status')).toHaveTextContent('connected');

    jest.useRealTimers();
  });
});
