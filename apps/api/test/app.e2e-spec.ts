import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { GlobalExceptionFilter } from './../src/common/filters/global-exception.filter';
import { createCorsOptions } from './../src/config/cors.config';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.enableCors(createCorsOptions('http://localhost:3000'));
    app.setGlobalPrefix('api/v1', {
      exclude: ['health', 'api/v1/health'],
    });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
  });

  it('/api/v1 (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1')
      .expect(200)
      .expect('Hello World!');
  });

  it('/health (GET)', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);
    const body = res.body as {
      success: boolean;
      data: { status: string; timestamp: string; uptime: number };
    };
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('ok');
    expect(body.data.timestamp).toBeDefined();
    expect(body.data.uptime).toBeGreaterThanOrEqual(0);
  });

  it('/api/v1/health (GET)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200);
    const body = res.body as {
      success: boolean;
      data: { status: string; timestamp: string; uptime: number };
    };
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('ok');
    expect(body.data.timestamp).toBeDefined();
    expect(body.data.uptime).toBeGreaterThanOrEqual(0);
  });

  describe('/api/v1/test-validation (POST)', () => {
    it('should accept valid payload', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/test-validation')
        .send({ name: 'John Doe', age: 30 })
        .expect(201);

      expect(res.body).toEqual({
        success: true,
        data: { name: 'John Doe', age: 30 },
      });
    });

    it('should reject unknown fields (forbidNonWhitelisted)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/test-validation')
        .send({ name: 'John Doe', age: 30, extraField: 'not allowed' })
        .expect(400);

      const body = res.body as {
        success: boolean;
        error: { code: string; message: string; details: string[] };
      };
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(body.error.message).toBe('Validation failed');
      expect(body.error.details).toContain(
        'property extraField should not exist',
      );
    });

    it('should reject invalid payload values (validation error)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/test-validation')
        .send({ name: '', age: 'thirty' })
        .expect(400);

      const body = res.body as {
        success: boolean;
        error: { code: string; message: string; details: string[] };
      };
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(body.error.message).toBe('Validation failed');
      expect(body.error.details).toContain('name should not be empty');
      expect(body.error.details).toContain(
        'age must be a number conforming to the specified constraints',
      );
    });
  });

  describe('/api/v1/test-http-error (GET)', () => {
    it('should return standard HTTP exception format', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/test-http-error')
        .expect(400);

      expect(res.body).toEqual({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'Custom HTTP error message',
        },
      });
    });
  });

  describe('/api/v1/test-error (GET)', () => {
    it('should return internal server error format (with stack in dev)', async () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      try {
        const res = await request(app.getHttpServer())
          .get('/api/v1/test-error')
          .expect(500);

        const body = res.body as {
          success: boolean;
          error: { code: string; message: string; stack?: string };
        };
        expect(body.success).toBe(false);
        expect(body.error.code).toBe('INTERNAL_SERVER_ERROR');
        expect(body.error.message).toBe('Test internal error');
        expect(body.error.stack).toBeDefined();
      } finally {
        process.env.NODE_ENV = originalNodeEnv;
      }
    });

    it('should return internal server error format (hidden stack and message in prod)', async () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      try {
        const res = await request(app.getHttpServer())
          .get('/api/v1/test-error')
          .expect(500);

        expect(res.body).toEqual({
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
          },
        });
      } finally {
        process.env.NODE_ENV = originalNodeEnv;
      }
    });
  });

  describe('Request ID Header propagation', () => {
    it('should generate a new request ID if none is provided in headers', async () => {
      const res = await request(app.getHttpServer()).get('/health').expect(200);

      expect(res.headers['x-request-id']).toBeDefined();
      expect(typeof res.headers['x-request-id']).toBe('string');
      expect(res.headers['x-request-id'].length).toBeGreaterThan(0);
    });

    it('should reuse and return the request ID provided in request headers', async () => {
      const customId = 'client-provided-req-id-789';
      const res = await request(app.getHttpServer())
        .get('/health')
        .set('x-request-id', customId)
        .expect(200);

      expect(res.headers['x-request-id']).toBe(customId);
    });

    it('should include request ID header in error responses', async () => {
      const customId = 'error-req-id-456';
      const res = await request(app.getHttpServer())
        .get('/api/v1/test-http-error')
        .set('x-request-id', customId)
        .expect(400);

      expect(res.headers['x-request-id']).toBe(customId);
      const body = res.body as { success: boolean };
      expect(body.success).toBe(false);
    });
  });

  describe('CORS', () => {
    it('allows the configured frontend origin with credentials', async () => {
      const res = await request(app.getHttpServer())
        .options('/health')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'GET')
        .expect(204);

      expect(res.headers['access-control-allow-origin']).toBe(
        'http://localhost:3000',
      );
      expect(res.headers['access-control-allow-credentials']).toBe('true');
    });

    it('rejects origins other than the configured frontend origin', async () => {
      const res = await request(app.getHttpServer())
        .options('/health')
        .set('Origin', 'https://malicious.example')
        .set('Access-Control-Request-Method', 'GET')
        .expect(500);

      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
