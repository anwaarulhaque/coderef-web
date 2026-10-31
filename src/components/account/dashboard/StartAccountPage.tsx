"use client";

// Account > CodeRef Start: the Start plan (separate from CodeRef Pro), its billing, teams and connected browsers.
import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError, refreshAccount, useAccount } from "@/lib/account/client";
import { startApi } from "@/lib/start/client";
import { Alert, btn, btnPrimary, card, fmtDate } from "./ui";

type Subs = Awaited<ReturnType<typeof startApi.billing>>;
const TIER_NAME = { free: "Free", pro: "Start PRO", team: "Start Team", enterprise: "Start Enterprise" } as const;

export function StartAccountPage() {
  const start = useAccount().me?.start;
  const [subs, setSubs] = useState<Subs | null>(null);
  const [devices, setDevices] = useState<Awaited<ReturnType<typeof startApi.tokens>>>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const load = () => {
    startApi
      .billing()
      .then(setSubs)
      .catch(() => setSubs([]));
    startApi
      .tokens()
      .then(setDevices)
      .catch(() => undefined);
  };
  useEffect(() => {
    load();
    if (new URLSearchParams(window.location.search).get("checkout") === "success") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of the URL
      setNotice("Thanks! Your CodeRef Start plan is being activated. It can take a minute to show here.");
      setTimeout(() => void refreshAccount().then(load), 4000);
    }
  }, []);
  const tier = start?.tier ?? "free";
  return (
    <div className="grid gap-6">
      {notice && <Alert tone="ok">{notice}</Alert>}
      <section className={card}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted">CodeRef Start plan</p>
            <p className="text-2xl font-semibold">{TIER_NAME[tier]}</p>
            <p className="mt-1 text-sm text-muted">
              {start ? `${start.pages} of ${start.pageLimit >= 200 ? "unlimited" : start.pageLimit} personal pages` : ""} · CodeRef Start is billed separately from CodeRef Pro.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/start/" className={btnPrimary}>
              Open CodeRef Start
            </Link>
            {tier === "free" && (
              <Link href="/pricing/?product=start" className={btn}>
                Upgrade
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className={card}>
        <h2 className="font-semibold">Subscriptions</h2>
        {subs === null ? (
          <p className="mt-2 text-sm text-muted">Loading…</p>
        ) : !subs.length ? (
          <p className="mt-2 text-sm text-muted">
            No paid Start plan. <Link href="/pricing/?product=start" className="text-accent">Compare plans</Link>
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {subs.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
                <span className="flex-1">
                  <span className="font-medium">{s.name}</span>
                  {s.teamName && <span className="text-muted"> · {s.teamName}</span>}
                  <span className="block text-xs text-muted">
                    {s.status === "cancelling" ? `Ends ${fmtDate(s.proUntil)}` : s.status === "active" ? `Renews around ${fmtDate(s.proUntil)}` : `${s.status} · access until ${fmtDate(s.proUntil)}`}
                  </span>
                </span>
                {s.manageable && (s.status === "active" || s.status === "cancelling") && (
                  <button
                    type="button"
                    className={btn}
                    onClick={async () => {
                      setError(null);
                      try {
                        await startApi.cancel(s.id, s.status === "active");
                        load();
                      } catch (e) {
                        setError(e instanceof ApiError ? e.message : "Couldn't update the subscription.");
                      }
                    }}
                  >
                    {s.status === "active" ? "Cancel at period end" : "Keep my plan"}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
        <p className="mt-3 text-xs text-muted">Receipts and invoices for Start purchases are in Transactions, alongside any CodeRef Pro payments.</p>
      </section>

      <section className={card}>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Teams</h2>
          <Link href="/start/teams/" className={btn}>
            Manage teams
          </Link>
        </div>
      </section>

      <section className={card}>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Connected browsers</h2>
          <Link href="/start/connect/" className={btn}>
            Connect a browser
          </Link>
        </div>
        <ul className="mt-3 divide-y divide-border text-sm">
          {!devices.length && <li className="py-2 text-muted">None yet.</li>}
          {devices.map((d) => (
            <li key={d.id} className="flex items-center gap-3 py-2">
              <span className="flex-1">
                {d.name} <span className="text-xs text-muted">· {d.lastUsedAt ? `last used ${fmtDate(d.lastUsedAt)}` : "not used yet"}</span>
              </span>
              <button type="button" className="text-xs text-muted hover:text-red-500" onClick={async () => (await startApi.deleteToken(d.id), load())}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
