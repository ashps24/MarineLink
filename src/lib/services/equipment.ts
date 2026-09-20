import { equipmentSchema } from "@/schemas";
import type { Equipment } from "@/types";
import { visibleEquipment, canViewEquipment } from "@/lib/permissions/visibility";
import { fetchLiveEquipment } from "./live-source";
import { matchesSearch } from "./client";
import type { EquipmentFilters, RequestScope } from "./types";

export async function getEquipment(
  scope: RequestScope,
  filters: EquipmentFilters = {},
): Promise<Equipment[]> {
  const allEquipment = await fetchLiveEquipment();
  const rows = visibleEquipment(scope, allEquipment).filter((item) => {
    const typeOk =
      !filters.equipmentType ||
      filters.equipmentType === "all" ||
      item.equipmentType === filters.equipmentType;
    const statusOk =
      !filters.status || filters.status === "all" || item.currentStatus === filters.status;
    const customerOk = !filters.customerId || item.customerId === filters.customerId;
    const dealerOk = !filters.dealerId || item.dealerId === filters.dealerId;
    const searchOk = matchesSearch(
      filters.search,
      item.name,
      item.model,
      item.serialNumber,
      item.equipmentType,
    );
    return typeOk && statusOk && customerOk && dealerOk && searchOk;
  });

  return rows.map((row) => equipmentSchema.parse(row));
}

export async function getEquipmentById(
  scope: RequestScope,
  id: string,
): Promise<Equipment | null> {
  const allEquipment = await fetchLiveEquipment();
  const item = allEquipment.find((row) => row.id === id);
  if (!item) return null;
  if (!canViewEquipment(scope, item)) return null;
  return equipmentSchema.parse(item);
}

export async function equipmentTypes(): Promise<string[]> {
  const allEquipment = await fetchLiveEquipment();
  return Array.from(new Set(allEquipment.map((item) => item.equipmentType))).sort();
}
