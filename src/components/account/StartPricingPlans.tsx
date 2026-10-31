"use client";

// CodeRef Start plans: Free, Start PRO ($24/year), Start Team ($29/month) and Enterprise (contact sales), plus a
// feature comparison. Separate from CodeRef Pro: checkout goes to /api/start/billing/checkout.
import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError, openSignIn, useAccount, usePaymentsOpen } from "@/lib/account/client";
import { startApi } from "@/lib/start/client";
import { SUPPORT_EMAIL } from "@/lib/plans";
import { START_ENTERPRISE_FEATURES, START_FREE_FEATURES, START_LIMITS, START_PLANS, START_PRO_FEATURES, START_TEAM_FEATURES, START_TEAM_SEATS, START_WIDGETS, type StartPlanId } from "@/lib/start-plans";

const Check = () => (
  <svg aria-hidden viewBox="0 0 20 20" width="16" height="16" className="mt-0.5 shrink-0 text-accent">
    <path d="M5 10.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const List = ({ lead, items }: { lead?: string; items: string[] }) => (
  <ul className="mt-5 flex-1 space-y-2.5 text-sm">
    {lead && (
      <li className="flex gap-2 font-medium">
        <Check />
        {lead}
      </li>
    )}
    {items.map((f) => (
      <li key={f} className="flex gap-2">
        <Check />
        {f}
      </li>
    ))}
  </ul>
);

const yes = "✓";
const COMPARE: [string, string, string, string, string][] = [
  ["Start pages", String(START_LIMITS.free.pages), "Unlimited", "Unlimited", "Unlimited"],
  ["Widgets", `${START_WIDGETS.filter((w) => w.tier === "free").length} essential`, `All ${START_WIDGETS.filter((w) => w.tier !== "team").length}`, `All ${START_WIDGETS.length}`, `All ${START_WIDGETS.length}`],
  ["New-tab extension & saving tabs", yes, yes, yes, yes],
  ["Import bookmarks (browser, start.me, OPML)", yes, yes, yes, yes],
  ["Public sharing & template gallery", yes, yes, yes, yes],
  ["Inbox, custom backgrounds & CSS", "", yes, yes, yes],
  ["Password-protected pages", "", yes, yes, yes],
  ["Members", "1", "1", String(START_TEAM_SEATS), "Unlimited"],
  ["Shared team pages, roles & branding", "", "", yes, yes],
  ["Join by email domain, announcements", "", "", yes, yes],
  ["Link analytics", "", "", yes, "Advanced"],
  ["Single sign-on, managed rollout", "", "", "", yes],
  ["Support", "Email", "Priority email", "Priority email", "Dedicated"],
];

