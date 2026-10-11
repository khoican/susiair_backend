export interface PilotData {
  name: string;
  totalFlightHours: number;
}

export interface FlightHoursLimits {
  daily: number;
  weekly: number;
  monthly: number;
  annual: number;
}

export interface ChartBounds {
  limit: number;
  max: number;
  windowDays: number;
  displayRangeDays: number;
}

export type ChartBoundsMap = Record<
  '1w' | '1m' | '3m' | '6m' | '1y',
  ChartBounds
>;

export interface FlightHourEntry {
  date: string;
  hours: number;
}

export interface LegendEntry {
  code: string;
  label: string;
  color: string;
}

export interface ScheduleEntry {
  id: string;
  duty_date: string;
  status: number;
  base_name: string;
  base_color: string;
  duty_type: string;
  count_schedules: number;
  count_logbooks: number;
}

export interface DocumentEntry {
  id: string;
  label: string;
  expiryDate: string;
}

export interface DocumentThresholds {
  warningDays: number;
  comment: string;
}
