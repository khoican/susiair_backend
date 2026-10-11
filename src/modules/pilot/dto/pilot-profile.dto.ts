import { ApiProperty } from '@nestjs/swagger';

export class PilotProfileDto {
  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiProperty({ example: 1444.5 })
  totalFlightHours: number;

  @ApiProperty({ example: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb' })
  avatarUrl: string;
}