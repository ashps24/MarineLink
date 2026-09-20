"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getCatalystIdentity, signOutOfCatalyst } from "@/lib/auth/catalyst-session";
import { resolveAppUser, fetchAppUsers } from "@/lib/auth/app-user";
import type { User } from "@/types";

export type AuthState =
  | { status: "loading" }
  /** `authenticated` false means the app opened on a provisioned profile. */
  | { status: "ready"; user: User; authenticated: boolean; profiles: User[] }
  | { status: "unavailable"; message: string };

interface AuthContextValue {
  state: AuthState;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
  /** Switch which provisioned profile the app is viewed as. */
  setProfile: (userId: string) => void;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

const ACTIVE_PROFILE_KEY = "marinelink.active-profile";

function readStoredProfileId(): string | null {
  try {
    return window.localStorage.getItem(ACTIVE_PROFILE_KEY);
  } catch {
    return null;
  }
}

function storeProfileId(id: string): void {
  try {
    window.localStorage.setItem(ACTIVE_PROFILE_KEY, id);
  } catch {
    // A browser that refuses storage still gets a working session, it just
    // starts from the default profile on the next load.
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<AuthState>({ status: "loading" });
  const queryClient = useQueryClient();

  const load = React.useCallback(async () => {
    try {
      const profiles = await fetchAppUsers();
      if (profiles.length === 0) {
        setState({
          status: "unavailable",
          message: "No MarineLink profile is configured for this workspace yet.",
        });
        return;
      }

      // A real Catalyst session pins the profile to that person. Without one,
      // the app opens on whichever profile was last chosen here.
      const identity = await getCatalystIdentity().catch(() => null);
      const signedIn = identity ? await resolveAppUser(identity) : null;
      if (signedIn) {
        setState({ status: "ready", user: signedIn, authenticated: true, profiles });
        return;
      }

      const storedId = readStoredProfileId();
      const user = profiles.find((p) => p.id === storedId) ?? profiles[0];
      setState({ status: "ready", user, authenticated: false, profiles });
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

  /**
   * Switching profile reloads rather than re-rendering in place.
   *
   * Role decides the navigation set, which dashboard mounts, and the scope on
   * every query, so a switch replaces essentially the whole tree at once.
   * Doing that as a client transition crashed the router mid-swap; a reload
   * remounts cleanly and costs a second on an action taken a few times a
   * session. The choice is already persisted, so the new profile is in place
   * on the way back up.
   */
  const setProfile = React.useCallback(
    (userId: string) => {
      if (state.status !== "ready" || state.authenticated) return;
      const user = state.profiles.find((profile) => profile.id === userId);
      if (!user || user.id === state.user.id) return;
      storeProfileId(user.id);
      window.location.assign("/");
    },
    [state],
  );

  const signOut = React.useCallback(async () => {
    queryClient.clear();
    await signOutOfCatalyst();
  }, [queryClient]);

  const value = React.useMemo<AuthContextValue>(
    () => ({ state, refresh: load, signOut, setProfile }),
    [state, load, signOut, setProfile],
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
