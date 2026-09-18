"use client";

import { MagnifyingGlass, Bell, FlaskIcon } from "@phosphor-icons/react/dist/ssr";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { BrandLockup } from "./brand-mark";
import { RoleSwitcher } from "@/components/navigation/role-switcher";
import { UserMenu } from "@/components/navigation/user-menu";
import { ThemeToggle } from "@/components/navigation/theme-toggle";
import { DemoControls } from "@/components/navigation/demo-controls";

/**
 * Sticky application header. Search and notifications are deliberate
 * placeholders — both need services that do not exist in this phase.
 */
export function TopBar() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="flex h-16 items-center gap-2 px-4 sm:px-6">
        <div className="lg:hidden">
          <BrandLockup />
        </div>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <Button
            variant="outline"
            size="lg"
            className="hidden h-10 min-w-56 justify-start gap-2 text-muted-foreground md:flex"
            onClick={() =>
              toast("Global search is not wired up yet", {
                description: "It needs a search index over the Zoho-backed records.",
              })
            }
          >
            <MagnifyingGlass size={16} aria-hidden="true" />
            <span className="text-sm font-normal">Search MarineLink</span>
          </Button>

          <Button
            variant="ghost"
            size="icon-lg"
            className="md:hidden"
            aria-label="Search"
            onClick={() =>
              toast("Global search is not wired up yet", {
                description: "It needs a search index over the Zoho-backed records.",
              })
            }
          >
            <MagnifyingGlass size={18} aria-hidden="true" />
          </Button>

          <Button
            variant="ghost"
            size="icon-lg"
            aria-label="Notifications"
            onClick={() =>
              toast("No notification service in this build", {
                description: "Delivery arrives with the backend integration.",
              })
            }
          >
            <Bell size={18} aria-hidden="true" />
          </Button>

          <DemoControls />
          <ThemeToggle />

          <div className="hidden sm:block">
            <RoleSwitcher />
          </div>

          <UserMenu />
        </div>
      </div>

      {/* Demo-mode banner: this must never be mistaken for a real session. */}
      <div className="flex items-center gap-2 border-t border-ocean/20 bg-ocean/[0.06] px-4 py-1.5 text-[0.6875rem] text-muted-foreground sm:px-6">
        <FlaskIcon size={12} aria-hidden="true" className="shrink-0 text-ocean" />
        <span className="truncate">
          Demo mode — mock data and a role selector stand in for authentication.
        </span>
        <div className="ml-auto sm:hidden">
          <RoleSwitcher />
        </div>
      </div>
    </header>
  );
}
