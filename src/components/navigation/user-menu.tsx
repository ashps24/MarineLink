"use client";

import Link from "next/link";
import { Check, SignIn, SignOut, UserCircle } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EntityAvatar } from "@/components/shared/entity-avatar";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useAuth } from "@/providers/auth-provider";
import type { UserRole } from "@/types";

const ROLE_LABELS: Record<UserRole, string> = {
  internal: "Internal staff",
  dealer: "Dealer",
  customer: "Customer",
};

/**
 * Who you are, and — when the app is open rather than signed into — which
 * provisioned account you are viewing as. Switching lives here rather than in
 * its own control so it is reachable at every width, phones included.
 */
export function UserMenu() {
  const { user } = useCurrentUser();
  const { state, signOut, setProfile } = useAuth();

  const authenticated = state.status === "ready" && state.authenticated;
  const profiles = state.status === "ready" && !authenticated ? state.profiles : [];

  const profileHref =
    user.role === "dealer"
      ? `/dealers/view/?id=${user.organizationId}`
      : user.role === "customer"
        ? `/customers/view/?id=${user.organizationId}`
        : null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-lg"
          className="rounded-full"
          aria-label={`Account menu for ${user.name}, ${ROLE_LABELS[user.role]}`}
        >
          <EntityAvatar name={user.name} size="sm" className="rounded-full" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="py-2.5">
          <span className="block text-sm font-medium">{user.name}</span>
          <span className="block truncate text-xs font-normal text-muted-foreground">
            {user.email}
          </span>
          <span className="mt-1.5 block truncate text-xs font-normal text-muted-foreground">
            {user.title ? `${user.title} · ` : ""}
            {user.organizationName}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {profileHref ? (
          <>
            <DropdownMenuItem asChild>
              <Link prefetch={false} href={profileHref}>
                <UserCircle size={16} aria-hidden="true" />
                My organization profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        ) : null}

        {profiles.length > 1 ? (
          <>
            <DropdownMenuLabel className="text-xs">
              Viewing as
              <span className="mt-0.5 block font-normal text-muted-foreground">
                Each account sees only its own records
              </span>
            </DropdownMenuLabel>
            {profiles.map((profile) => (
              <DropdownMenuItem
                key={profile.id}
                className="items-start gap-3 py-2.5"
                onSelect={() => setProfile(profile.id)}
              >
                <span className="mt-0.5 size-4 shrink-0">
                  {profile.id === user.id ? (
                    <Check size={16} aria-hidden="true" className="text-ocean" />
                  ) : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{ROLE_LABELS[profile.role]}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {profile.name} · {profile.organizationName}
                  </span>
                </span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </>
        ) : null}

        {authenticated ? (
          <DropdownMenuItem onSelect={() => void signOut()}>
            <SignOut size={16} aria-hidden="true" />
            Sign out
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem asChild>
            <Link prefetch={false} href="/login/">
              <SignIn size={16} aria-hidden="true" />
              Sign in
            </Link>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
