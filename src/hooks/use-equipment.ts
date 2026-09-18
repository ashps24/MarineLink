"use client";

import { useQuery } from "@tanstack/react-query";
import { getEquipment, getEquipmentById } from "@/lib/mock-api";
import type { EquipmentFilters } from "@/lib/mock-api";
import { useCurrentUser } from "./use-current-user";
import { useMockKey } from "./use-query-keys";

export function useEquipmentList(filters: EquipmentFilters = {}) {
  const { scope } = useCurrentUser();
  const mockKey = useMockKey();
  return useQuery({
    queryKey: ["equipment", scope, filters, mockKey],
    queryFn: () => getEquipment(scope, filters),
  });
}

export function useEquipmentItem(equipmentId: string | undefined) {
  const { scope } = useCurrentUser();
  const mockKey = useMockKey();
  return useQuery({
    queryKey: ["equipment-item", scope, equipmentId, mockKey],
    queryFn: () => getEquipmentById(scope, equipmentId as string),
    enabled: Boolean(equipmentId),
  });
}
