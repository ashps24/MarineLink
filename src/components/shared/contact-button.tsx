import { PaperPlaneTilt } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";

/** Opens the viewer's mail client addressed to a record's primary contact. */
export function ContactButton({
  label,
  email,
  name,
  subject,
}: {
  label: string;
  email?: string;
  name?: string;
  subject: string;
}) {
  if (!email) return null;

  const href = `mailto:${email}?subject=${encodeURIComponent(subject)}`;

  return (
    <Button asChild variant="outline" size="sm">
      <a href={href} aria-label={name ? `${label} — ${name}` : label}>
        <PaperPlaneTilt aria-hidden="true" />
        {label}
      </a>
    </Button>
  );
}
