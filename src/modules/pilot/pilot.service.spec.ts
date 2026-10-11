import { DEFAULT_PILOT } from '../../common/constants/app.constant.js';
import { MockDataService } from '../../mock-data/mock-data.service.js';
import { PilotService } from './pilot.service.js';

describe('PilotService', () => {
  const service = new PilotService(new MockDataService());

  it('mengembalikan nama, total jam terbang, dan avatar pilot', () => {
    expect(service.getProfile()).toEqual({
      name: 'John Doe',
      totalFlightHours: 1444.5,
      avatarUrl: DEFAULT_PILOT.avatarUrl,
    });
  });
});
