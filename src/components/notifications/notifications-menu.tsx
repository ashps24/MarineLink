"use client";

import * as React from "react";
import Link from "next/link";
import { Bell } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/shared/status-badge";
import { useServiceRequests } from "@/hooks/use-service-requests";
import { formatRelativeTime } from "@/lib/formatting/date";
import { daysSince } from "@/lib/constants/time";
import { cn } from "@/lib/utils";

/** How far back the bell looks, and what still counts as unseen. */
const ACTIVITY_WINDOW_DAYS = 14;
const UNREAD_WINDOW_DAYS = 3;
const MAX_ITEMS = 8;

/**
 * Status movement on the requests this user can see. There is no separate
 * notification store — a request changing status *is* the event, so this
 * reads the same scoped list every other screen does and stays correct
 * without anything extra to keep in sync.
 */
export function NotificationsMenu() {
  const { data: requests } = useServiceRequests();

  const items = React.useMemo(() => {
    return (requests ?? [])
      .filter((request) => daysSince(request.statusChangedAt) <= ACTIVITY_WINDOW_DAYS)
      .sort((a, b) => Date.parse(b.statusChangedAt) - Date.parse(a.statusChangedAt))
      .slice(0, MAX_ITEMS);
  }, [requests]);

  const unread = items.filter((item) => daysSince(item.statusChangedAt) <= UNREAD_WINDOW_DAYS).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-lg"
          className="relative"
          aria-label={unread > 0 ? `Notifications, ${unread} recent` : "Notifications"}
        >
          <Bell size={18} aria-hidden="true" />
          {unread > 0 ? (
            <span
              aria-hidden="true"
              className="absolute top-1.5 right-1.5 size-2 rounded-full bg-ocean ring-2 ring-background"
            />
          ) : null}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="text-xs">
          Recent activity
          <span className="mt-0.5 block font-normal text-muted-foreground">
            Status changes in the last {ACTIVITY_WINDOW_DAYS} days
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {items.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">
            Nothing has changed recently.
          </p>
        ) : (
          items.map((request) => (
            <DropdownMenuItem key={request.id} asChild className="items-start gap-3 py-2.5">
              <Link prefetch={false} href={`/service/view/?id=${request.id}`}>
                <span
                  aria-hidden="true"
                  className={cn(
                    "mt-1.5 size-1.5 shrink-0 rounded-full",
                    daysSince(request.statusChangedAt) <= UNREAD_WINDOW_DAYS
                      ? "bg-ocean"
                      : "bg-muted-foreground/30",
                  )}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{request.subject}</span>
                  <span className="mt-0.5 flex items-center gap-2">
                    <StatusBadge kind="service" status={request.status} />
                    <span className="truncate text-xs text-muted-foreground">
                      {formatRelativeTime(request.statusChangedAt)}
                    </span>
                  </span>
                </span>
              </Link>
            </DropdownMenuItem>
          ))
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link prefetch={false} href="/service">
            View all service requests
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
