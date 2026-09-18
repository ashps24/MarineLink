"use client";

import { useQuery } from "@tanstack/react-query";
import { getExecutiveOverview } from "@/lib/mock-api";
import { useCurrentUser } from "./use-current-user";
import { useMockKey } from "./use-query-keys";

export function useExecutiveOverview() {
  const { scope } = useCurrentUser();
  const mockKey = useMockKey();
  return useQuery({
    queryKey: ["executive-overview", scope, mockKey],
    queryFn: () => getExecutiveOverview(scope),
    enabled: scope.role === "internal",
  });
}
