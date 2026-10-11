import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  DEFAULT_PASSWORD,
  DEFAULT_PILOT,
} from '../../common/constants/app.constant.js';
import type { LoginDto } from './dto/login.dto.js';

export interface LoginResult {
  accessToken: string;
  pilot: { id: string; name: string; username: string };
}

/**
 * Layanan autentikasi: memvalidasi kredensial dan menerbitkan access token JWT.
 */
@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  /**
   * Validasi kredensial lalu terbitkan access token untuk pilot.
   * @param {LoginDto} dto - Kredensial login (username, password).
   * @returns {Promise<LoginResult>} Access token dan data pilot.
   * @throws {UnauthorizedException} Bila username atau password salah.
   */
  async login(dto: LoginDto): Promise<LoginResult> {
    if (
      dto.username !== DEFAULT_PILOT.username ||
      dto.password !== DEFAULT_PASSWORD
    ) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: DEFAULT_PILOT.id,
      username: DEFAULT_PILOT.username,
    });

    return {
      accessToken,
      pilot: {
        id: DEFAULT_PILOT.id,
        name: DEFAULT_PILOT.name,
        username: DEFAULT_PILOT.username,
      },
    };
  }
}
