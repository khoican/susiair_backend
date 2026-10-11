import { addDays, diffDays, eachDay } from './date.util.js';

describe('date.util', () => {
  describe('diffDays', () => {
    it('mengembalikan nilai positif untuk tanggal yang lebih akhir', () => {
      expect(diffDays('2026-05-08', '2026-05-15')).toBe(7);
    });

    it('mengembalikan nol untuk tanggal yang sama', () => {
      expect(diffDays('2026-05-15', '2026-05-15')).toBe(0);
    });

    it('mengembalikan nilai negatif untuk tanggal yang lebih awal', () => {
      expect(diffDays('2026-05-15', '2026-05-01')).toBe(-14);
    });
  });

  describe('addDays', () => {
    it('menggeser ke depan', () => {
      expect(addDays('2026-05-15', 7)).toBe('2026-05-22');
    });

    it('menggeser ke belakang', () => {
      expect(addDays('2026-05-15', -7)).toBe('2026-05-08');
    });

    it('melintasi batas bulan', () => {
      expect(addDays('2026-05-31', 1)).toBe('2026-06-01');
    });
  });

  describe('eachDay', () => {
    it('inklusif pada kedua ujung', () => {
      expect(eachDay('2026-05-08', '2026-05-10')).toEqual([
        '2026-05-08',
        '2026-05-09',
        '2026-05-10',
      ]);
    });

    it('menghasilkan satu entri untuk tanggal sama', () => {
      expect(eachDay('2026-05-15', '2026-05-15')).toEqual(['2026-05-15']);
    });

    it('kosong bila from lebih akhir dari to', () => {
      expect(eachDay('2026-05-10', '2026-05-08')).toEqual([]);
    });
  });
});
