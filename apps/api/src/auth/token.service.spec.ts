import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule, JwtService } from '@nestjs/jwt';
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

describe('TokenService (Integration)', () => {
  let service: TokenService;
  const secret = 'test-secret';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret,
          signOptions: { expiresIn: '60s' },
        }),
      ],
      providers: [TokenService],
    }).compile();

    service = module.get<TokenService>(TokenService);
  });

  it('should sign and verify token successfully, preserving payload claims', async () => {
    const payload: TokenPayload = {
      sub: 'user-456',
      email: 'user2@example.com',
      name: 'Alice Smith',
    };

    const token = await service.signToken(payload);
    expect(token).toBeDefined();

    const decoded = await service.verifyToken(token);
    expect(decoded.sub).toBe(payload.sub);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.name).toBe(payload.name);
    const decodedWithTime = decoded as TokenPayload & {
      iat?: number;
      exp?: number;
    };
    expect(decodedWithTime.iat).toBeDefined();
    expect(decodedWithTime.exp).toBeDefined();
  });

  it('should reject verification if token signature is invalid (tampered)', async () => {
    const payload: TokenPayload = {
      sub: 'user-456',
      email: 'user2@example.com',
      name: 'Alice Smith',
    };

    const token = await service.signToken(payload);
    const tamperedToken = token + 'tampered';

    await expect(service.verifyToken(tamperedToken)).rejects.toThrow();
  });

  it('should reject verification if token is signed with a different secret', async () => {
    const payload: TokenPayload = {
      sub: 'user-456',
      email: 'user2@example.com',
      name: 'Alice Smith',
    };

    const otherJwtService = new JwtService({
      secret: 'different-secret',
      signOptions: { expiresIn: '60s' },
    });
    const token = await otherJwtService.signAsync(payload);

    await expect(service.verifyToken(token)).rejects.toThrow();
  });
});
