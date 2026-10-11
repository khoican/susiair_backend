import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

type AuthenticatedRequest = Request & { user?: unknown };

/**
 * Guard yang memvalidasi Bearer token JWT pada header Authorization.
 * Payload token yang valid ditempelkan ke `request.user`.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  /**
   * Verifikasi Bearer token pada request.
   * @param {ExecutionContext} context - Konteks eksekusi NestJS.
   * @returns {Promise<boolean>} `true` bila token valid.
   * @throws {UnauthorizedException} Bila header tidak ada, format salah, atau token tidak valid.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const [type, token] = request.headers.authorization?.split(' ') ?? [];

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Unauthorized');
    }

    try {
      request.user = await this.jwtService.verifyAsync(token);
      return true;
    } catch {
      throw new UnauthorizedException('Unauthorized');
    }
  }
}
