import { applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';

/**
 * Bangun deskripsi respons sukses yang menyertakan wrapper global `{ statusCode, data }`.
 * @param {object} options - Opsi respons: `description`, tipe data (kelas), dan `isArray`.
 * @param {string} options.description - Penjelasan respons.
 * @param {Function} options.dataType - Kelas DTO yang didokumentasikan sebagai `data`.
 * @param {boolean} [options.isArray=false] - Bila `data` berupa larik.
 * @returns {MethodDecorator & PropertyDecorator} Decorator gabungan untuk endpoint.
 */
export function ApiWrappedResponse(options: {
  description: string;
  dataType: Function;
  isArray?: boolean;
}) {
  const dataSchema = options.isArray
    ? { type: 'array', items: { $ref: getSchemaPath(options.dataType) } }
    : { $ref: getSchemaPath(options.dataType) };

  return applyDecorators(
    ApiExtraModels(options.dataType),
    ApiOkResponse({
      description: options.description,
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 200 },
          data: dataSchema,
        },
      },
    }),
  );
}