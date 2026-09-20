import Link from "next/link";
import { Lock } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { EmptyState } from "./empty-state";

/**
 * Shown when the signed-in user's role has no business seeing a screen or
 * record. Reads are scoped before they reach a screen, so this is the message
 * for a record that scoping removed rather than a second access check.
 */
export function RestrictedState({
  title = "Not available for this role",
  description = "This area is limited to Marine Travelift internal staff.",
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
          <Link prefetch={false} href="/">Back to dashboard</Link>
        </Button>
      }
    />
  );
}
