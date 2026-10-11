import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { FlightHoursQueryDto } from './dto/flight-hours-query.dto.js';
import { SummaryQueryDto } from './dto/summary-query.dto.js';
import {
  FlightHoursService,
  type FlightHourItem,
  type SummaryResult,
} from './flight-hours.service.js';

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
  getSummary(@Query() query: SummaryQueryDto): { data: SummaryResult } {
    return { data: this.flightHoursService.getSummary(query.range) };
  }
}