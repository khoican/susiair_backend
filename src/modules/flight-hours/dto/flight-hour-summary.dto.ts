import { ApiProperty } from '@nestjs/swagger';

export class CardValueDto {
  @ApiProperty({ example: 6.4, description: 'Nilai saat ini (rolling sum / jam harian).' })
  current: number;

  @ApiProperty({ example: 8, description: 'Batas yang diizinkan.' })
  limit: number;
}

export class SummaryCardsDto {
  @ApiProperty({ type: CardValueDto })
  daily: CardValueDto;

  @ApiProperty({ type: CardValueDto })
  weekly: CardValueDto;

  @ApiProperty({ type: CardValueDto })
  monthly: CardValueDto;

  @ApiProperty({ type: CardValueDto })
  annual: CardValueDto;
}

export class ChartPointDto {
  @ApiProperty({ example: '2026-05-15', description: 'Hari, format `YYYY-MM-DD`.' })
  date: string;

  @ApiProperty({ example: 25.2, description: 'Rolling sum pada hari itu.' })
  sum: number;
}

export class ChartSummaryDto {
  @ApiProperty({ example: '1w', description: 'Rentang yang diminta.' })
  range: string;

  @ApiProperty({ example: 40, description: 'Garis batas grafik.' })
  limitLine: number;

  @ApiProperty({ example: 45, description: 'Batas atas sumbu Y.' })
  yMax: number;

  @ApiProperty({ type: ChartPointDto, isArray: true, description: '15 titik harian berpusat pada anchor.' })
  series: ChartPointDto[];
}

export class SummaryDataDto {
  @ApiProperty({ type: SummaryCardsDto })
  cards: SummaryCardsDto;

  @ApiProperty({ type: ChartSummaryDto })
  chart: ChartSummaryDto;
}