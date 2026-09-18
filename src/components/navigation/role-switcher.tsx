"use client";

import { useRouter } from "next/navigation";
import { CaretUpDown, Check, FlaskIcon } from "@phosphor-icons/react/dist/ssr";
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
import { useRoleStore } from "@/stores/role-store";
import { useCurrentUser } from "@/hooks/use-current-user";
import { listMockUsers } from "@/lib/mock-api";
import type { UserRole } from "@/types";
import { cn } from "@/lib/utils";

const roleLabels: Record<UserRole, string> = {
  internal: "Internal staff",
  dealer: "Dealer user",
  customer: "Customer user",
};

/**
 * Demo-only identity switch. It swaps which mock user the UI renders for — it
 * is not a login, and the UI says so wherever it appears.
 */
export function RoleSwitcher({ className }: { className?: string }) {
  const setRole = useRoleStore((state) => state.setRole);
  const { user } = useCurrentUser();
  const router = useRouter();
  const users = listMockUsers();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="lg"
          className={cn("h-10 max-w-[13rem] justify-between gap-2", className)}
        >
          <span className="flex min-w-0 items-center gap-2">
            <FlaskIcon size={14} aria-hidden="true" className="shrink-0 text-ocean" />
            <span className="truncate text-xs font-medium">{roleLabels[user.role]}</span>
          </span>
          <CaretUpDown size={14} aria-hidden="true" className="shrink-0 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="flex items-center gap-2 text-xs">
          <FlaskIcon size={14} aria-hidden="true" className="text-ocean" />
          Demo role — not real authentication
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {users.map((mockUser) => (
          <DropdownMenuItem
            key={mockUser.id}
            className="items-start gap-3 py-2.5"
            onSelect={() => {
              setRole(mockUser.role);
              router.push("/");
              toast.success(`Now viewing as ${roleLabels[mockUser.role].toLowerCase()}`, {
                description: `${mockUser.name} · ${mockUser.organizationName}`,
              });
            }}
          >
            <span className="mt-0.5 size-4 shrink-0">
              {user.role === mockUser.role ? (
                <Check size={16} aria-hidden="true" className="text-ocean" />
              ) : null}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">{roleLabels[mockUser.role]}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {mockUser.name} · {mockUser.organizationName}
              </span>
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
