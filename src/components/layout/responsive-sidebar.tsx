"use client";

import { CaretLeft, CaretRight } from "@phosphor-icons/react/dist/ssr";
import { BrandLockup } from "./brand-mark";
import { SidebarNav } from "@/components/navigation/nav-links";
import { useUiStore } from "@/stores/ui-store";
import { useCurrentUser } from "@/hooks/use-current-user";
import { cn } from "@/lib/utils";

const roleLabels = {
  internal: "Internal",
  dealer: "Dealer",
  customer: "Customer",
} as const;

/**
 * Desktop navigation rail. Collapses to an icon rail; the collapsed preference
 * is remembered per browser.
 */
export function ResponsiveSidebar() {
  const collapsed = useUiStore((state) => state.sidebarCollapsed);
  const toggle = useUiStore((state) => state.toggleSidebar);
  const { user } = useCurrentUser();

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-svh shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 lg:flex",
        collapsed ? "w-[4.5rem]" : "w-64",
      )}
    >
      <div className={cn("flex h-16 items-center px-4", collapsed && "justify-center px-0")}>
        <BrandLockup collapsed={collapsed} />
      </div>

      <div className={cn("px-3 pb-2", collapsed && "px-2")}>
        <SidebarNav
          role={user.role}
          organizationId={user.organizationId}
          collapsed={collapsed}
        />
      </div>

      <div className="mt-auto space-y-3 p-3">
        {!collapsed ? (
          <div className="rounded-xl bg-sidebar-accent/70 p-3">
            <p className="text-[0.6875rem] font-medium tracking-wide text-sidebar-foreground/55 uppercase">
              Signed in as
            </p>
            <p className="mt-1.5 truncate text-sm font-medium text-sidebar-foreground">
              {user.name}
            </p>
            <p className="truncate text-xs text-sidebar-foreground/60">{user.organizationName}</p>
            <span className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-sidebar-primary/15 px-2 py-0.5 text-[0.6875rem] font-medium text-sidebar-primary">
              {roleLabels[user.role]} view
            </span>
          </div>
        ) : null}

        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-sidebar-foreground/60 transition-colors",
            "hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none",
            collapsed && "justify-center px-0",
          )}
        >
          {collapsed ? (
            <CaretRight size={16} aria-hidden="true" />
          ) : (
            <>
              <CaretLeft size={16} aria-hidden="true" />
              Collapse
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
