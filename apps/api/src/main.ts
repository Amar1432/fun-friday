import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1', {
    exclude: ['health', 'api/v1/health'],
  });

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
}
void bootstrap();
