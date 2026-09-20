import { Check, Circle, Clock } from "@phosphor-icons/react/dist/ssr";
import { serviceStatusConfig } from "@/lib/constants/status";
import type { ServiceRequestStatus } from "@/types";
import { cn } from "@/lib/utils";

/**
 * Progress indicator for a request.
 *
 * "Awaiting parts" is a hold on the in-progress step rather than a stage of
 * its own, so the track stays linear and easy to read.
 */
const TRACK: ServiceRequestStatus[] = [
  "new",
  "acknowledged",
  "in_progress",
  "resolved",
  "closed",
];

export function StatusTimeline({ status }: { status: ServiceRequestStatus }) {
  const waiting = status === "waiting";
  const effective: ServiceRequestStatus = waiting ? "in_progress" : status;
  const currentIndex = TRACK.indexOf(effective);

  return (
    <ol className="space-y-0" role="list">
      {TRACK.map((step, index) => {
        const complete = index < currentIndex;
        const current = index === currentIndex;
        const held = current && waiting;
        const last = index === TRACK.length - 1;

        return (
          <li key={step} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "inline-flex size-6 shrink-0 items-center justify-center rounded-full ring-1 transition-colors",
                  complete && "bg-success/15 text-success ring-success/30",
                  current && !held && "bg-info/15 text-info ring-info/30",
                  held && "bg-warning/20 text-warning ring-warning/35",
                  !complete && !current && "bg-muted text-muted-foreground/50 ring-border",
                )}
              >
                {complete ? (
                  <Check size={12} weight="bold" aria-hidden="true" />
                ) : held ? (
                  <Clock size={12} weight="fill" aria-hidden="true" />
                ) : (
                  <Circle
                    size={8}
                    weight={current ? "fill" : "regular"}
                    aria-hidden="true"
                  />
                )}
              </span>
              {!last ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    "my-1 w-px flex-1",
                    complete ? "bg-success/30" : "bg-border",
                  )}
                />
              ) : null}
            </div>

            <div className={cn("pb-5", last && "pb-0")}>
              <p
                className={cn(
                  "text-sm font-medium",
                  current ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {serviceStatusConfig[step].label}
                {current ? <span className="sr-only"> — current status</span> : null}
              </p>
              {held ? (
                <p className="mt-0.5 text-xs text-warning">
                  On hold — {serviceStatusConfig.waiting.label.toLowerCase()}
                </p>
              ) : null}
              {current && !held ? (
                <p className="mt-0.5 text-xs text-muted-foreground">Current stage</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
