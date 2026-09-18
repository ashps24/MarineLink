import { mockDealers } from "@/data/mock-dealers";
import { dealerSchema } from "@/schemas";
import type { Dealer } from "@/types";
import { visibleDealers, canViewDealer } from "@/lib/permissions/visibility";
import { mockRequest, matchesSearch } from "./client";
import type { DealerFilters, RequestScope } from "./types";

export async function getDealers(
  scope: RequestScope,
  filters: DealerFilters = {},
): Promise<Dealer[]> {
  return mockRequest(() => {
    const rows = visibleDealers(scope, mockDealers).filter((dealer) => {
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

    // Validate the "response" the way a real API client would.
    return rows.map((row) => dealerSchema.parse(row));
  }, []);
}

export async function getDealerById(scope: RequestScope, id: string): Promise<Dealer | null> {
  return mockRequest(() => {
    const dealer = mockDealers.find((item) => item.id === id);
    if (!dealer) return null;
    if (!canViewDealer(scope, dealer.id)) return null;
    return dealerSchema.parse(dealer);
  }, null);
}

export function dealerRegions(): string[] {
  return Array.from(new Set(mockDealers.map((dealer) => dealer.region))).sort();
}
