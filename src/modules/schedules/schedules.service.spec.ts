import { MockDataService } from '../../mock-data/mock-data.service.js';
import { SchedulesService } from './schedules.service.js';

describe('SchedulesService', () => {
  const service = new SchedulesService(new MockDataService());

  it('mengembalikan 10 legend dan jadwal Mei 2026 dengan isCompleted', () => {
    const { legend, schedules } = service.getSchedules(2026, 5);

    expect(legend).toHaveLength(10);
    expect(schedules).toHaveLength(21);

    const byId = Object.fromEntries(schedules.map((s) => [s.id, s]));
    expect(byId['97017']).toMatchObject({
      duty_date: '2026-05-01',
      status: 2,
      isCompleted: true,
    });
    expect(byId['97028']).toMatchObject({
      count_schedules: 2,
      count_logbooks: 0,
      isCompleted: false,
    });
  });

  it('mengembalikan daftar kosong untuk bulan tanpa data', () => {
    const { schedules } = service.getSchedules(2026, 7);

    expect(schedules).toEqual([]);
  });
});