export function StartPricingPlans() {
  const { me, status } = useAccount();
  const user = me?.user;
  const tier = me?.start?.tier ?? "free";
  const open = usePaymentsOpen();
  const [busy, setBusy] = useState<StartPlanId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const qs = new URLSearchParams(window.location.search);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of the URL
    if (qs.get("product") === "start" && qs.get("checkout") === "cancelled") setNotice("Checkout was cancelled. You haven't been charged.");
  }, []);

  const buy = async (plan: StartPlanId) => {
    if (!user) return openSignIn("Create a free account first. You'll go straight to checkout after.");
    setBusy(plan);
    setError(null);
    try {
      window.location.assign((await startApi.checkout(plan)).url);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not start checkout. Please try again.");
      setBusy(null);
    }
  };

  const owns = (plan: StartPlanId) => (plan === "start_pro_yearly" ? tier === "pro" : tier === "team" || tier === "enterprise");
  const cta = (plan: StartPlanId) => {
    if (owns(plan)) return "Your current plan";
    if (!open) return "Coming soon";
    if (busy === plan) return "Opening checkout…";
    return user ? `Get ${START_PLANS.find((p) => p.id === plan)!.name}` : "Sign up to buy";
  };

  return (
    <div>
      {!open && status !== "loading" && (
        <p className="mb-6 rounded-xl border border-border bg-surface px-4 py-3 text-sm">
          Paid Start plans are <strong>coming soon</strong>. The free plan works today, and you can upgrade the moment they open.
        </p>
      )}
      {notice && <p className="mb-6 rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm">{notice}</p>}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <section className="flex flex-col rounded-2xl border border-border bg-surface p-6" aria-labelledby="start-free">
          <h2 id="start-free" className="text-lg font-semibold">
            Free
          </h2>
          <p className="mt-3">
            <span className="text-4xl font-bold tracking-tight">$0</span>
            <span className="ml-1 text-sm text-muted">forever</span>
          </p>
          <p className="mt-2 min-h-10 text-sm text-muted">A start page in every new tab.</p>
          <List items={START_FREE_FEATURES} />
          {user ? (
            <Link href="/start/" className="mt-6 rounded-lg border border-border px-4 py-2.5 text-center text-sm font-medium hover:border-accent">
              {tier === "free" ? "Open CodeRef Start" : "Open your pages"}
            </Link>
          ) : (
            <button type="button" onClick={() => openSignIn()} className="mt-6 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:border-accent">
              Create free account
            </button>
          )}
        </section>

        {START_PLANS.map((p) => {
          const featured = p.id === "start_pro_yearly";
          return (
            <section key={p.id} aria-labelledby={`plan-${p.id}`} className={`relative flex flex-col rounded-2xl border bg-surface p-6 ${featured ? "border-accent shadow-lg ring-1 ring-accent" : "border-border"}`}>
              {featured && <span className="absolute -top-3 left-6 rounded-full bg-accent px-2.5 py-0.5 text-xs font-bold text-surface">Most popular</span>}
              <h2 id={`plan-${p.id}`} className="text-lg font-semibold">
                {p.name}
              </h2>
              <p className="mt-3">
                <span className="text-4xl font-bold tracking-tight">{p.price}</span>
                <span className="ml-1 text-sm text-muted">{p.period}</span>
              </p>
              <p className="mt-2 min-h-10 text-sm text-muted">{p.note}</p>
              <List lead={featured ? "Everything in Free, plus:" : "Everything in PRO for every member, plus:"} items={featured ? START_PRO_FEATURES : START_TEAM_FEATURES} />
              <button
                type="button"
                disabled={!open || status === "loading" || !!busy || owns(p.id)}
                onClick={() => buy(p.id)}
                className={`mt-6 rounded-lg px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${featured ? "bg-accent text-surface hover:opacity-90" : "border border-border hover:border-accent hover:text-accent"}`}
              >
                {cta(p.id)}
              </button>
            </section>
          );
        })}

        <section className="flex flex-col rounded-2xl border border-border bg-surface p-6" aria-labelledby="start-enterprise">
          <h2 id="start-enterprise" className="text-lg font-semibold">
            Start Enterprise
          </h2>
          <p className="mt-3">
            <span className="text-4xl font-bold tracking-tight">Custom</span>
          </p>
          <p className="mt-2 min-h-10 text-sm text-muted">For organisations with many teams.</p>
          <List lead="Everything in Team, plus:" items={START_ENTERPRISE_FEATURES} />
          <a href={`mailto:${SUPPORT_EMAIL}?subject=CodeRef%20Start%20Enterprise`} className="mt-6 rounded-lg border border-border px-4 py-2.5 text-center text-sm font-semibold hover:border-accent hover:text-accent">
            Contact sales
          </a>
        </section>
      </div>
      {error && (
        <p role="alert" className="mt-4 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <section className="mt-12" aria-labelledby="start-compare">
        <h2 id="start-compare" className="mb-4 text-xl font-semibold">
          Compare CodeRef Start plans
        </h2>
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="p-3 font-medium text-muted">Feature</th>
                {["Free", "PRO", "Team", "Enterprise"].map((h) => (
                  <th key={h} className="p-3 text-center font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {COMPARE.map(([f, ...cells]) => (
                <tr key={f}>
                  <th scope="row" className="p-3 text-left font-normal">
                    {f}
                  </th>
                  {cells.map((c, i) => (
                    <td key={i} className={`p-3 text-center ${c === yes ? "text-accent" : ""}`}>
                      {c === yes ? <span aria-label="Included">✓</span> : c || <span aria-label="Not included" className="text-muted">—</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
