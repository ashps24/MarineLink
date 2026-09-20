import { mockProducts, mockProductCategories } from "@/data/mock-products";
import { fetchLiveDealers, fetchLiveCustomers, fetchLiveEquipment, fetchLiveServiceRequests } from "./live-source";
import type { Customer, Dealer, Equipment, ProductCategoryId, ServiceRequest, ServiceRequestStatus } from "@/types";
import {
  visibleDealers,
  visibleCustomers,
  visibleEquipment,
  visibleServiceRequests,
} from "@/lib/permissions/visibility";
import { appTodayMs, DAY_MS, MIN_SAMPLE_FOR_MEDIAN } from "@/lib/constants/time";
import { RESOLUTION_TARGET_HOURS } from "@/lib/constants/service-workflow";
import { getAllServiceEvents, type ServiceEvent } from "./service-events";
import { serviceStatusOrder } from "@/lib/constants/status";
import type { RequestScope } from "./types";
import { isOpenStatus } from "@/lib/constants/service-workflow";

/**
 * The four headline KPIs and four charts from the Phase 2 dashboard brief.
 * Kept in a separate module from executive.ts (the earlier CEO-tournament
 * design) rather than replacing it — both read the same fixtures and neither
 * is wrong; this file answers the literal Phase 2 KPI/chart list, the other
 * answers "what needs a decision today". The dashboard composes from both.
 */

const isOpen = (r: ServiceRequest) => isOpenStatus(r.status);

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

// ── KPI 1: Open service requests, with a 30-day trend ─────────────────────

export interface OpenRequestsKpi {
  count: number;
  count30dAgo: number;
  change: number;
}

function computeOpenRequestsKpi(requests: ServiceRequest[]): OpenRequestsKpi {
  const count = requests.filter(isOpen).length;

  // As-of reconstruction: a request counts as "open as of 30 days ago" if it
  // existed by then and had not yet resolved by then.
  const cutoff = appTodayMs() - 30 * DAY_MS;
  const count30dAgo = requests.filter((r) => {
    if (Date.parse(r.createdAt) > cutoff) return false;
    const resolvedByCutoff = r.resolvedAt && Date.parse(r.resolvedAt) <= cutoff;
    return !resolvedByCutoff;
  }).length;

  return { count, count30dAgo, change: count - count30dAgo };
}

// ── KPI 2: Average time to resolution ──────────────────────────────────────

export interface ResolutionTimeKpi {
  averageDays: number | null;
  medianDays: number | null;
  n: number;
}

function computeResolutionTimeKpi(requests: ServiceRequest[]): ResolutionTimeKpi {
  const now = appTodayMs();
  const resolved = requests.filter((r) => r.resolvedAt && Date.parse(r.resolvedAt) > now - 90 * DAY_MS);
  const durations = resolved.map((r) => (Date.parse(r.resolvedAt!) - Date.parse(r.createdAt)) / DAY_MS);

  return {
    // A mean is easily hijacked by one long outlier (a single 40-day parts
    // wait among mostly 2-day fixes), so it is shown alongside the median
    // rather than in place of it — never as the only number.
    averageDays: durations.length >= MIN_SAMPLE_FOR_MEDIAN ? mean(durations) : null,
    medianDays: durations.length >= MIN_SAMPLE_FOR_MEDIAN ? median(durations) : null,
    n: durations.length,
  };
}

// ── KPI 3: Active dealers / customer accounts ──────────────────────────────

export interface ActiveAccountsKpi {
  activeDealers: number;
  totalDealers: number;
  activeCustomers: number;
  totalCustomers: number;
}

function computeActiveAccountsKpi(dealers: Dealer[], customers: Customer[]): ActiveAccountsKpi {
  return {
    activeDealers: dealers.filter((d) => d.status === "active").length,
    totalDealers: dealers.length,
    activeCustomers: customers.filter((c) => c.status === "active").length,
    totalCustomers: customers.length,
  };
}

// ── KPI 4: Equipment under active service contract ─────────────────────────

