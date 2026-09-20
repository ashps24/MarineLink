"use client";

import { apiClient } from "@/lib/api/client";
import type { User, UserRole } from "@/types";
import type { CatalystIdentity } from "./catalyst-session";

/**
 * Catalyst Authentication answers "is this a real person, and which one".
 * The AppUsers table answers "what may they see" — their role and the dealer
 * or customer organization their view is scoped to. Accounts are provisioned
 * by internal staff; there is no public signup, so an authenticated email
 * with no row here is a person who has not been granted access yet.
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

export type AccessDecision =
  | { status: "granted"; user: User }
  | { status: "not-provisioned"; email: string }
  | { status: "disabled"; email: string };

/** Resolves an authenticated Catalyst identity into a MarineLink user. */
export async function resolveAppUser(identity: CatalystIdentity): Promise<AccessDecision> {
  const matches = await apiClient.list<AppUserRecord>("app-users", { email: identity.email });
  const record = matches[0];

  if (!record) return { status: "not-provisioned", email: identity.email };
  if (record.accountStatus === "disabled") return { status: "disabled", email: identity.email };

  const role = toRole(record.userRole);
  if (!role) return { status: "not-provisioned", email: identity.email };

  const fallbackName = [identity.firstName, identity.lastName].filter(Boolean).join(" ");

  return {
    status: "granted",
    user: {
      id: record.id,
      name: record.fullName || fallbackName || identity.email,
      email: record.email,
      role,
      organizationId: record.organizationId ?? "",
      organizationName: record.organizationName ?? "",
      permissions: PERMISSIONS_BY_ROLE[role],
      dashboardType: role,
      title: record.title ?? undefined,
    },
  };
}
