"use client";

import * as React from "react";
import { useAuthenticatedUser } from "@/providers/auth-provider";
import type { RequestScope } from "@/lib/mock-api";
import type { User } from "@/types";

/**
 * The signed-in user and the scope every read is filtered through.
 *
 * Identity comes from Catalyst Authentication; the role and organization come
 * from the AppUsers table. Screens only ever render behind the auth gate, so
 * there is always a user here.
 */
export function useCurrentUser(): { user: User; scope: RequestScope } {
  const user = useAuthenticatedUser();
  const scope = React.useMemo<RequestScope>(
    () => ({ role: user.role, organizationId: user.organizationId }),
    [user.role, user.organizationId],
  );

  return { user, scope };
}
