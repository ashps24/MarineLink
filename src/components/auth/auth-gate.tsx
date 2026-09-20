"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Lock, WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { AppShell } from "@/components/layout/app-shell";
import { BrandMark } from "@/components/layout/brand-mark";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";

const LOGIN_PATH = "/login";
const RETURNED_FROM_SIGNIN_KEY = "marinelink:returned-from-signin";

function consumeReturnedFromSignIn(): boolean {
  try {
    const flagged = window.sessionStorage.getItem(RETURNED_FROM_SIGNIN_KEY) === "1";
    if (flagged) window.sessionStorage.removeItem(RETURNED_FROM_SIGNIN_KEY);
    return flagged;
  } catch {
    return false;
  }
}

/** Brand-marked full-page state, used while resolving and when blocked. */
function AuthScreen({
  icon,
  title,
  description,
  children,
}: {
  icon?: React.ReactNode;
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
        {icon ? <div className="mt-6 flex justify-center">{icon}</div> : null}
        {title ? (
          <h1 className="mt-5 font-heading text-xl font-semibold tracking-tight">{title}</h1>
        ) : (
          <p className="sr-only">Loading MarineLink</p>
        )}
        {description ? (
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        ) : null}
        {children ? <div className="mt-6">{children}</div> : null}
      </div>
    </div>
  );
}

/**
 * Decides what a visitor sees before any application screen renders: the
 * sign-in page, a full-page state while the session resolves, or the app
 * shell itself. Only the "signed-in" branch ever mounts application UI, so no
 * screen below this point has to reason about there being no user.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { state, refresh, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [sessionLost, setSessionLost] = React.useState(false);
  // The static export serves "/login/", so compare without the trailing slash.
  const onLoginPage = pathname.replace(/\/+$/, "") === LOGIN_PATH;

  React.useEffect(() => {
    if (state.status === "signed-out") {
      // Coming back from Catalyst's sign-in only to read as signed out means
      // the session did not reach the API. Say that, rather than sending the
      // person back to a form they just completed.
      if (consumeReturnedFromSignIn()) {
        setSessionLost(true);
        return;
      }
      if (!onLoginPage) router.replace(LOGIN_PATH);
    }
    if (state.status === "signed-in") {
      setSessionLost(false);
      if (onLoginPage) router.replace("/");
    }
  }, [state.status, onLoginPage, router]);

  if (sessionLost && state.status !== "signed-in") {
    return (
      <AuthScreen
        icon={<WarningCircle size={28} weight="duotone" className="text-warning" />}
        title="Session did not carry over"
        description="You signed in with Zoho, but the browser did not pass that session on to MarineLink. Allowing third-party cookies for this site usually resolves it."
      >
        <div className="flex flex-wrap justify-center gap-2">
          <Button
            size="lg"
            className="h-10"
            onClick={() => {
              setSessionLost(false);
              void refresh();
            }}
          >
            Check again
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="h-10"
            onClick={() => {
              setSessionLost(false);
              router.replace(LOGIN_PATH);
            }}
          >
            Back to sign in
          </Button>
        </div>
      </AuthScreen>
    );
  }

  if (onLoginPage) return <>{children}</>;

  switch (state.status) {
    case "loading":
    case "signed-out":
      return <AuthScreen />;

    case "unavailable":
      return (
        <AuthScreen
          icon={<WarningCircle size={28} weight="duotone" className="text-warning" />}
          title="MarineLink is unavailable"
          description={state.message}
        >
          <Button size="lg" className="h-10" onClick={() => window.location.reload()}>
            Try again
          </Button>
        </AuthScreen>
      );

    case "no-access":
      return (
        <AuthScreen
          icon={<Lock size={28} weight="duotone" className="text-muted-foreground" />}
          title={state.reason === "disabled" ? "Account disabled" : "No access yet"}
          description={
            state.reason === "disabled"
              ? `Access for ${state.email} has been turned off. Contact your Marine Travelift administrator to restore it.`
              : `${state.email} is signed in but has not been granted MarineLink access. Your Marine Travelift administrator can add you.`
          }
        >
          <Button variant="outline" size="lg" className="h-10" onClick={() => void signOut()}>
            Sign out
          </Button>
        </AuthScreen>
      );

    case "signed-in":
      return <AppShell>{children}</AppShell>;
  }
}
