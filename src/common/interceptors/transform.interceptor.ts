import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';

/**
 * Interceptor global yang menambahkan `statusCode` ke setiap response sukses.
 * Controller cukup mengembalikan `{ data }` (opsional `message`).
 */
@Injectable()
export class TransformInterceptor implements NestInterceptor {
  /**
   * Bungkus payload handler dengan `statusCode` dari HTTP response.
   * @param {ExecutionContext} context - Konteks eksekusi NestJS.
   * @param {CallHandler} next - Handler berikutnya dalam pipeline.
   * @returns {Observable<Record<string, unknown>>} Observable payload terbungkus.
   */
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Record<string, unknown>> {
    const statusCode = context.switchToHttp().getResponse().statusCode;
    return next.handle().pipe(map((value) => ({ statusCode, ...value })));
  }
}
