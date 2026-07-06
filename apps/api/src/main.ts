import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { createCorsOptions } from './config/cors.config';
import { verifyDatabaseConnection } from './database/database-connection';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const prisma = new PrismaClient();

  try {
    await verifyDatabaseConnection(prisma, logger);
  } finally {
    await prisma.$disconnect();
  }

  const app = await NestFactory.create(AppModule);

  app.enableShutdownHooks();

  app.enableCors(createCorsOptions());

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

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
}

void bootstrap().catch((error: unknown) => {
  const logger = new Logger('Bootstrap');
  const message = error instanceof Error ? error.message : 'Unknown error';

  logger.error(`API startup aborted: ${message}`);
  process.exitCode = 1;
});
