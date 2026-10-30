"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useAccount, usePaymentsOpen } from "@/lib/account/client";
import { FREE_ITEM_LIMIT } from "@/lib/plans";
import { SignInForm } from "../SignInDialog";
import { card, Lock, PlanBadge, planState, ProBadge, SignOutIcon, signOutBtn } from "./ui";

const icon = (d: string) => (
  <svg aria-hidden viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const NAV = [
  { href: "/account/", label: "Overview", icon: icon("M3 12l9-8 9 8M5 10v10h5v-6h4v6h5V10") },
  { href: "/account/subscription/", label: "Subscription", icon: icon("M12 2l2.9 6.3 6.6.6-5 4.5 1.5 6.6L12 16.6 6 20l1.5-6.6-5-4.5 6.6-.6z") },
  { href: "/account/saved/", label: "Saved", icon: icon("M6 3h12v18l-6-4-6 4z") },
  { href: "/account/downloads/", label: "Downloads", icon: icon("M12 3v12m0 0l-4-4m4 4l4-4M4 17v3h16v-3"), pro: true },
  { href: "/account/settings/", label: "Settings", icon: icon("M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z") },
];

const normal = (p: string) => p.replace(/\/?$/, "/");

/**
 * The customer area: only the sign-in form until someone is signed in, then a side menu (tabs on small screens)
 * around the page.
 */
export function AccountShell({ children }: { children: React.ReactNode }) {
  const { status, me } = useAccount();
  const pathname = normal(usePathname() ?? "/account/");
  const user = me?.user;
  const paymentsOpen = usePaymentsOpen();

  if (status === "loading")
    return (
      <div className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <div className="hidden h-80 animate-pulse rounded-2xl bg-chip lg:block" />
        <div className="h-80 animate-pulse rounded-2xl bg-chip" />
      </div>
    );
  if (status === "offline") return <p className={card}>Accounts are unavailable right now. Your tools still work; please try again in a moment.</p>;

  if (!user)
    return (
      <div className={`${card} mx-auto max-w-md`}>
        <h2 className="mb-1 text-lg font-semibold">Sign in to your account</h2>
        <p className="mb-4 text-sm text-muted">
          New here? Signing in creates a free account: save {FREE_ITEM_LIMIT} items and unlimited favourite designs. Upgrade any time for downloads and more.
        </p>
        <SignInForm />
      </div>
    );

  const plan = planState(user);
  const active = (href: string) => (href === "/account/" ? pathname === "/account/" : pathname.startsWith(href));
  const link = (n: (typeof NAV)[number], compact = false) => (
    <Link
      key={n.href}
      href={n.href}
      aria-current={active(n.href) ? "page" : undefined}
      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm whitespace-nowrap transition-colors ${
        active(n.href) ? "bg-accent/10 font-semibold text-accent" : "text-muted hover:bg-chip hover:text-foreground"
      }`}
    >
      {n.icon}
      <span>{n.label}</span>
      {!compact && n.label === "Saved" && me?.usage && <span className="ml-auto text-xs font-normal text-muted">{me.usage.saved}/{me.usage.limit}</span>}
      {!compact && n.label === "Subscription" && <span className={`ml-auto text-xs ${user.pro ? "font-semibold text-accent" : "font-normal text-muted"}`}>{user.pro ? ({ monthly: "Monthly", yearly: "Yearly", lifetime: "Lifetime" } as Record<string, string>)[user.plan ?? ""] ?? "Pro" : "Free"}</span>}
      {!compact && n.pro && !user.pro && <Lock className="ml-auto text-muted" />}
    </Link>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-start">
      <aside className="lg:sticky lg:top-20" aria-label="Account">
        <div className={`${card} hidden p-4 lg:block`}>
          <div className="mb-4 flex items-center gap-3">
            <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-base font-bold uppercase text-surface">
              {user.email[0]}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium" title={user.email}>{user.email}</p>
              <p className="flex items-center gap-1.5 text-xs text-muted">{user.pro ? <ProBadge /> : "Free account"}</p>
            </div>
          </div>
          <div className={`mb-4 rounded-xl border p-3 ${user.pro ? "border-accent/30 bg-accent/5" : "border-border bg-background"}`}>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Current plan</p>
            <div className="mt-1 flex items-center justify-between gap-2">
              <p className="truncate font-semibold">{plan.name}</p>
              <PlanBadge state={plan} />
            </div>
            <p className="mt-0.5 text-xs text-muted">{plan.detail}</p>
            <Link
              href={user.pro ? "/account/subscription/" : "/pricing/"}
              className={`mt-2.5 block rounded-lg px-3 py-1.5 text-center text-xs font-semibold ${user.pro ? "border border-border hover:border-accent hover:text-accent" : "bg-accent text-surface hover:opacity-90"}`}
            >
              {user.pro ? "Manage subscription" : paymentsOpen ? "Upgrade to Pro" : "Pro coming soon"}
            </Link>
          </div>
          <nav className="space-y-0.5">{NAV.map((n) => link(n))}</nav>
          <button type="button" onClick={() => void signOut()} className={`${signOutBtn} mt-4 w-full py-2`}>
            <SignOutIcon /> Sign out
          </button>
        </div>
        {/* Small screens: the same menu as scrollable tabs. */}
        <nav className="-mx-4 flex items-center gap-1 overflow-x-auto border-b border-border px-4 pb-2 lg:hidden">
          {NAV.map((n) => link(n, true))}
          <button type="button" onClick={() => void signOut()} className={`${signOutBtn} ml-auto shrink-0 whitespace-nowrap`}>
            <SignOutIcon /> Sign out
          </button>
        </nav>
      </aside>
      <div className="min-w-0 space-y-6">{children}</div>
    </div>
  );
}
