"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Keeps list filter state in the URL so a filtered view can be linked and
 * survives a refresh. Values equal to `all` or empty are dropped from the query
 * string to keep URLs clean.
 */
export function useFilterParams<T extends Record<string, string>>(defaults: T) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const values = React.useMemo(() => {
    const next = { ...defaults };
    for (const key of Object.keys(defaults) as (keyof T)[]) {
      const fromUrl = searchParams.get(key as string);
      if (fromUrl !== null) next[key] = fromUrl as T[keyof T];
    }
    return next;
  }, [searchParams, defaults]);

  const setValue = React.useCallback(
    (key: keyof T, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (!value || value === "all") {
        params.delete(key as string);
      } else {
        params.set(key as string, value);
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const reset = React.useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [pathname, router]);

  const isFiltered = React.useMemo(
    () =>
      (Object.keys(defaults) as (keyof T)[]).some(
        (key) => values[key] !== defaults[key],
      ),
    [values, defaults],
  );

  return { values, setValue, reset, isFiltered };
}
