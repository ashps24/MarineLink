"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getCatalystIdentity, signOutOfCatalyst } from "@/lib/auth/catalyst-session";
import { resolveAppUser } from "@/lib/auth/app-user";
import type { User } from "@/types";

export type AuthState =
  | { status: "loading" }
  | { status: "signed-out" }
  /** Authenticated with Catalyst, but no MarineLink access has been granted. */
  | { status: "no-access"; email: string; reason: "not-provisioned" | "disabled" }
  | { status: "signed-in"; user: User }
  | { status: "unavailable"; message: string };

interface AuthContextValue {
  state: AuthState;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<AuthState>({ status: "loading" });
  const queryClient = useQueryClient();

  const load = React.useCallback(async () => {
    try {
      const identity = await getCatalystIdentity();
      if (!identity) {
        setState({ status: "signed-out" });
        return;
      }

      const decision = await resolveAppUser(identity);
      setState(
        decision.status === "granted"
          ? { status: "signed-in", user: decision.user }
          : { status: "no-access", email: decision.email, reason: decision.status },
      );
    } catch (error) {
      setState({
        status: "unavailable",
        message: error instanceof Error ? error.message : "Sign-in is unavailable.",
      });
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const signOut = React.useCallback(async () => {
    // Every cached list and detail response was fetched for the outgoing
    // user's scope, so it must not survive into the next session.
    queryClient.clear();
    await signOutOfCatalyst();
  }, [queryClient]);

  const value = React.useMemo<AuthContextValue>(
    () => ({ state, refresh: load, signOut }),
    [state, load, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}

/**
 * The signed-in user, for the screens that only ever render behind the auth
 * gate. Those screens cannot be reached in any other state, so this throws
 * rather than making every consumer handle a null user.
 */
export function useAuthenticatedUser(): User {
  const { state } = useAuth();
  if (state.status !== "signed-in") {
    throw new Error("useAuthenticatedUser called outside an authenticated screen");
  }
  return state.user;
}
