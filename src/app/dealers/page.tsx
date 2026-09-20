"use client";

import * as React from "react";
import { Buildings } from "@phosphor-icons/react/dist/ssr";
import { PageHeader } from "@/components/layout/page-header";
import { FilterBar } from "@/components/shared/filter-bar";
import { SearchInput } from "@/components/shared/search-input";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { CardGridSkeleton } from "@/components/shared/loading-skeleton";
import { RestrictedState } from "@/components/shared/restricted-state";
import { DealerCard } from "@/components/dealers/dealer-card";
import { useDealers, useDealerRegions } from "@/hooks/use-dealers";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useFilterParams } from "@/hooks/use-filter-params";
import { canViewInternalDirectories } from "@/lib/permissions/visibility";

const DEFAULTS = { search: "", status: "all", region: "all" } as const;

export default function DealersPage() {
  const { user } = useCurrentUser();
  const { values, setValue, reset, isFiltered } = useFilterParams<Record<string, string>>({
    ...DEFAULTS,
  });

  const { data, isPending, isError, refetch } = useDealers({
    search: values.search,
    status: values.status as "all",
    region: values.region,
  });

  const { data: regions } = useDealerRegions();
  const allowed = canViewInternalDirectories(user);
  const dealers = data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dealers"
        description="The Marine Travelift dealer network, with customer, equipment, and open service counts."
      />

      {!allowed ? (
        <RestrictedState description="The full dealer directory is limited to Marine Travelift internal staff. Your dealer profile is available from the sidebar." />
      ) : (
        <>
          <FilterBar
            search={
              <SearchInput
                label="Search dealers"
                placeholder="Search by name, region, or contact"
                value={values.search}
                onChange={(value) => setValue("search", value)}
              />
            }
            filters={[
              {
                key: "status",
                label: "Status",
                value: values.status,
                onChange: (value) => setValue("status", value),
                options: [
                  { value: "all", label: "All statuses" },
                  { value: "active", label: "Active" },
                  { value: "pending", label: "Pending" },
                  { value: "inactive", label: "Inactive" },
                ],
              },
              {
                key: "region",
                label: "Region",
                value: values.region,
                onChange: (value) => setValue("region", value),
                options: [
                  { value: "all", label: "All regions" },
                  ...(regions ?? []).map((region) => ({ value: region, label: region })),
                ],
              },
            ]}
            isFiltered={isFiltered}
            onReset={reset}
            resultCount={isPending || isError ? undefined : dealers.length}
            resultNoun="dealer"
          />

          {isPending ? (
            <CardGridSkeleton label="Loading dealers" />
          ) : isError ? (
            <ErrorState
              title="Could not load dealers"
              description="The dealer service did not respond."
              onRetry={() => refetch()}
            />
          ) : dealers.length === 0 ? (
            <EmptyState
              icon={Buildings}
              title="No dealers match these filters"
              description={
                isFiltered
                  ? "Try widening the search or clearing a filter."
                  : "Dealers appear here once they are added to the network."
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {dealers.map((dealer, index) => (
                <DealerCard key={dealer.id} dealer={dealer} index={index} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
