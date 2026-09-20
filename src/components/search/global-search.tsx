"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  MagnifyingGlass,
  Buildings,
  UsersThree,
  Wrench,
  ClipboardText,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useDealers } from "@/hooks/use-dealers";
import { useCustomers } from "@/hooks/use-customers";
import { useEquipmentList } from "@/hooks/use-equipment";
import { useServiceRequests } from "@/hooks/use-service-requests";
import { cn } from "@/lib/utils";

const MAX_PER_GROUP = 4;

interface Hit {
  key: string;
  href: string;
  title: string;
  subtitle: string;
  group: string;
  icon: Icon;
}

function matches(query: string, ...fields: (string | undefined)[]): boolean {
  const needle = query.trim().toLowerCase();
  return fields.some((field) => field?.toLowerCase().includes(needle));
}

/**
 * Searches everything the signed-in user can see, from the same scoped reads
 * the list screens use — so a dealer never matches another dealer's records,
 * and an opened palette costs no extra fetch once those lists are cached.
 */
function useHits(query: string): Hit[] {
  const { data: dealers } = useDealers();
  const { data: customers } = useCustomers();
  const { data: equipment } = useEquipmentList();
  const { data: requests } = useServiceRequests();

  return React.useMemo(() => {
    if (query.trim().length < 2) return [];

    const hits: Hit[] = [];

    for (const dealer of dealers ?? []) {
      if (!matches(query, dealer.name, dealer.region, dealer.primaryContactName)) continue;
      hits.push({
        key: `dealer-${dealer.id}`,
        href: `/dealers/view/?id=${dealer.id}`,
        title: dealer.name,
        subtitle: dealer.region,
        group: "Dealers",
        icon: Buildings,
      });
    }

    for (const customer of customers ?? []) {
      if (!matches(query, customer.name, customer.primaryContactName, customer.organizationName))
        continue;
      hits.push({
        key: `customer-${customer.id}`,
        href: `/customers/view/?id=${customer.id}`,
        title: customer.name,
        subtitle: customer.primaryContactName,
        group: "Customers",
        icon: UsersThree,
      });
    }

    for (const unit of equipment ?? []) {
      if (!matches(query, unit.name, unit.model, unit.serialNumber, unit.location)) continue;
      hits.push({
        key: `equipment-${unit.id}`,
        href: `/equipment/view/?id=${unit.id}`,
        title: unit.name,
        subtitle: `${unit.model} · ${unit.serialNumber}`,
        group: "Equipment",
        icon: Wrench,
      });
    }

    for (const request of requests ?? []) {
      if (!matches(query, request.referenceNumber, request.subject, request.assignedTeam)) continue;
      hits.push({
        key: `request-${request.id}`,
        href: `/service/view/?id=${request.id}`,
        title: request.subject,
        subtitle: `${request.referenceNumber} · ${request.assignedTeam}`,
        group: "Service requests",
        icon: ClipboardText,
      });
    }

    const perGroup = new Map<string, number>();
    return hits.filter((hit) => {
      const used = perGroup.get(hit.group) ?? 0;
      if (used >= MAX_PER_GROUP) return false;
      perGroup.set(hit.group, used + 1);
      return true;
    });
  }, [query, dealers, customers, equipment, requests]);
}

function SearchPanel({ onNavigate }: { onNavigate: () => void }) {
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);
  const hits = useHits(query);
  const router = useRouter();

  React.useEffect(() => setActive(0), [query]);

  const go = React.useCallback(
    (hit: Hit | undefined) => {
      if (!hit) return;
      onNavigate();
      router.push(hit.href);
    },
    [onNavigate, router],
  );

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => Math.min(index + 1, hits.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      go(hits[active]);
    }
  }

  let rendered = -1;
  let lastGroup: string | null = null;

  return (
    <div>
      <div className="flex items-center gap-3 border-b border-border px-1 pb-3">
        <MagnifyingGlass size={18} aria-hidden="true" className="shrink-0 text-muted-foreground" />
        <input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Search dealers, customers, equipment, requests"
          aria-label="Search MarineLink"
          className="h-8 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div className="max-h-80 overflow-y-auto pt-2">
        {query.trim().length < 2 ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">
            Type at least two characters to search.
          </p>
        ) : hits.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">
            Nothing matches “{query.trim()}”.
          </p>
        ) : (
          hits.map((hit) => {
            rendered += 1;
            const index = rendered;
            const showGroup = hit.group !== lastGroup;
            lastGroup = hit.group;
            const HitIcon = hit.icon;

            return (
              <React.Fragment key={hit.key}>
                {showGroup ? (
                  <p className="px-2 pt-3 pb-1 text-[0.6875rem] font-medium tracking-wide text-muted-foreground uppercase">
                    {hit.group}
                  </p>
                ) : null}
                <button
                  type="button"
                  onMouseEnter={() => setActive(index)}
                  onClick={() => go(hit)}
                  aria-current={index === active ? "true" : undefined}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors",
                    index === active ? "bg-accent" : "hover:bg-accent/60",
                  )}
                >
                  <HitIcon size={16} aria-hidden="true" className="shrink-0 text-ocean" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{hit.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {hit.subtitle}
                    </span>
                  </span>
                </button>
              </React.Fragment>
            );
          })
        )}
      </div>
    </div>
  );
}

export function GlobalSearch() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((value) => !value);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <Button
        variant="outline"
        size="lg"
        onClick={() => setOpen(true)}
        className="hidden h-10 min-w-56 justify-start gap-2 text-muted-foreground md:flex"
      >
        <MagnifyingGlass size={16} aria-hidden="true" />
        <span className="text-sm font-normal">Search MarineLink</span>
        <kbd className="ml-auto rounded border border-border px-1.5 py-0.5 font-sans text-[0.625rem] text-muted-foreground">
          ⌘K
        </kbd>
      </Button>

      <Button
        variant="ghost"
        size="icon-lg"
        aria-label="Search"
        onClick={() => setOpen(true)}
        className="md:hidden"
      >
        <MagnifyingGlass size={18} aria-hidden="true" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showCloseButton={false} className="top-24 translate-y-0 sm:max-w-xl">
          <DialogTitle className="sr-only">Search MarineLink</DialogTitle>
          {/* Mounted only while open so the scoped reads it needs are not
            * started on every page just to power a closed dialog. */}
          {open ? <SearchPanel onNavigate={() => setOpen(false)} /> : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
