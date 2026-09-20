import type { Customer, Dealer, Equipment, ServiceRequest } from "@/types";
import { fetchLiveDealers, fetchLiveCustomers, fetchLiveEquipment, fetchLiveServiceRequests } from "./live-source";
import {
  visibleDealers,
  visibleCustomers,
  visibleEquipment,
  visibleServiceRequests,
} from "@/lib/permissions/visibility";
import {
  appTodayMs,
  daysSince,
  DAY_MS,
  AGING_THRESHOLD_DAYS,
  INSPECTION_RECORD_DAYS,
  FLEET_AGE_THRESHOLD_YEARS,
  REPEAT_VISIT_THRESHOLD,
  MIN_SAMPLE_FOR_MEDIAN,
  MIN_UNITS_FOR_RATE,
} from "@/lib/constants/time";
import type { RequestScope } from "./types";

/**
 * Executive-level KPIs for the internal dashboard.
 *
 * Every figure here is a real computation over the fixtures — nothing is a
 * fabricated business fact (no revenue, cost, or contract data exists in this
 * model). Where a fixture-scale sample would make a rate misleading, the
 * function says so explicitly via an `insufficientData` message rather than
 * printing a number that looks more confident than it is.
 *
 * These are not validated with Zod like the entity-level reads: the shape is
 * a composite computed at read time rather than a record type a future
 * backend would return verbatim, so there is no fixed schema to validate
 * against yet. That decision is revisited once these become real endpoints.
 */

const OPEN_STATUSES: ServiceRequest["status"][] = ["new", "in_progress", "waiting"];
const isOpen = (r: ServiceRequest) => OPEN_STATUSES.includes(r.status);

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function percentile(values: number[], p: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[index];
}

// ── Band 1 ───────────────────────────────────────────────────────────────

export interface UnitDownRow {
  equipmentId: string;
  name: string;
  customerName?: string;
  daysDown: number;
  requestId?: string;
  requestStatus?: ServiceRequest["status"];
}

export interface UnitsDownNow {
  count: number;
  fieldedTotal: number;
  rows: UnitDownRow[];
}

function computeUnitsDownNow(
  equipment: Equipment[],
  requests: ServiceRequest[],
  customers: Customer[],
): UnitsDownNow {
  const fielded = equipment.filter((e) => e.currentStatus !== "retired");
  const openFlagging = requests.filter((r) => isOpen(r) && r.unitOutOfService && r.equipmentId);

  const flagByEquipment = new Map<string, ServiceRequest>();
  for (const request of openFlagging) {
    const existing = flagByEquipment.get(request.equipmentId!);
    if (!existing || Date.parse(request.createdAt) < Date.parse(existing.createdAt)) {
      flagByEquipment.set(request.equipmentId!, request);
    }
  }

  const customerById = new Map(customers.map((c) => [c.id, c.name]));
  // Fallback for a unit whose maintenance status is not backed by an open
  // unitOutOfService request: use the most recent request touching that unit
  // at all, since that is the closest real signal for "when did this start".
  // Falling back to commissionedDate would misreport a five-year-old unit as
  // five years down.
  const mostRecentRequestByEquipment = new Map<string, ServiceRequest>();
  for (const request of requests) {
    if (!request.equipmentId) continue;
    const existing = mostRecentRequestByEquipment.get(request.equipmentId);
    if (!existing || Date.parse(request.createdAt) > Date.parse(existing.createdAt)) {
      mostRecentRequestByEquipment.set(request.equipmentId, request);
    }
  }

  const rows: UnitDownRow[] = [];

  for (const unit of fielded) {
    const flagging = flagByEquipment.get(unit.id);
    const isDown = Boolean(flagging) || unit.currentStatus === "maintenance";
    if (!isDown) continue;

    const since =
      flagging?.createdAt ??
      mostRecentRequestByEquipment.get(unit.id)?.createdAt ??
      new Date(appTodayMs()).toISOString();
    rows.push({
      equipmentId: unit.id,
      name: unit.name,
      customerName: unit.customerId ? customerById.get(unit.customerId) : undefined,
      daysDown: Math.max(0, Math.round(daysSince(since))),
      requestId: flagging?.id ?? mostRecentRequestByEquipment.get(unit.id)?.id,
      requestStatus: flagging?.status ?? mostRecentRequestByEquipment.get(unit.id)?.status,
    });
  }

  rows.sort((a, b) => b.daysDown - a.daysDown);
  return { count: rows.length, fieldedTotal: fielded.length, rows };
}

