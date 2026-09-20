"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { AppShell } from "@/components/layout/app-shell";
import { BrandMark } from "@/components/layout/brand-mark";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";

const LOGIN_PATH = "/login";

/** Brand-marked full-page state, used while the profile resolves. */
function AuthScreen({
  title,
  description,
  children,
}: {
  title?: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-sm text-center">
        <span className="inline-flex" aria-hidden="true">
          <BrandMark className={title ? undefined : "animate-pulse"} />
        </span>
        {title ? (
          <>
            <div className="mt-6 flex justify-center">
              <WarningCircle size={28} weight="duotone" aria-hidden="true" className="text-warning" />
            </div>
            <h1 className="mt-5 font-heading text-xl font-semibold tracking-tight">{title}</h1>
          </>
        ) : (
          <p className="sr-only">Loading MarineLink</p>
        )}
        {description ? <p className="mt-2 text-sm text-muted-foreground">{description}</p> : null}
        {children ? <div className="mt-6">{children}</div> : null}
      </div>
    </div>
  );
}

/**
 * Resolves the active profile before any application screen renders.
 *
 * This is not a lock. The app is open: signing in swaps which profile is
 * active, and not signing in opens on the internal-staff one. What this does
 * guarantee is that no screen below it ever has to render without a user.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { state } = useAuth();
  const pathname = usePathname();

  // The static export serves "/login/", so compare without the trailing slash.
  if (pathname.replace(/\/+$/, "") === LOGIN_PATH) return <>{children}</>;

  switch (state.status) {
    case "loading":
      return <AuthScreen />;

    case "unavailable":
      return (
        <AuthScreen title="MarineLink is unavailable" description={state.message}>
          <Button size="lg" className="h-10" onClick={() => window.location.reload()}>
            Try again
          </Button>
        </AuthScreen>
      );

    case "ready":
      return <AppShell>{children}</AppShell>;
  }
}
