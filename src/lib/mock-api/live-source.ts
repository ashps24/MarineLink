import { apiClient } from "@/lib/api/client";
import { dealerSchema, customerSchema, equipmentSchema, serviceRequestSchema } from "@/schemas";
import type { Dealer, Customer, Equipment, ServiceRequest } from "@/types";

/**
 * Fetches every entity from the real Catalyst backend and derives the
 * view-model count fields (customerCount, equipmentCount,
 * openServiceRequestCount) client-side from the fetched arrays — exactly the
 * pattern `src/data/derive.ts` used for the static fixtures, now applied to
 * live rows instead. The API itself never computes these; a table row is
 * just the record it represents.
 *
 * Reads are simple parallel full-table fetches rather than N+1 per-record
 * lookups: four resources, a few dozen rows each, comfortably fits in memory
 * and keeps this a single round trip per resource instead of one per row.
 */

const OPEN_STATUSES: ServiceRequest["status"][] = ["new", "in_progress", "waiting"];

/** null (the API's "no value") -> undefined (what the Zod .optional() schemas expect). */
function nullsToUndefined<T extends Record<string, unknown>>(row: T): T {
  const out = { ...row };
  for (const key of Object.keys(out)) {
    if (out[key] === null) delete out[key];
  }
  return out;
}

interface LiveTables {
  dealers: Dealer[];
  customers: Customer[];
  equipment: Equipment[];
  serviceRequests: ServiceRequest[];
}

let cached: { at: number; promise: Promise<LiveTables> } | null = null;
const CACHE_MS = 3_000;

/**
 * All four tables, fetched together and briefly memoised. A single page view
 * usually triggers several of these calls back to back (a detail page reads
 * its own record plus related dealers/customers/equipment); the cache
 * collapses that burst into one network round trip per resource without
 * introducing a stale-data window longer than a few seconds.
 */
function loadTables(): Promise<LiveTables> {
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.promise;

  const promise = (async () => {
    const [dealerRows, customerRows, equipmentRows, requestRows] = await Promise.all([
      apiClient.list<Record<string, unknown>>("dealers"),
      apiClient.list<Record<string, unknown>>("customers"),
      apiClient.list<Record<string, unknown>>("equipment"),
      apiClient.list<Record<string, unknown>>("service-requests"),
    ]);

    const serviceRequests = requestRows.map((row) => serviceRequestSchema.parse(nullsToUndefined(row)));

    const equipment = equipmentRows.map((row) => equipmentSchema.parse(nullsToUndefined(row)));

    const customers = customerRows.map((row) => {
      const base = nullsToUndefined(row);
      return customerSchema.parse({
        ...base,
        equipmentCount: equipment.filter((e) => e.customerId === base.id).length,
        openServiceRequestCount: serviceRequests.filter(
          (r) => r.customerId === base.id && OPEN_STATUSES.includes(r.status),
        ).length,
      });
    });

    const dealers = dealerRows.map((row) => {
      const base = nullsToUndefined(row);
      return dealerSchema.parse({
        ...base,
        customerCount: customers.filter((c) => c.dealerId === base.id).length,
        equipmentCount: equipment.filter((e) => e.dealerId === base.id).length,
        openServiceRequestCount: serviceRequests.filter(
          (r) => r.dealerId === base.id && OPEN_STATUSES.includes(r.status),
        ).length,
      });
    });

    return { dealers, customers, equipment, serviceRequests };
  })();

  cached = { at: Date.now(), promise };
  return promise;
}

/** Called after any write so the next read reflects it immediately. */
export function invalidateLiveCache(): void {
  cached = null;
}

export async function fetchLiveDealers(): Promise<Dealer[]> {
  return (await loadTables()).dealers;
}
export async function fetchLiveCustomers(): Promise<Customer[]> {
  return (await loadTables()).customers;
}
export async function fetchLiveEquipment(): Promise<Equipment[]> {
  return (await loadTables()).equipment;
}
export async function fetchLiveServiceRequests(): Promise<ServiceRequest[]> {
  return (await loadTables()).serviceRequests;
}
