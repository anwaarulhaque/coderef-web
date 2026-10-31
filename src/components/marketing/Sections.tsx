// Marketing building blocks (server components): hero, feature grids, steps, FAQ, call to action, and a live-looking
// mock-up of a start page. They use the site's tokens, so they follow light and dark mode like every other page.
import Link from "next/link";
import type { ReactNode } from "react";
import { START_WIDGETS, type WidgetDef } from "@/lib/start-plans";
import type { Feature } from "@/lib/start-marketing";

export const ctaPrimary = "inline-flex items-center justify-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-surface shadow-sm hover:opacity-90";
export const ctaSecondary = "inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-semibold hover:border-accent hover:text-accent";

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-xs font-bold tracking-widest text-accent uppercase">{children}</p>;
}

export function Hero({ eyebrow, title, text, actions, aside }: { eyebrow?: string; title: ReactNode; text: ReactNode; actions?: ReactNode; aside?: ReactNode }) {
  return (
    <section className={`grid items-center gap-10 py-6 ${aside ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]" : ""}`}>
      <div>
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-balance sm:text-5xl">{title}</h1>
        <p className="mt-4 max-w-xl text-lg text-muted text-pretty">{text}</p>
        {actions && <div className="mt-7 flex flex-wrap gap-3">{actions}</div>}
      </div>
      {aside}
    </section>
  );
}

