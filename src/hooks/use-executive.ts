"use client";

import { useQuery } from "@tanstack/react-query";
import { getExecutiveOverview } from "@/lib/services";
import { useCurrentUser } from "./use-current-user";

export function useExecutiveOverview() {
  const { scope } = useCurrentUser();
  return useQuery({
    queryKey: ["executive-overview", scope],
    queryFn: () => getExecutiveOverview(scope),
    enabled: scope.role === "internal",
  });
}
