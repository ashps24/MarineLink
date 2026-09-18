import type { Equipment, ServiceRequest } from "@/types";

/**
 * The counts carried on dealer and customer records are denormalised — a real
 * backend would return them alongside the record rather than make the client
 * aggregate. Deriving them from the underlying fixtures instead of hand-writing
 * them keeps every number on screen agreeing with the records behind it, which
 * matters once the service history is large enough that nobody can check by eye.
 */

const OPEN_STATUSES: ServiceRequest["status"][] = ["new", "in_progress", "waiting"];

export function isOpen(request: ServiceRequest): boolean {
  return OPEN_STATUSES.includes(request.status);
}

export function countEquipmentForCustomer(equipment: Equipment[], customerId: string): number {
  return equipment.filter((item) => item.customerId === customerId).length;
}

export function countEquipmentForDealer(equipment: Equipment[], dealerId: string): number {
  return equipment.filter((item) => item.dealerId === dealerId).length;
}

export function countOpenForCustomer(requests: ServiceRequest[], customerId: string): number {
  return requests.filter((request) => request.customerId === customerId && isOpen(request)).length;
}

export function countOpenForDealer(requests: ServiceRequest[], dealerId: string): number {
  return requests.filter((request) => request.dealerId === dealerId && isOpen(request)).length;
}
