import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'johndoe', description: 'Username pilot.' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: 'susiairtest', description: 'Password pilot.' })
  @IsString()
  @IsNotEmpty()
  password: string;
}