export interface AgingOpenRequests {
  count: number;
  openTotal: number;
  pointChange30d: number | null;
}

function computeAgingOpenRequests(requests: ServiceRequest[]): AgingOpenRequests {
  const open = requests.filter(isOpen);
  const aging = open.filter((r) => daysSince(r.createdAt) > AGING_THRESHOLD_DAYS);

  // As-of reconstruction: what would this share have read 30 days ago, using
  // only requests that existed by then and treating anything not yet
  // resolved at that point as open.
  const cutoff = appTodayMs() - 30 * DAY_MS;
  const openAsOf = requests.filter((r) => {
    if (Date.parse(r.createdAt) > cutoff) return false;
    const resolvedByCutoff = r.resolvedAt && Date.parse(r.resolvedAt) <= cutoff;
    return !resolvedByCutoff;
  });
  const agingAsOf = openAsOf.filter((r) => (cutoff - Date.parse(r.createdAt)) / DAY_MS > AGING_THRESHOLD_DAYS);

  const shareNow = open.length > 0 ? aging.length / open.length : null;
  const shareThen = openAsOf.length > 0 ? agingAsOf.length / openAsOf.length : null;
  const pointChange30d =
    shareNow !== null && shareThen !== null ? Math.round((shareNow - shareThen) * 100) : null;

  return { count: aging.length, openTotal: open.length, pointChange30d };
}

export interface MedianResolution {
  medianDays: number | null;
  p90Days: number | null;
  n: number;
  priorMedianDays: number | null;
  priorN: number;
}

function computeMedianResolution(requests: ServiceRequest[]): MedianResolution {
  const inWindow = (fromMs: number, toMs: number) =>
    requests.filter((r) => {
      if (!r.resolvedAt) return false;
      const resolvedMs = Date.parse(r.resolvedAt);
      return resolvedMs > fromMs && resolvedMs <= toMs;
    });

  const durations = (rows: ServiceRequest[]) =>
    rows.map((r) => (Date.parse(r.resolvedAt!) - Date.parse(r.createdAt)) / DAY_MS);

  const now = appTodayMs();
  const current = durations(inWindow(now - 90 * DAY_MS, now));
  const prior = durations(inWindow(now - 180 * DAY_MS, now - 90 * DAY_MS));

  return {
    medianDays: current.length >= MIN_SAMPLE_FOR_MEDIAN ? median(current) : null,
    p90Days: current.length >= MIN_SAMPLE_FOR_MEDIAN ? percentile(current, 90) : null,
    n: current.length,
    priorMedianDays: prior.length >= MIN_SAMPLE_FOR_MEDIAN ? median(prior) : null,
    priorN: prior.length,
  };
}

export interface ServiceLoadPoint {
  month: string;
  label: string;
  index: number;
}

export interface ServiceLoadIndex {
  points: ServiceLoadPoint[];
  current: number | null;
  priorYear: number | null;
  mtdLabel: string;
}

function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

