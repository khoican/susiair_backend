import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { ApiWrappedResponse } from '../../common/swagger/wrapped-response.decorator.js';
import { PilotProfileDto } from './dto/pilot-profile.dto.js';
import { PilotService, type PilotProfile } from './pilot.service.js';

@ApiTags('pilot')
@ApiBearerAuth()
@Controller('pilot')
@UseGuards(JwtAuthGuard)
export class PilotController {
  constructor(private readonly pilotService: PilotService) {}

  /**
   * Kembalikan profil pilot yang sedang login.
   * @returns {{ data: PilotProfile }} Profil pilot.
   */
  @Get('me')
  @ApiWrappedResponse({ description: 'Profil pilot yang sedang login.', dataType: PilotProfileDto })
  getMe(): { data: PilotProfile } {
    return { data: this.pilotService.getProfile() };
  }
}