"use client";

import { useQuery } from "@tanstack/react-query";
import { getCustomers, getCustomerById } from "@/lib/services";
import type { CustomerFilters } from "@/lib/services";
import { useCurrentUser } from "./use-current-user";

export function useCustomers(filters: CustomerFilters = {}) {
  const { scope } = useCurrentUser();
  return useQuery({
    queryKey: ["customers", scope, filters],
    queryFn: () => getCustomers(scope, filters),
  });
}

export function useCustomer(customerId: string | undefined) {
  const { scope } = useCurrentUser();
  return useQuery({
    queryKey: ["customer", scope, customerId],
    queryFn: () => getCustomerById(scope, customerId as string),
    enabled: Boolean(customerId),
  });
}
