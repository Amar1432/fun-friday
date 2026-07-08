/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { GlobalExceptionFilter } from './../src/common/filters/global-exception.filter';
import { createCorsOptions } from './../src/config/cors.config';
import { TokenService } from './../src/auth/token.service';
import { PrismaService } from './../src/database/prisma.service';

describe('RoomsController (e2e)', () => {
  let app: INestApplication<App>;
  let tokenService: TokenService;
  let prisma: PrismaService;
  let hostToken: string;
  let hostId: string;

  beforeAll(async () => {
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

    tokenService = moduleFixture.get<TokenService>(TokenService);
    prisma = moduleFixture.get<PrismaService>(PrismaService);

    // Create a mock user in test DB
    const uniqueEmail = `test-host-${Date.now()}@example.com`;
    const user = await prisma.user.create({
      data: {
        email: uniqueEmail,
        name: 'Test Host',
      },
    });
    hostId = user.id;

    // Generate a valid host token
    hostToken = await tokenService.signToken({
      sub: hostId,
      name: 'Test Host',
      email: uniqueEmail,
      role: 'host',
    });
  });

  afterAll(async () => {
    // Cleanup the test user and its rooms
    if (hostId) {
      await prisma.user
        .delete({
          where: { id: hostId },
        })
        .catch(() => {});
    }
    await app.close();
  });

  describe('POST /api/v1/rooms', () => {
    it('should reject unauthorized host access', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/rooms')
        .send({})
        .expect(401);
    });

    it('should create a room successfully for a valid host', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/rooms')
        .set('Authorization', `Bearer ${hostToken}`)
        .send({})
        .expect(201);

      const body = res.body as {
        success: boolean;
        data: {
          room: {
            id: string;
            code: string;
            status: string;
          };
        };
      };

      expect(body.success).toBe(true);
      expect(body.data.room.id).toBeDefined();
      expect(body.data.room.code).toHaveLength(6);
      expect(body.data.room.status).toBe('LOBBY');
    });
  });

  describe('GET /api/v1/rooms/validate/:code', () => {
    it('should return 404 for invalid code', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/rooms/validate/NOTEXS')
        .expect(404);
    });

    it('should validate an existing room code', async () => {
      // Create a room first
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/rooms')
        .set('Authorization', `Bearer ${hostToken}`)
        .send({})
        .expect(201);

      const roomCode = createRes.body.data.room.code;

      const res = await request(app.getHttpServer())
        .get(`/api/v1/rooms/validate/${roomCode}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.exists).toBe(true);
      expect(res.body.data.room.code).toBe(roomCode);
    });
  });
});
