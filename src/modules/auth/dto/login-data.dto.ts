import { ApiProperty } from '@nestjs/swagger';

export class LoginPilotDto {
  @ApiProperty({ example: 'pilot_001' })
  id: string;

  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiProperty({ example: 'johndoe' })
  username: string;
}

export class LoginDataDto {
  @ApiProperty({ description: 'Access token JWT untuk header `Authorization`.' })
  accessToken: string;

  @ApiProperty({ type: LoginPilotDto })
  pilot: LoginPilotDto;
}