function computeServiceLoadIndex(equipment: Equipment[], requests: ServiceRequest[]): ServiceLoadIndex {
  const today = new Date(appTodayMs());
  const months: { key: string; end: number; label: string }[] = [];
  for (let i = 23; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - i, 1));
    const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1)).getTime();
    months.push({
      key: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`,
      end,
      label: d.toLocaleDateString("en-US", { month: "short" }),
    });
  }

  const requestsByMonth = new Map<string, number>();
  for (const r of requests) {
    const key = monthKey(r.createdAt);
    requestsByMonth.set(key, (requestsByMonth.get(key) ?? 0) + 1);
  }

  const points: ServiceLoadPoint[] = months.map(({ key, end, label }) => {
    const activeUnits = equipment.filter(
      (e) => e.commissionedDate && Date.parse(e.commissionedDate) <= end && e.currentStatus !== "retired",
    ).length;
    const opened = requestsByMonth.get(key) ?? 0;
    return { month: key, label, index: activeUnits > 0 ? (opened / activeUnits) * 100 : 0 };
  });

  const priorYearKey = months[months.length - 13]?.key;

  return {
    points,
    current: points[points.length - 1]?.index ?? null,
    priorYear: priorYearKey ? (points.find((p) => p.month === priorYearKey)?.index ?? null) : null,
    mtdLabel: `Through ${today.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
  };
}

export interface WaitingOnParts {
  count: number;
  medianDwellDays: number | null;
  noEtaCount: number;
  pastEtaCount: number;
}

function computeWaitingOnParts(requests: ServiceRequest[]): WaitingOnParts {
  const waiting = requests.filter((r) => r.status === "waiting");
  const dwellDays = waiting.map((r) => daysSince(r.statusChangedAt));
  const noEta = waiting.filter((r) => !r.partsEtaDate).length;
  const pastEta = waiting.filter((r) => r.partsEtaDate && Date.parse(r.partsEtaDate) < appTodayMs()).length;

  return {
    count: waiting.length,
    medianDwellDays: median(dwellDays),
    noEtaCount: noEta,
    pastEtaCount: pastEta,
  };
}

// ── Band 2 ───────────────────────────────────────────────────────────────

export interface DealerLoadRow {
  dealerId: string;
  name: string;
  units: number;
  openLoad: number;
  loadPer100: number | null;
  medianResolveDays: number | null;
}

export interface DealerLoadTable {
  rows: DealerLoadRow[];
  networkMedianPer100: number | null;
}

function computeDealerLoad(
  dealers: Dealer[],
  equipment: Equipment[],
  requests: ServiceRequest[],
): DealerLoadTable {
  const eligible = dealers.filter((d) => d.status === "active" || d.status === "pending");

  const rows: DealerLoadRow[] = eligible.map((dealer) => {
    const units = equipment.filter((e) => e.dealerId === dealer.id && e.currentStatus !== "retired").length;
    const dealerRequests = requests.filter((r) => r.dealerId === dealer.id);
    const openLoad = dealerRequests.filter(isOpen).length;
    const resolved = dealerRequests.filter((r) => r.resolvedAt);
    const medianResolveDays =
      resolved.length >= 3
        ? median(resolved.map((r) => (Date.parse(r.resolvedAt!) - Date.parse(r.createdAt)) / DAY_MS))
        : null;

    return {
      dealerId: dealer.id,
      name: dealer.name,
      units,
      openLoad,
      loadPer100: units >= MIN_UNITS_FOR_RATE ? (openLoad / units) * 100 : null,
      medianResolveDays,
    };
  });

  const rates = rows.map((r) => r.loadPer100).filter((v): v is number => v !== null);
  rows.sort((a, b) => (b.loadPer100 ?? -1) - (a.loadPer100 ?? -1));

  return { rows, networkMedianPer100: median(rates) };
}

export interface UncoveredInstalledBase {
  count: number;
  liftTonsSum: number;
  accountCount: number;
  dealers: { dealerId: string; name: string; region: string; daysSincePartner: number }[];
}

function computeUncoveredInstalledBase(
  dealers: Dealer[],
  equipment: Equipment[],
): UncoveredInstalledBase {
  const dealerById = new Map(dealers.map((d) => [d.id, d]));
  const uncovered = equipment.filter((e) => {
    if (e.currentStatus === "retired") return false;
    if (!e.dealerId) return true;
    return dealerById.get(e.dealerId)?.status !== "active";
  });

  const namedDealers = new Map<string, Dealer>();
  for (const unit of uncovered) {
    if (unit.dealerId) {
      const dealer = dealerById.get(unit.dealerId);
      if (dealer) namedDealers.set(dealer.id, dealer);
    }
  }

  return {
    count: uncovered.length,
    liftTonsSum: uncovered.reduce((sum, e) => sum + (e.liftCapacityTons ?? 0), 0),
    accountCount: new Set(uncovered.map((e) => e.customerId).filter(Boolean)).size,
    dealers: Array.from(namedDealers.values()).map((dealer) => ({
      dealerId: dealer.id,
      name: dealer.name,
      region: dealer.region,
      daysSincePartner: Math.round(daysSince(dealer.partnerSince)),
    })),
  };
}

// ── Band 3 ───────────────────────────────────────────────────────────────

export interface InspectionCoverageRow {
  equipmentId: string;
  name: string;
  dealerName?: string;
  daysSinceRecord: number | null;
}

export interface InspectionCoverage {
  overdueCount: number;
  unknownCount: number;
  inServiceTotal: number;
  overdueRows: InspectionCoverageRow[];
  unknownRows: InspectionCoverageRow[];
}

function computeInspectionCoverage(
  equipment: Equipment[],
  dealers: Dealer[],
): InspectionCoverage {
  const dealerById = new Map(dealers.map((d) => [d.id, d.name]));
  const inService = equipment.filter((e) => e.currentStatus === "active" || e.currentStatus === "maintenance");

  const toRow = (e: Equipment): InspectionCoverageRow => ({
    equipmentId: e.id,
    name: e.name,
    dealerName: e.dealerId ? dealerById.get(e.dealerId) : undefined,
    daysSinceRecord: e.lastInspectionDate ? Math.round(daysSince(e.lastInspectionDate)) : null,
  });

  const overdue = inService.filter(
    (e) => e.lastInspectionDate && daysSince(e.lastInspectionDate) > INSPECTION_RECORD_DAYS,
  );
  const unknown = inService.filter((e) => !e.lastInspectionDate);

  return {
    overdueCount: overdue.length,
    unknownCount: unknown.length,
    inServiceTotal: inService.length,
    overdueRows: overdue.map(toRow).sort((a, b) => (b.daysSinceRecord ?? 0) - (a.daysSinceRecord ?? 0)),
    unknownRows: unknown.map(toRow),
  };
}

export interface AgedFleetRow {
  equipmentId: string;
  name: string;
  ageYears: number;
  liftCapacityTons?: number;
}

export interface AgedFleet {
  count: number;
  liftTonsSum: number;
  medianAgeYears: number | null;
  coverage: number | null;
  rows: AgedFleetRow[];
}

function computeAgedFleet(equipment: Equipment[]): AgedFleet {
  const dated = equipment.filter((e) => e.currentStatus !== "retired" && e.commissionedDate);
  const ageYears = (e: Equipment) => daysSince(e.commissionedDate!) / 365.25;

  const aged = dated.filter((e) => ageYears(e) >= FLEET_AGE_THRESHOLD_YEARS);
  const fielded = equipment.filter((e) => e.currentStatus !== "retired");

  return {
    count: aged.length,
    liftTonsSum: aged.reduce((sum, e) => sum + (e.liftCapacityTons ?? 0), 0),
    medianAgeYears: dated.length > 0 ? median(dated.map(ageYears)) : null,
    coverage: fielded.length > 0 ? dated.length / fielded.length : null,
    rows: aged
      .map((e) => ({
        equipmentId: e.id,
        name: e.name,
        ageYears: Math.round(ageYears(e) * 10) / 10,
        liftCapacityTons: e.liftCapacityTons,
      }))
      .sort((a, b) => b.ageYears - a.ageYears),
  };
}

export interface RepeatVisitRow {
  equipmentId: string;
  name: string;
  model: string;
  customerName?: string;
  dealerName?: string;
  visitCount: number;
}

export interface RepeatVisits {
  count: number;
  top: RepeatVisitRow[];
}

function computeRepeatVisits(
  equipment: Equipment[],
  requests: ServiceRequest[],
  customers: Customer[],
  dealers: Dealer[],
): RepeatVisits {
  const customerById = new Map(customers.map((c) => [c.id, c.name]));
  const dealerById = new Map(dealers.map((d) => [d.id, d.name]));
  const cutoff = appTodayMs() - 365 * DAY_MS;

  const countByUnit = new Map<string, number>();
  for (const r of requests) {
    if (r.kind !== "corrective" || !r.equipmentId) continue;
    if (Date.parse(r.createdAt) < cutoff) continue;
    countByUnit.set(r.equipmentId, (countByUnit.get(r.equipmentId) ?? 0) + 1);
  }

  const repeatUnits = equipment.filter(
    (e) => e.currentStatus !== "retired" && (countByUnit.get(e.id) ?? 0) >= REPEAT_VISIT_THRESHOLD,
  );

  const rows: RepeatVisitRow[] = repeatUnits
    .map((e) => ({
      equipmentId: e.id,
      name: e.name,
      model: e.model,
      customerName: e.customerId ? customerById.get(e.customerId) : undefined,
      dealerName: e.dealerId ? dealerById.get(e.dealerId) : undefined,
      visitCount: countByUnit.get(e.id) ?? 0,
    }))
    .sort((a, b) => b.visitCount - a.visitCount);

  return { count: rows.length, top: rows.slice(0, 5) };
}

// ── Composite read ───────────────────────────────────────────────────────

export interface ExecutiveOverview {
  unitsDownNow: UnitsDownNow;
  agingOpenRequests: AgingOpenRequests;
  medianResolution: MedianResolution;
  serviceLoadIndex: ServiceLoadIndex;
  waitingOnParts: WaitingOnParts;
  dealerLoad: DealerLoadTable;
  uncoveredInstalledBase: UncoveredInstalledBase;
  inspectionCoverage: InspectionCoverage;
  agedFleet: AgedFleet;
  repeatVisits: RepeatVisits;
}

export async function getExecutiveOverview(scope: RequestScope): Promise<ExecutiveOverview | null> {
  // Executive KPIs are an internal-staff surface — dealer and customer
  // dashboards use the simpler SummaryMetrics instead.
  if (scope.role !== "internal") return null;

  const [allDealers, allCustomers, allEquipment, allRequests] = await Promise.all([
    fetchLiveDealers(),
    fetchLiveCustomers(),
    fetchLiveEquipment(),
    fetchLiveServiceRequests(),
  ]);

  const dealers = visibleDealers(scope, allDealers);
  const customers = visibleCustomers(scope, allCustomers);
  const equipment = visibleEquipment(scope, allEquipment);
  const requests = visibleServiceRequests(scope, allRequests);

  return {
    unitsDownNow: computeUnitsDownNow(equipment, requests, customers),
    agingOpenRequests: computeAgingOpenRequests(requests),
    medianResolution: computeMedianResolution(requests),
    serviceLoadIndex: computeServiceLoadIndex(equipment, requests),
    waitingOnParts: computeWaitingOnParts(requests),
    dealerLoad: computeDealerLoad(dealers, equipment, requests),
    uncoveredInstalledBase: computeUncoveredInstalledBase(dealers, equipment),
    inspectionCoverage: computeInspectionCoverage(equipment, dealers),
    agedFleet: computeAgedFleet(equipment),
    repeatVisits: computeRepeatVisits(equipment, requests, customers, dealers),
  };
}
