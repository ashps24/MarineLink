import type { Icon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: IconComponent,
  title,
  description,
  action,
  className,
}: {
  icon?: Icon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 px-6 py-14 text-center",
        className,
      )}
    >
      {IconComponent ? (
        <span className="mb-4 inline-flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <IconComponent size={24} aria-hidden="true" />
        </span>
      ) : null}
      <p className="text-base font-semibold text-foreground">{title}</p>
      {description ? (
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