export interface ContractedEquipmentKpi {
  activeCount: number;
  expiredCount: number;
  fieldedTotal: number;
}

function computeContractedEquipmentKpi(equipment: Equipment[]): ContractedEquipmentKpi {
  const fielded = equipment.filter((e) => e.currentStatus !== "retired");
  return {
    activeCount: fielded.filter((e) => e.serviceContractStatus === "active").length,
    expiredCount: fielded.filter((e) => e.serviceContractStatus === "expired").length,
    fieldedTotal: fielded.length,
  };
}

// ── Chart 1: Service pipeline by status ─────────────────────────────────────

export interface PipelineStage {
  status: ServiceRequestStatus;
  count: number;
}

function computeServicePipeline(requests: ServiceRequest[]): PipelineStage[] {
  return serviceStatusOrder.map((status) => ({
    status,
    count: requests.filter((r) => r.status === status).length,
  }));
}

// ── Chart 2: Service volume trend, monthly, last 12 months ─────────────────

export interface VolumeMonth {
  month: string;
  label: string;
  opened: number;
}

function computeServiceVolumeTrend(requests: ServiceRequest[]): VolumeMonth[] {
  const today = new Date(appTodayMs());
  const months: { key: string; label: string }[] = [];
  for (let i = 11; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - i, 1));
    months.push({
      key: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("en-US", { month: "short" }),
    });
  }

  const byMonth = new Map<string, number>();
  for (const r of requests) {
    const key = r.createdAt.slice(0, 7);
    byMonth.set(key, (byMonth.get(key) ?? 0) + 1);
  }

  return months.map(({ key, label }) => ({ month: key, label, opened: byMonth.get(key) ?? 0 }));
}

// ── Chart 3: Dealer network health, ranked ──────────────────────────────────

export interface DealerHealthRow {
  dealerId: string;
  name: string;
  region: string;
  status: Dealer["status"];
  fieldedUnits: number;
  openRequests: number;
  loadPer100: number | null;
  medianResolveDays: number | null;
  /** Traffic-light read: good / watch / attention, derived from load vs the network median. */
  health: "good" | "watch" | "attention";
}

function computeDealerHealth(
  dealers: Dealer[],
  equipment: Equipment[],
  requests: ServiceRequest[],
): DealerHealthRow[] {
  const eligible = dealers.filter((d) => d.status === "active" || d.status === "pending");

  const base = eligible.map((dealer) => {
    const fieldedUnits = equipment.filter(
      (e) => e.dealerId === dealer.id && e.currentStatus !== "retired",
    ).length;
    const dealerRequests = requests.filter((r) => r.dealerId === dealer.id);
    const openRequests = dealerRequests.filter(isOpen).length;
    const resolved = dealerRequests.filter((r) => r.resolvedAt);
    const medianResolveDays =
      resolved.length >= 3
        ? median(resolved.map((r) => (Date.parse(r.resolvedAt!) - Date.parse(r.createdAt)) / DAY_MS))
        : null;

    return {
      dealerId: dealer.id,
      name: dealer.name,
      region: dealer.region,
      status: dealer.status,
      fieldedUnits,
      openRequests,
      loadPer100: fieldedUnits >= 3 ? (openRequests / fieldedUnits) * 100 : null,
      medianResolveDays,
    };
  });

  const rates = base.map((r) => r.loadPer100).filter((v): v is number => v !== null);
  const networkMedian = median(rates) ?? 0;

  const withHealth: DealerHealthRow[] = base.map((row) => ({
    ...row,
    health:
      row.loadPer100 === null
        ? "watch"
        : row.loadPer100 > networkMedian * 1.5
          ? "attention"
          : row.loadPer100 > networkMedian * 1.1
            ? "watch"
            : "good",
  }));

  return withHealth.sort((a, b) => (b.loadPer100 ?? -1) - (a.loadPer100 ?? -1));
}

// ── Chart 4: Equipment category breakdown, by service volume ───────────────

export interface CategoryVolumeRow {
  categoryId: string;
  categoryName: string;
  requestCount: number;
  fieldedUnits: number;
}

