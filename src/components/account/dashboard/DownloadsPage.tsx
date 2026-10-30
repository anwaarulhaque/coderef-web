"use client";

import Link from "next/link";
import { download, requirePro, useAccount } from "@/lib/account/client";
import { BULK_LIMIT, FRAMEWORK_EXPORTS, type ExportFormat } from "@/lib/plans";
import { Alert, btn, card, Lock, ProBadge, UnlockPanel, useAction, useItems } from "./ui";

const FORMATS: { id: ExportFormat; label: string; hint: string }[] = [
  { id: "zip", label: "Complete package", hint: "DESIGN.md, light/dark HTML, tokens.json, styles.css and every framework export" },
  ...FRAMEWORK_EXPORTS.map((f) => ({ id: f.format, label: f.label, hint: `${f.file}: ${f.howTo}` })),
];

export function DownloadsPage({ collections }: { collections: { id: string; label: string; count: number }[] }) {
  const { me } = useAccount();
  const user = me!.user!;
  const { items } = useItems();
  const { busy, error, run } = useAction();
  const favourites = (items ?? []).filter((i) => i.kind === "favorite");
  const locked = !user.pro;

  const get = (key: string, label: string, path: string, body: unknown, fallback: string) =>
    run(key, async () => {
      if (!(await requirePro(label))) return;
      await download(path, body, fallback);
    });

  return (
    <>
      {locked && (
        <UnlockPanel title="Unlock downloads with Pro" remaining={me?.lifetimeRemaining ?? 0}>
          Download complete Design System packages, Tailwind v4 and v3, shadcn/ui and Figma-token exports for any design, and whole DESIGN.md collections in one ZIP. Previews, single DESIGN.md files and HTML stay free on every design page.
        </UnlockPanel>
      )}
      {error && <Alert tone="error">{error}</Alert>}

      <section className={card} aria-labelledby="dl-fav">
        <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="dl-fav" className="text-lg font-semibold">Your designs</h2>
          <Link href="/design-md/" className="text-sm text-accent hover:underline">Browse the library</Link>
        </div>
        <p className="mb-4 text-sm text-muted">Packages and exports for your favourite designs. Add more with ♡ on any design page.</p>
        {items === null ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : favourites.length === 0 ? (
          <p className="text-sm text-muted">
            No favourites yet. Open a design in the <Link href="/design-md/" className="text-accent hover:underline">DESIGN.md library</Link> and tap ♡; it appears here with its downloads.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {favourites.map((f) => {
              const id = f.data?.id ?? f.title;
              const name = f.data?.name ?? f.title;
              return (
                <li key={f.id} className="py-3">
                  <div className="mb-2 flex items-baseline justify-between gap-2">
                    <Link href={`/design-md/${id}/`} className="font-medium hover:text-accent">{name}</Link>
                    <span className="truncate text-xs text-muted">{id}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {FORMATS.map((fmt) => (
                      <button
                        key={fmt.id}
                        type="button"
                        title={fmt.hint}
                        className={btn}
                        disabled={busy === `${id}:${fmt.id}`}
                        onClick={() => get(`${id}:${fmt.id}`, `${fmt.label} downloads`, "/exports/design", { id, format: fmt.id }, `${id.split("/").pop()}-${fmt.id}`)}
                      >
                        {locked ? <Lock /> : <DownloadIcon />}
                        {busy === `${id}:${fmt.id}` ? "Preparing…" : fmt.label}
                      </button>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className={card} aria-labelledby="dl-bulk">
        <h2 id="dl-bulk" className="mb-1 flex items-center gap-2 text-lg font-semibold">Whole collections {locked && <ProBadge />}</h2>
        <p className="mb-4 text-sm text-muted">Every DESIGN.md in a collection, in one ZIP (up to {BULK_LIMIT} files each).</p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {collections.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5">
              <div className="min-w-0">
                <Link href={`/design-md/${c.id}/`} className="font-medium hover:text-accent">{c.label}</Link>
                <p className="text-xs text-muted">{Math.min(c.count, BULK_LIMIT)} of {c.count} designs</p>
              </div>
              <button type="button" className={btn} disabled={busy === `bulk:${c.id}`} onClick={() => get(`bulk:${c.id}`, "Bulk downloads", "/exports/collection", { collection: c.id }, `coderef-${c.id}-designs.zip`)}>
                {locked ? <Lock /> : <DownloadIcon />}
                {busy === `bulk:${c.id}` ? "Preparing…" : "ZIP"}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className={card} aria-labelledby="dl-free">
        <h2 id="dl-free" className="mb-1 text-lg font-semibold">Free on every design page</h2>
        <p className="text-sm text-muted">Light and dark previews, the generated DESIGN.md and HTML downloads, plus Copy, Download and Raw for the original file. No account needed.</p>
      </section>
    </>
  );
}

const DownloadIcon = () => (
  <svg aria-hidden viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 2v8m0 0L5 7m3 3 3-3M3 12v2h10v-2" />
  </svg>
);
