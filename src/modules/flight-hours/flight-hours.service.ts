import { Injectable } from '@nestjs/common';
import { ANCHOR_DATE } from '../../common/constants/app.constant.js';
import { addDays, eachDay } from '../../common/utils/date.util.js';
import type { FlightHourEntry } from '../../mock-data/mock-data.types.js';
import { MockDataService } from '../../mock-data/mock-data.service.js';
import type { SummaryRange } from './dto/summary-query.dto.js';

export interface FlightHourItem {
  date: string;
  hours: number;
}

export interface CardValue {
  current: number;
  limit: number;
}

export interface SummaryCards {
  daily: CardValue;
  weekly: CardValue;
  monthly: CardValue;
  annual: CardValue;
}

export interface ChartPoint {
  date: string;
  sum: number;
}

export interface ChartSummary {
  range: SummaryRange;
  limitLine: number;
  yMax: number;
  series: ChartPoint[];
}

export interface SummaryResult {
  cards: SummaryCards;
  chart: ChartSummary;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Layanan jam terbang: deret harian dan ringkasan rolling sum.
 */
@Injectable()
export class FlightHoursService {
  constructor(private readonly mockData: MockDataService) {}

  /**
   * Ambil jam terbang harian pada rentang `[from, to]` (inklusif).
   * @param {string} from - Tanggal awal, format `YYYY-MM-DD`.
   * @param {string} to - Tanggal akhir, format `YYYY-MM-DD`.
   * @returns {FlightHourItem[]} Satu entri per hari; hari tanpa record bernilai `0.0`.
   */
  getRange(from: string, to: string): FlightHourItem[] {
    const hours = this.toHourMap(this.entriesUpToAnchor());

    return eachDay(from, to).map((date) => ({
      date,
      hours: round1(hours.get(date) ?? 0),
    }));
  }

  /**
   * Hitung ringkasan jam (cards batas periode) dan grafik rolling sum 15 titik.
   * Tanggal setelah anchor (`2026-05-15`) dan tanpa record berkontribusi `0.0`.
   * @param {SummaryRange} range - Rentang grafik (`1w`..`1y`), default `1w`.
   * @returns {SummaryResult} Cards per periode dan grafik berpusat pada anchor.
   */
  getSummary(range: SummaryRange = '1w'): SummaryResult {
    // ponytail: entri > anchor (masa depan fiktif dari mock s.d. 2026-05-31) di-nol-kan di sini agar tak pernah terhitung.
    const hours = this.toHourMap(this.entriesUpToAnchor());
    const { windowDays, limit, max } = this.mockData.getChartBounds()[range];
    const limits = this.mockData.getLimits();

    return {
      cards: {
        daily: {
          current: round1(hours.get(ANCHOR_DATE) ?? 0),
          limit: limits.daily,
        },
        weekly: {
          current: this.rollingSum(hours, ANCHOR_DATE, 7),
          limit: limits.weekly,
        },
        monthly: {
          current: this.rollingSum(hours, ANCHOR_DATE, 30),
          limit: limits.monthly,
        },
        annual: {
          current: this.rollingSum(hours, ANCHOR_DATE, 365),
          limit: limits.annual,
        },
      },
      chart: {
        range,
        limitLine: limit,
        yMax: max,
        series: eachDay(
          addDays(ANCHOR_DATE, -7),
          addDays(ANCHOR_DATE, 7),
        ).map((date) => ({
          date,
          sum: this.rollingSum(hours, date, windowDays),
        })),
      },
    };
  }

  /**
   * Ambil seluruh entri jam terbang hingga anchor date (data masa depan diabaikan).
   * @returns {FlightHourEntry[]} Entri dengan `date <= ANCHOR_DATE`.
   */
  private entriesUpToAnchor(): FlightHourEntry[] {
    return this.mockData
      .getFlightHours()
      .filter((entry) => entry.date <= ANCHOR_DATE);
  }

  /**
   * Bangun peta `date -> hours` dari daftar entri.
   * @param {FlightHourEntry[]} entries - Daftar entri jam terbang.
   * @returns {Map<string, number>} Peta tanggal ke jam.
   */
  private toHourMap(entries: FlightHourEntry[]): Map<string, number> {
    return new Map(entries.map((entry) => [entry.date, entry.hours]));
  }

  /**
   * Hitung rolling sum jam pada rentang `[to - (windowDays - 1), to]`.
   * @param {Map<string, number>} hours - Peta tanggal ke jam.
   * @param {string} to - Tanggal akhir jendela.
   * @param {number} windowDays - Panjang jendela (hari).
   * @returns {number} Total jam, dibulatkan 1 desimal.
   */
  private rollingSum(
    hours: Map<string, number>,
    to: string,
    windowDays: number,
  ): number {
    let total = 0;
    for (let offset = 0; offset < windowDays; offset += 1) {
      total += hours.get(addDays(to, -offset)) ?? 0;
    }
    return round1(total);
  }
}