function computeEquipmentCategoryBreakdown(
  equipment: Equipment[],
  requests: ServiceRequest[],
): CategoryVolumeRow[] {
  const productById = new Map(mockProducts.map((p) => [p.id, p]));
  const categoryById = new Map(mockProductCategories.map((c) => [c.id, c.shortName]));
  const equipmentById = new Map(equipment.map((e) => [e.id, e]));

  const categoryOfEquipment = (equipmentId: string | undefined): ProductCategoryId | null => {
    if (!equipmentId) return null;
    const unit = equipmentById.get(equipmentId);
    const product = unit ? productById.get(unit.productId) : undefined;
    return product?.categoryId ?? null;
  };

  const requestCounts = new Map<ProductCategoryId, number>();
  for (const r of requests) {
    const categoryId = categoryOfEquipment(r.equipmentId);
    if (!categoryId) continue;
    requestCounts.set(categoryId, (requestCounts.get(categoryId) ?? 0) + 1);
  }

  const unitCounts = new Map<ProductCategoryId, number>();
  for (const unit of equipment) {
    if (unit.currentStatus === "retired") continue;
    const product = productById.get(unit.productId);
    if (!product) continue;
    unitCounts.set(product.categoryId, (unitCounts.get(product.categoryId) ?? 0) + 1);
  }

  const categoryIds = new Set([...requestCounts.keys(), ...unitCounts.keys()]);

  return Array.from(categoryIds)
    .map((categoryId) => ({
      categoryId,
      categoryName: categoryById.get(categoryId) ?? categoryId,
      requestCount: requestCounts.get(categoryId) ?? 0,
      fieldedUnits: unitCounts.get(categoryId) ?? 0,
    }))
    .sort((a, b) => b.requestCount - a.requestCount);
}


// ── Comparison periods ────────────────────────────────────────────────────

export type ComparisonPeriod = "month" | "quarter";

export interface PeriodWindow {
  start: number;
  end: number;
}

export interface PeriodWindows {
  current: PeriodWindow;
  previous: PeriodWindow;
  label: string;
  previousLabel: string;
}

/**
 * The current period so far, and the same stretch of the period before it.
 *
 * Comparing a half-finished month against a whole one is the classic way to
 * manufacture a decline, so the previous window is truncated to the same
 * elapsed duration rather than run to its natural end.
 */
export function periodWindows(period: ComparisonPeriod, now = appTodayMs()): PeriodWindows {
  const today = new Date(now);

  const currentStart =
    period === "month"
      ? Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1)
      : Date.UTC(today.getUTCFullYear(), Math.floor(today.getUTCMonth() / 3) * 3, 1);

  const previousStart =
    period === "month"
      ? Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1)
      : Date.UTC(today.getUTCFullYear(), Math.floor(today.getUTCMonth() / 3) * 3 - 3, 1);

  const elapsed = now - currentStart;

  return {
    current: { start: currentStart, end: now },
    previous: { start: previousStart, end: previousStart + elapsed },
    label: period === "month" ? "this month" : "this quarter",
    previousLabel: period === "month" ? "same point last month" : "same point last quarter",
  };
}

function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

/** Evenly spaced sample points across a window, for a sparkline. */
function samplePoints(window: PeriodWindow, count = 12): number[] {
  const step = (window.end - window.start) / (count - 1);
  return Array.from({ length: count }, (_, i) => window.start + step * i);
}

/**
 * Fills gaps by carrying the previous reading forward. A sparkline needs a
 * contiguous line, and a bucket with no closures in it means "no new
 * information", not "the average fell to zero".
 */
function carryForward(values: (number | null)[]): number[] {
  const out: number[] = [];
  let last: number | null = null;
  for (const value of values) {
    if (value !== null) last = value;
    if (last !== null) out.push(last);
  }
  return out;
}

const resolvedAtMs = (r: ServiceRequest): number | null =>
  r.resolvedAt ? Date.parse(r.resolvedAt) : null;

const wasOpenAt = (r: ServiceRequest, at: number): boolean => {
  if (Date.parse(r.createdAt) > at) return false;
  const closed = resolvedAtMs(r);
  return closed === null || closed > at;
};

