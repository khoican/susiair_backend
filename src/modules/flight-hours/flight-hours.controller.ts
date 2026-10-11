import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { ApiWrappedResponse } from '../../common/swagger/wrapped-response.decorator.js';
import { FlightHourItemDto } from './dto/flight-hour-item.dto.js';
import { SummaryDataDto } from './dto/flight-hour-summary.dto.js';
import { FlightHoursQueryDto } from './dto/flight-hours-query.dto.js';
import { SummaryQueryDto } from './dto/summary-query.dto.js';
import {
  FlightHoursService,
  type FlightHourItem,
  type SummaryResult,
} from './flight-hours.service.js';

@ApiTags('flight-hours')
@ApiBearerAuth()
@Controller('flight-hours')
@UseGuards(JwtAuthGuard)
export class FlightHoursController {
  constructor(private readonly flightHoursService: FlightHoursService) {}

  /**
   * Kembalikan jam terbang harian pada rentang yang diminta.
   * @param {FlightHoursQueryDto} query - Rentang tanggal `from`..`to`.
   * @returns {{ data: FlightHourItem[] }} Deret jam harian.
   */
  @Get()
  @ApiWrappedResponse({
    description: 'Jam terbang harian pada rentang inklusif; hari tanpa data / masa depan = `0`.',
    dataType: FlightHourItemDto,
    isArray: true,
  })
  getRange(@Query() query: FlightHoursQueryDto): { data: FlightHourItem[] } {
    return {
      data: this.flightHoursService.getRange(query.from, query.to),
    };
  }

  /**
   * Kembalikan ringkasan jam terbang (cards + grafik rolling sum).
   * @param {SummaryQueryDto} query - Rentang grafik; kosong berarti `1w`.
   * @returns {{ data: SummaryResult }} Cards dan chart ringkasan.
   */
  @Get('summary')
  @ApiWrappedResponse({
    description: 'Cards batas periode dan grafik rolling sum 15 titik.',
    dataType: SummaryDataDto,
  })
  getSummary(@Query() query: SummaryQueryDto): { data: SummaryResult } {
    return { data: this.flightHoursService.getSummary(query.range) };
  }
}