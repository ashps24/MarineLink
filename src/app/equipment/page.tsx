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
import { ProductLineBrowser } from "@/components/products/product-line-browser";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useEquipmentList } from "@/hooks/use-equipment";
import { useCustomers } from "@/hooks/use-customers";
import { useDealers } from "@/hooks/use-dealers";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useFilterParams } from "@/hooks/use-filter-params";
import { equipmentTypes } from "@/lib/mock-api";

const DEFAULTS = { search: "", status: "all", equipmentType: "all" } as const;

/**
 * Product Catalog: the units Marine Travelift equipment tracks in the field
 * ("Fielded Units"), and the manufacturer's published product line it draws
 * on ("Product Line") — real model names, specifications, and photography
 * from marinetravelift.com, not invented equipment.
 */
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
  const { data: customers } = useCustomers();
  const { data: dealers } = useDealers();

  const types = React.useMemo(() => equipmentTypes(), []);
  const items = data ?? [];

  const customerById = React.useMemo(
    () => new Map((customers ?? []).map((c) => [c.id, c.name])),
    [customers],
  );
  const dealerById = React.useMemo(
    () => new Map((dealers ?? []).map((d) => [d.id, d.name])),
    [dealers],
  );

  function contextFor(item: { customerId?: string; dealerId?: string }): string | undefined {
    if (user.role === "customer") return undefined;
    if (user.role === "dealer") return item.customerId ? customerById.get(item.customerId) : undefined;
    return (
      [
        item.customerId ? customerById.get(item.customerId) : null,
        item.dealerId ? dealerById.get(item.dealerId) : null,
      ]
        .filter(Boolean)
        .join(" · ") || undefined
    );
  }

  const description =
    user.role === "internal"
      ? "Every registered machine across the dealer network, and the manufacturer's product line behind it."
      : user.role === "dealer"
        ? "Machines registered in your territory, and the manufacturer's product line behind them."
        : "Machines registered to your yard, and the manufacturer's product line behind them.";

  return (
    <div className="space-y-6">
      <PageHeader
        title={user.role === "customer" ? "My Product Catalog" : "Product Catalog"}
        description={description}
      />

      <Tabs defaultValue="fielded">
        <TabsList>
          <TabsTrigger value="fielded">Fielded Units</TabsTrigger>
          <TabsTrigger value="line">Product Line</TabsTrigger>
        </TabsList>

        <TabsContent value="fielded" className="space-y-6">
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
                <EquipmentCard
                  key={item.id}
                  item={item}
                  index={index}
                  context={contextFor(item)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="line">
          <ProductLineBrowser />
        </TabsContent>
      </Tabs>
    </div>
  );
}
