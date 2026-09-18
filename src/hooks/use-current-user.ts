"use client";

import * as React from "react";
import { useRoleStore } from "@/stores/role-store";
import { getMockUserForRole } from "@/lib/mock-api";
import type { RequestScope } from "@/lib/mock-api";
import type { User } from "@/types";

/**
 * The signed-in user, as far as the UI is concerned.
 *
 * ── Auth seam ────────────────────────────────────────────────────────────
 * Real sessions replace the role store behind this hook. Components should
 * depend on the returned `User` shape, not on how it was obtained.
 * ─────────────────────────────────────────────────────────────────────────
 */
export function useCurrentUser(): { user: User; scope: RequestScope; hydrated: boolean } {
  const role = useRoleStore((state) => state.role);

  // The persisted role only exists in the browser. Rendering the internal user
  // on the server and first client paint keeps hydration stable; the effect
  // below flips to the stored role immediately after.
  const [hydrated, setHydrated] = React.useState(false);
  React.useEffect(() => setHydrated(true), []);

  const effectiveRole = hydrated ? role : "internal";
  const user = React.useMemo(() => getMockUserForRole(effectiveRole), [effectiveRole]);
  const scope = React.useMemo<RequestScope>(
    () => ({ role: user.role, organizationId: user.organizationId }),
    [user.role, user.organizationId],
  );

  return { user, scope, hydrated };
}
