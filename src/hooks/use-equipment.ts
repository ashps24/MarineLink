"use client";

import { useQuery } from "@tanstack/react-query";
import { getEquipment, getEquipmentById, equipmentTypes } from "@/lib/mock-api";
import type { EquipmentFilters } from "@/lib/mock-api";
import { useCurrentUser } from "./use-current-user";

export function useEquipmentList(filters: EquipmentFilters = {}) {
  const { scope } = useCurrentUser();
  return useQuery({
    queryKey: ["equipment", scope, filters],
    queryFn: () => getEquipment(scope, filters),
  });
}

export function useEquipmentItem(equipmentId: string | undefined) {
  const { scope } = useCurrentUser();
  return useQuery({
    queryKey: ["equipment-item", scope, equipmentId],
    queryFn: () => getEquipmentById(scope, equipmentId as string),
    enabled: Boolean(equipmentId),
  });
}

export function useEquipmentTypes() {
  return useQuery({
    queryKey: ["equipment-types"],
    queryFn: equipmentTypes,
  });
}
