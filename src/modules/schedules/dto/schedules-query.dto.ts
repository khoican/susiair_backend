import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class SchedulesQueryDto {
  @ApiProperty({ example: 2026, description: 'Tahun penuh, mis. `2026`.' })
  @Type(() => Number)
  @IsInt()
  year: number;

  @ApiProperty({ example: 5, description: 'Bulan 1-12.' })
  @Type(() => Number)
  @IsInt()
  month: number;
}