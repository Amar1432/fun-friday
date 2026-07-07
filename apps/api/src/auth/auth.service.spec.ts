import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../database/prisma.service';
import { TokenService } from './token.service';
import { GoogleSsoProvider } from './providers/google-sso.provider';
import { MicrosoftSsoProvider } from './providers/microsoft-sso.provider';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  const findUniqueMock = jest.fn();
  const createMock = jest.fn();
  const signTokenMock = jest.fn();
  const verifyGoogleIdTokenMock = jest.fn();
  const verifyMicrosoftIdTokenMock = jest.fn();

  beforeEach(async () => {
    process.env.JWT_EXPIRATION = '24h';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: findUniqueMock,
              create: createMock,
            },
          },
        },
        {
          provide: TokenService,
          useValue: {
            signToken: signTokenMock,
          },
        },
        {
          provide: GoogleSsoProvider,
          useValue: {
            verifyIdToken: verifyGoogleIdTokenMock,
          },
        },
        {
          provide: MicrosoftSsoProvider,
          useValue: {
            verifyIdToken: verifyMicrosoftIdTokenMock,
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('ssoLogin', () => {
    it('should create a new user and return JWT for valid Google token', async () => {
      verifyGoogleIdTokenMock.mockResolvedValue({
        email: 'user@example.com',
        name: 'John Doe',
      });
      findUniqueMock.mockResolvedValue(null);
      createMock.mockResolvedValue({
        id: 'usr-123',
        email: 'user@example.com',
        name: 'John Doe',
      });
      signTokenMock.mockResolvedValue('jwt-token');

      const result = await service.ssoLogin('google', 'valid-id-token');

      expect(result.accessToken).toBe('jwt-token');
      expect(result.expiresIn).toBe(86400);
      expect(result.user.email).toBe('user@example.com');
      expect(createMock).toHaveBeenCalled();
    });

    it('should create a new user and return JWT for valid Microsoft token', async () => {
      verifyMicrosoftIdTokenMock.mockResolvedValue({
        email: 'ms-user@example.com',
        name: 'Jane Doe',
      });
      findUniqueMock.mockResolvedValue(null);
      createMock.mockResolvedValue({
        id: 'usr-456',
        email: 'ms-user@example.com',
        name: 'Jane Doe',
      });
      signTokenMock.mockResolvedValue('ms-jwt-token');

      const result = await service.ssoLogin('microsoft', 'valid-ms-token');

      expect(result.accessToken).toBe('ms-jwt-token');
      expect(result.expiresIn).toBe(86400);
      expect(result.user.email).toBe('ms-user@example.com');
      expect(createMock).toHaveBeenCalled();
    });

    it('should reuse existing user for returning users', async () => {
      verifyGoogleIdTokenMock.mockResolvedValue({
        email: 'existing@example.com',
        name: 'Existing User',
      });
      findUniqueMock.mockResolvedValue({
        id: 'usr-existing',
        email: 'existing@example.com',
        name: 'Existing User',
      });
      signTokenMock.mockResolvedValue('jwt-token-existing');

      const result = await service.ssoLogin('google', 'valid-id-token');

      expect(result.user.id).toBe('usr-existing');
      expect(createMock).not.toHaveBeenCalled();
    });

    it('should handle unique constraint violation (P2002) gracefully and return existing user', async () => {
      verifyGoogleIdTokenMock.mockResolvedValue({
        email: 'concurrent@example.com',
        name: 'Concurrent User',
      });
      // First findUnique returns null (user doesn't exist yet)
      // Second findUnique returns the user created by concurrent request
      findUniqueMock.mockResolvedValueOnce(null).mockResolvedValueOnce({
        id: 'usr-concurrent',
        email: 'concurrent@example.com',
        name: 'Concurrent User',
      });
      // createMock throws unique constraint error
      const prismaError = Object.assign(new Error('Unique constraint failed'), {
        code: 'P2002',
      });
      createMock.mockRejectedValue(prismaError);
      signTokenMock.mockResolvedValue('jwt-token-concurrent');

      const result = await service.ssoLogin('google', 'valid-id-token');

      expect(result.user.id).toBe('usr-concurrent');
      expect(createMock).toHaveBeenCalled();
      expect(findUniqueMock).toHaveBeenCalledTimes(2);
    });

    it('should rethrow non-P2002 errors on user creation', async () => {
      verifyGoogleIdTokenMock.mockResolvedValue({
        email: 'error@example.com',
        name: 'Error User',
      });
      findUniqueMock.mockResolvedValue(null);
      const dbError = new Error('DB Connection Failed');
      createMock.mockRejectedValue(dbError);

      await expect(
        service.ssoLogin('google', 'valid-id-token'),
      ).rejects.toThrow('DB Connection Failed');
    });

    it('should throw for unsupported provider', async () => {
      await expect(service.ssoLogin('unsupported', 'token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