const closedWithin = (requests: ServiceRequest[], w: PeriodWindow): ServiceRequest[] =>
  requests.filter((r) => {
    const at = resolvedAtMs(r);
    return at !== null && at >= w.start && at <= w.end;
  });

const resolutionDays = (r: ServiceRequest): number =>
  ((resolvedAtMs(r) as number) - Date.parse(r.createdAt)) / DAY_MS;

// ── Open requests, with period-over-period movement ───────────────────────

export interface OpenRequestsTrendKpi {
  count: number;
  previousCount: number;
  changePercent: number | null;
  trend: number[];
}

function computeOpenRequestsTrend(
  requests: ServiceRequest[],
  windows: PeriodWindows,
): OpenRequestsTrendKpi {
  const count = requests.filter(isOpen).length;
  const previousCount = requests.filter((r) => wasOpenAt(r, windows.previous.end)).length;

  return {
    count,
    previousCount,
    changePercent: percentChange(count, previousCount),
    trend: samplePoints(windows.current).map(
      (at) => requests.filter((r) => wasOpenAt(r, at)).length,
    ),
  };
}

// ── Time to resolution, with trend against the previous period ────────────

export interface ResolutionTrendKpi {
  averageDays: number | null;
  previousAverageDays: number | null;
  changePercent: number | null;
  n: number;
  trend: number[];
}

function computeResolutionTrend(
  requests: ServiceRequest[],
  windows: PeriodWindows,
): ResolutionTrendKpi {
  const current = closedWithin(requests, windows.current);
  const previous = closedWithin(requests, windows.previous);

  const averageDays = mean(current.map(resolutionDays));
  const previousAverageDays = mean(previous.map(resolutionDays));

  const points = samplePoints(windows.current);
  const buckets = points.slice(1).map((end, i) =>
    mean(
      closedWithin(requests, { start: points[i], end }).map(resolutionDays),
    ),
  );

  return {
    averageDays,
    previousAverageDays,
    changePercent:
      averageDays !== null && previousAverageDays !== null
        ? percentChange(averageDays, previousAverageDays)
        : null,
    n: current.length,
    trend: carryForward(buckets),
  };
}

// ── Compliance against the stated resolution targets ──────────────────────

export interface SlaComplianceKpi {
  percent: number | null;
  previousPercent: number | null;
  changePoints: number | null;
  n: number;
  breachedCount: number;
}

function metTarget(r: ServiceRequest): boolean {
  const hours = ((resolvedAtMs(r) as number) - Date.parse(r.createdAt)) / 3_600_000;
  return hours <= RESOLUTION_TARGET_HOURS[r.priority];
}

function complianceOf(requests: ServiceRequest[]): number | null {
  if (requests.length === 0) return null;
  return (requests.filter(metTarget).length / requests.length) * 100;
}

function computeSlaCompliance(
  requests: ServiceRequest[],
  windows: PeriodWindows,
): SlaComplianceKpi {
  const current = closedWithin(requests, windows.current);
  const percent = complianceOf(current);
  const previousPercent = complianceOf(closedWithin(requests, windows.previous));

  return {
    percent,
    previousPercent,
    changePoints:
      percent !== null && previousPercent !== null ? percent - previousPercent : null,
    n: current.length,
    breachedCount: current.filter((r) => !metTarget(r)).length,
  };
}

// ── Where the open work sits on urgency ───────────────────────────────────

export interface UrgencyBand {
  key: "critical" | "high" | "normal";
  label: string;
  count: number;
}

function computeUrgencyMix(requests: ServiceRequest[]): UrgencyBand[] {
  const open = requests.filter(isOpen);
  return [
    { key: "critical", label: "Critical", count: open.filter((r) => r.priority === "urgent").length },
    { key: "high", label: "High", count: open.filter((r) => r.priority === "high").length },
    {
      key: "normal",
      label: "Normal",
      count: open.filter((r) => r.priority === "medium" || r.priority === "low").length,
    },
  ];
}

