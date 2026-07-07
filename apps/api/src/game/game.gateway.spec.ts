import { Test, TestingModule } from '@nestjs/testing';
import { GameGateway } from './game.gateway';
import { TokenService } from '../auth/token.service';
import { Socket } from 'socket.io';

describe('GameGateway', () => {
  let gateway: GameGateway;
  const verifyTokenMock = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameGateway,
        {
          provide: TokenService,
          useValue: {
            verifyToken: verifyTokenMock,
          },
        },
      ],
    }).compile();

    gateway = module.get<GameGateway>(GameGateway);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleConnection', () => {
    let mockSocket: {
      id: string;
      handshake: {
        auth: Record<string, unknown>;
        headers: Record<string, string>;
      };
      data: Record<string, any>;
      disconnect: jest.Mock;
    };

    beforeEach(() => {
      mockSocket = {
        id: 'socket-123',
        handshake: {
          auth: {},
          headers: {},
        },
        data: {},
        disconnect: jest.fn(),
      };
    });

    it('should reject connection when no token is present', async () => {
      await gateway.handleConnection(mockSocket as unknown as Socket);

      expect(mockSocket.disconnect).toHaveBeenCalledWith(true);
      expect(verifyTokenMock).not.toHaveBeenCalled();
    });

    it('should reject connection when token verification fails', async () => {
      mockSocket.handshake.auth.token = 'Bearer invalid-token';
      verifyTokenMock.mockRejectedValue(new Error('Invalid signature'));

      await gateway.handleConnection(mockSocket as unknown as Socket);

      expect(verifyTokenMock).toHaveBeenCalledWith('invalid-token');
      expect(mockSocket.disconnect).toHaveBeenCalledWith(true);
      expect(mockSocket.data.user).toBeUndefined();
    });

    it('should authenticate connection when valid host token is present in auth object', async () => {
      mockSocket.handshake.auth.token = 'Bearer valid-host-token';
      const mockPayload = { sub: 'host-123', name: 'John Doe', role: 'host' };
      verifyTokenMock.mockResolvedValue(mockPayload);

      await gateway.handleConnection(mockSocket as unknown as Socket);

      expect(verifyTokenMock).toHaveBeenCalledWith('valid-host-token');
      expect(mockSocket.disconnect).not.toHaveBeenCalled();
      expect(mockSocket.data.user).toEqual(mockPayload);
    });

    it('should authenticate connection when valid guest token is present in headers', async () => {
      mockSocket.handshake.headers.authorization = 'valid-guest-token';
      const mockPayload = {
        sub: 'guest-123',
        name: 'Guest Player',
        role: 'guest',
        roomId: 'room-123',
      };
      verifyTokenMock.mockResolvedValue(mockPayload);

      await gateway.handleConnection(mockSocket as unknown as Socket);

      expect(verifyTokenMock).toHaveBeenCalledWith('valid-guest-token');
      expect(mockSocket.disconnect).not.toHaveBeenCalled();
      expect(mockSocket.data.user).toEqual(mockPayload);
    });
  });

  describe('handleDisconnect', () => {
    it('should log disconnection', () => {
      const mockSocket = {
        id: 'socket-123',
        data: {
          user: { sub: 'user-123' },
        },
      } as unknown as Socket;

      expect(() => gateway.handleDisconnect(mockSocket)).not.toThrow();
    });

    it('should handle unauthenticated disconnection safely', () => {
      const mockSocket = {
        id: 'socket-123',
        data: {},
      } as unknown as Socket;

      expect(() => gateway.handleDisconnect(mockSocket)).not.toThrow();
    });
  });

  describe('handlePing', () => {
    it('should return pong status', () => {
      const res = gateway.handlePing();
      expect(res).toEqual({ status: 'pong' });
    });
  });
});
