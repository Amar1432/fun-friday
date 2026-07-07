/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { SocketLoggingInterceptor } from './socket-logging.interceptor';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { Socket } from 'socket.io';

describe('SocketLoggingInterceptor', () => {
  let interceptor: SocketLoggingInterceptor;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SocketLoggingInterceptor],
    }).compile();

    interceptor = module.get<SocketLoggingInterceptor>(
      SocketLoggingInterceptor,
    );
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  describe('intercept', () => {
    let mockContext: jest.Mocked<ExecutionContext>;
    let mockWsArgumentsHost: {
      getClient: jest.Mock;
      getData: jest.Mock;
      getPattern: jest.Mock;
    };
    let mockSocket: Partial<Socket>;
    let mockCallHandler: jest.Mocked<CallHandler>;

    beforeEach(() => {
      mockSocket = {
        id: 'socket-123',
        data: {
          user: { sub: 'player-123' },
          roomId: 'room-123',
        },
      };

      mockWsArgumentsHost = {
        getClient: jest.fn().mockReturnValue(mockSocket),
        getData: jest.fn().mockReturnValue({ roomId: 'room-456' }),
        getPattern: jest.fn().mockReturnValue('TestEvent'),
      };

      mockContext = {
        switchToWs: jest.fn().mockReturnValue(mockWsArgumentsHost),
        getArgByIndex: jest.fn(),
        getArgs: jest.fn(),
        getType: jest.fn(),
        switchToHttp: jest.fn(),
        switchToRpc: jest.fn(),
        getClass: jest.fn(),
        getHandler: jest.fn(),
      };

      mockCallHandler = {
        handle: jest.fn().mockReturnValue(of('response-data')),
      };
    });

    it('should log successfully on success path', (done) => {
      interceptor.intercept(mockContext, mockCallHandler).subscribe({
        next: (val) => {
          expect(val).toBe('response-data');
          expect(mockContext.switchToWs).toHaveBeenCalled();
          expect(mockCallHandler.handle).toHaveBeenCalled();
          done();
        },
      });
    });

    it('should log error on failure path', (done) => {
      const mockError = new Error('Test event error');
      mockCallHandler.handle.mockReturnValue(throwError(() => mockError));

      interceptor.intercept(mockContext, mockCallHandler).subscribe({
        error: (err) => {
          expect(err).toBe(mockError);
          expect(mockContext.switchToWs).toHaveBeenCalled();
          expect(mockCallHandler.handle).toHaveBeenCalled();
          done();
        },
      });
    });

    it('should fallback gracefully when client data or event data is missing', (done) => {
      // Clear data to test fallbacks
      delete mockSocket.data;
      mockWsArgumentsHost.getData.mockReturnValue(null);

      interceptor.intercept(mockContext, mockCallHandler).subscribe({
        next: (val) => {
          expect(val).toBe('response-data');
          done();
        },
      });
    });
  });
});
