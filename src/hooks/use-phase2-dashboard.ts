"use client";

import { useQuery } from "@tanstack/react-query";
import { getPhase2Dashboard } from "@/lib/mock-api";
import { useCurrentUser } from "./use-current-user";
import { useMockKey } from "./use-query-keys";

export function usePhase2Dashboard() {
  const { scope } = useCurrentUser();
  const mockKey = useMockKey();
  return useQuery({
    queryKey: ["phase2-dashboard", scope, mockKey],
    queryFn: () => getPhase2Dashboard(scope),
  });
}
