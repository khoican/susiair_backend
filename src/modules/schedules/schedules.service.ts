import { Injectable } from '@nestjs/common';
import type {
  LegendEntry,
  ScheduleEntry,
} from '../../mock-data/mock-data.types.js';
import { MockDataService } from '../../mock-data/mock-data.service.js';

export interface ScheduleItem extends ScheduleEntry {
  isCompleted: boolean;
}

export interface SchedulesResult {
  legend: LegendEntry[];
  schedules: ScheduleItem[];
}

/**
 * Layanan jadwal duty pilot.
 */
@Injectable()
export class SchedulesService {
  constructor(private readonly mockData: MockDataService) {}

  /**
   * Ambil jadwal duty pada bulan/tahun tertentu beserta legend lengkap.
   * @param {number} year - Tahun penuh (mis. `2026`).
   * @param {number} month - Bulan 1-12.
   * @returns {SchedulesResult} Legend lengkap dan jadwal yang sudah dilengkapi `isCompleted`.
   */
  getSchedules(year: number, month: number): SchedulesResult {
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    const schedules = this.mockData
      .getSchedules()
      .filter((entry) => entry.duty_date.startsWith(prefix))
      .map((entry) => ({
        ...entry,
        isCompleted: entry.count_logbooks === entry.count_schedules,
      }));

    return { legend: this.mockData.getLegend(), schedules };
  }
}
