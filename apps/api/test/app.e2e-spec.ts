import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
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

      const body = res.body as { message: string[] };
      expect(body.message).toContain('property extraField should not exist');
    });

    it('should reject invalid payload values (validation error)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/test-validation')
        .send({ name: '', age: 'thirty' })
        .expect(400);

      const body = res.body as { message: string[] };
      expect(body.message).toContain('name should not be empty');
      expect(body.message).toContain(
        'age must be a number conforming to the specified constraints',
      );
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
