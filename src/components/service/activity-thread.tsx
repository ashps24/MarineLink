"use client";

import * as React from "react";
import {
  ArrowsLeftRight,
  ChatText,
  FlagBanner,
  PaperPlaneTilt,
  UsersThree,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ListSkeleton } from "@/components/shared/loading-skeleton";
import { useServiceEvents, useServiceRequestActions } from "@/hooks/use-service-requests";
import { serviceStatusConfig } from "@/lib/constants/status";
import { formatDateTime, formatRelativeTime } from "@/lib/formatting/date";
import type { ServiceEvent } from "@/lib/services";
import type { ServiceRequest, ServiceRequestStatus } from "@/types";
import { cn } from "@/lib/utils";

const ROLE_LABELS: Record<string, string> = {
  internal: "Marine Travelift",
  dealer: "Dealer",
  customer: "Customer",
};

function statusLabel(value: string | null): string {
  if (!value) return "—";
  return serviceStatusConfig[value as ServiceRequestStatus]?.label ?? value;
}

function describe(event: ServiceEvent): { icon: Icon; headline: string } {
  if (event.eventKind === "assignment") {
    return {
      icon: UsersThree,
      headline: `Reassigned from ${event.fromValue ?? "—"} to ${event.toValue ?? "—"}`,
    };
  }
  if (event.eventKind === "comment") {
    return { icon: ChatText, headline: "Commented" };
  }
  return {
    icon: ArrowsLeftRight,
    headline: `${statusLabel(event.fromValue)} → ${statusLabel(event.toValue)}`,
  };
}

function Entry({
  icon: EntryIcon,
  headline,
  actor,
  at,
  note,
  muted,
}: {
  icon: Icon;
  headline: string;
  actor?: string;
  at: string;
  note?: string | null;
  muted?: boolean;
}) {
  return (
    <li className="flex gap-3">
      <span
        aria-hidden="true"
        className={cn(
          "mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-lg",
          muted ? "bg-muted text-muted-foreground" : "bg-ocean/10 text-ocean",
        )}
      >
        <EntryIcon size={14} weight="bold" />
      </span>
      <div className="min-w-0 flex-1 pb-4">
        <p className="text-sm font-medium">{headline}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {actor ? `${actor} · ` : ""}
          <time dateTime={at} title={formatDateTime(at)}>
            {formatRelativeTime(at)}
          </time>
        </p>
        {note ? (
          <p className="mt-2 rounded-lg bg-muted/60 px-3 py-2 text-sm text-foreground">{note}</p>
        ) : null}
      </div>
    </li>
  );
}

/**
 * One visible history per request, so the customer, the dealer and internal
 * staff are reading the same thing. Status moves, handovers and comments are
 * interleaved rather than separated, because what matters is the order things
 * happened in, not which kind of thing each one was.
 */
export function ActivityThread({ request }: { request: ServiceRequest }) {
  const { data: events, isPending } = useServiceEvents(request.id);
  const { comment } = useServiceRequestActions();
  const [draft, setDraft] = React.useState("");

  async function onPost() {
    const note = draft.trim();
    if (!note) return;
    try {
      await comment.mutateAsync({ requestId: request.id, note });
      setDraft("");
    } catch (error) {
      toast.error("Could not post the comment", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  }

  return (
    <div className="space-y-4">
      {isPending ? (
        <ListSkeleton count={2} label="Loading activity" />
      ) : (
        <ul className="space-y-0">
          <Entry
            icon={FlagBanner}
            headline="Request raised"
            at={request.createdAt}
            note={null}
            muted
          />
          {(events ?? []).map((event) => {
            const { icon, headline } = describe(event);
            const actorRole = event.actorRole ? ROLE_LABELS[event.actorRole] : undefined;
            return (
              <Entry
                key={event.id}
                icon={icon}
                headline={headline}
                actor={
                  event.actorName
                    ? actorRole
                      ? `${event.actorName} (${actorRole})`
                      : event.actorName
                    : undefined
                }
                at={event.occurredAt}
                note={event.note}
              />
            );
          })}
        </ul>
      )}

      <div className="space-y-2 border-t border-border pt-4">
        <label htmlFor="comment" className="sr-only">
          Add a comment
        </label>
        <textarea
          id="comment"
          rows={2}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Add an update everyone on this request can see…"
          className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        />
        <Button
          size="sm"
          variant="outline"
          onClick={() => void onPost()}
          disabled={!draft.trim() || comment.isPending}
        >
          <PaperPlaneTilt aria-hidden="true" />
          {comment.isPending ? "Posting…" : "Post comment"}
        </Button>
      </div>
    </div>
  );
}
