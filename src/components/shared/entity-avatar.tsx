import { cn } from "@/lib/utils";
import { initials } from "@/lib/formatting/text";

const sizeClasses = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-14 text-base",
} as const;

/**
 * A deterministic monogram for an organization or person. Avoids stock avatar
 * imagery, which reads as placeholder content in an enterprise product.
 */
export function EntityAvatar({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: keyof typeof sizeClasses;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/90 to-ocean/80 font-semibold text-primary-foreground shadow-sm dark:text-background",
        sizeClasses[size],
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
