import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { DocumentsService, type DocumentItem } from './documents.service.js';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  /**
   * Kembalikan daftar dokumen pilot beserta badge urgensi.
   * @returns {{ data: DocumentItem[] }} Daftar dokumen.
   */
  @Get()
  getAll(): { data: DocumentItem[] } {
    return { data: this.documentsService.getDocuments() };
  }
}
