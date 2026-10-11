import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { SchedulesQueryDto } from './dto/schedules-query.dto.js';
import { SchedulesService, type SchedulesResult } from './schedules.service.js';

@Controller('schedules')
@UseGuards(JwtAuthGuard)
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  /**
   * Kembalikan jadwal duty bulanan beserta legend.
   * @param {SchedulesQueryDto} query - Tahun dan bulan.
   * @returns {{ data: SchedulesResult }} Legend dan jadwal pada bulan tsb.
   */
  @Get()
  getAll(@Query() query: SchedulesQueryDto): { data: SchedulesResult } {
    return {
      data: this.schedulesService.getSchedules(query.year, query.month),
    };
  }
}
