"use client";

import Link from "next/link";
import { SignIn, SignOut, UserCircle } from "@phosphor-icons/react/dist/ssr";
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

export function UserMenu() {
  const { user } = useCurrentUser();
  const { state, signOut } = useAuth();
  const authenticated = state.status === "ready" && state.authenticated;

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
          aria-label={`Account menu for ${user.name}`}
        >
          <EntityAvatar name={user.name} size="sm" className="rounded-full" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
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
