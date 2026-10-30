"use client";

import Link from "next/link";
import { useState } from "react";
import { api, refreshAccount, TOOL_PATHS, useAccount } from "@/lib/account/client";
import { Alert, btn, card, fmtDate, ProBadge, useAction, useItems } from "./ui";

type Kind = keyof typeof TOOL_PATHS;

export function SavedPage() {
  const { me } = useAccount();
  const user = me!.user!;
  const { items, reload } = useItems();
  const { busy, error, run } = useAction();
  const [filter, setFilter] = useState<Kind | "all">("all");
  const [copied, setCopied] = useState<string | null>(null);

  const saved = (items ?? []).filter((i) => i.kind !== "favorite");
  const favourites = (items ?? []).filter((i) => i.kind === "favorite");
  const shown = filter === "all" ? saved : saved.filter((i) => i.kind === filter);
  const counts = Object.fromEntries((Object.keys(TOOL_PATHS) as Kind[]).map((k) => [k, saved.filter((i) => i.kind === k).length]));

  const copy = async (text: string, id: string) => {
    await navigator.clipboard?.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <>
      {error && <Alert tone="error">{error}</Alert>}
      <section className={card} aria-labelledby="saved-title">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="saved-title" className="text-lg font-semibold">Saved work</h2>
          {me?.usage && <span className="text-sm text-muted">{me.usage.saved} of {me.usage.limit} used{!user.pro && <> · <Link href="/pricing/" className="text-accent hover:underline">get 500 with Pro</Link></>}</span>}
        </div>
        <div role="tablist" aria-label="Filter by tool" className="mb-3 flex flex-wrap gap-1">
          {(["all", ...Object.keys(TOOL_PATHS)] as (Kind | "all")[]).map((k) => (
            <button
              key={k}
              role="tab"
              type="button"
              aria-selected={filter === k}
              onClick={() => setFilter(k)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${filter === k ? "bg-accent text-surface" : "bg-chip text-muted hover:text-foreground"}`}
            >
              {k === "all" ? `All (${saved.length})` : `${TOOL_PATHS[k].label} (${counts[k]})`}
            </button>
          ))}
        </div>
        {items === null ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : shown.length === 0 ? (
          <p className="text-sm text-muted">
            Nothing here yet. Open{" "}
            {(filter === "all" ? Object.values(TOOL_PATHS) : [TOOL_PATHS[filter]]).map((t, i, all) => (
              <span key={t.path}>
                <Link href={t.path} className="text-accent hover:underline">{t.label}</Link>
                {i < all.length - 2 ? ", " : i === all.length - 2 ? " or " : ""}
              </span>
            ))}{" "}
            and use the <span className="font-medium">Saved</span> button.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {shown.map((it) => {
              const tool = TOOL_PATHS[it.kind as Kind];
              const shareUrl = it.shareId ? `${window.location.origin}${tool.path}?share=${it.shareId}` : null;
              return (
                <li key={it.id} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 py-2.5">
                  <span className="w-32 shrink-0 text-xs text-muted">{tool?.label}</span>
                  <Link href={`${tool?.path ?? "/"}?item=${it.id}`} className="min-w-0 flex-1 truncate font-medium hover:text-accent">{it.title}</Link>
                  <span className="text-xs text-muted">{fmtDate(it.updatedAt)}</span>
                  {shareUrl ? (
                    <>
                      <button type="button" className="text-xs text-accent hover:underline" onClick={() => copy(shareUrl, it.id)}>{copied === it.id ? "Copied ✓" : "Copy share link"}</button>
                      <button type="button" className="text-xs text-muted hover:text-foreground" disabled={busy === `s${it.id}`} onClick={() => run(`s${it.id}`, async () => { await api("DELETE", `/items/${it.id}/share`); await reload(); })}>Stop sharing</button>
                    </>
                  ) : user.pro ? (
                    <button type="button" className="text-xs text-accent hover:underline" disabled={busy === `s${it.id}`} onClick={() => run(`s${it.id}`, async () => { const r = await api<{ item: { shareId: string } }>("POST", `/items/${it.id}/share`); await reload(); await copy(`${window.location.origin}${tool.path}?share=${r.item.shareId}`, it.id); })}>Share</button>
                  ) : (
                    <Link href="/pricing/?feature=Share%20links" className="flex items-center gap-1 text-xs text-muted hover:text-accent">Share <ProBadge /></Link>
                  )}
                  <button type="button" aria-label={`Delete ${it.title}`} className="text-xs text-muted hover:text-red-600" disabled={busy === it.id} onClick={() => run(it.id, async () => { await api("DELETE", `/items/${it.id}`); await reload(); await refreshAccount(); })}>
                    Delete
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section id="favourites" className={`${card} scroll-mt-24`} aria-labelledby="fav-title">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="fav-title" className="text-lg font-semibold">Favourite designs</h2>
          {favourites.length > 0 && <Link href="/account/downloads/" className="text-sm text-accent hover:underline">Download their packages →</Link>}
        </div>
        {favourites.length === 0 ? (
          <p className="text-sm text-muted">
            Tap ♡ on any design in the <Link href="/design-md/" className="text-accent hover:underline">DESIGN.md library</Link> to keep it here. Favourites are free and don&apos;t count towards your saves.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {favourites.map((f) => (
              <li key={f.id} className="flex items-center overflow-hidden rounded-full border border-border">
                <Link href={`/design-md/${f.data?.id ?? f.title}/`} className="px-3 py-1 text-sm hover:text-accent">{f.data?.name ?? f.title}</Link>
                <button type="button" aria-label={`Remove ${f.data?.name ?? f.title} from favourites`} className={`${btn} rounded-none border-0 border-l px-2 py-1 text-xs`} disabled={busy === f.id} onClick={() => run(f.id, async () => { await api("DELETE", `/items/${f.id}`); await reload(); })}>
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
