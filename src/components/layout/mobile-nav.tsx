"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItemsForRole } from "@/lib/constants/navigation";
import { isActivePath, resolveNavHref } from "@/components/navigation/nav-links";
import { useCurrentUser } from "@/hooks/use-current-user";
import { cn } from "@/lib/utils";

/**
 * Bottom tab bar for phones. Shows at most five destinations — beyond that the
 * targets get too small to hit reliably.
 */
export function MobileNav() {
  const pathname = usePathname();
  const { user } = useCurrentUser();
  const items = navItemsForRole(user.role).slice(0, 5);

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg lg:hidden"
    >
      <ul className="grid" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map((item) => {
          const href = resolveNavHref(item.href, user.organizationId);
          const active = isActivePath(pathname, href);
          const ItemIcon = item.icon;

          return (
            <li key={`${item.label}-${item.href}`}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 px-1 py-2 text-[0.6875rem] font-medium transition-colors",
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset",
                  active ? "text-ocean" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <ItemIcon size={20} aria-hidden="true" weight={active ? "fill" : "regular"} />
                <span className="max-w-full truncate">{item.label.replace(/^My /, "")}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
