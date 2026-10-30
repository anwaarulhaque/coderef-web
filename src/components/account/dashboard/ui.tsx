"use client";

// Small pieces shared by the account pages.
import { useCallback, useEffect, useState } from "react";
import { api, ApiError, startCheckout, usePaymentsOpen, type AccountUser, type SavedItem } from "@/lib/account/client";
import { PLANS, type PlanId } from "@/lib/plans";

export const card = "rounded-2xl border border-border bg-surface p-5";
export const btn = "inline-flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:border-accent hover:text-accent disabled:opacity-50";
export const btnPrimary = "inline-flex items-center justify-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-sm font-semibold text-surface hover:opacity-90 disabled:opacity-50";

export const fmtDate = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "");

export function fmtMoney(amount: number | null, currency: string | null): string {
  if (amount === null) return "—";
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: currency || "USD" }).format(amount / 100);
  } catch {
    return `${(amount / 100).toFixed(2)} ${currency ?? ""}`.trim();
  }
}

/** Sign-out is deliberately loud (red outline + icon), so people can always find it. */
export const signOutBtn = "inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-500/40 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-500/10 dark:text-red-400";

export const SignOutIcon = () => (
  <svg aria-hidden viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 17l5-5-5-5M21 12H9" />
  </svg>
);

export const Lock = ({ className = "" }: { className?: string }) => (
  <svg aria-hidden viewBox="0 0 16 16" width="13" height="13" className={className}>
    <rect x="3" y="7" width="10" height="7" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" fill="none" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

export const ProBadge = () => <span className="rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">Pro</span>;

export function Alert({ tone = "info", children }: { tone?: "info" | "ok" | "warn" | "error"; children: React.ReactNode }) {
  const tones = {
    info: "border-accent/30 bg-accent/10",
    ok: "border-emerald-600/30 bg-emerald-500/10",
    warn: "border-amber-600/30 bg-amber-500/10",
    error: "border-red-600/30 bg-red-500/10 text-red-700 dark:text-red-300",
  };
  return (
    <p role={tone === "error" ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-sm ${tones[tone]}`}>
      {children}
    </p>
  );
}

/** Runs one action at a time and keeps its error message. */
export function useAction() {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const run = useCallback(async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(null);
    }
  }, []);
  return { busy, error, run, setError };
}

/** The signed-in user's saved items (all kinds, favourites included). */
export function useItems() {
  const [items, setItems] = useState<SavedItem<{ id?: string; name?: string }>[] | null>(null);
  const load = useCallback(async () => {
    try {
      setItems((await api<{ items: SavedItem<{ id?: string; name?: string }>[] }>("GET", "/items")).items);
    } catch {
      setItems([]);
    }
  }, []);
  useEffect(() => {
    let live = true;
    api<{ items: SavedItem<{ id?: string; name?: string }>[] }>("GET", "/items")
      .then((r) => live && setItems(r.items))
      .catch(() => live && setItems([]));
    return () => {
      live = false;
    };
  }, []);
  return { items, reload: load };
}

/** Upgrade box with direct checkout buttons, for free accounts. */
export function UnlockPanel({ title, children, remaining }: { title: string; children?: React.ReactNode; remaining: number }) {
  const { busy, error, run } = useAction();
  const open = usePaymentsOpen();
  return (
    <section className="rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/10 via-surface to-surface p-5" aria-label={title}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-xl">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Lock className="text-accent" /> {title}
          </h2>
          {children && <div className="mt-1 text-sm text-muted">{children}</div>}
        </div>
        <div className="flex flex-wrap gap-2">
          {!open && <span className="rounded-lg border border-border px-3.5 py-2 text-sm font-semibold text-muted">Pro plans coming soon</span>}
          {open && PLANS.filter((p) => p.id !== "lifetime" || remaining > 0).map((p) => (
            <button key={p.id} type="button" className={p.id === "yearly" ? btnPrimary : btn} disabled={!!busy} onClick={() => run(p.id, () => startCheckout(p.id as PlanId))}>
              {busy === p.id ? "Opening checkout…" : `${p.price} ${p.period}`}
              <span className="text-xs font-normal opacity-80">{p.id === "monthly" ? "Monthly" : p.id === "yearly" ? "Yearly" : "Lifetime"}</span>
            </button>
          ))}
        </div>
      </div>
      {error && <div className="mt-3"><Alert tone="error">{error}</Alert></div>}
      <p className="mt-3 text-xs text-muted">{open ? "Secure checkout by Dodo Payments. Cancel anytime; refunds within 14 days." : "Paid plans are coming soon. Everything on the free plan works today."}</p>
    </section>
  );
}

export type PlanState = { name: string; badge: string; tone: "ok" | "warn" | "muted" | "pro"; detail: string };

/** The current plan in words, used by the side menu, the subscription page and the overview. */
export function planState(user: AccountUser): PlanState {
  const name = user.pro ? (PLANS.find((p) => p.id === user.plan)?.name ?? "Pro") : "Free";
  if (user.plan === "lifetime") return { name, badge: "Lifetime", tone: "pro", detail: "Pro forever, no renewals" };
  if (!user.pro) {
    const ended = user.status === "expired" || user.status === "cancelled" || user.status === "failed";
    return { name, badge: ended ? "Ended" : "Free", tone: "muted", detail: ended ? `Pro ended ${fmtDate(user.proUntil)}` : "Upgrade any time" };
  }
  if (user.status === "cancelled") return { name, badge: "Cancelled", tone: "warn", detail: `Pro until ${fmtDate(user.proUntil)}` };
  if (user.status === "on_hold" || user.status === "past_due") return { name, badge: "Payment issue", tone: "warn", detail: "Update your card to keep Pro" };
  return { name, badge: "Active", tone: "ok", detail: `Renews ${fmtDate(user.proUntil)}` };
}

export function PlanBadge({ state }: { state: PlanState }) {
  const tones = {
    ok: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    warn: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
    muted: "bg-chip text-muted",
    pro: "bg-accent/15 text-accent",
  };
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${tones[state.tone]}`}>{state.badge}</span>;
}
