"use client";

import { useQuery } from "@tanstack/react-query";
import { getCustomers, getCustomerById } from "@/lib/mock-api";
import type { CustomerFilters } from "@/lib/mock-api";
import { useCurrentUser } from "./use-current-user";
import { useMockKey } from "./use-query-keys";

export function useCustomers(filters: CustomerFilters = {}) {
  const { scope } = useCurrentUser();
  const mockKey = useMockKey();
  return useQuery({
    queryKey: ["customers", scope, filters, mockKey],
    queryFn: () => getCustomers(scope, filters),
  });
}

export function useCustomer(customerId: string | undefined) {
  const { scope } = useCurrentUser();
  const mockKey = useMockKey();
  return useQuery({
    queryKey: ["customer", scope, customerId, mockKey],
    queryFn: () => getCustomerById(scope, customerId as string),
    enabled: Boolean(customerId),
  });
}
