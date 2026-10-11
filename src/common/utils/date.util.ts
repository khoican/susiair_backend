import dayjs from 'dayjs';

const FORMAT = 'YYYY-MM-DD';

/**
 * Hitung selisih hari antara dua tanggal (`to` dikurangi `from`).
 * @param {string} from - Tanggal awal, format `YYYY-MM-DD`.
 * @param {string} to - Tanggal akhir, format `YYYY-MM-DD`.
 * @returns {number} Jumlah hari (negatif bila `to` lebih awal dari `from`).
 */
export function diffDays(from: string, to: string): number {
  return dayjs(to).diff(dayjs(from), 'day');
}

/**
 * Geser tanggal sejumlah hari.
 * @param {string} date - Tanggal acuan, format `YYYY-MM-DD`.
 * @param {number} days - Jumlah hari (negatif untuk mundur).
 * @returns {string} Tanggal hasil, format `YYYY-MM-DD`.
 */
export function addDays(date: string, days: number): string {
  return dayjs(date).add(days, 'day').format(FORMAT);
}

/**
 * Susun daftar tanggal harian inklusif dari `from` sampai `to`.
 * @param {string} from - Tanggal awal, format `YYYY-MM-DD`.
 * @param {string} to - Tanggal akhir, format `YYYY-MM-DD`.
 * @returns {string[]} Daftar tanggal `YYYY-MM-DD`; kosong bila `from` > `to`.
 */
export function eachDay(from: string, to: string): string[] {
  const days: string[] = [];
  const end = dayjs(to);
  let cursor = dayjs(from);

  while (!cursor.isAfter(end)) {
    days.push(cursor.format(FORMAT));
    cursor = cursor.add(1, 'day');
  }

  return days;
}
