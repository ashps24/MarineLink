"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { ResponsiveSidebar } from "./responsive-sidebar";
import { MobileNav } from "./mobile-nav";
import { TopBar } from "./top-bar";
import { PageContainer } from "./page-container";
import { PageTransition } from "./page-transition";

/**
 * One shell for all three roles. What changes between them is the navigation
 * set and the landing dashboard — never the brand or the interaction language.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex min-h-svh bg-background">
        <ResponsiveSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main id="main" className="flex-1">
            <PageContainer>
              <PageTransition>{children}</PageTransition>
            </PageContainer>
          </main>
        </div>

        <MobileNav />
      </div>
    </TooltipProvider>
  );
}
