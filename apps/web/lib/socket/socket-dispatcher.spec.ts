import { Socket } from 'socket.io-client';
import { SocketDispatcher } from './socket-dispatcher';

describe('SocketDispatcher', () => {
  let mockSocket: jest.Mocked<Socket>;
  let dispatcher: SocketDispatcher;

  beforeEach(() => {
    mockSocket = {
      connected: true,
      emit: jest.fn(),
    } as unknown as jest.Mocked<Socket>;
    dispatcher = new SocketDispatcher(mockSocket);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('joinRoom', () => {
    it('should emit JoinRoom event when socket is connected', () => {
      const payload = {
        roomCode: 'ABC123',
        displayName: 'Test Player',
        guestToken: 'token123',
      };

      dispatcher.joinRoom(payload);

      expect(mockSocket.emit).toHaveBeenCalledWith('JoinRoom', payload);
    });

    it('should not emit JoinRoom event when socket is not connected', () => {
      mockSocket.connected = false;
      const payload = {
        roomCode: 'ABC123',
        displayName: 'Test Player',
        guestToken: 'token123',
      };

      dispatcher.joinRoom(payload);

      expect(mockSocket.emit).not.toHaveBeenCalled();
    });

    it('should warn when socket is not connected', () => {
      mockSocket.connected = false;
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const payload = {
        roomCode: 'ABC123',
        displayName: 'Test Player',
        guestToken: 'token123',
      };

      dispatcher.joinRoom(payload);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[SocketDispatcher] Cannot emit JoinRoom: socket not connected',
      );
      consoleWarnSpy.mockRestore();
    });
  });

  describe('leaveRoom', () => {
    it('should emit LeaveRoom event when socket is connected', () => {
      const payload = {
        roomId: 'room123',
        playerId: 'player123',
      };

      dispatcher.leaveRoom(payload);

      expect(mockSocket.emit).toHaveBeenCalledWith('LeaveRoom', payload);
    });

    it('should not emit LeaveRoom event when socket is not connected', () => {
      mockSocket.connected = false;
      const payload = {
        roomId: 'room123',
        playerId: 'player123',
      };

      dispatcher.leaveRoom(payload);

      expect(mockSocket.emit).not.toHaveBeenCalled();
    });
  });

  describe('playerReady', () => {
    it('should emit PlayerReady event when socket is connected', () => {
      const payload = {
        roomId: 'room123',
        playerId: 'player123',
      };

      dispatcher.playerReady(payload);

      expect(mockSocket.emit).toHaveBeenCalledWith('PlayerReady', payload);
    });

    it('should not emit PlayerReady event when socket is not connected', () => {
      mockSocket.connected = false;
      const payload = {
        roomId: 'room123',
        playerId: 'player123',
      };

      dispatcher.playerReady(payload);

      expect(mockSocket.emit).not.toHaveBeenCalled();
    });
  });

  describe('startGame', () => {
    it('should emit StartGame event when socket is connected', () => {
      const payload = {
        roomId: 'room123',
        gameId: 'game123',
      };

      dispatcher.startGame(payload);

      expect(mockSocket.emit).toHaveBeenCalledWith('StartGame', payload);
    });

    it('should not emit StartGame event when socket is not connected', () => {
      mockSocket.connected = false;
      const payload = {
        roomId: 'room123',
        gameId: 'game123',
      };

      dispatcher.startGame(payload);

      expect(mockSocket.emit).not.toHaveBeenCalled();
    });
  });

  describe('nextRound', () => {
    it('should emit NextRound event when socket is connected', () => {
      const payload = {
        roomId: 'room123',
      };

      dispatcher.nextRound(payload);

      expect(mockSocket.emit).toHaveBeenCalledWith('NextRound', payload);
    });

    it('should not emit NextRound event when socket is not connected', () => {
      mockSocket.connected = false;
      const payload = {
        roomId: 'room123',
      };

      dispatcher.nextRound(payload);

      expect(mockSocket.emit).not.toHaveBeenCalled();
    });
  });

  describe('endGame', () => {
    it('should emit EndGame event when socket is connected', () => {
      const payload = {
        roomId: 'room123',
      };

      dispatcher.endGame(payload);

      expect(mockSocket.emit).toHaveBeenCalledWith('EndGame', payload);
    });

    it('should not emit EndGame event when socket is not connected', () => {
      mockSocket.connected = false;
      const payload = {
        roomId: 'room123',
      };

      dispatcher.endGame(payload);

      expect(mockSocket.emit).not.toHaveBeenCalled();
    });
  });

  describe('submitAnswer', () => {
    it('should emit SubmitAnswer event when socket is connected', () => {
      const payload = {
        roomId: 'room123',
        questionId: 'question123',
        answer: 'test answer',
        responseTimeMs: 5000,
      };

      dispatcher.submitAnswer(payload);

      expect(mockSocket.emit).toHaveBeenCalledWith('SubmitAnswer', payload);
    });

    it('should not emit SubmitAnswer event when socket is not connected', () => {
      mockSocket.connected = false;
      const payload = {
        roomId: 'room123',
        questionId: 'question123',
        answer: 'test answer',
        responseTimeMs: 5000,
      };

      dispatcher.submitAnswer(payload);

      expect(mockSocket.emit).not.toHaveBeenCalled();
    });
  });

  describe('reconnectRequest', () => {
    it('should emit ReconnectRequest event when socket is connected', () => {
      const payload = {
        playerId: 'player123',
        roomId: 'room123',
      };

      dispatcher.reconnectRequest(payload);

      expect(mockSocket.emit).toHaveBeenCalledWith('ReconnectRequest', payload);
    });

    it('should not emit ReconnectRequest event when socket is not connected', () => {
      mockSocket.connected = false;
      const payload = {
        playerId: 'player123',
        roomId: 'room123',
      };

      dispatcher.reconnectRequest(payload);

      expect(mockSocket.emit).not.toHaveBeenCalled();
    });
  });

  describe('setSocket', () => {
    it('should update the socket instance', () => {
      const newSocket = {
        connected: true,
        emit: jest.fn(),
      } as unknown as jest.Mocked<Socket>;

      dispatcher.setSocket(newSocket);

      const payload = {
        roomId: 'room123',
        gameId: 'game123',
      };

      dispatcher.startGame(payload);

      expect(newSocket.emit).toHaveBeenCalledWith('StartGame', payload);
      expect(mockSocket.emit).not.toHaveBeenCalled();
    });

    it('should handle null socket', () => {
      dispatcher.setSocket(null);

      const payload = {
        roomId: 'room123',
        gameId: 'game123',
      };

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      dispatcher.startGame(payload);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[SocketDispatcher] Cannot emit StartGame: socket not connected',
      );
      consoleWarnSpy.mockRestore();
    });
  });
});
