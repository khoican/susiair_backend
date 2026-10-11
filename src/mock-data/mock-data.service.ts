import { Injectable } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import type {
  ChartBoundsMap,
  DocumentEntry,
  DocumentThresholds,
  FlightHourEntry,
  FlightHoursLimits,
  LegendEntry,
  PilotData,
  ScheduleEntry,
} from './mock-data.types.js';

interface FlightHoursFile {
  pilot: PilotData;
  limits: FlightHoursLimits;
  chartBounds: ChartBoundsMap;
  flightHours: FlightHourEntry[];
}

interface SchedulesFile {
  today: string;
  fieldGuide: Record<string, string>;
  legend: LegendEntry[];
  schedules: ScheduleEntry[];
}

interface DocumentsFile {
  today: string;
  thresholds: DocumentThresholds;
  documents: DocumentEntry[];
}

function load<T>(fileName: string): T {
  const url = new URL(`../../mocks/${fileName}`, import.meta.url);
  return JSON.parse(readFileSync(url, 'utf-8')) as T;
}

/**
 * Provider in-memory yang membaca ketiga file JSON di `mocks/` saat bootstrap.
 * Bersifat read-only: hanya membaca file, tidak pernah menulis/mengubahnya.
 */
@Injectable()
export class MockDataService {
  private readonly flightHoursFile: FlightHoursFile;
  private readonly schedulesFile: SchedulesFile;
  private readonly documentsFile: DocumentsFile;

  constructor() {
    this.flightHoursFile = load<FlightHoursFile>('mock-flight-hours.json');
    this.schedulesFile = load<SchedulesFile>('mock-schedules.json');
    this.documentsFile = load<DocumentsFile>('mock-documents.json');
  }

  /**
   * Ambil profil pilot beserta total jam terbang.
   * @returns {PilotData} Nama pilot dan total jam terbang.
   */
  getPilot(): PilotData {
    return this.flightHoursFile.pilot;
  }

  /**
   * Ambil batas jam terbang (harian/mingguan/bulanan/tahunan).
   * @returns {FlightHoursLimits} Batas jam per periode.
   */
  getLimits(): FlightHoursLimits {
    return this.flightHoursFile.limits;
  }

  /**
   * Ambil konfigurasi batas grafik per rentang.
   * @returns {ChartBoundsMap} Batas limit/max/window per rentang `1w`..`1y`.
   */
  getChartBounds(): ChartBoundsMap {
    return this.flightHoursFile.chartBounds;
  }

  /**
   * Ambil seluruh entri jam terbang harian.
   * @returns {FlightHourEntry[]} Daftar `{ date, hours }` berurutan.
   */
  getFlightHours(): FlightHourEntry[] {
    return this.flightHoursFile.flightHours;
  }

  /**
   * Ambil daftar legend duty.
   * @returns {LegendEntry[]} Daftar `{ code, label, color }`.
   */
  getLegend(): LegendEntry[] {
    return this.schedulesFile.legend;
  }

  /**
   * Ambil seluruh entri jadwal duty.
   * @returns {ScheduleEntry[]} Daftar jadwal tanpa transformasi.
   */
  getSchedules(): ScheduleEntry[] {
    return this.schedulesFile.schedules;
  }

  /**
   * Ambil ambang hari peringatan dokumen.
   * @returns {DocumentThresholds} Ambang `warningDays` dan catatan.
   */
  getDocumentThresholds(): DocumentThresholds {
    return this.documentsFile.thresholds;
  }

  /**
   * Ambil seluruh dokumen pilot.
   * @returns {DocumentEntry[]} Daftar `{ id, label, expiryDate }`.
   */
  getDocuments(): DocumentEntry[] {
    return this.documentsFile.documents;
  }
}
