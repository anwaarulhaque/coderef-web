"use client";

import { useState } from "react";
import type { MarkdownEntry } from "@/lib/markdown/cheatsheet";

export function CheatSheetViewer({ entries }: { entries: MarkdownEntry[] }) {
  const [tab, setTab] = useState<MarkdownEntry["group"]>("Basic syntax");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const groups: MarkdownEntry["group"][] = ["Basic syntax", "Extended syntax"];

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1200);
    } catch {
      // fallback
    }
  };

  const handleScrollToEditor = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filtered = entries.filter((e) => {
    if (e.group !== tab) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return e.element.toLowerCase().includes(q) || e.markdown.toLowerCase().includes(q) || (e.note && e.note.toLowerCase().includes(q));
  });

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border">
        <div className="flex gap-1" role="tablist">
          {groups.map((g) => {
            const count = entries.filter((e) => e.group === g).length;
            return (
              <button
                key={g}
                type="button"
                role="tab"
                aria-selected={tab === g}
                onClick={() => setTab(g)}
                className={`-mb-px border-b-2 px-3.5 py-2 text-sm font-medium transition-colors ${
                  tab === g
                    ? "border-accent text-foreground"
                    : "border-transparent text-muted hover:border-border hover:text-foreground"
                }`}
              >
                {g} ({count})
              </button>
            );
          })}
        </div>

        <div className="pb-1.5">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter cheatsheet…"
            className="h-8 w-48 rounded-lg border border-border bg-surface px-2.5 text-xs outline-none focus:border-accent"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="hidden grid-cols-[10rem_minmax(0,1.2fr)_minmax(0,1.2fr)_6.5rem] gap-4 border-b border-border px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted md:grid">
          <span>Element</span>
          <span>Markdown Source</span>
          <span>Rendered Result</span>
          <span className="text-right">Actions</span>
        </div>

        <ul className="divide-y divide-border">
          {filtered.map((e) => (
            <li
              key={e.id}
              className="grid gap-3 px-4 py-3 md:grid-cols-[10rem_minmax(0,1.2fr)_minmax(0,1.2fr)_6.5rem] md:items-center md:gap-4"
            >
              <div>
                <p className="font-semibold text-sm">{e.element}</p>
                {e.note && <p className="mt-1 text-xs text-muted leading-relaxed">{e.note}</p>}
              </div>

              <pre className="overflow-x-auto rounded-lg bg-background p-2.5 font-mono text-[12.5px] leading-5 text-foreground whitespace-pre-wrap">
                {e.markdown}
              </pre>

              <div
                className="md-preview overflow-auto rounded-lg border border-border bg-background/50 p-2.5 text-sm"
                dangerouslySetInnerHTML={{ __html: e.html }}
              />

              <div className="flex flex-col items-start gap-1.5 md:items-end">
                <button
                  type="button"
                  onClick={() => handleCopy(e.id, e.markdown)}
                  className="rounded-md border border-border px-2.5 py-1 text-xs text-muted hover:border-accent hover:text-foreground transition-colors"
                >
                  {copiedId === e.id ? "✓ Copied" : "Copy"}
                </button>
                <button
                  type="button"
                  onClick={handleScrollToEditor}
                  className="rounded-md border border-border px-2.5 py-1 text-xs text-accent hover:border-accent hover:bg-accent/10 transition-colors"
                >
                  Go to editor ↑
                </button>
              </div>
            </li>
          ))}
        </ul>

        {filtered.length === 0 && (
          <div className="p-8 text-center text-sm text-muted">
            No syntax elements found matching &quot;{search}&quot;.
          </div>
        )}
      </div>
    </div>
  );
}