// ── Units coming back ─────────────────────────────────────────────────────

const REPEAT_WINDOW_DAYS = 90;

export interface RepeatServiceKpi {
  percent: number | null;
  repeatUnits: number;
  servicedUnits: number;
}

function computeRepeatService(requests: ServiceRequest[]): RepeatServiceKpi {
  const since = appTodayMs() - REPEAT_WINDOW_DAYS * DAY_MS;
  const perUnit = new Map<string, number>();

  for (const request of requests) {
    if (!request.equipmentId || Date.parse(request.createdAt) < since) continue;
    perUnit.set(request.equipmentId, (perUnit.get(request.equipmentId) ?? 0) + 1);
  }

  const servicedUnits = perUnit.size;
  const repeatUnits = [...perUnit.values()].filter((n) => n >= 2).length;

  return {
    percent: servicedUnits === 0 ? null : (repeatUnits / servicedUnits) * 100,
    repeatUnits,
    servicedUnits,
  };
}

// ── How fast a request is picked up ───────────────────────────────────────

export interface ResponseTimeKpi {
  averageHours: number | null;
  previousAverageHours: number | null;
  changePercent: number | null;
  n: number;
}

/** Hours from a request being raised to the first recorded move on it. */
function firstActionHours(
  request: ServiceRequest,
  firstActionAt: Map<string, number>,
): number | null {
  const at = firstActionAt.get(request.id);
  return at === undefined ? null : (at - Date.parse(request.createdAt)) / 3_600_000;
}

function indexFirstAction(events: ServiceEvent[]): Map<string, number> {
  const earliest = new Map<string, number>();
  for (const event of events) {
    if (event.eventKind !== "status") continue;
    const at = Date.parse(event.occurredAt);
    const current = earliest.get(event.requestId);
    if (current === undefined || at < current) earliest.set(event.requestId, at);
  }
  return earliest;
}

function computeResponseTime(
  requests: ServiceRequest[],
  firstActionAt: Map<string, number>,
  windows: PeriodWindows,
): ResponseTimeKpi {
  const within = (w: PeriodWindow) =>
    requests
      .filter((r) => {
        const at = firstActionAt.get(r.id);
        return at !== undefined && at >= w.start && at <= w.end;
      })
      .map((r) => firstActionHours(r, firstActionAt) as number);

  const current = within(windows.current);
  const previous = within(windows.previous);
  const averageHours = mean(current);
  const previousAverageHours = mean(previous);

  return {
    averageHours,
    previousAverageHours,
    changePercent:
      averageHours !== null && previousAverageHours !== null
        ? percentChange(averageHours, previousAverageHours)
        : null,
    n: current.length,
  };
}

// ── Dealer performance, best and worst ────────────────────────────────────

export interface DealerPerformanceRow {
  dealerId: string;
  dealerName: string;
  averageResolutionDays: number | null;
  averageResponseHours: number | null;
  resolvedCount: number;
  openCount: number;
}

function computeDealerPerformance(
  dealers: Dealer[],
  requests: ServiceRequest[],
  firstActionAt: Map<string, number>,
): DealerPerformanceRow[] {
  return dealers
    .map((dealer) => {
      const mine = requests.filter((r) => r.dealerId === dealer.id);
      const resolved = mine.filter((r) => resolvedAtMs(r) !== null);
      const responses = mine
        .map((r) => firstActionHours(r, firstActionAt))
        .filter((h): h is number => h !== null);

      return {
        dealerId: dealer.id,
        dealerName: dealer.name,
        averageResolutionDays: mean(resolved.map(resolutionDays)),
        averageResponseHours: mean(responses),
        resolvedCount: resolved.length,
        openCount: mine.filter(isOpen).length,
      };
    })
    .sort((a, b) => {
      if (a.averageResolutionDays === null) return 1;
      if (b.averageResolutionDays === null) return -1;
      return a.averageResolutionDays - b.averageResolutionDays;
    });
}

// ── Contract cover across the fleet ───────────────────────────────────────

const EXPIRING_SOON_DAYS = 90;

