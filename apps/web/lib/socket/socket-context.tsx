'use client';
/* eslint-disable no-console, react-hooks/set-state-in-effect, @typescript-eslint/no-explicit-any */

import * as React from 'react';
import { io, Socket } from 'socket.io-client';
import { config } from '@/lib/config';
import { useAuth } from '@/lib/auth/auth-context';
import { ServerToClientEvents, ClientToServerEvents, ConnectionStatus } from './types';

interface SocketContextType {
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  status: ConnectionStatus;
  connect: (token: string) => void;
  disconnect: () => void;
  registerListener: <K extends keyof ServerToClientEvents>(
    event: K,
    callback: ServerToClientEvents[K],
  ) => void;
  unregisterListener: <K extends keyof ServerToClientEvents>(
    event: K,
    callback: ServerToClientEvents[K],
  ) => void;
}

const SocketContext = React.createContext<SocketContextType | undefined>(undefined);

// List of allowed server-to-client events from ROOM_PROTOCOL.md
const VALID_SERVER_EVENTS: Array<keyof ServerToClientEvents> = [
  'PlayerJoined',
  'PlayerLeft',
  'RoomStateUpdated',
  'GameStarted',
  'QuestionStarted',
  'TimerTick',
  'AnswerReveal',
  'LeaderboardUpdated',
  'GameFinished',
  'StateSync',
  'error',
];

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { token, logout } = useAuth();
  const [status, setStatus] = React.useState<ConnectionStatus>('disconnected');
  const [socket, setSocket] = React.useState<Socket<
    ServerToClientEvents,
    ClientToServerEvents
  > | null>(null);
  const socketRef = React.useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);

  // Maintain local record of callbacks to prevent duplicate listeners
  // and route incoming socket events to the registered callbacks.
  const listenersRef = React.useRef<{
    [K in keyof ServerToClientEvents]?: Set<ServerToClientEvents[K]>;
  }>({});

  const registerListener = React.useCallback(
    <K extends keyof ServerToClientEvents>(event: K, callback: ServerToClientEvents[K]) => {
      if (!VALID_SERVER_EVENTS.includes(event)) {
        console.warn(
          `Attempted to register listener for unknown/unsupported event: ${String(event)}`,
        );
        return;
      }

      if (!listenersRef.current[event]) {
        listenersRef.current[event] = new Set() as any;
      }

      const set = listenersRef.current[event] as Set<ServerToClientEvents[K]>;
      set.add(callback);
    },
    [],
  );

  const unregisterListener = React.useCallback(
    <K extends keyof ServerToClientEvents>(event: K, callback: ServerToClientEvents[K]) => {
      const set = listenersRef.current[event] as Set<ServerToClientEvents[K]> | undefined;
      if (set) {
        set.delete(callback);
      }
    },
    [],
  );

  // Central event dispatcher that hooks up to the underlying socket
  const setupEventDispatcher = React.useCallback(
    (targetSocket: Socket<ServerToClientEvents, ClientToServerEvents>) => {
      VALID_SERVER_EVENTS.forEach((event) => {
        // Clean up any existing raw listeners to avoid duplicates
        targetSocket.off(event);

        // Register a single raw listener per event type
        targetSocket.on(event, (...args: any[]) => {
          const callbacks = listenersRef.current[event] as Set<any> | undefined;
          if (callbacks) {
            callbacks.forEach((cb) => {
              try {
                cb(...args);
              } catch (err) {
                console.error(`Error in socket event callback for event ${String(event)}:`, err);
              }
            });
          }
        });
      });
    },
    [],
  );

  const disconnect = React.useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
    }
    setStatus('disconnected');
  }, []);

  const connect = React.useCallback(
    (connectionToken: string) => {
      if (socketRef.current) {
        // If already connected or connecting with the same token, do nothing
        if (
          socketRef.current.connected &&
          (socketRef.current.io.opts as any).auth?.token === connectionToken
        ) {
          return;
        }
        // If the token is different, disconnect the old one first
        socketRef.current.disconnect();
      }

      setStatus('connecting');

      // Create a new socket instance
      const newSocket = io(config.socketUrl, {
        auth: {
          token: connectionToken,
        },
        autoConnect: false,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
      });

      socketRef.current = newSocket;
      setSocket(newSocket);

      // Set up status event handlers
      newSocket.on('connect', () => {
        setStatus('connected');
      });

      newSocket.on('disconnect', (reason) => {
        if (reason === 'io server disconnect') {
          // the disconnection was initiated by the server, need to reconnect manually
          setStatus('disconnected');
        } else {
          // the disconnection was temporary, socket.io will auto-reconnect
          setStatus('reconnecting');
        }
      });

      newSocket.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
        // Check if it's an authentication error
        if (
          err.message.includes('auth') ||
          err.message.includes('token') ||
          err.message.includes('unauthorized') ||
          err.message.includes('Unauthorized')
        ) {
          setStatus('auth_failed');
          // Optionally logout if auth fails
          logout();
        } else {
          setStatus('reconnecting');
        }
      });

      // Wire up the central event dispatcher
      setupEventDispatcher(newSocket);

      // Connect
      newSocket.connect();
    },
    [logout, setupEventDispatcher],
  );

  // Manage connection lifecycle automatically based on Auth token presence
  React.useEffect(() => {
    if (token) {
      connect(token);
    } else {
      disconnect();
    }
  }, [token, connect, disconnect]);

  // Clean up on provider unmount
  React.useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  const value = React.useMemo(
    () => ({
      socket,
      status,
      connect,
      disconnect,
      registerListener,
      unregisterListener,
    }),
    [socket, status, connect, disconnect, registerListener, unregisterListener],
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const context = React.useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}

/**
 * Custom hook to register socket event listeners with automatic cleanup.
 */
export function useSocketEvent<K extends keyof ServerToClientEvents>(
  event: K,
  callback: ServerToClientEvents[K],
) {
  const { registerListener, unregisterListener } = useSocket();

  // Avoid unnecessary subscription changes on every render by capturing callback in ref
  const callbackRef = React.useRef(callback);
  React.useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  React.useEffect(() => {
    const handler = ((...args: Parameters<ServerToClientEvents[K]>) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      callbackRef.current(...args);
    }) as unknown as ServerToClientEvents[K];

    registerListener(event, handler);
    return () => {
      unregisterListener(event, handler);
    };
  }, [event, registerListener, unregisterListener]);
}
