import { cn } from "@/lib/utils";

/** Content column. Capped so long lines stay readable on wide displays. */
export function PageContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-[86rem] px-4 pt-6 pb-28 sm:px-6 lg:pb-12", className)}>
      {children}
    </div>
  );
}
