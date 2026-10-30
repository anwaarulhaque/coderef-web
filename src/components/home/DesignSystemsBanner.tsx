import Link from "next/link";
import type { ReactNode } from "react";
import { DesignCard } from "@/components/designmd/DesignCard";
import { getCollections, getDesigns, getTopRank, toIndexEntry } from "@/lib/design-md";

const SHOWN = 20;

// Brand marks from simple-icons (CC0). OpenAI's marks are not published there, so ChatGPT and Codex get
// neutral glyphs rather than an imitation of their logo.
const icon = (d: string, color?: string) => (
  <svg viewBox="0 0 24 24" className="size-4 shrink-0" fill={color ?? "currentColor"} aria-hidden>
    <path d={d} />
  </svg>
);
const outline = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {children}
  </svg>
);

const ASSISTANTS: { name: string; icon: ReactNode }[] = [
  {
    name: "Claude Code",
    icon: icon("M21 10.5h3v3h-3v3h-1.5v3H18v-3h-1.5v3H15v-3H9v3H7.5v-3H6v3H4.5v-3H3v-3H0v-3h3v-6h18Zm-15 0h1.5v-3H6Zm10.5 0H18v-3h-1.5z", "#D97757"),
  },
  {
    name: "Cursor",
    icon: icon(
      "M11.503.131 1.891 5.678a.84.84 0 0 0-.42.726v11.188c0 .3.162.575.42.724l9.609 5.55a1 1 0 0 0 .998 0l9.61-5.55a.84.84 0 0 0 .42-.724V6.404a.84.84 0 0 0-.42-.726L12.497.131a1.01 1.01 0 0 0-.996 0M2.657 6.338h18.55c.263 0 .43.287.297.515L12.23 22.918c-.062.107-.229.064-.229-.06V12.335a.59.59 0 0 0-.295-.51l-9.11-5.257c-.109-.063-.064-.23.061-.23",
    ),
  },
  { name: "Codex", icon: outline(<><path d="m5 8 4 4-4 4" /><path d="M12 17h7" /></>) },
  {
    name: "Gemini",
    icon: icon(
      "M11.04 19.32Q12 21.51 12 24q0-2.49.93-4.68.96-2.19 2.58-3.81t3.81-2.55Q21.51 12 24 12q-2.49 0-4.68-.93a12.3 12.3 0 0 1-3.81-2.58 12.3 12.3 0 0 1-2.58-3.81Q12 2.49 12 0q0 2.49-.96 4.68-.93 2.19-2.55 3.81a12.3 12.3 0 0 1-3.81 2.58Q2.49 12 0 12q2.49 0 4.68.96 2.19.93 3.81 2.55t2.55 3.81",
      "#8E75B2",
    ),
  },
  { name: "ChatGPT", icon: outline(<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-5A8 8 0 1 1 21 12Z" />) },
];

/** The home page's lead: the DESIGN.md library pitched as its own product, with the first top brands. */
export async function DesignSystemsBanner() {
  const [designs, collections] = await Promise.all([getDesigns(), getCollections()]);
  const top = designs
    .filter((d) => getTopRank(d.id) !== undefined)
    .sort((a, b) => getTopRank(a.id)! - getTopRank(b.id)!)
    .slice(0, SHOWN);
  if (!top.length) return null;
  const total = designs.filter((d) => !d.external).length.toLocaleString("en");

  const features = [
    [`${total} design systems`, "Apple, Stripe, Airbnb, Notion and every top brand, plus indie and mobile apps."],
    ["Tokens your agent can follow", "Colors, typography, spacing and components, written as rules — not screenshots."],
    ["Real site screenshots", "See each brand's live site next to its DESIGN.md before you pick one."],
    ["Free, no sign-up", "Copy, download or curl a DESIGN.md straight into your project root."],
  ];

  return (
    <section className="mb-14 w-full" aria-labelledby="design-systems-heading">
      <div className="mb-8">
        <Link href="/design-md/" className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent hover:bg-accent/15">
          <span className="rounded-full bg-accent px-1.5 py-px text-[10px] font-bold text-surface">NEW</span>
          DESIGN.md Library
        </Link>
        <h1 id="design-systems-heading" className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Design Systems of Top Brands
        </h1>
        <p className="mt-4 max-w-2xl text-base text-muted sm:text-lg">
          Drop a brand&apos;s <code className="rounded bg-chip px-1.5 py-0.5 font-mono text-[0.9em]">DESIGN.md</code> into your project and your AI coding
          assistant builds UI in that style — the right colors, type, spacing and components, on the first try.
        </p>

        <div className="mt-6 rounded-2xl border border-accent/30 bg-accent/5 p-4 sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">Works with</p>
          <ul className="mt-3 flex flex-wrap items-center gap-2">
            {ASSISTANTS.map((a) => (
              <li key={a.name} className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground shadow-xs">
                {a.icon}
                {a.name}
              </li>
            ))}
            <li className="px-1 text-sm text-muted">and other AI coding assistants</li>
          </ul>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/design-md/" className="inline-flex items-center rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-surface hover:opacity-90">
            Browse all {total} designs →
          </Link>
          <Link href="/design-md/?collection=top" className="inline-flex items-center rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground hover:border-accent hover:text-accent">
            ★ Top brands
          </Link>
        </div>

        <dl className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(([title, text]) => (
            <div key={title} className="rounded-xl border border-border bg-surface p-4">
              <dt className="font-semibold text-foreground">{title}</dt>
              <dd className="mt-1 text-sm text-muted">{text}</dd>
            </div>
          ))}
        </dl>
      </div>

      <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {top.map((d) => (
          <li key={d.id}>
            <DesignCard d={toIndexEntry(d)} collectionLabel={collections.find((c) => c.id === d.collection)?.label} />
          </li>
        ))}
      </ul>
    </section>
  );
}
