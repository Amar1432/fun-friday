import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { TokenService, TokenPayload } from './token.service';

describe('TokenService', () => {
  let service: TokenService;
  const signAsyncMock = jest.fn();
  const verifyAsyncMock = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        {
          provide: JwtService,
          useValue: {
            signAsync: signAsyncMock,
            verifyAsync: verifyAsyncMock,
          },
        },
      ],
    }).compile();

    service = module.get<TokenService>(TokenService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signToken', () => {
    it('should call signAsync with correct payload', async () => {
      const payload: TokenPayload = {
        sub: 'user-123',
        email: 'user@example.com',
        name: 'John Doe',
      };
      signAsyncMock.mockResolvedValue('mock-token');

      const token = await service.signToken(payload);

      expect(token).toBe('mock-token');
      expect(signAsyncMock).toHaveBeenCalledWith(payload);
    });
  });

  describe('verifyToken', () => {
    it('should call verifyAsync and return the payload', async () => {
      const payload: TokenPayload = {
        sub: 'user-123',
        email: 'user@example.com',
        name: 'John Doe',
      };
      verifyAsyncMock.mockResolvedValue(payload);

      const verified = await service.verifyToken('mock-token');

      expect(verified).toEqual(payload);
      expect(verifyAsyncMock).toHaveBeenCalledWith('mock-token');
    });
  });
});
