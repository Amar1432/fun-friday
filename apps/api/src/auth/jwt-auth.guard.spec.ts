import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { TokenService, TokenPayload } from './token.service';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  const verifyTokenMock = jest.fn();

  beforeEach(() => {
    guard = new JwtAuthGuard({
      verifyToken: verifyTokenMock,
    } as unknown as TokenService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  interface MockRequest {
    headers: { authorization?: string };
    user?: TokenPayload;
  }

  function createMockContext(authorizationHeader?: string): {
    context: ExecutionContext;
    request: MockRequest;
  } {
    const request: MockRequest = {
      headers: {
        ...(authorizationHeader !== undefined && {
          authorization: authorizationHeader,
        }),
      },
    };

    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;

    return { context, request };
  }

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access for a valid Bearer token', async () => {
    const mockPayload: TokenPayload = {
      sub: 'usr-123',
      email: 'user@example.com',
      name: 'John Doe',
    };
    verifyTokenMock.mockResolvedValue(mockPayload);

    const { context, request } = createMockContext('Bearer valid-jwt-token');
    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(verifyTokenMock).toHaveBeenCalledWith('valid-jwt-token');

    // Verify user was attached to request
    expect(request.user).toEqual(mockPayload);
  });

  it('should throw UnauthorizedException when no Authorization header', async () => {
    const { context } = createMockContext();
    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
    await expect(guard.canActivate(context)).rejects.toThrow(
      'Missing authorization token',
    );
  });

  it('should throw UnauthorizedException when Authorization header is empty', async () => {
    const { context } = createMockContext('');
    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException when scheme is not Bearer', async () => {
    const { context } = createMockContext('Basic some-token');
    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException when Bearer has no token', async () => {
    const { context } = createMockContext('Bearer');
    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException when token verification fails', async () => {
    verifyTokenMock.mockRejectedValue(new Error('Token expired'));

    const { context } = createMockContext('Bearer expired-token');
    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
    await expect(guard.canActivate(context)).rejects.toThrow(
      'Invalid or expired token',
    );
  });
});
