/**
 * "Now", for every date calculation in the app. Records come from the Data
 * Store and move in real time, so these read the real clock.
 */
export function appToday(): Date {
  return new Date();
}

export function appTodayMs(): number {
  return Date.now();
}

export const DAY_MS = 86_400_000;

/** Whole days between an ISO timestamp and now. */
export function daysSince(iso: string): number {
  return (appTodayMs() - Date.parse(iso)) / DAY_MS;
}

/** Hours between an ISO timestamp and now. */
export function hoursSince(iso: string): number {
  return (appTodayMs() - Date.parse(iso)) / 3_600_000;
}

/**
 * House operating conventions, not contractual targets. No SLA field exists in
 * this data model, and the UI must not imply one.
 */
export const AGING_THRESHOLD_DAYS = 14;
export const PICKUP_THRESHOLD_HOURS = 24;
export const INSPECTION_RECORD_DAYS = 395;
export const FLEET_AGE_THRESHOLD_YEARS = 10;
export const REPEAT_VISIT_THRESHOLD = 3;

/** Below this many closed requests, a median is noise rather than a measurement. */
export const MIN_SAMPLE_FOR_MEDIAN = 8;
/** Below this many fielded units, a per-100-units rate is not worth stating. */
export const MIN_UNITS_FOR_RATE = 3;
