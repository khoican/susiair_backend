import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { ApiWrappedResponse } from '../../common/swagger/wrapped-response.decorator.js';
import { ScheduleResultDto } from './dto/schedule-result.dto.js';
import { SchedulesQueryDto } from './dto/schedules-query.dto.js';
import { SchedulesService, type SchedulesResult } from './schedules.service.js';

@ApiTags('schedules')
@ApiBearerAuth()
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
  @ApiWrappedResponse({
    description: 'Legend lengkap dan jadwal duty pada bulan/tahun yang diminta.',
    dataType: ScheduleResultDto,
  })
  getAll(@Query() query: SchedulesQueryDto): { data: SchedulesResult } {
    return {
      data: this.schedulesService.getSchedules(query.year, query.month),
    };
  }
}