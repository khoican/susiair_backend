import { Injectable } from '@nestjs/common';
import { DEFAULT_PILOT } from '../../common/constants/app.constant.js';
import { MockDataService } from '../../mock-data/mock-data.service.js';

export interface PilotProfile {
  name: string;
  totalFlightHours: number;
  avatarUrl: string;
}

/**
 * Layanan profil pilot.
 */
@Injectable()
export class PilotService {
  constructor(private readonly mockData: MockDataService) {}

  /**
   * Ambil profil pilot: nama, total jam terbang, dan URL avatar.
   * @returns {PilotProfile} Profil pilot untuk endpoint `/pilot/me`.
   */
  getProfile(): PilotProfile {
    const pilot = this.mockData.getPilot();
    return {
      name: pilot.name,
      totalFlightHours: pilot.totalFlightHours,
      avatarUrl: DEFAULT_PILOT.avatarUrl,
    };
  }
}
