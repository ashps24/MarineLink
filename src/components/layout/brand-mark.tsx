import { cn } from "@/lib/utils";

/**
 * MarineLink monogram — two linked hull profiles. Inline SVG so it inherits
 * colour from its container and needs no network request.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-ocean to-primary text-white shadow-sm",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true">
        <path
          d="M3 15.5c1.8 0 1.8 1.4 3.6 1.4s1.8-1.4 3.6-1.4 1.8 1.4 3.6 1.4 1.8-1.4 3.6-1.4 1.8 1.4 3.6 1.4"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5.5 12.2V6.4a1 1 0 0 1 1-1h5.2M5.5 12.2h13M11.7 5.4l5.6 6.8"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function BrandLockup({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <BrandMark />
      {!collapsed ? (
        <span className="flex min-w-0 flex-col leading-none">
          <span className="font-heading text-[0.9375rem] font-semibold tracking-tight">
            MarineLink
          </span>
          <span className="mt-1 truncate text-[0.6875rem] text-sidebar-foreground/55">
            Marine Travelift
          </span>
        </span>
      ) : null}
    </span>
  );
}
