import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { ApiWrappedResponse } from '../../common/swagger/wrapped-response.decorator.js';
import { DocumentItemDto } from './dto/document-item.dto.js';
import { DocumentsService, type DocumentItem } from './documents.service.js';

@ApiTags('documents')
@ApiBearerAuth()
@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  /**
   * Kembalikan daftar dokumen pilot beserta badge urgensi.
   * @returns {{ data: DocumentItem[] }} Daftar dokumen.
   */
  @Get()
  @ApiWrappedResponse({
    description: 'Daftar dokumen dengan badge urgensi (expired/soon/safe).',
    dataType: DocumentItemDto,
    isArray: true,
  })
  getAll(): { data: DocumentItem[] } {
    return { data: this.documentsService.getDocuments() };
  }
}