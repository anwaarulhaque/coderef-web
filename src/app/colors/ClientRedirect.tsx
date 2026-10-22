"use client";

import { useEffect } from "react";

/** Replaces the current URL with `to`, carrying over the query string and hash. */
export function ClientRedirect({ to }: { to: string }) {
  useEffect(() => {
    window.location.replace(`${to}${window.location.search}${window.location.hash}`);
  }, [to]);
  return null;
}
