import { cn } from "@/lib/utils";

export interface KeyValueEntry {
  label: string;
  value: React.ReactNode;
  /** Renders the value in a monospaced face — for serials and references. */
  mono?: boolean;
}

export function KeyValueList({
  entries,
  columns = 1,
  className,
}: {
  entries: KeyValueEntry[];
  columns?: 1 | 2;
  className?: string;
}) {
  return (
    <dl
      className={cn(
        "grid gap-x-6 gap-y-4",
        columns === 2 ? "sm:grid-cols-2" : "grid-cols-1",
        className,
      )}
    >
      {entries.map((entry) => (
        <div key={entry.label} className="min-w-0">
          <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {entry.label}
          </dt>
          <dd
            className={cn(
              "mt-1 text-sm break-words text-foreground",
              entry.mono && "font-mono text-[0.8125rem] tracking-tight",
            )}
          >
            {entry.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
