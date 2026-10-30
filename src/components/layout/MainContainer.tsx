"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// App-style pages that use the whole browser width (they manage their own padding).
const FULL_WIDTH = [
  "/colors",
  "/realtime-colors",
  "/json-formatter",
  "/try-it",
  "/html-editor",
  "/css-editor",
  "/javascript-compiler",
  "/rest-api-client",
];

export const isFullWidth = (pathname: string) => FULL_WIDTH.some((p) => pathname === p || pathname.startsWith(`${p}/`));

export function MainContainer({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const full = isFullWidth(pathname);
  return <main className={full ? "w-full flex-1" : "mx-auto w-full max-w-7xl flex-1 px-4 pt-8 pb-4"}>{children}</main>;
}
