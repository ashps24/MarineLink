"use client";

import * as React from "react";
import { Wrench } from "@phosphor-icons/react/dist/ssr";
import { PageHeader } from "@/components/layout/page-header";
import { FilterBar } from "@/components/shared/filter-bar";
import { SearchInput } from "@/components/shared/search-input";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { CardGridSkeleton } from "@/components/shared/loading-skeleton";
import { EquipmentCard } from "@/components/equipment/equipment-card";
import { useEquipmentList } from "@/hooks/use-equipment";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useFilterParams } from "@/hooks/use-filter-params";
import { equipmentTypes } from "@/lib/mock-api";

const DEFAULTS = { search: "", status: "all", equipmentType: "all" } as const;

export default function EquipmentPage() {
  const { user } = useCurrentUser();
  const { values, setValue, reset, isFiltered } = useFilterParams<Record<string, string>>({
    ...DEFAULTS,
  });

  const { data, isPending, isError, refetch } = useEquipmentList({
    search: values.search,
    status: values.status as "all",
    equipmentType: values.equipmentType,
  });

  const types = React.useMemo(() => equipmentTypes(), []);
  const items = data ?? [];

  const description =
    user.role === "internal"
      ? "Every registered machine across the dealer network, searchable by name, model, or serial number."
      : user.role === "dealer"
        ? "Machines registered in your territory, searchable by name, model, or serial number."
        : "Machines registered to your yard, searchable by name, model, or serial number.";

  return (
    <div className="space-y-6">
      <PageHeader
        title={user.role === "customer" ? "My equipment" : "Equipment"}
        description={description}
      />

      <FilterBar
        search={
          <SearchInput
            label="Search equipment"
            placeholder="Search by name, model, or serial number"
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
              { value: "maintenance", label: "In maintenance" },
              { value: "inactive", label: "Inactive" },
              { value: "retired", label: "Retired" },
            ],
          },
          {
            key: "equipmentType",
            label: "Type",
            value: values.equipmentType,
            onChange: (value) => setValue("equipmentType", value),
            options: [
              { value: "all", label: "All types" },
              ...types.map((type) => ({ value: type, label: type })),
            ],
          },
        ]}
        isFiltered={isFiltered}
        onReset={reset}
        resultCount={isPending || isError ? undefined : items.length}
        resultNoun="unit"
      />

      {isPending ? (
        <CardGridSkeleton label="Loading equipment" />
      ) : isError ? (
        <ErrorState
          title="Could not load equipment"
          description="The equipment service did not respond."
          onRetry={() => refetch()}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="No equipment matches these filters"
          description={
            isFiltered
              ? "Try widening the search or clearing a filter."
              : "Equipment appears here once it is registered."
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item, index) => (
            <EquipmentCard key={item.id} item={item} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}
