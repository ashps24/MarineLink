"use client";

import { apiClient } from "@/lib/api/client";

/**
 * Catalyst Authentication, as reachable from a Slate-hosted app.
 *
 * Two halves, because the platform splits them:
 *
 * - *Who is signed in* is answered by the backend function, not by the Web
 *   SDK. The SDK builds its session URLs against the page's own origin
 *   ("<origin>/baas/v1/..."), and Slate proxies "/__catalyst/..." but not
 *   "/baas/...", so the SDK's own check always fails on this host regardless
 *   of whether a session exists. The function runs on the Catalyst domain
 *   where the session is real, and the gateway answers this origin with
 *   Access-Control-Allow-Credentials, so the cookie reaches it.
 *
 * - *Signing in and out* is the SDK's, since that is a redirect and an iframe
 *   against Zoho's accounts domain rather than a call to "/baas".
 */

export interface CatalystIdentity {
  email: string;
  firstName?: string;
  lastName?: string;
  userId?: string;
}

interface CatalystAuth {
  signIn: (containerId: string, config: Record<string, string>) => void;
  signOut: (redirectUrl: string) => void;
}

interface CatalystGlobal {
  auth?: CatalystAuth;
}

const SDK_READY_TIMEOUT_MS = 12_000;
const SDK_POLL_INTERVAL_MS = 60;

function readGlobal(): CatalystGlobal | undefined {
  return (globalThis as { catalyst?: CatalystGlobal }).catalyst;
}

/** Resolves once `catalyst.auth` exists, or rejects if the SDK never loads. */
export function catalystAuth(): Promise<CatalystAuth> {
  const ready = readGlobal()?.auth;
  if (ready) return Promise.resolve(ready);

  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const timer = setInterval(() => {
      const auth = readGlobal()?.auth;
      if (auth) {
        clearInterval(timer);
        resolve(auth);
        return;
      }
      if (Date.now() - startedAt > SDK_READY_TIMEOUT_MS) {
        clearInterval(timer);
        reject(new Error("The Catalyst sign-in service did not load."));
      }
    }, SDK_POLL_INTERVAL_MS);
  });
}

/** The signed-in Catalyst identity, or null when nobody is signed in. */
export async function getCatalystIdentity(): Promise<CatalystIdentity | null> {
  const me = await apiClient.me<CatalystIdentity | null>();
  return me && me.email ? me : null;
}

/** Renders Catalyst's sign-in form into an element on our own page. */
export async function renderSignInWidget(containerId: string): Promise<void> {
  const auth = await catalystAuth();
  auth.signIn(containerId, { login_redirect: `${window.location.origin}/` });
}

export async function signOutOfCatalyst(): Promise<void> {
  const auth = await catalystAuth();
  auth.signOut(window.location.origin);
}
