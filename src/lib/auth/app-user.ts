"use client";

import { apiClient } from "@/lib/api/client";
import type { User, UserRole } from "@/types";
import type { CatalystIdentity } from "./catalyst-session";

/**
 * The AppUsers table is the source of truth for what a person may see: their
 * role, and the dealer or customer organization their view is scoped to.
 *
 * Signing in is optional. When there is a Catalyst session the row is matched
 * on the authenticated email; otherwise the app opens on the internal-staff
 * profile. Either way the profile is a real record rather than a fixture, so
 * scoping behaves identically in both cases.
 */
interface AppUserRecord {
  id: string;
  email: string;
  fullName: string | null;
  title: string | null;
  userRole: string | null;
  organizationId: string | null;
  organizationName: string | null;
  accountStatus: string | null;
}

const PERMISSIONS_BY_ROLE: Record<UserRole, string[]> = {
  internal: [
    "view:all-dealers",
    "view:all-customers",
    "view:all-equipment",
    "view:all-service-requests",
  ],
  dealer: [
    "view:own-dealer",
    "view:own-customers",
    "view:own-equipment",
    "view:own-service-requests",
  ],
  customer: ["view:own-equipment", "view:own-service-requests"],
};

function toRole(value: string | null): UserRole | null {
  return value === "internal" || value === "dealer" || value === "customer" ? value : null;
}

function toUser(record: AppUserRecord, fallbackName?: string): User | null {
  const role = toRole(record.userRole);
  if (!role) return null;

  return {
    id: record.id,
    name: record.fullName || fallbackName || record.email,
    email: record.email,
    role,
    organizationId: record.organizationId ?? "",
    organizationName: record.organizationName ?? "",
    permissions: PERMISSIONS_BY_ROLE[role],
    dashboardType: role,
    title: record.title ?? undefined,
  };
}

/** The profile for an authenticated identity, or null if none is provisioned. */
export async function resolveAppUser(identity: CatalystIdentity): Promise<User | null> {
  const matches = await apiClient.list<AppUserRecord>("app-users", { email: identity.email });
  const record = matches[0];
  if (!record || record.accountStatus === "disabled") return null;

  const fallbackName = [identity.firstName, identity.lastName].filter(Boolean).join(" ");
  return toUser(record, fallbackName);
}

/** The profile the app opens on when nobody has signed in. */
export async function fetchDefaultAppUser(): Promise<User | null> {
  const staff = await apiClient.list<AppUserRecord>("app-users", { userRole: "internal" });
  const record = staff.find((row) => row.accountStatus !== "disabled");
  return record ? toUser(record) : null;
}
