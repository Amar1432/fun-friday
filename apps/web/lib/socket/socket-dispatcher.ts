/* eslint-disable no-console */
import { Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents } from './types';

/**
 * Outgoing event dispatcher that centralizes all WebSocket event emissions.
 * Components should never emit socket events directly - they must use this dispatcher.
 */
export class SocketDispatcher {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

  constructor(socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null) {
    this.socket = socket;
  }

  /**
   * Update the socket instance (used when socket reconnects)
   */
  setSocket(socket: Socket<ServerToClientEvents, ClientToServerEvents> | null) {
    this.socket = socket;
  }

  /**
   * Emit JoinRoom event
   */
  joinRoom(payload: { roomCode: string; displayName: string; guestToken: string }): void {
    if (!this.socket?.connected) {
      console.warn('[SocketDispatcher] Cannot emit JoinRoom: socket not connected');
      return;
    }
    this.socket.emit('JoinRoom', payload);
  }

  /**
   * Emit LeaveRoom event
   */
  leaveRoom(payload: { roomId: string; playerId: string }): void {
    if (!this.socket?.connected) {
      console.warn('[SocketDispatcher] Cannot emit LeaveRoom: socket not connected');
      return;
    }
    this.socket.emit('LeaveRoom', payload);
  }

  /**
   * Emit PlayerReady event
   */
  playerReady(payload: { roomId: string; playerId: string }): void {
    if (!this.socket?.connected) {
      console.warn('[SocketDispatcher] Cannot emit PlayerReady: socket not connected');
      return;
    }
    this.socket.emit('PlayerReady', payload);
  }

  /**
   * Emit StartGame event
   */
  startGame(payload: { roomId: string; gameId: string }): void {
    if (!this.socket?.connected) {
      console.warn('[SocketDispatcher] Cannot emit StartGame: socket not connected');
      return;
    }
    this.socket.emit('StartGame', payload);
  }

  /**
   * Emit NextRound event
   */
  nextRound(payload: { roomId: string }): void {
    if (!this.socket?.connected) {
      console.warn('[SocketDispatcher] Cannot emit NextRound: socket not connected');
      return;
    }
    this.socket.emit('NextRound', payload);
  }

  /**
   * Emit EndGame event
   */
  endGame(payload: { roomId: string }): void {
    if (!this.socket?.connected) {
      console.warn('[SocketDispatcher] Cannot emit EndGame: socket not connected');
      return;
    }
    this.socket.emit('EndGame', payload);
  }

  /**
   * Emit SubmitAnswer event
   */
  submitAnswer(payload: {
    roomId: string;
    questionId: string;
    answer: string;
    responseTimeMs: number;
  }): void {
    if (!this.socket?.connected) {
      console.warn('[SocketDispatcher] Cannot emit SubmitAnswer: socket not connected');
      return;
    }
    this.socket.emit('SubmitAnswer', payload);
  }

  /**
   * Emit ReconnectRequest event
   */
  reconnectRequest(payload: { playerId: string; roomId: string }): void {
    if (!this.socket?.connected) {
      console.warn('[SocketDispatcher] Cannot emit ReconnectRequest: socket not connected');
      return;
    }
    this.socket.emit('ReconnectRequest', payload);
  }
}
