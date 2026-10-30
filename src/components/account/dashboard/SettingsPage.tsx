"use client";

import { useState } from "react";
import { api, refreshAccount, signOut, useAccount } from "@/lib/account/client";
import { Alert, btn, card, fmtDate, useAction } from "./ui";

export function SettingsPage() {
  const { me } = useAccount();
  const user = me!.user!;
  const { busy, error, run } = useAction();
  const [confirm, setConfirm] = useState("");
  const subscribed = user.pro && user.plan !== "lifetime" && user.status !== "cancelled";

  return (
    <>
      {error && <Alert tone="error">{error}</Alert>}
      <section className={card} aria-labelledby="set-profile">
        <h2 id="set-profile" className="mb-3 text-lg font-semibold">Profile</h2>
        <dl className="divide-y divide-border text-sm">
          <div className="flex justify-between gap-4 py-2"><dt className="text-muted">Email</dt><dd className="font-medium">{user.email}</dd></div>
          <div className="flex justify-between gap-4 py-2"><dt className="text-muted">Verification</dt><dd className="font-medium text-emerald-700 dark:text-emerald-400">Verified</dd></div>
          <div className="flex justify-between gap-4 py-2"><dt className="text-muted">Sign-in method</dt><dd>Email code (no password)</dd></div>
          <div className="flex justify-between gap-4 py-2"><dt className="text-muted">Member since</dt><dd>{fmtDate(user.createdAt)}</dd></div>
        </dl>
        <div className="mt-4">
          <button type="button" className={btn} onClick={() => void signOut()}>Sign out</button>
        </div>
      </section>

      <section className={`${card} border-red-600/30`} aria-labelledby="set-delete">
        <h2 id="set-delete" className="text-lg font-semibold text-red-700 dark:text-red-400">Delete account</h2>
        <p className="mt-2 text-sm text-muted">
          Permanently deletes your account, saved work, favourites and share links{subscribed ? ", and cancels your subscription" : ""}. This can&apos;t be undone. Type <span className="font-mono">{user.email}</span> to confirm.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <input value={confirm} onChange={(e) => setConfirm(e.target.value)} aria-label="Type your email to confirm" className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          <button
            type="button"
            disabled={confirm.trim().toLowerCase() !== user.email || busy === "delete"}
            onClick={() => run("delete", async () => { await api("DELETE", "/me", { confirm: confirm.trim().toLowerCase() }); await refreshAccount(); })}
            className="rounded-lg bg-red-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-40"
          >
            {busy === "delete" ? "Deleting…" : "Delete everything"}
          </button>
        </div>
      </section>
    </>
  );
}
