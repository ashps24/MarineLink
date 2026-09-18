import type { User } from "@/types";

export const mockUsers: Record<"internal" | "dealer" | "customer", User> = {
  internal: {
    id: "user-internal-1",
    name: "Meredith Talley",
    email: "meredith.talley@marinetravelift.com",
    role: "internal",
    organizationId: "internal-mtl",
    organizationName: "Marine Travelift, Inc.",
    permissions: [
      "view:all-dealers",
      "view:all-customers",
      "view:all-equipment",
      "view:all-service-requests",
    ],
    dashboardType: "internal",
    title: "VP, Customer Operations",
  },
  dealer: {
    id: "user-dealer-1",
    name: "Marcus Deluca",
    email: "marcus.deluca@gulfcoasttravelift.com",
    role: "dealer",
    organizationId: "dealer-2",
    organizationName: "Gulf Coast Travelift Services",
    permissions: [
      "view:own-dealer",
      "view:own-customers",
      "view:own-equipment",
      "view:own-service-requests",
    ],
    dashboardType: "dealer",
    title: "Service Operations Manager",
  },
  customer: {
    id: "user-customer-1",
    name: "Julian Ferreira",
    email: "julian.ferreira@tampabayshiprepair.com",
    role: "customer",
    organizationId: "cust-4",
    organizationName: "Tampa Bay Ship Repair Corp.",
    permissions: ["view:own-equipment", "view:own-service-requests"],
    dashboardType: "customer",
    title: "Yard Manager",
  },
};

export const mockUserList: User[] = Object.values(mockUsers);
