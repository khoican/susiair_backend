import { ApiProperty } from '@nestjs/swagger';

export class DocumentItemDto {
  @ApiProperty({ example: 'doc_license' })
  id: string;

  @ApiProperty({ example: 'Indonesian License Exp. Date' })
  label: string;

  @ApiProperty({ example: '2026-05-29' })
  expiryDate: string;

  @ApiProperty({ example: 14, description: 'Sisa hari terhadap anchor date.' })
  daysRemaining: number;

  @ApiProperty({ example: 'soon', description: '`expired`, `soon`, atau `safe`.' })
  status: string;

  @ApiProperty({ example: '#F59E0B', description: 'Warna badge urgensi.' })
  badgeColor: string;
}