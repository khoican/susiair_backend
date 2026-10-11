import { IsIn, IsOptional } from 'class-validator';

export const SUMMARY_RANGES = ['1w', '1m', '3m', '6m', '1y'] as const;

export type SummaryRange = (typeof SUMMARY_RANGES)[number];

export class SummaryQueryDto {
  @IsOptional()
  @IsIn(SUMMARY_RANGES)
  range?: SummaryRange;
}