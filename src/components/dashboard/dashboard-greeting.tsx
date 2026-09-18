"use client";

import * as React from "react";
import { FlaskIcon } from "@phosphor-icons/react/dist/ssr";
import { PageHeader } from "@/components/layout/page-header";
import { greetingForHour } from "@/lib/formatting/text";
import { formatGreetingDate } from "@/lib/formatting/date";
import type { User } from "@/types";

const roleLabels: Record<User["role"], string> = {
  internal: "Internal view",
  dealer: "Dealer view",
  customer: "Customer view",
};

export function DashboardGreeting({
  user,
  description,
  actions,
}: {
  user: User;
  description: string;
  actions?: React.ReactNode;
}) {
  // Greeting and date are time-dependent, so they are computed after mount to
  // keep the server and client markup identical.
  const [now, setNow] = React.useState<{ greeting: string; date: string } | null>(null);
  React.useEffect(() => {
    setNow({ greeting: greetingForHour(), date: formatGreetingDate() });
  }, []);

  const firstName = user.name.split(" ")[0];

  return (
    <PageHeader
      eyebrow={
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-ocean/10 px-2.5 py-1 text-xs font-medium text-ocean">
            <FlaskIcon size={12} aria-hidden="true" />
            {roleLabels[user.role]}
          </span>
          <span className="text-xs text-muted-foreground">
            {now?.date ?? " "}
          </span>
        </div>
      }
      title={now ? `${now.greeting}, ${firstName}` : `Welcome back, ${firstName}`}
      description={description}
      actions={actions}
    />
  );
}
