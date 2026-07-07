import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { GoogleSsoProvider } from './google-sso.provider';

const verifyIdTokenMock = jest.fn();

// Mock the entire google-auth-library module
jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: verifyIdTokenMock,
  })),
}));

describe('GoogleSsoProvider', () => {
  let provider: GoogleSsoProvider;

  beforeEach(async () => {
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';

    const module: TestingModule = await Test.createTestingModule({
      providers: [GoogleSsoProvider],
    }).compile();

    provider = module.get<GoogleSsoProvider>(GoogleSsoProvider);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    delete process.env.GOOGLE_CLIENT_ID;
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  it('should return user profile for a valid token', async () => {
    verifyIdTokenMock.mockResolvedValue({
      getPayload: () => ({
        email: 'user@example.com',
        name: 'John Doe',
      }),
    });

    const result = await provider.verifyIdToken('valid-token');

    expect(result).toEqual({
      email: 'user@example.com',
      name: 'John Doe',
    });
  });

  it('should throw UnauthorizedException for missing email', async () => {
    verifyIdTokenMock.mockResolvedValue({
      getPayload: () => ({
        name: 'John Doe',
      }),
    });

    await expect(provider.verifyIdToken('token-no-email')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException for missing name', async () => {
    verifyIdTokenMock.mockResolvedValue({
      getPayload: () => ({
        email: 'user@example.com',
      }),
    });

    await expect(provider.verifyIdToken('token-no-name')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException when verification fails', async () => {
    verifyIdTokenMock.mockRejectedValue(new Error('Token expired'));

    await expect(provider.verifyIdToken('expired-token')).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