export function Section({ id, eyebrow, title, intro, children, center = false }: { id?: string; eyebrow?: string; title: ReactNode; intro?: ReactNode; children: ReactNode; center?: boolean }) {
  return (
    <section id={id} className="mt-20 scroll-mt-20" aria-labelledby={id ? `${id}-h` : undefined}>
      <div className={center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h2 id={id ? `${id}-h` : undefined} className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
          {title}
        </h2>
        {intro && <p className="mt-3 text-muted">{intro}</p>}
      </div>
      <div className="mt-8">{children}</div>
    </section>
  );
}

const TierPill = ({ tier }: { tier: string }) => <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold tracking-wide text-accent uppercase">{tier}</span>;

export function FeatureGrid({ features, cols = 3 }: { features: Feature[]; cols?: 2 | 3 | 4 }) {
  const grid = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-2 lg:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4" }[cols];
  return (
    <div className={`grid gap-4 ${grid}`}>
      {features.map((f) => (
        <div key={f.title} className="rounded-2xl border border-border bg-surface p-5">
          <h3 className="flex flex-wrap items-center gap-2 font-semibold">
            {f.title} {f.tier && <TierPill tier={f.tier} />}
          </h3>
          <p className="mt-1.5 text-sm text-muted">{f.text}</p>
        </div>
      ))}
    </div>
  );
}

export function WidgetGrid({ widgets = START_WIDGETS }: { widgets?: WidgetDef[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {widgets.map((w) => (
        <div key={w.type} className="rounded-xl border border-border bg-surface p-4">
          <p className="flex items-center gap-2 text-sm font-semibold">
            {w.label} {w.tier !== "free" && <TierPill tier={w.tier === "pro" ? "PRO" : "Team"} />}
          </p>
          <p className="mt-1 text-xs text-muted">{w.description}</p>
        </div>
      ))}
    </div>
  );
}

export function Split({ title, text, points, visual, flip = false }: { title: string; text: string; points?: string[]; visual: ReactNode; flip?: boolean }) {
  return (
    <div className="grid items-center gap-8 py-6 lg:grid-cols-2">
      <div className={flip ? "lg:order-2" : ""}>
        <h3 className="text-xl font-bold tracking-tight">{title}</h3>
        <p className="mt-2 text-muted">{text}</p>
        {points && (
          <ul className="mt-4 space-y-2 text-sm">
            {points.map((p) => (
              <li key={p} className="flex gap-2">
                <svg aria-hidden viewBox="0 0 20 20" width="16" height="16" className="mt-0.5 shrink-0 text-accent">
                  <path d="M5 10.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {p}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className={flip ? "lg:order-1" : ""}>{visual}</div>
    </div>
  );
}

export function Steps({ steps }: { steps: [string, string][] }) {
  return (
    <ol className="grid gap-4 md:grid-cols-3">
      {steps.map(([t, d], i) => (
        <li key={t} className="rounded-2xl border border-border bg-surface p-5">
          <span className="grid size-8 place-items-center rounded-full bg-accent text-sm font-bold text-surface">{i + 1}</span>
          <h3 className="mt-3 font-semibold">{t}</h3>
          <p className="mt-1 text-sm text-muted">{d}</p>
        </li>
      ))}
    </ol>
  );
}

export function Faq({ items, id = "faq" }: { items: [string, string][]; id?: string }) {
  return (
    <div className="divide-y divide-border rounded-2xl border border-border bg-surface" id={id}>
      {items.map(([q, a]) => (
        <details key={q} className="group p-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
            {q}
            <span aria-hidden className="text-muted transition group-open:rotate-45">
              +
            </span>
          </summary>
          <p className="mt-2 text-sm text-muted">{a}</p>
        </details>
      ))}
    </div>
  );
}

export function Cta({ title, text, children }: { title: string; text: string; children: ReactNode }) {
  return (
    <section className="mt-20 overflow-hidden rounded-3xl border border-accent/30 bg-gradient-to-br from-accent/15 via-surface to-surface p-8 text-center sm:p-12">
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
      <p className="mx-auto mt-3 max-w-xl text-muted">{text}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">{children}</div>
    </section>
  );
}

export function SubNav({ items, current }: { items: { href: string; label: string }[]; current: string }) {
  return (
    <nav aria-label="CodeRef Start" className="-mx-1 mb-8 flex gap-1 overflow-x-auto border-b border-border pb-px [scrollbar-width:none]">
      {items.map((i) => (
        <Link key={i.href} href={i.href} aria-current={i.href === current ? "page" : undefined} className="-mb-px shrink-0 border-b-2 border-transparent px-3 py-2 text-sm text-muted hover:text-foreground aria-[current=page]:border-accent aria-[current=page]:font-semibold aria-[current=page]:text-foreground">
          {i.label}
        </Link>
      ))}
    </nav>
  );
}

// ---- illustration: a start page drawn in HTML, so it stays sharp and themed ----

const Card = ({ title, children, color }: { title: string; children: ReactNode; color?: string }) => (
  <div className="rounded-lg border border-border bg-surface/95 p-2.5 shadow-sm" style={color ? { borderTop: `3px solid ${color}` } : undefined}>
    <p className="mb-1.5 text-[10px] font-semibold" style={color ? { color } : undefined}>
      {title}
    </p>
    {children}
  </div>
);
const Line = ({ w, dot }: { w: string; dot?: string }) => (
  <div className="mb-1 flex items-center gap-1.5">
    <span className="size-2 shrink-0 rounded-sm" style={{ background: dot ?? "var(--border)" }} />
    <span className="h-1.5 rounded bg-chip" style={{ width: w }} />
  </div>
);

export function StartMockup({ variant = "personal" }: { variant?: "personal" | "team" }) {
  const team = variant === "team";
  return (
    <div className="relative" aria-hidden>
      <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-tr from-accent/25 via-purple-400/15 to-emerald-300/20 blur-2xl" />
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
        <div className="flex items-center gap-1.5 border-b border-border bg-chip px-3 py-2">
          <span className="size-2.5 rounded-full bg-red-400" />
          <span className="size-2.5 rounded-full bg-amber-400" />
          <span className="size-2.5 rounded-full bg-green-400" />
          <span className="ml-3 h-4 flex-1 rounded bg-surface px-2 text-[9px] leading-4 text-muted">{team ? "coderef.xyz/start/t/acme" : "New Tab"}</span>
        </div>
        <div className="p-3" style={{ background: team ? "linear-gradient(135deg, #0f2027, #203a43, #2c5364)" : "linear-gradient(135deg, #e0c3fc, #8ec5fc)" }}>
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded-md bg-surface/90 px-2 py-1 font-mono text-[10px] font-semibold">
              {team ? "acme" : "code"}
              <span className="text-accent">{team ? " start" : "ref"}</span>
            </span>
            <span className="flex gap-1 rounded-md bg-surface/70 p-0.5 text-[9px]">
              <span className="rounded bg-surface px-1.5 py-0.5 font-semibold">{team ? "Company" : "Home"}</span>
              <span className="px-1.5 py-0.5 text-muted">{team ? "Engineering" : "Work"}</span>
              <span className="px-1.5 py-0.5 text-muted">{team ? "Onboarding" : "Research"}</span>
            </span>
          </div>
          {team && <div className="mb-2 rounded-md bg-surface/95 px-2 py-1 text-[9px]">📣 All-hands moves to Thursday 4pm. New expense tool is live!</div>}
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-2">
              <Card title={team ? "Company apps" : "Search"}>
                {team ? (
                  <div className="grid grid-cols-3 gap-1">
                    {["#2563eb", "#16a34a", "#d97706", "#9333ea", "#0891b2", "#db2777"].map((c) => (
                      <span key={c} className="aspect-square rounded-md" style={{ background: c, opacity: 0.85 }} />
                    ))}
                  </div>
                ) : (
                  <div className="h-5 rounded-md border border-border bg-background" />
                )}
              </Card>
              <Card title="Daily" color="#2563eb">
                <Line w="70%" dot="#ea4335" />
                <Line w="55%" dot="#4285f4" />
                <Line w="80%" dot="#ff0000" />
                <Line w="45%" dot="#24292f" />
              </Card>
            </div>
            <div className="space-y-2">
              <Card title={team ? "Team news" : "Hacker News"} color="#d97706">
                <Line w="90%" />
                <Line w="75%" />
                <Line w="85%" />
                <Line w="60%" />
                <Line w="70%" />
              </Card>
              <Card title="To-do">
                <p className="text-[9px]">☑ Ship the release</p>
                <p className="text-[9px]">☐ Review PRs</p>
                <p className="text-[9px]">☐ Plan sprint</p>
              </Card>
            </div>
            <div className="space-y-2">
              <Card title="Clock">
                <p className="text-lg leading-none font-semibold tabular-nums">09:41</p>
                <p className="text-[8px] text-muted">Tuesday, 3 November</p>
              </Card>
              <Card title="Weather">
                <p className="text-[11px]">☀️ 21° · Clear</p>
              </Card>
              <Card title={team ? "Directory" : "Developer"} color="#9333ea">
                <Line w="65%" dot="#9333ea" />
                <Line w="50%" dot="#16a34a" />
                <Line w="75%" dot="#0891b2" />
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
