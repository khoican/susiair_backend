import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class SchedulesQueryDto {
  @Type(() => Number)
  @IsInt()
  year: number;

  @Type(() => Number)
  @IsInt()
  month: number;
}
