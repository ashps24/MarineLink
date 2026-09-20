import { dealerSchema } from "@/schemas";
import type { Dealer } from "@/types";
import { visibleDealers, canViewDealer } from "@/lib/permissions/visibility";
import { fetchLiveDealers } from "./live-source";
import { matchesSearch } from "./client";
import type { DealerFilters, RequestScope } from "./types";

export async function getDealers(
  scope: RequestScope,
  filters: DealerFilters = {},
): Promise<Dealer[]> {
  const allDealers = await fetchLiveDealers();
  const rows = visibleDealers(scope, allDealers).filter((dealer) => {
    const statusOk =
      !filters.status || filters.status === "all" || dealer.status === filters.status;
    const regionOk =
      !filters.region || filters.region === "all" || dealer.region === filters.region;
    const searchOk = matchesSearch(
      filters.search,
      dealer.name,
      dealer.region,
      dealer.primaryContactName,
      dealer.primaryContactEmail,
    );
    return statusOk && regionOk && searchOk;
  });

  return rows.map((row) => dealerSchema.parse(row));
}

export async function getDealerById(scope: RequestScope, id: string): Promise<Dealer | null> {
  const allDealers = await fetchLiveDealers();
  const dealer = allDealers.find((item) => item.id === id);
  if (!dealer) return null;
  if (!canViewDealer(scope, dealer.id)) return null;
  return dealerSchema.parse(dealer);
}

export async function dealerRegions(): Promise<string[]> {
  const allDealers = await fetchLiveDealers();
  return Array.from(new Set(allDealers.map((dealer) => dealer.region))).sort();
}
