import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { SocketStatusIndicator } from './socket-status-indicator';

const mockUseSocket = jest.fn(() => ({
  status: 'disconnected',
}));

jest.mock('@/lib/socket/socket-context', () => ({
  useSocket: () => mockUseSocket(),
}));

describe('SocketStatusIndicator Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders disconnected state correctly', () => {
    mockUseSocket.mockReturnValue({ status: 'disconnected' });
    render(<SocketStatusIndicator />);

    const indicator = screen.getByTestId('socket-status-indicator');
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveTextContent('Disconnected');
    expect(indicator).toHaveAttribute('title', 'Disconnected from real-time server');
  });

  it('renders connected state correctly', () => {
    mockUseSocket.mockReturnValue({ status: 'connected' });
    render(<SocketStatusIndicator />);

    const indicator = screen.getByTestId('socket-status-indicator');
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveTextContent('Connected');
    expect(indicator).toHaveAttribute('title', 'Connected to real-time game server');
  });

  it('renders connecting state correctly', () => {
    mockUseSocket.mockReturnValue({ status: 'connecting' });
    render(<SocketStatusIndicator />);

    const indicator = screen.getByTestId('socket-status-indicator');
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveTextContent('Connecting');
    expect(indicator).toHaveAttribute('title', 'Establishing real-time connection...');
  });

  it('renders reconnecting state correctly', () => {
    mockUseSocket.mockReturnValue({ status: 'reconnecting' });
    render(<SocketStatusIndicator />);

    const indicator = screen.getByTestId('socket-status-indicator');
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveTextContent('Reconnecting');
    expect(indicator).toHaveAttribute('title', 'Connection lost. Retrying automatically...');
  });

  it('renders auth_failed state correctly', () => {
    mockUseSocket.mockReturnValue({ status: 'auth_failed' });
    render(<SocketStatusIndicator />);

    const indicator = screen.getByTestId('socket-status-indicator');
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveTextContent('Auth Failed');
    expect(indicator).toHaveAttribute('title', 'Real-time session authorization failed');
  });
});
