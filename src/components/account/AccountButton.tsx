"use client";

import Link from "next/link";
import { openSignIn, useAccount } from "@/lib/account/client";
import { SignInDialog } from "./SignInDialog";

/** Header control: "Sign in" or a Dashboard link, plus the global sign-in dialog. */
export function AccountButton() {
  const { status, me } = useAccount();
  const user = me?.user;

  return (
    <>
      <SignInDialog />
      {status === "loading" ? (
        <span aria-hidden className="h-9 w-20 animate-pulse rounded-lg bg-chip" />
      ) : !user ? (
        <div className="flex items-center gap-2">
          <Link href="/pricing/" className="hidden rounded-lg px-2.5 py-1.5 text-sm text-muted hover:text-foreground sm:inline">
            Pricing
          </Link>
          <button type="button" onClick={() => openSignIn()} className="h-9 rounded-lg bg-accent px-3 text-sm font-medium text-surface hover:opacity-90">
            Sign in
          </button>
        </div>
      ) : (
        <Link href="/account/" className="flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium hover:border-accent">
          Dashboard
          {user.pro && <span className="rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">Pro</span>}
        </Link>
      )}
    </>
  );
}
