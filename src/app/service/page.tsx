"use client";

import * as React from "react";
import Link from "next/link";
import { ClipboardText, Plus } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { FilterBar } from "@/components/shared/filter-bar";
import { SearchInput } from "@/components/shared/search-input";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { ListSkeleton } from "@/components/shared/loading-skeleton";
import { ServiceRequestRow } from "@/components/service/service-request-row";
import { useServiceRequests, useServiceTeams } from "@/hooks/use-service-requests";
import { useCustomers } from "@/hooks/use-customers";
import { useDealers } from "@/hooks/use-dealers";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useFilterParams } from "@/hooks/use-filter-params";

const DEFAULTS = { search: "", status: "all", priority: "all", assignedTeam: "all" } as const;

export default function ServicePage() {
  const { user } = useCurrentUser();
  const { values, setValue, reset, isFiltered } = useFilterParams<Record<string, string>>({
    ...DEFAULTS,
  });

  const { data, isPending, isError, refetch } = useServiceRequests({
    search: values.search,
    status: values.status as "all",
    priority: values.priority as "all",
    assignedTeam: values.assignedTeam,
  });
  const { data: customers } = useCustomers();
  const { data: dealers } = useDealers();

  const { data: teams } = useServiceTeams();
  const requests = data ?? [];

  const customerById = React.useMemo(
    () => new Map((customers ?? []).map((customer) => [customer.id, customer.name])),
    [customers],
  );
  const dealerById = React.useMemo(
    () => new Map((dealers ?? []).map((dealer) => [dealer.id, dealer.name])),
    [dealers],
  );

  /** Which related name to show depends on what the role is allowed to see. */
  function contextFor(customerId?: string, dealerId?: string): string | undefined {
    if (user.role === "customer") return undefined;
    if (user.role === "dealer") return customerId ? customerById.get(customerId) : undefined;
    return (
      [customerId ? customerById.get(customerId) : null, dealerId ? dealerById.get(dealerId) : null]
        .filter(Boolean)
        .join(" · ") || undefined
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Service"
        description="Track service requests and their current status."
        actions={
          <Button asChild size="lg" className="h-10">
            <Link prefetch={false} href="/service/new/">
              <Plus aria-hidden="true" />
              New request
            </Link>
          </Button>
        }
      />

      <FilterBar
        search={
          <SearchInput
            label="Search service requests"
            placeholder="Search by reference, subject, or team"
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
              { value: "new", label: "New" },
              { value: "acknowledged", label: "Acknowledged" },
              { value: "in_progress", label: "In progress" },
              { value: "waiting", label: "Awaiting parts" },
              { value: "resolved", label: "Resolved" },
              { value: "closed", label: "Closed" },
            ],
          },
          {
            key: "priority",
            label: "Priority",
            value: values.priority,
            onChange: (value) => setValue("priority", value),
            options: [
              { value: "all", label: "All priorities" },
              { value: "urgent", label: "Urgent" },
              { value: "high", label: "High" },
              { value: "medium", label: "Medium" },
              { value: "low", label: "Low" },
            ],
          },
          ...(user.role === "internal"
            ? [
                {
                  key: "assignedTeam",
                  label: "Team",
                  value: values.assignedTeam,
                  onChange: (value: string) => setValue("assignedTeam", value),
                  options: [
                    { value: "all", label: "All teams" },
                    ...(teams ?? []).map((team) => ({ value: team, label: team })),
                  ],
                },
              ]
            : []),
        ]}
        isFiltered={isFiltered}
        onReset={reset}
        resultCount={isPending || isError ? undefined : requests.length}
        resultNoun="request"
      />

      {isPending ? (
        <ListSkeleton label="Loading service requests" />
      ) : isError ? (
        <ErrorState
          title="Could not load service requests"
          description="The service queue did not respond."
          onRetry={() => refetch()}
        />
      ) : requests.length === 0 ? (
        <EmptyState
          icon={ClipboardText}
          title="No service requests match these filters"
          description={
            isFiltered
              ? "Try widening the search or clearing a filter."
              : "Requests appear here as they are raised against your equipment."
          }
        />
      ) : (
        <div className="space-y-3">
          {requests.map((request, index) => (
            <ServiceRequestRow
              key={request.id}
              request={request}
              context={contextFor(request.customerId, request.dealerId)}
              index={index}
            />
          ))}
        </div>
      )}
    </div>
  );
}
