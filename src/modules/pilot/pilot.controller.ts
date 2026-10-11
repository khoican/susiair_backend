import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { PilotService, type PilotProfile } from './pilot.service.js';

@Controller('pilot')
@UseGuards(JwtAuthGuard)
export class PilotController {
  constructor(private readonly pilotService: PilotService) {}

  /**
   * Kembalikan profil pilot yang sedang login.
   * @returns {{ data: PilotProfile }} Profil pilot.
   */
  @Get('me')
  getMe(): { data: PilotProfile } {
    return { data: this.pilotService.getProfile() };
  }
}
