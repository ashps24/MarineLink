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
import { serviceStatusOrder } from "@/lib/constants/status";
import type { RequestScope } from "./types";

/**
 * The four headline KPIs and four charts from the Phase 2 dashboard brief.
 * Kept in a separate module from executive.ts (the earlier CEO-tournament
 * design) rather than replacing it — both read the same fixtures and neither
 * is wrong; this file answers the literal Phase 2 KPI/chart list, the other
 * answers "what needs a decision today". The dashboard composes from both.
 */

const OPEN_STATUSES: ServiceRequestStatus[] = ["new", "in_progress", "waiting"];
const isOpen = (r: ServiceRequest) => OPEN_STATUSES.includes(r.status);

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

// ── Composite read ───────────────────────────────────────────────────────

export interface Phase2DashboardData {
  openRequests: OpenRequestsKpi;
  resolutionTime: ResolutionTimeKpi;
  activeAccounts: ActiveAccountsKpi;
  contractedEquipment: ContractedEquipmentKpi;
  pipeline: PipelineStage[];
  volumeTrend: VolumeMonth[];
  dealerHealth: DealerHealthRow[];
  categoryBreakdown: CategoryVolumeRow[];
}

export async function getPhase2Dashboard(scope: RequestScope): Promise<Phase2DashboardData> {
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
    openRequests: computeOpenRequestsKpi(requests),
    resolutionTime: computeResolutionTimeKpi(requests),
    activeAccounts: computeActiveAccountsKpi(dealers, customers),
    contractedEquipment: computeContractedEquipmentKpi(equipment),
    pipeline: computeServicePipeline(requests),
    volumeTrend: computeServiceVolumeTrend(requests),
    dealerHealth: scope.role === "internal" ? computeDealerHealth(dealers, equipment, requests) : [],
    categoryBreakdown: computeEquipmentCategoryBreakdown(equipment, requests),
  };
}
