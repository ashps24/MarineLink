"use client";

import Link from "next/link";
import { SignOut, UserCircle, Gear } from "@phosphor-icons/react/dist/ssr";
import { toast } from "sonner";
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

export function UserMenu() {
  const { user } = useCurrentUser();

  const profileHref =
    user.role === "dealer"
      ? `/dealers/${user.organizationId}`
      : user.role === "customer"
        ? `/customers/${user.organizationId}`
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
            {user.title} · {user.organizationName}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {profileHref ? (
          <DropdownMenuItem asChild>
            <Link href={profileHref}>
              <UserCircle size={16} aria-hidden="true" />
              My organization profile
            </Link>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem
          onSelect={() =>
            toast("Preferences arrive with the backend", {
              description: "Account settings need a real session to write to.",
            })
          }
        >
          <Gear size={16} aria-hidden="true" />
          Preferences
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() =>
            toast("No session to sign out of", {
              description: "This build uses a demo role selector, not authentication.",
            })
          }
        >
          <SignOut size={16} aria-hidden="true" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
