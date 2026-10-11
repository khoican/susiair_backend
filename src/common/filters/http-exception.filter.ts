import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';

/**
 * Filter global untuk menyeragamkan bentuk response error seluruh endpoint.
 * Response berbentuk `{ statusCode, message, error }`.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  /**
   * Tangkap semua exception yang belum tertangani dan ubah menjadi response JSON seragam.
   * @param {unknown} exception - Exception yang dilempar handler/guard/pipe.
   * @param {ArgumentsHost} host - Konteks eksekusi, dipakai mengambil objek response HTTP.
   * @returns {void}
   */
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();
      const body =
        typeof payload === 'string'
          ? { statusCode: status, message: payload, error: HttpStatus[status] }
          : payload;
      response.status(status).json(body);
      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      error: 'Internal Server Error',
    });
  }
}
