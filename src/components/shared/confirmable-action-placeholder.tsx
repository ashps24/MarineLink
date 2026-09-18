"use client";

import * as React from "react";
import { Lock } from "@phosphor-icons/react/dist/ssr";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * A visible seat for an action that a later phase will implement.
 *
 * It deliberately performs nothing and says so. Faking a successful write
 * would misrepresent what this build does, so the control explains that the
 * capability arrives with the backend instead.
 */
export function ConfirmableActionPlaceholder({
  label,
  description,
  icon,
  variant = "outline",
  size = "sm",
}: {
  label: string;
  description: string;
  icon?: React.ReactNode;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant={variant}
          size={size}
          onClick={() =>
            toast("Not available in this build", {
              description,
              icon: <Lock size={16} aria-hidden="true" />,
            })
          }
        >
          {icon}
          {label}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p className="max-w-56 text-xs">{description}</p>
      </TooltipContent>
    </Tooltip>
  );
}
