"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { refreshAccount, TOOL_PATHS, useAccount } from "@/lib/account/client";
import { PLANS, SUPPORT_EMAIL } from "@/lib/plans";
import { Alert, card, fmtDate, Lock, useItems } from "./ui";

export function Overview() {
  const { me } = useAccount();
  const user = me!.user!;
  const { items } = useItems();
  const [checkout, setCheckout] = useState<"waiting" | "done" | "slow" | null>(null);

  // Back from checkout: the webhook usually lands within seconds, so poll until Pro shows up.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("checkout") !== "success") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of the URL
    setCheckout("waiting");
    let tries = 0;
    const t = setInterval(async () => {
      const r = await refreshAccount();
      if (r?.user?.pro) {
        setCheckout("done");
        clearInterval(t);
        window.history.replaceState(null, "", "/account/");
      } else if (++tries >= 20) {
        setCheckout("slow");
        clearInterval(t);
      }
    }, 3000);
    return () => clearInterval(t);
  }, []);

  const plan = PLANS.find((p) => p.id === user.plan);
  const saved = (items ?? []).filter((i) => i.kind !== "favorite");
  const favourites = (items ?? []).filter((i) => i.kind === "favorite");
  const usage = me?.usage;
  const pct = usage ? Math.min(100, Math.round((usage.saved / usage.limit) * 100)) : 0;

  const tiles = [
    { href: "/account/saved/", label: "Saved items", value: usage ? `${usage.saved} / ${usage.limit}` : "…", hint: "Across every tool" },
    { href: "/account/saved/#favourites", label: "Favourite designs", value: String(favourites.length), hint: "From the DESIGN.md library" },
    { href: "/account/downloads/", label: "Downloads", value: user.pro ? "Unlocked" : "Locked", hint: user.pro ? "Packages and framework exports" : "Included with Pro", locked: !user.pro },
    { href: "/account/subscription/", label: "Subscription", value: user.pro ? (plan?.name ?? "Pro") : "Free", hint: user.plan === "lifetime" ? "Pro forever" : user.pro ? `Renews around ${fmtDate(user.proUntil)}` : "Upgrade any time" },
  ];

  return (
    <>
      {checkout === "waiting" && <Alert>Payment received. Activating Pro…</Alert>}
      {checkout === "done" && <Alert tone="ok">You&apos;re on Pro. Downloads and share links are unlocked. Thank you for supporting CodeRef!</Alert>}
      {checkout === "slow" && (
        <Alert tone="warn">
          Your payment is still being confirmed. Refresh in a minute; if Pro doesn&apos;t appear, email <a className="underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
        </Alert>
      )}
      {user.pro && (user.status === "on_hold" || user.status === "past_due") && (
        <Alert tone="warn">We couldn&apos;t take your last payment. Update your card under <Link href="/account/subscription/" className="underline">Subscription</Link> to keep Pro.</Alert>
      )}

      <section aria-labelledby="ov-title">
        <h2 id="ov-title" className="text-xl font-semibold">Welcome back</h2>
        <p className="mt-1 text-sm text-muted">{user.email}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((t) => (
          <Link key={t.label} href={t.href} className={`${card} block transition-colors hover:border-accent`}>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t.label}</p>
            <p className="mt-2 flex items-center gap-1.5 text-2xl font-semibold">{t.locked && <Lock className="text-muted" />}{t.value}</p>
            <p className="mt-1 text-xs text-muted">{t.hint}</p>
          </Link>
        ))}
      </div>

      {usage && (
        <section className={card} aria-labelledby="ov-usage">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="ov-usage" className="font-semibold">Cloud save</h2>
            <span className="text-sm text-muted">{usage.saved} of {usage.limit} used</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-chip" role="progressbar" aria-valuenow={usage.saved} aria-valuemin={0} aria-valuemax={usage.limit} aria-label="Saved items used">
            <div className={`h-full rounded-full ${pct >= 100 ? "bg-amber-500" : "bg-accent"}`} style={{ width: `${pct}%` }} />
          </div>
          {!user.pro && pct >= 100 && (
            <p className="mt-2 text-sm">
              You&apos;ve used every free save. <Link href="/pricing/" className="font-medium text-accent hover:underline">Upgrade to Pro</Link> for up to 500.
            </p>
          )}
        </section>
      )}

      <section className={card} aria-labelledby="ov-recent">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 id="ov-recent" className="font-semibold">Recently saved</h2>
          <Link href="/account/saved/" className="text-sm text-accent hover:underline">View all</Link>
        </div>
        {items === null ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : saved.length === 0 ? (
          <p className="text-sm text-muted">Nothing saved yet. Use the <span className="font-medium">Saved</span> button in any tool.</p>
        ) : (
          <ul className="divide-y divide-border">
            {saved.slice(0, 5).map((it) => {
              const tool = TOOL_PATHS[it.kind as keyof typeof TOOL_PATHS];
              return (
                <li key={it.id} className="flex items-center gap-3 py-2">
                  <span className="w-32 shrink-0 truncate text-xs text-muted">{tool?.label}</span>
                  <Link href={`${tool?.path ?? "/"}?item=${it.id}`} className="min-w-0 flex-1 truncate text-sm font-medium hover:text-accent">{it.title}</Link>
                  <span className="text-xs text-muted">{fmtDate(it.updatedAt)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
