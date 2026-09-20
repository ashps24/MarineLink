"use client";

import { BrandLockup } from "./brand-mark";
import { GlobalSearch } from "@/components/search/global-search";
import { NotificationsMenu } from "@/components/notifications/notifications-menu";
import { UserMenu } from "@/components/navigation/user-menu";
import { ThemeToggle } from "@/components/navigation/theme-toggle";

/** Sticky application header. */
export function TopBar() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="flex h-16 items-center gap-2 px-4 sm:px-6">
        <div className="lg:hidden">
          <BrandLockup />
        </div>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <GlobalSearch />
          <NotificationsMenu />
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
