import { IsDateString } from 'class-validator';

export class FlightHoursQueryDto {
  @IsDateString()
  from: string;

  @IsDateString()
  to: string;
}