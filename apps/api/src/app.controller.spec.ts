import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  describe('health', () => {
    it('should return health status', () => {
      const response = appController.getHealth();
      expect(response.success).toBe(true);
      expect(response.data.status).toBe('ok');
      expect(response.data.timestamp).toBeDefined();
      expect(response.data.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should return health status for v1 path', () => {
      const response = appController.getHealthV1();
      expect(response.success).toBe(true);
      expect(response.data.status).toBe('ok');
      expect(response.data.timestamp).toBeDefined();
      expect(response.data.uptime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('testValidation', () => {
    it('should return input data', () => {
      const payload = { name: 'John Doe', age: 30 };
      expect(appController.testValidation(payload)).toEqual({
        success: true,
        data: payload,
      });
    });
  });
});
