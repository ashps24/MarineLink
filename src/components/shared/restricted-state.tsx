import Link from "next/link";
import { Lock } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { EmptyState } from "./empty-state";

/**
 * Shown when the current role has no business seeing a screen or record.
 *
 * This is a UI boundary, not a security control — it models what a correctly
 * scoped backend would return once real authorization exists.
 */
export function RestrictedState({
  title = "Not available for this role",
  description = "This area is limited to Marine Travelift internal staff. Switch the demo role to explore it.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <EmptyState
      icon={Lock}
      title={title}
      description={description}
      action={
        <Button asChild variant="outline" size="lg" className="h-10">
          <Link href="/">Back to dashboard</Link>
        </Button>
      }
    />
  );
}
