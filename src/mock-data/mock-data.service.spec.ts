import { MockDataService } from './mock-data.service.js';

describe('MockDataService', () => {
  const service = new MockDataService();

  describe('data jam terbang', () => {
    it('memuat seluruh 521 entri harian', () => {
      expect(service.getFlightHours()).toHaveLength(521);
    });

    it('rentang tanggal sesuai file mock', () => {
      const entries = service.getFlightHours();
      expect(entries[0].date).toBe('2024-12-27');
      expect(entries.at(-1)?.date).toBe('2026-05-31');
    });

    it('menyediakan profil pilot', () => {
      expect(service.getPilot()).toEqual({
        name: 'John Doe',
        totalFlightHours: 1444.5,
      });
    });

    it('menyediakan batas jam', () => {
      expect(service.getLimits().daily).toBe(8);
    });

    it('menyediakan chart bounds per rentang', () => {
      expect(service.getChartBounds()['1w'].windowDays).toBe(7);
    });
  });

  describe('data jadwal', () => {
    it('memuat legend lengkap', () => {
      expect(service.getLegend()).toHaveLength(10);
    });

    it('memuat seluruh entri jadwal', () => {
      expect(service.getSchedules()).toHaveLength(54);
    });

    it('entri pertama utuh sesuai file mock', () => {
      expect(service.getSchedules()[0]).toEqual({
        id: '97000',
        duty_date: '2026-04-01',
        status: 2,
        base_name: 'MKW',
        base_color: '#10B981',
        duty_type: 'DTY',
        count_schedules: 4,
        count_logbooks: 4,
      });
    });
  });

  describe('data dokumen', () => {
    it('memuat seluruh dokumen', () => {
      expect(service.getDocuments()).toHaveLength(5);
    });

    it('menyediakan ambang warning 30 hari', () => {
      expect(service.getDocumentThresholds().warningDays).toBe(30);
    });

    it('memuat dokumen lisensi', () => {
      expect(service.getDocuments().some((doc) => doc.id === 'doc_license')).toBe(
        true,
      );
    });
  });
});
