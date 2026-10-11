import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { configureApp } from './app.setup.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  configureApp(app);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Susi Air Pilot API')
    .setDescription(
      'Backend REST Susi Air Pilot App. Semua respons sukses dibungkus `{ statusCode, data }`; ' +
        'log-in menambah `message`. Endpoint selain login wajib header `Authorization: Bearer <token>`. ' +
        'Anchor date (pengganti hari ini) = `2026-05-15`.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const config = app.get(ConfigService);
  await app.listen(Number(config.get('PORT') ?? 3001));
}
await bootstrap();