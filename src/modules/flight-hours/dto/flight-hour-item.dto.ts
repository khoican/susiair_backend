import { ApiProperty } from '@nestjs/swagger';

export class FlightHourItemDto {
  @ApiProperty({ example: '2026-05-01', description: 'Hari, format `YYYY-MM-DD`.' })
  date: string;

  @ApiProperty({ example: 3.8, description: 'Jam terbang hari itu; `0` bila tanpa data / masa depan.' })
  hours: number;
}