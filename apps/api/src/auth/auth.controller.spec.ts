import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  const ssoLoginMock = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            ssoLogin: ssoLoginMock,
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('ssoLogin', () => {
    it('should return success envelope with SSO login result', async () => {
      const mockResult = {
        accessToken: 'jwt-token',
        expiresIn: 86400,
        user: { id: 'usr-123', name: 'John Doe', email: 'john@example.com' },
      };
      ssoLoginMock.mockResolvedValue(mockResult);

      const result = await controller.ssoLogin({
        provider: 'google',
        idToken: 'valid-token',
      });

      expect(result).toEqual({ success: true, data: mockResult });
      expect(ssoLoginMock).toHaveBeenCalledWith('google', 'valid-token');
    });
  });
});
