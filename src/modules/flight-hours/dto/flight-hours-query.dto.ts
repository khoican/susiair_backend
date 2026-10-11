import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class FlightHoursQueryDto {
  @ApiProperty({ example: '2026-05-01', description: 'Tanggal awal, format `YYYY-MM-DD`.' })
  @IsDateString()
  from: string;

  @ApiProperty({ example: '2026-05-15', description: 'Tanggal akhir, format `YYYY-MM-DD`.' })
  @IsDateString()
  to: string;
}