"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getCatalystIdentity, signOutOfCatalyst } from "@/lib/auth/catalyst-session";
import { resolveAppUser, fetchDefaultAppUser } from "@/lib/auth/app-user";
import type { User } from "@/types";

export type AuthState =
  | { status: "loading" }
  /** `authenticated` false means the app opened on the default staff profile. */
  | { status: "ready"; user: User; authenticated: boolean }
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
      // A Catalyst session wins when there is one, and the app opens on the
      // internal-staff profile when there is not. Signing in is optional
      // here, so a missing session is an ordinary state, not a failure.
      const identity = await getCatalystIdentity().catch(() => null);
      const signedIn = identity ? await resolveAppUser(identity) : null;
      if (signedIn) {
        setState({ status: "ready", user: signedIn, authenticated: true });
        return;
      }

      const fallback = await fetchDefaultAppUser();
      if (!fallback) {
        setState({
          status: "unavailable",
          message: "No MarineLink profile is configured for this workspace yet.",
        });
        return;
      }
      setState({ status: "ready", user: fallback, authenticated: false });
    } catch (error) {
      setState({
        status: "unavailable",
        message: error instanceof Error ? error.message : "MarineLink could not start.",
      });
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const signOut = React.useCallback(async () => {
    // Every cached response was fetched for the outgoing user's scope, so it
    // must not survive into whatever the app resolves to next.
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
 * The active user, for screens that only render once a profile has resolved.
 * Those screens cannot be reached in any other state, so this throws rather
 * than making every consumer handle a null user.
 */
export function useAuthenticatedUser(): User {
  const { state } = useAuth();
  if (state.status !== "ready") {
    throw new Error("useAuthenticatedUser called before a profile resolved");
  }
  return state.user;
}
