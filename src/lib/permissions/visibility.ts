import type { User, Dealer, Customer, Equipment, ServiceRequest } from "@/types";

/**
 * The minimum a caller must know about the signed-in user to evaluate
 * visibility. Accepting this instead of a full `User` lets the mock service
 * layer pass a request scope without fabricating a whole user object.
 */
export type VisibilityContext = Pick<User, "role" | "organizationId">;

/**
 * Frontend visibility boundary only. This models which records a user
 * *should* see in the UI so Phase 1 can demonstrate role-based scoping.
 * It is not a security control — real enforcement happens server-side
 * once this layer is backed by Zoho CRM and a proper auth/authorization
 * service in a later phase.
 */

export function canViewInternalDirectories(user: VisibilityContext): boolean {
  return user.role === "internal";
}

export function visibleDealers(user: VisibilityContext, dealers: Dealer[]): Dealer[] {
  if (user.role === "internal") return dealers;
  if (user.role === "dealer") return dealers.filter((d) => d.id === user.organizationId);
  return [];
}

export function visibleCustomers(user: VisibilityContext, customers: Customer[]): Customer[] {
  if (user.role === "internal") return customers;
  if (user.role === "dealer") {
    return customers.filter((c) => c.dealerId === user.organizationId);
  }
  return customers.filter((c) => c.id === user.organizationId);
}

export function visibleEquipment(user: VisibilityContext, equipment: Equipment[]): Equipment[] {
  if (user.role === "internal") return equipment;
  if (user.role === "dealer") {
    return equipment.filter((e) => e.dealerId === user.organizationId);
  }
  return equipment.filter((e) => e.customerId === user.organizationId);
}

export function visibleServiceRequests(
  user: VisibilityContext,
  requests: ServiceRequest[],
): ServiceRequest[] {
  if (user.role === "internal") return requests;
  if (user.role === "dealer") {
    return requests.filter((r) => r.dealerId === user.organizationId);
  }
  return requests.filter((r) => r.customerId === user.organizationId);
}

export function canViewDealer(user: VisibilityContext, dealerId: string): boolean {
  if (user.role === "internal") return true;
  if (user.role === "dealer") return user.organizationId === dealerId;
  return false;
}

export function canViewCustomer(
  user: VisibilityContext,
  customer: Pick<Customer, "id" | "dealerId">,
): boolean {
  if (user.role === "internal") return true;
  if (user.role === "dealer") return customer.dealerId === user.organizationId;
  return user.organizationId === customer.id;
}

export function canViewEquipment(
  user: VisibilityContext,
  item: Pick<Equipment, "customerId" | "dealerId">,
): boolean {
  if (user.role === "internal") return true;
  if (user.role === "dealer") return item.dealerId === user.organizationId;
  return item.customerId === user.organizationId;
}

export function canViewServiceRequest(
  user: VisibilityContext,
  request: Pick<ServiceRequest, "customerId" | "dealerId">,
): boolean {
  if (user.role === "internal") return true;
  if (user.role === "dealer") return request.dealerId === user.organizationId;
  return request.customerId === user.organizationId;
}
