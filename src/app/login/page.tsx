"use client";

import * as React from "react";
import { WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { BrandMark } from "@/components/layout/brand-mark";
import { Button } from "@/components/ui/button";
import { renderSignInWidget } from "@/lib/auth/catalyst-session";

const WIDGET_CONTAINER_ID = "catalyst-signin";

export default function LoginPage() {
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    // The widget mounts an iframe into the container and would stack a second
    // one on a re-run, so this is deliberately mounted once per visit.
    let cancelled = false;
    renderSignInWidget(WIDGET_CONTAINER_ID).catch((err: unknown) => {
      if (cancelled) return;
      setError(err instanceof Error ? err.message : "The sign-in form could not be loaded.");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <main id="main" className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="text-center">
            <span className="inline-flex" aria-hidden="true">
              <BrandMark className="size-11" />
            </span>
            <h1 className="mt-5 font-heading text-2xl font-semibold tracking-tight">
              Sign in to MarineLink
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Marine Travelift equipment, dealers, and service in one place.
            </p>
          </div>

          <div className="mt-8 rounded-2xl border border-border bg-card p-2 shadow-sm">
            {error ? (
              <div className="px-4 py-10 text-center">
                <WarningCircle
                  size={26}
                  weight="duotone"
                  aria-hidden="true"
                  className="mx-auto text-warning"
                />
                <p className="mt-3 text-sm font-medium">Sign-in is unavailable</p>
                <p className="mt-1 text-sm text-muted-foreground">{error}</p>
                <Button
                  variant="outline"
                  size="lg"
                  className="mt-5 h-10"
                  onClick={() => window.location.reload()}
                >
                  Try again
                </Button>
              </div>
            ) : (
              <div id={WIDGET_CONTAINER_ID} />
            )}
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Accounts are provisioned by Marine Travelift. Contact your administrator if you need
            access.
          </p>
        </div>
      </main>
    </div>
  );
}
