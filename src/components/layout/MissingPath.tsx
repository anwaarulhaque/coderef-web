"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};

/** The URL the visitor asked for. Read on the client: the static 404.html is shared by every missing URL. */
export function MissingPath() {
  const path = useSyncExternalStore(
    noop,
    () => decodeURI(window.location.pathname),
    () => "",
  );
  return <span className="break-all text-foreground">{path || "/this-page"}</span>;
}
