"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";

/** Where the inline bootstrap script parks the originally-requested path. */
const DEEPLINK_KEY = "marinelink:deeplink";

/**
 * Only Slate builds park a path, so only they need it replayed. Elsewhere this
 * component mounts and does nothing.
 */
const SLATE_FALLBACK_HOSTING = process.env.NEXT_PUBLIC_SLATE_FALLBACK === "1";

/** A parked path older than this is treated as abandoned and discarded. */
const MAX_AGE_MS = 10_000;

/**
 * Only paths that can plausibly be an app route are ever replayed. Replaying
 * anything else is how this turns into a loop: the router cannot match a static
 * asset, the browser hard-loads it, the bootstrap script parks it again on
 * arrival, and the next visit repeats the whole thing.
 */
function isRoute(path: string): boolean {
  if (!path || !path.startsWith("/")) return false;
  if (path.startsWith("/_next/")) return false;
  const last = path.split("?")[0].split("#")[0].split("/").filter(Boolean).pop() ?? "";
  return !last.includes(".");
}

/**
 * Makes deep links work on Catalyst Slate.
 *
 * Slate resolves neither directory indexes nor clean URLs onto `.html`, and it
 * ignores rewrite rules, so every HTML request that is not an exact file
 * returns the root `index.html`. The sequence that fixes it:
 *
 *  1. An inline script in the head runs before React, parks the requested path
 *     and rewrites the address bar to `/`.
 *  2. React hydrates at `/`, which is genuinely the document it was given, so
 *     the router state and the markup agree.
 *  3. This component picks the parked path up and navigates to it for real.
 */
export function DeepLinkResolver() {
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    const reveal = () => document.documentElement.removeAttribute("data-deeplink");
    let target: string | null = null;

    if (!SLATE_FALLBACK_HOSTING) {
      reveal();
      return;
    }

    try {
      const raw = window.sessionStorage.getItem(DEEPLINK_KEY);
      // Consumed unconditionally: a value that survived a failed replay would
      // hijack the next visit to the site.
      window.sessionStorage.removeItem(DEEPLINK_KEY);

      if (raw) {
        const parsed = JSON.parse(raw) as { p?: unknown; t?: unknown };
        const path = typeof parsed.p === "string" ? parsed.p : null;
        const stamp = typeof parsed.t === "number" ? parsed.t : 0;
        const fresh = Date.now() - stamp < MAX_AGE_MS;
        if (path && fresh && isRoute(path) && path !== "/") target = path;
      }
    } catch {
      // Malformed value, or storage unavailable in private browsing.
    }

    if (!target) {
      reveal();
      return;
    }
    router.replace(target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reveal once the router has landed somewhere other than the root.
  React.useEffect(() => {
    if (pathname !== "/") document.documentElement.removeAttribute("data-deeplink");
  }, [pathname]);

  // Failsafe: never leave the app hidden, whatever happened above.
  React.useEffect(() => {
    const id = window.setTimeout(
      () => document.documentElement.removeAttribute("data-deeplink"),
      5_000,
    );
    return () => window.clearTimeout(id);
  }, []);

  return null;
}
