import { MockDataService } from '../../mock-data/mock-data.service.js';
import { FlightHoursService } from './flight-hours.service.js';

describe('FlightHoursService', () => {
  const service = new FlightHoursService(new MockDataService());

  it('mengembalikan satu entri per hari; hari tanpa record bernilai 0.0', () => {
    expect(service.getRange('2026-05-01', '2026-05-02')).toEqual([
      { date: '2026-05-01', hours: 3.8 },
      { date: '2026-05-02', hours: 0 },
    ]);
  });

  it('menolkan data setelah anchor (masa depan)', () => {
    expect(service.getRange('2026-05-15', '2026-05-17')).toEqual([
      { date: '2026-05-15', hours: 6.4 },
      { date: '2026-05-16', hours: 0 },
      { date: '2026-05-17', hours: 0 },
    ]);
  });

  it('summary 1w memberi cards sesuai batas dan chart 15 titik', () => {
    const { cards, chart } = service.getSummary('1w');

    expect(cards.daily).toEqual({ current: 6.4, limit: 8 });
    expect(cards.weekly).toEqual({ current: 25.2, limit: 40 });
    expect(cards.monthly).toEqual({ current: 87.2, limit: 100 });
    expect(cards.annual).toEqual({ current: 1013.8, limit: 1050 });

    expect(chart).toMatchObject({ range: '1w', limitLine: 40, yMax: 45 });
    expect(chart.series).toHaveLength(15);
    expect(chart.series[0]).toEqual({ date: '2026-05-08', sum: 15 });
    expect(chart.series[7]).toEqual({ date: '2026-05-15', sum: 25.2 });
    expect(chart.series[14]).toEqual({ date: '2026-05-22', sum: 0 });
  });

  it('default range ke 1w saat tanpa argumen', () => {
    expect(service.getSummary()).toEqual(service.getSummary('1w'));
  });
});