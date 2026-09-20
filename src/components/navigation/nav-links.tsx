"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItemsForRole } from "@/lib/constants/navigation";
import type { UserRole } from "@/types";
import { cn } from "@/lib/utils";

/**
 * A nav destination is current when the path is it, or sits beneath it.
 * `href` may carry a "?id=..." query string (every detail-view link does,
 * since those are query-param routes, not dynamic path segments) — only the
 * path portion is compared, since `usePathname()` never includes the query.
 */
export function isActivePath(pathname: string, href: string): boolean {
  const path = href.split("?")[0];
  if (path === "/") return pathname === "/";
  return pathname === path || pathname.startsWith(`${path}/`);
}

/**
 * Resolves the `/dealers/me` and `/customers/me` aliases to the signed-in
 * organization's real record, as a query-param route — detail views are
 * `/<resource>/view/?id=...`, not a dynamic path segment per id, since a
 * real record's id is a database ROWID that cannot be enumerated at build
 * time the way the old per-id static routes assumed.
 */
export function resolveNavHref(href: string, organizationId: string): string {
  const match = href.match(/^\/(\w+)\/me$/);
  if (!match) return href;
  return `/${match[1]}/view/?id=${organizationId}`;
}

export function SidebarNav({
  role,
  organizationId,
  collapsed,
  onNavigate,
}: {
  role: UserRole;
  organizationId: string;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const items = navItemsForRole(role);

  return (
    <nav aria-label="Main" className="flex flex-col gap-1">
      {items.map((item) => {
        const href = resolveNavHref(item.href, organizationId);
        const active = isActivePath(pathname, href);
        const ItemIcon = item.icon;

        return (
          <Link prefetch={false}
            key={`${item.label}-${item.href}`}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            title={collapsed ? item.label : undefined}
            className={cn(
              "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              "focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              collapsed && "justify-center px-0",
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "absolute left-0 h-5 w-0.5 rounded-r-full bg-sidebar-primary transition-opacity",
                active ? "opacity-100" : "opacity-0",
                collapsed && "hidden",
              )}
            />
            <ItemIcon
              size={18}
              aria-hidden="true"
              weight={active ? "fill" : "regular"}
              className="shrink-0"
            />
            {!collapsed ? <span className="truncate">{item.label}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}
