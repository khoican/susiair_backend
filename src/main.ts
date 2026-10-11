import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { configureApp } from './app.setup.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  configureApp(app);

  const config = app.get(ConfigService);
  await app.listen(Number(config.get('PORT') ?? 3001));
}
await bootstrap();