"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { SheetSummary } from "@/lib/types";

const ALL = "All";

function letterOf(title: string) {
  const first = title.replace(/^[^A-Za-z0-9]+/, "").charAt(0).toUpperCase();
  return /[A-Z]/.test(first) ? first : "#";
}

export function SheetBrowser({ sheets }: { sheets: SheetSummary[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(ALL);

  const categories = useMemo(
    () => [ALL, ...[...new Set(sheets.map((sheet) => sheet.category))].sort()],
    [sheets],
  );

  const q = query.trim().toLowerCase();
  const visible = sheets.filter(
    (sheet) =>
      (category === ALL || sheet.category === category) &&
      (!q ||
        sheet.title.toLowerCase().includes(q) ||
        sheet.slug.includes(q) ||
        sheet.description.toLowerCase().includes(q)),
  );
  const full = visible.filter((sheet) => sheet.kind !== "links");

  const byLetter = new Map<string, SheetSummary[]>();
  for (const sheet of visible) {
    const letter = letterOf(sheet.title);
    byLetter.set(letter, [...(byLetter.get(letter) ?? []), sheet]);
  }
  const letters = [...byLetter.keys()].sort();

  return (
    <>
      <div className="mb-6 flex flex-col gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${sheets.length} topics…`}
          aria-label="Search topics"
          className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-accent sm:max-w-sm"
        />
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          {categories.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setCategory(name)}
              aria-pressed={category === name}
              className={`h-8 rounded-full border px-3 text-sm transition-colors ${
                category === name
                  ? "border-accent bg-accent text-surface"
                  : "border-border bg-surface text-muted hover:text-foreground"
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 && <p className="text-muted">No topics match “{query}”.</p>}

      {full.length > 0 && (
        <section className="mb-12">
          <h2 className="mb-4 text-xl font-semibold tracking-tight">
            Cheat sheets <span className="text-sm font-normal text-muted">({full.length})</span>
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {full.map((sheet) => (
              <li key={sheet.slug}>
                <Link
                  href={`/${sheet.slug}/`}
                  className="group flex h-full flex-col rounded-xl border border-border bg-surface p-5 transition-shadow hover:shadow-md"
                  style={{ borderTopColor: sheet.color, borderTopWidth: 4 }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-lg font-semibold group-hover:text-accent">{sheet.title}</h3>
                    <span className="shrink-0 text-xs text-muted">{sheet.category}</span>
                  </div>
                  <p className="mt-2 flex-1 text-sm text-muted">{sheet.description}</p>
                  <p className="mt-4 font-mono text-xs text-muted">
                    {sheet.itemCount > 0 ? `${sheet.itemCount} entries` : "Interactive tool"}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {visible.length > 0 && (
        <section id="directory">
          <h2 className="mb-1 text-xl font-semibold tracking-tight">
            A–Z directory <span className="text-sm font-normal text-muted">({visible.length})</span>
          </h2>
          <p className="mb-4 text-sm text-muted">
            Bold topics have a full cheat sheet; the rest link to official docs and cheat sheets.
          </p>
          <nav className="mb-6 flex flex-wrap gap-1" aria-label="Jump to letter">
            {letters.map((letter) => (
              <a
                key={letter}
                href={`#letter-${letter}`}
                className="flex size-8 items-center justify-center rounded-md border border-border bg-surface font-mono text-sm text-muted hover:text-accent"
              >
                {letter}
              </a>
            ))}
          </nav>
          <div className="space-y-6">
            {letters.map((letter) => (
              <div key={letter} id={`letter-${letter}`} className="scroll-mt-4 grid gap-2 sm:grid-cols-[3rem_1fr]">
                <h3 className="font-mono text-2xl font-semibold text-muted">{letter}</h3>
                <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
                  {byLetter.get(letter)!.map((sheet) => (
                    <li key={sheet.slug}>
                      <Link
                        href={`/${sheet.slug}/`}
                        className={`text-sm hover:text-accent hover:underline ${
                          sheet.kind === "links" ? "text-foreground/80" : "font-semibold"
                        }`}
                      >
                        {sheet.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