export interface WarrantyBand {
  key: "active" | "expiring" | "expired" | "none";
  label: string;
  count: number;
}

function computeWarrantyMix(equipment: Equipment[]): WarrantyBand[] {
  const soonCutoff = appTodayMs() + EXPIRING_SOON_DAYS * DAY_MS;

  let active = 0;
  let expiring = 0;

  for (const unit of equipment) {
    if (unit.serviceContractStatus !== "active") continue;
    const expires = unit.serviceContractExpiresOn
      ? Date.parse(unit.serviceContractExpiresOn)
      : null;
    if (expires !== null && expires <= soonCutoff) expiring += 1;
    else active += 1;
  }

  return [
    { key: "active", label: "Active", count: active },
    { key: "expiring", label: "Expiring in 90 days", count: expiring },
    {
      key: "expired",
      label: "Expired",
      count: equipment.filter((u) => u.serviceContractStatus === "expired").length,
    },
    {
      key: "none",
      label: "No contract",
      count: equipment.filter((u) => u.serviceContractStatus === "none").length,
    },
  ];
}

// ── Composite read ───────────────────────────────────────────────────────

export interface Phase2DashboardData {
  period: ComparisonPeriod;
  windows: PeriodWindows;
  openRequests: OpenRequestsKpi;
  resolutionTime: ResolutionTimeKpi;
  activeAccounts: ActiveAccountsKpi;
  contractedEquipment: ContractedEquipmentKpi;
  openRequestsTrend: OpenRequestsTrendKpi;
  resolutionTrend: ResolutionTrendKpi;
  slaCompliance: SlaComplianceKpi;
  urgencyMix: UrgencyBand[];
  repeatService: RepeatServiceKpi;
  responseTime: ResponseTimeKpi;
  dealerPerformance: DealerPerformanceRow[];
  warrantyMix: WarrantyBand[];
  pipeline: PipelineStage[];
  volumeTrend: VolumeMonth[];
  dealerHealth: DealerHealthRow[];
  categoryBreakdown: CategoryVolumeRow[];
}

export async function getPhase2Dashboard(
  scope: RequestScope,
  period: ComparisonPeriod = "month",
): Promise<Phase2DashboardData> {
  const [allDealers, allCustomers, allEquipment, allRequests, events] = await Promise.all([
    fetchLiveDealers(),
    fetchLiveCustomers(),
    fetchLiveEquipment(),
    fetchLiveServiceRequests(),
    getAllServiceEvents(),
  ]);

  const dealers = visibleDealers(scope, allDealers);
  const customers = visibleCustomers(scope, allCustomers);
  const equipment = visibleEquipment(scope, allEquipment);
  const requests = visibleServiceRequests(scope, allRequests);

  const windows = periodWindows(period);
  const visibleIds = new Set(requests.map((r) => r.id));
  const firstActionAt = indexFirstAction(events.filter((e) => visibleIds.has(e.requestId)));

  return {
    period,
    windows,
    openRequests: computeOpenRequestsKpi(requests),
    resolutionTime: computeResolutionTimeKpi(requests),
    activeAccounts: computeActiveAccountsKpi(dealers, customers),
    contractedEquipment: computeContractedEquipmentKpi(equipment),
    openRequestsTrend: computeOpenRequestsTrend(requests, windows),
    resolutionTrend: computeResolutionTrend(requests, windows),
    slaCompliance: computeSlaCompliance(requests, windows),
    urgencyMix: computeUrgencyMix(requests),
    repeatService: computeRepeatService(requests),
    responseTime: computeResponseTime(requests, firstActionAt, windows),
    dealerPerformance:
      scope.role === "internal" ? computeDealerPerformance(dealers, requests, firstActionAt) : [],
    warrantyMix: computeWarrantyMix(equipment),
    pipeline: computeServicePipeline(requests),
    volumeTrend: computeServiceVolumeTrend(requests),
    dealerHealth: scope.role === "internal" ? computeDealerHealth(dealers, equipment, requests) : [],
    categoryBreakdown: computeEquipmentCategoryBreakdown(equipment, requests),
  };
}
