"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, ApiError, openSignIn, useAccount, usePaymentsOpen } from "@/lib/account/client";
import { FREE_FEATURES, LIFETIME_CAP, PLANS, PRO_FEATURES, type PlanId } from "@/lib/plans";

const Check = () => (
  <svg aria-hidden viewBox="0 0 20 20" width="16" height="16" className="mt-0.5 shrink-0 text-accent">
    <path d="M5 10.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function PricingPlans() {
  const { me, status } = useAccount();
  const user = me?.user;
  const open = usePaymentsOpen();
  const [busy, setBusy] = useState<PlanId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const remaining = me?.lifetimeRemaining ?? LIFETIME_CAP;

  useEffect(() => {
    const qs = new URLSearchParams(window.location.search);
    /* eslint-disable react-hooks/set-state-in-effect -- one-time read of the URL */
    if (qs.get("checkout") === "cancelled") setNotice("Checkout was cancelled. You haven't been charged.");
    else if (qs.get("feature")) setNotice(`${qs.get("feature")} is part of CodeRef Pro.`);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const buy = async (plan: PlanId) => {
    if (!user) {
      openSignIn("Create a free account first. You'll go straight to checkout after.");
      return;
    }
    setBusy(plan);
    setError(null);
    try {
      const { url } = await api<{ url: string }>("POST", "/billing/checkout", { plan });
      window.location.assign(url);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not start checkout. Please try again.");
      setBusy(null);
    }
  };

  const current = user?.pro ? user.plan : null;
  const cta = (plan: PlanId) => {
    if (!open && !current) return "Coming soon";
    if (current === "lifetime") return "Included in your lifetime plan";
    if (current && plan !== "lifetime") return current === plan ? "Your current plan" : "Change in Manage billing";
    if (plan === "lifetime" && remaining <= 0) return "Sold out";
    return busy === plan ? "Opening checkout…" : user ? `Get ${PLANS.find((p) => p.id === plan)!.name}` : "Sign up to buy";
  };
  const disabled = (plan: PlanId) => !open || status === "loading" || !!busy || current === "lifetime" || (!!current && plan !== "lifetime") || (plan === "lifetime" && remaining <= 0);

  return (
    <div>
      {!open && status !== "loading" && <p className="mb-6 rounded-xl border border-border bg-surface px-4 py-3 text-sm">Paid plans are <strong>coming soon</strong>. Everything on the free plan works today, and your free account will be upgradeable the moment Pro opens.</p>}
      {notice && <p className="mb-6 rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm">{notice}</p>}
      <div className="grid gap-4 lg:grid-cols-4">
        <section className="flex flex-col rounded-2xl border border-border bg-surface p-6" aria-labelledby="plan-free">
          <h2 id="plan-free" className="text-lg font-semibold">
            Free
          </h2>
          <p className="mt-3">
            <span className="text-4xl font-bold tracking-tight">$0</span>
            <span className="ml-1 text-sm text-muted">forever</span>
          </p>
          <p className="mt-2 text-sm text-muted">Everything CodeRef has always offered.</p>
          <ul className="mt-5 flex-1 space-y-2.5 text-sm">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex gap-2">
                <Check />
                {f}
              </li>
            ))}
          </ul>
          {user ? (
            <Link href="/account/" className="mt-6 rounded-lg border border-border px-4 py-2.5 text-center text-sm font-medium hover:border-accent">
              {user.pro ? "Your account" : "Your current plan"}
            </Link>
          ) : (
            <button type="button" onClick={() => openSignIn()} className="mt-6 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:border-accent">
              Create free account
            </button>
          )}
        </section>

        {PLANS.map((p) => {
          const featured = p.id === "yearly";
          return (
            <section key={p.id} aria-labelledby={`plan-${p.id}`} className={`relative flex flex-col rounded-2xl border bg-surface p-6 ${featured ? "border-accent shadow-lg ring-1 ring-accent" : "border-border"}`}>
              {featured && <span className="absolute -top-3 left-6 rounded-full bg-accent px-2.5 py-0.5 text-xs font-bold text-surface">Best value</span>}
              <h2 id={`plan-${p.id}`} className="text-lg font-semibold">
                {p.name}
              </h2>
              <p className="mt-3">
                <span className="text-4xl font-bold tracking-tight">{p.price}</span>
                <span className="ml-1 text-sm text-muted">{p.period}</span>
              </p>
              <p className="mt-2 min-h-10 text-sm text-muted">
                {!open ? "Opens soon. Prices shown are the planned launch prices." : p.id === "lifetime" ? (remaining > 0 ? `Launch offer: ${remaining} of ${LIFETIME_CAP} left. Pay once, Pro forever.` : "The launch offer has sold out.") : p.note ?? "Cancel anytime. Access until the end of the period."}
              </p>
              <ul className="mt-5 flex-1 space-y-2.5 text-sm">
                <li className="flex gap-2 font-medium">
                  <Check />
                  Everything in Free, plus:
                </li>
                {PRO_FEATURES.map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                disabled={disabled(p.id)}
                onClick={() => buy(p.id)}
                className={`mt-6 rounded-lg px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${featured ? "bg-accent text-surface hover:opacity-90" : "border border-border hover:border-accent hover:text-accent"}`}
              >
                {cta(p.id)}
              </button>
            </section>
          );
        })}
      </div>
      {error && (
        <p role="alert" className="mt-4 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
