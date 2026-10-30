"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, refreshAccount, startCheckout, useAccount, usePaymentsOpen, type SubscriptionDetails } from "@/lib/account/client";
import { FREE_FEATURES, PLANS, PRO_FEATURES, type PlanId } from "@/lib/plans";
import { Alert, btn, btnPrimary, card, fmtDate, Lock, PlanBadge, planState, useAction } from "./ui";
import { BillingHistory } from "./BillingHistory";

const Check = () => (
  <svg aria-hidden viewBox="0 0 20 20" width="16" height="16" className="mt-0.5 shrink-0 text-emerald-600">
    <path d="M5 10.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function SubscriptionPage() {
  const { me } = useAccount();
  const open = usePaymentsOpen();
  const user = me!.user!;
  const { busy, error, run } = useAction();
  const state = planState(user);
  const plan = PLANS.find((p) => p.id === user.plan);
  const remaining = me?.lifetimeRemaining ?? 0;
  const subscribed = user.pro && user.plan !== "lifetime";
  const [details, setDetails] = useState<SubscriptionDetails | null>(null);
  const [confirm, setConfirm] = useState<PlanId | "cancel" | null>(null);
  // Mounts only after sign-in (client side), so reading the URL here is safe.
  const [notice, setNotice] = useState<string | null>(() => (new URLSearchParams(window.location.search).get("card") === "updated" ? "Your card was updated." : null));
  const cancelling = details?.cancelAtPeriodEnd ?? false;

  const loadDetails = useCallback(() => api<{ subscription: SubscriptionDetails | null }>("GET", "/billing/subscription").then((r) => setDetails(r.subscription)).catch(() => undefined), []);
  useEffect(() => {
    if (subscribed) void loadDetails();
  }, [subscribed, loadDetails]);

  // Plan changes finish through Dodo's webhooks a moment later: refresh until the new plan shows up.
  const settle = async (message: string) => {
    setConfirm(null);
    setNotice(message);
    for (let i = 0; i < 6; i++) {
      await new Promise((r) => setTimeout(r, 2500));
      await refreshAccount();
      await loadDetails();
    }
  };
  const switchTo = (id: PlanId) => run("switch", async () => {
    await api("POST", "/billing/change-plan", { plan: id });
    await settle(`Switched to ${PLANS.find((p) => p.id === id)!.name}. Dodo charges or credits the prorated difference on your card.`);
  });
  const setCancel = (cancel: boolean) => run("cancel", async () => {
    await api("POST", "/billing/cancel", { cancel });
    await loadDetails();
    setConfirm(null);
    setNotice(cancel ? `Your subscription won't renew. Pro stays on until ${fmtDate(user.proUntil)}.` : "Your subscription will renew as normal.");
  });
  const updateCard = () => run("card", async () => window.location.assign((await api<{ url: string }>("POST", "/billing/payment-method")).url));

  // What each plan's button does from the current plan.
  const action = (id: PlanId): { label: string; kind: "current" | "checkout" | "switch" | "none" } => {
    if (user.plan === "lifetime") return id === "lifetime" ? { label: "Your plan", kind: "current" } : { label: "Included", kind: "none" };
    if (user.pro && user.plan === id && user.status !== "cancelled") return { label: "Current plan", kind: "current" };
    if (id === "lifetime") return remaining > 0 ? { label: subscribed ? "Switch to lifetime" : "Buy lifetime", kind: "checkout" } : { label: "Sold out", kind: "none" };
    if (subscribed && user.status !== "cancelled") return { label: PLANS.findIndex((p) => p.id === id) > PLANS.findIndex((p) => p.id === user.plan) ? `Upgrade to ${id}` : `Downgrade to ${id}`, kind: "switch" };
    return { label: user.pro ? `Resubscribe ${id}` : `Get ${id}`, kind: "checkout" };
  };

  return (
    <>
      {error && <Alert tone="error">{error}</Alert>}
      {notice && <Alert tone="ok">{notice}</Alert>}
      {state.badge === "Payment issue" && <Alert tone="warn">We couldn&apos;t take your last payment. Update your card below to keep Pro.</Alert>}

      <section className={card} aria-labelledby="sub-current">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 id="sub-current" className="text-xs font-semibold uppercase tracking-wide text-muted">Current plan</h2>
            <p className="mt-2 flex items-center gap-2.5 text-2xl font-semibold">
              {state.name} <PlanBadge state={state} />
            </p>
            {user.pro && plan && <p className="mt-0.5 text-sm text-muted">{plan.price} {plan.period}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            {subscribed && (
              <button type="button" className={btn} disabled={!!busy} onClick={updateCard}>
                {busy === "card" ? "Opening…" : "Update card"}
              </button>
            )}
            {!user.pro && open && <Link href="/pricing/" className={btnPrimary}>Upgrade to Pro</Link>}
            {!user.pro && !open && <span className="rounded-lg border border-border px-3.5 py-2 text-sm font-semibold text-muted">Pro coming soon</span>}
          </div>
        </div>
        <dl className="mt-4 grid gap-3 border-t border-border pt-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs text-muted">Status</dt>
            <dd className="mt-0.5 font-medium">{state.badge === "Free" ? "Free plan" : state.badge}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">{user.plan === "lifetime" ? "Access" : user.status === "cancelled" || !user.pro ? "Access until" : "Next renewal"}</dt>
            <dd className="mt-0.5 font-medium">{user.plan === "lifetime" ? "Forever" : user.proUntil ? fmtDate(user.proUntil) : "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Billing</dt>
            <dd className="mt-0.5 font-medium">{user.plan === "lifetime" ? "Paid once" : subscribed ? (user.plan === "yearly" ? "Yearly" : "Monthly") : "None"}</dd>
          </div>
        </dl>
        {subscribed && (
          <div className="mt-4 border-t border-border pt-4 text-sm">
            {cancelling || user.status === "cancelled" ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-muted">Your subscription won&apos;t renew. Pro stays on until {fmtDate(user.proUntil)}.</p>
                {cancelling && <button type="button" className={btnPrimary} disabled={!!busy} onClick={() => setCancel(false)}>{busy === "cancel" ? "Working…" : "Resume subscription"}</button>}
              </div>
            ) : confirm === "cancel" ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p>Cancel your subscription? Pro stays on until the end of the period you&apos;ve paid for.</p>
                <span className="flex gap-2">
                  <button type="button" className={btn} disabled={!!busy} onClick={() => setConfirm(null)}>Keep it</button>
                  <button type="button" className={btnPrimary} disabled={!!busy} onClick={() => setCancel(true)}>{busy === "cancel" ? "Cancelling…" : "Yes, cancel"}</button>
                </span>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-muted">Upgrade or downgrade below. If you cancel, Pro stays on until the end of the period you&apos;ve paid for.</p>
                <button type="button" className={btn} disabled={!!busy} onClick={() => setConfirm("cancel")}>Cancel subscription</button>
              </div>
            )}
          </div>
        )}
      </section>

      <section aria-labelledby="sub-plans">
        <h2 id="sub-plans" className="mb-3 text-lg font-semibold">{user.pro ? "Plans" : "Choose a plan"}</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {PLANS.map((p) => {
            const a = action(p.id);
            const current = a.kind === "current";
            return (
              <div key={p.id} className={`${card} flex flex-col ${current ? "border-accent ring-1 ring-accent" : ""}`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{p.name}</h3>
                  {current && <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase text-surface">Current</span>}
                  {!current && p.id === "yearly" && <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold uppercase text-accent">Best value</span>}
                </div>
                <p className="mt-2">
                  <span className="text-3xl font-semibold">{p.price}</span> <span className="text-sm text-muted">{p.period}</span>
                </p>
                <p className="mt-1 min-h-10 text-xs text-muted">{p.id === "lifetime" ? `${remaining} of 100 launch spots left` : p.note ?? "Cancel anytime"}</p>
                <div className="mt-auto pt-4">
                  {a.kind === "switch" && confirm === p.id ? (
                    <div className="space-y-2">
                      <p className="text-xs text-muted">Switch to {p.name}? Dodo charges or credits the prorated difference on your card now, and renews at {p.price} {p.period}.</p>
                      <div className="flex gap-2">
                        <button type="button" className={`${btn} flex-1 py-2`} disabled={!!busy} onClick={() => setConfirm(null)}>Back</button>
                        <button type="button" className={`${btnPrimary} flex-1`} disabled={!!busy} onClick={() => switchTo(p.id)}>{busy === "switch" ? "Switching…" : "Confirm"}</button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={a.kind === "current" || a.kind === "none" || !!busy || cancelling || !open}
                      className={`w-full ${p.id === "yearly" && a.kind === "checkout" ? btnPrimary : btn} py-2`}
                      onClick={() => (a.kind === "switch" ? setConfirm(p.id) : run(p.id, () => startCheckout(p.id)))}
                    >
                      {busy === p.id ? "Opening checkout…" : !open ? "Coming soon" : a.label}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {subscribed && remaining > 0 && <p className="mt-2 text-xs text-muted">Switching to lifetime? Cancel your subscription above afterwards so it doesn&apos;t renew.</p>}
      </section>

      {(user.billing || user.pro) && <BillingHistory />}

      <section className={card} aria-labelledby="sub-includes">
        <h2 id="sub-includes" className="mb-3 text-lg font-semibold">{user.pro ? "Unlocked on your plan" : "What Pro unlocks"}</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {PRO_FEATURES.map((f) => (
            <li key={f} className="flex gap-2 text-sm">
              {user.pro ? <Check /> : <Lock className="mt-1 shrink-0 text-muted" />}
              <span>{f}</span>
            </li>
          ))}
        </ul>
        {!user.pro && (
          <>
            <h3 className="mb-2 mt-5 text-sm font-semibold text-muted">Already included free</h3>
            <ul className="grid gap-2 sm:grid-cols-2">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex gap-2 text-sm text-muted">
                  <Check />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </>
  );
}
