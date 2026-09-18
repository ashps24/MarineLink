/**
 * The reference "now" for every date calculation in the app.
 *
 * The fixtures describe a service year ending 18 September 2026. If metrics were
 * computed against the real clock, the whole dataset would drift into the past
 * and the dashboard would slowly fill with stale-looking work that is really
 * just old demonstration data. Pinning the reference date keeps ages, medians
 * and trends internally consistent for as long as the build exists — and the
 * dashboard says so in its header rather than passing it off as live.
 *
 * Replacing the mock layer with real services means deleting this and using the
 * real clock.
 */
export const APP_TODAY_ISO = "2026-09-18T17:00:00Z";

export function appToday(): Date {
  return new Date(APP_TODAY_ISO);
}

export function appTodayMs(): number {
  return Date.parse(APP_TODAY_ISO);
}

export const DAY_MS = 86_400_000;

/** Whole days between an ISO timestamp and the reference date. */
export function daysSince(iso: string): number {
  return (appTodayMs() - Date.parse(iso)) / DAY_MS;
}

/** Hours between an ISO timestamp and the reference date. */
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
