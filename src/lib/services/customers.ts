import { customerSchema } from "@/schemas";
import type { Customer } from "@/types";
import { visibleCustomers, canViewCustomer } from "@/lib/permissions/visibility";
import { fetchLiveCustomers } from "./live-source";
import { matchesSearch } from "./client";
import type { CustomerFilters, RequestScope } from "./types";

export async function getCustomers(
  scope: RequestScope,
  filters: CustomerFilters = {},
): Promise<Customer[]> {
  const allCustomers = await fetchLiveCustomers();
  const rows = visibleCustomers(scope, allCustomers).filter((customer) => {
    const statusOk =
      !filters.status || filters.status === "all" || customer.status === filters.status;
    const dealerOk =
      !filters.dealerId || filters.dealerId === "all" || customer.dealerId === filters.dealerId;
    const searchOk = matchesSearch(
      filters.search,
      customer.name,
      customer.organizationName,
      customer.primaryContactName,
      customer.primaryContactEmail,
    );
    return statusOk && dealerOk && searchOk;
  });

  return rows.map((row) => customerSchema.parse(row));
}

export async function getCustomerById(
  scope: RequestScope,
  id: string,
): Promise<Customer | null> {
  const allCustomers = await fetchLiveCustomers();
  const customer = allCustomers.find((item) => item.id === id);
  if (!customer) return null;
  if (!canViewCustomer(scope, customer)) return null;
  return customerSchema.parse(customer);
}
