"use client";

import * as React from "react";
import { UsersThree } from "@phosphor-icons/react/dist/ssr";
import { PageHeader } from "@/components/layout/page-header";
import { FilterBar } from "@/components/shared/filter-bar";
import { SearchInput } from "@/components/shared/search-input";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { CardGridSkeleton } from "@/components/shared/loading-skeleton";
import { RestrictedState } from "@/components/shared/restricted-state";
import { CustomerCard } from "@/components/customers/customer-card";
import { useCustomers } from "@/hooks/use-customers";
import { useDealers } from "@/hooks/use-dealers";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useFilterParams } from "@/hooks/use-filter-params";

const DEFAULTS = { search: "", status: "all", dealerId: "all" } as const;

/**
 * Internal staff see every account; a dealer user sees only the accounts they
 * support. A customer user has no directory at all — their own record is the
 * whole of what they can see.
 */
export default function CustomersPage() {
  const { user } = useCurrentUser();
  const { values, setValue, reset, isFiltered } = useFilterParams<Record<string, string>>({
    ...DEFAULTS,
  });

  const { data, isPending, isError, refetch } = useCustomers({
    search: values.search,
    status: values.status as "all",
    dealerId: values.dealerId,
  });
  const { data: dealers } = useDealers();

  const customers = data ?? [];
  const dealerById = React.useMemo(
    () => new Map((dealers ?? []).map((dealer) => [dealer.id, dealer])),
    [dealers],
  );

  if (user.role === "customer") {
    return (
      <div className="space-y-6">
        <PageHeader title="Customers" />
        <RestrictedState description="Customer accounts other than your own are not visible from the customer portal." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description={
          user.role === "dealer"
            ? "Accounts your dealership supports, with equipment and open service counts."
            : "Every customer account, with its dealer relationship and service load."
        }
      />

      <FilterBar
        search={
          <SearchInput
            label="Search customers"
            placeholder="Search by name or contact"
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
              { value: "prospect", label: "Prospect" },
              { value: "inactive", label: "Inactive" },
            ],
          },
          ...(user.role === "internal"
            ? [
                {
                  key: "dealerId",
                  label: "Dealer",
                  value: values.dealerId,
                  onChange: (value: string) => setValue("dealerId", value),
                  options: [
                    { value: "all", label: "All dealers" },
                    ...(dealers ?? []).map((dealer) => ({
                      value: dealer.id,
                      label: dealer.name,
                    })),
                  ],
                },
              ]
            : []),
        ]}
        isFiltered={isFiltered}
        onReset={reset}
        resultCount={isPending || isError ? undefined : customers.length}
        resultNoun="customer"
      />

      {isPending ? (
        <CardGridSkeleton label="Loading customers" />
      ) : isError ? (
        <ErrorState
          title="Could not load customers"
          description="The customer service did not respond."
          onRetry={() => refetch()}
        />
      ) : customers.length === 0 ? (
        <EmptyState
          icon={UsersThree}
          title="No customers match these filters"
          description={
            isFiltered
              ? "Try widening the search or clearing a filter."
              : "Customer accounts appear here once they are registered."
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {customers.map((customer, index) => (
            <CustomerCard
              key={customer.id}
              customer={customer}
              dealer={customer.dealerId ? dealerById.get(customer.dealerId) : undefined}
              index={index}
            />
          ))}
        </div>
      )}
    </div>
  );
}
