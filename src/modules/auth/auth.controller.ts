import { ApiBadRequestResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiWrappedResponse } from '../../common/swagger/wrapped-response.decorator.js';
import { AuthService, type LoginResult } from './auth.service.js';
import { LoginDataDto } from './dto/login-data.dto.js';
import { LoginDto } from './dto/login.dto.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Autentikasi pilot dan kembalikan access token.
   * @param {LoginDto} dto - Kredensial login.
   * @returns {Promise<{ message: string; data: LoginResult }>} Pesan sukses dan data login.
   */
  @Post('login')
  @HttpCode(200)
  @ApiWrappedResponse({ description: 'Login berhasil; kembalikan token dan pilot.', dataType: LoginDataDto })
  @ApiUnauthorizedResponse({ description: 'Kredensial salah.' })
  @ApiBadRequestResponse({ description: 'Field hilang atau bukan string.' })
  async login(
    @Body() dto: LoginDto,
  ): Promise<{ message: string; data: LoginResult }> {
    const data = await this.authService.login(dto);
    return { message: 'Login successful', data };
  }
}