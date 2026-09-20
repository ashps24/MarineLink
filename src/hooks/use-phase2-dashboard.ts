"use client";

import { useQuery } from "@tanstack/react-query";
import { getPhase2Dashboard } from "@/lib/mock-api";
import { useCurrentUser } from "./use-current-user";

export function usePhase2Dashboard() {
  const { scope } = useCurrentUser();
  return useQuery({
    queryKey: ["phase2-dashboard", scope],
    queryFn: () => getPhase2Dashboard(scope),
  });
}
