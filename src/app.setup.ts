import { INestApplication, ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { TransformInterceptor } from './common/interceptors/transform.interceptor.js';

/**
 * Terapkan konfigurasi aplikasi yang sama untuk runtime (`main.ts`) dan e2e:
 * prefix global, validasi, filter error, dan wrapper response.
 * @param {INestApplication} app - Instance aplikasi NestJS yang dikonfigurasi.
 * @returns {void}
 */
export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  app.useGlobalInterceptors(new TransformInterceptor());
}