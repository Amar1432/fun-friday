/* eslint-disable */
import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { MicrosoftSsoProvider } from './microsoft-sso.provider';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';

jest.mock('crypto', () => {
  const original = jest.requireActual('crypto') as typeof crypto;
  return {
    ...original,
    createPublicKey: jest.fn(),
  };
});

jest.mock('jsonwebtoken', () => {
  const original = jest.requireActual('jsonwebtoken') as typeof jwt;
  return {
    ...original,
    decode: jest.fn(),
    verify: jest.fn(),
  };
});

const jwtDecodeMock = jwt.decode as jest.Mock;
const jwtVerifyMock = jwt.verify as jest.Mock;
const createPublicKeyMock = crypto.createPublicKey as jest.Mock;

describe('MicrosoftSsoProvider', () => {
  let provider: MicrosoftSsoProvider;
  let fetchMock: jest.Mock;

  beforeEach(async () => {
    process.env.MICROSOFT_CLIENT_ID = 'test-client-id';

    // Mock global fetch
    fetchMock = jest.fn();
    global.fetch = fetchMock;

    createPublicKeyMock.mockImplementation(() => ({
      type: 'public',
    }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [MicrosoftSsoProvider],
    }).compile();

    provider = module.get<MicrosoftSsoProvider>(MicrosoftSsoProvider);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    delete process.env.MICROSOFT_CLIENT_ID;
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  it('should return user profile for a valid token with email', async () => {
    jwtDecodeMock.mockReturnValue({
      header: { kid: 'kid-123' },
    });
    fetchMock.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          keys: [{ kid: 'kid-123', kty: 'RSA', n: 'mock-n', e: 'AQAB' }],
        }),
    });
    jwtVerifyMock.mockReturnValue({
      email: 'user@example.com',
      name: 'John Doe',
      iss: 'https://login.microsoftonline.com/tenant-123/v2.0',
    });

    const result = await provider.verifyIdToken('valid-token');

    expect(result).toEqual({
      email: 'user@example.com',
      name: 'John Doe',
    });
    expect(jwtDecodeMock).toHaveBeenCalledWith('valid-token', {
      complete: true,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://login.microsoftonline.com/common/discovery/v2.0/keys',
    );
    expect(createPublicKeyMock).toHaveBeenCalledWith({
      format: 'jwk',
      key: { kid: 'kid-123', kty: 'RSA', n: 'mock-n', e: 'AQAB' },
    });
    expect(jwtVerifyMock).toHaveBeenCalledWith(
      'valid-token',
      { type: 'public' },
      {
        audience: 'test-client-id',
      },
    );
  });

  it('should fall back to preferred_username if email is missing', async () => {
    jwtDecodeMock.mockReturnValue({
      header: { kid: 'kid-123' },
    });
    fetchMock.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          keys: [{ kid: 'kid-123', kty: 'RSA', n: 'mock-n', e: 'AQAB' }],
        }),
    });
    jwtVerifyMock.mockReturnValue({
      preferred_username: 'pref@example.com',
      name: 'John Doe',
      iss: 'https://login.microsoftonline.com/tenant-123/v2.0',
    });

    const result = await provider.verifyIdToken('valid-token-pref');

    expect(result).toEqual({
      email: 'pref@example.com',
      name: 'John Doe',
    });
  });

  it('should throw UnauthorizedException if header kid is missing', async () => {
    jwtDecodeMock.mockReturnValue({
      header: {},
    });

    await expect(provider.verifyIdToken('token-no-kid')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException if decode returns null', async () => {
    jwtDecodeMock.mockReturnValue(null);

    await expect(provider.verifyIdToken('invalid-decode')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException if JWKS fetch fails', async () => {
    jwtDecodeMock.mockReturnValue({
      header: { kid: 'kid-123' },
    });
    fetchMock.mockResolvedValue({
      ok: false,
      statusText: 'Internal Server Error',
    });

    await expect(provider.verifyIdToken('token')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException if kid is not in JWKS keys list', async () => {
    jwtDecodeMock.mockReturnValue({
      header: { kid: 'kid-other' },
    });
    fetchMock.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          keys: [{ kid: 'kid-123', kty: 'RSA' }],
        }),
    });

    await expect(provider.verifyIdToken('token')).rejects.toThrow(
      new UnauthorizedException('Microsoft public key not found for kid'),
    );
  });

  it('should throw UnauthorizedException if verification fails', async () => {
    jwtDecodeMock.mockReturnValue({
      header: { kid: 'kid-123' },
    });
    fetchMock.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          keys: [{ kid: 'kid-123', kty: 'RSA' }],
        }),
    });
    jwtVerifyMock.mockImplementation(() => {
      throw new Error('Token expired');
    });

    await expect(provider.verifyIdToken('expired-token')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException if issuer is invalid', async () => {
    jwtDecodeMock.mockReturnValue({
      header: { kid: 'kid-123' },
    });
    fetchMock.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          keys: [{ kid: 'kid-123', kty: 'RSA' }],
        }),
    });
    jwtVerifyMock.mockReturnValue({
      email: 'user@example.com',
      name: 'John Doe',
      iss: 'https://login.malicious.com/tenant-123/v2.0',
    });

    await expect(
      provider.verifyIdToken('invalid-issuer-token'),
    ).rejects.toThrow(
      new UnauthorizedException('Invalid Microsoft token issuer'),
    );
  });

  it('should throw UnauthorizedException if both email and preferred_username are missing', async () => {
    jwtDecodeMock.mockReturnValue({
      header: { kid: 'kid-123' },
    });
    fetchMock.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          keys: [{ kid: 'kid-123', kty: 'RSA' }],
        }),
    });
    jwtVerifyMock.mockReturnValue({
      name: 'John Doe',
      iss: 'https://login.microsoftonline.com/tenant-123/v2.0',
    });

    await expect(provider.verifyIdToken('no-email-token')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException if name is missing', async () => {
    jwtDecodeMock.mockReturnValue({
      header: { kid: 'kid-123' },
    });
    fetchMock.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          keys: [{ kid: 'kid-123', kty: 'RSA' }],
        }),
    });
    jwtVerifyMock.mockReturnValue({
      email: 'user@example.com',
      iss: 'https://login.microsoftonline.com/tenant-123/v2.0',
    });

    await expect(provider.verifyIdToken('no-name-token')).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
