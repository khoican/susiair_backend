import { ApiProperty } from '@nestjs/swagger';

export class LegendDto {
  @ApiProperty({ example: 'DTY' })
  code: string;

  @ApiProperty({ example: 'On Duty' })
  label: string;

  @ApiProperty({ example: '#10B981' })
  color: string;
}

export class ScheduleItemDto {
  @ApiProperty({ example: '97017' })
  id: string;

  @ApiProperty({ example: '2026-05-01' })
  duty_date: string;

  @ApiProperty({ example: 2, description: '1 = pending/upcoming, 2 = completed/verified.' })
  status: number;

  @ApiProperty({ example: 'PDG' })
  base_name: string;

  @ApiProperty({ example: '#10B981' })
  base_color: string;

  @ApiProperty({ example: 'DTY' })
  duty_type: string;

  @ApiProperty({ example: 2 })
  count_schedules: number;

  @ApiProperty({ example: 2 })
  count_logbooks: number;

  @ApiProperty({ example: true, description: '`count_logbooks === count_schedules`.' })
  isCompleted: boolean;
}

export class ScheduleResultDto {
  @ApiProperty({ type: LegendDto, isArray: true, description: '10 kode duty.' })
  legend: LegendDto[];

  @ApiProperty({ type: ScheduleItemDto, isArray: true, description: 'Jadwal pada bulan/tahun tsb.' })
  schedules: ScheduleItemDto[];
}