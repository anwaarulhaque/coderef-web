"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { QuickRefSearchRow, QuickRefSummary } from "@/lib/quickref";
import { Snippet } from "./Snippet";

const MAX_RESULTS = 60;

// Languages name the same idea differently; search for one finds the others.
const SYNONYM_GROUPS = [
  ["list", "array", "vector", "slice", "vec"],
  ["dict", "dictionary", "map", "hash", "object", "record"],
  ["function", "method", "func", "fn", "def"],
  ["string", "str", "text"],
  ["remove", "delete", "pop"],
  ["print", "log", "output", "echo", "println"],
  ["error", "exception", "catch", "rescue"],
  ["loop", "iterate", "each", "foreach"],
  ["length", "len", "size", "count"],
];
const SYNONYMS = new Map<string, string[]>();
for (const group of SYNONYM_GROUPS) for (const w of group) SYNONYMS.set(w, group);
const alternatives = (word: string) => SYNONYMS.get(word) ?? [word];

export function QuickRefIndex({ topics, rows }: { topics: QuickRefSummary[]; rows: QuickRefSearchRow[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  const categories = useMemo(() => ["All", ...new Set(topics.map((t) => t.category))], [topics]);
  const q = query.trim().toLowerCase();
  const searching = q.length > 0;

  // Every word (or a synonym) must appear in the task, section, topic name or code.
  const results = useMemo(() => {
    const words = q.split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    const categoryOf = new Map(topics.map((t) => [t.slug, t.category]));
    return rows.filter((r) => {
      const hay = `${r.task} ${r.section} ${r.topic} ${r.code}`.toLowerCase();
      return words.every((w) => alternatives(w).some((a) => hay.includes(a))) && (category === "All" || categoryOf.get(r.slug) === category);
    });
  }, [rows, q, category, topics]);

  const visibleTopics = topics.filter(
    (t) => (category === "All" || t.category === category) && (!q || t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)),
  );

  return (
    <>
      <div className="mb-6 flex flex-col gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${rows.length.toLocaleString("en")} snippets across every language — try "reverse list", "read file", "sort"…`}
          aria-label="Search all quick references"
          className="h-12 w-full rounded-xl border border-border bg-surface px-4 text-base outline-none focus:border-accent"
        />
        <div className="flex flex-wrap gap-2" role="group" aria-label="Category">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              aria-pressed={category === c}
              className={`h-8 rounded-full border px-3 text-sm transition-colors ${
                category === c ? "border-accent bg-accent text-surface" : "border-border bg-surface text-muted hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {searching && (
        <section className="mb-10">
          <h2 className="mb-3 text-lg font-semibold">
            {results.length ? `${results.length} matching snippet${results.length === 1 ? "" : "s"}` : "No matching snippets"}
            {results.length > MAX_RESULTS && <span className="text-sm font-normal text-muted"> — showing the first {MAX_RESULTS}</span>}
          </h2>
          {results.length > 0 && (
            <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
              {results.slice(0, MAX_RESULTS).map((r) => (
                <li key={`${r.slug}-${r.section}-${r.task}`} className="grid gap-2 px-4 py-3 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{r.task}</p>
                    <Link href={`/quick-reference/${r.slug}/#${r.anchor}`} className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-muted hover:text-accent">
                      <span className="inline-block size-2 rounded-full" style={{ backgroundColor: r.color }} aria-hidden />
                      {r.topic} · {r.section}
                    </Link>
                  </div>
                  <Snippet code={r.code} compact />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section>
        {searching && visibleTopics.length > 0 && <h2 className="mb-3 text-lg font-semibold">Topics</h2>}
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibleTopics.map((t) => (
            <li key={t.slug}>
              <Link
                href={`/quick-reference/${t.slug}/`}
                className="group flex h-full flex-col rounded-xl border border-border bg-surface p-5 transition-shadow hover:shadow-md"
                style={{ borderTopColor: t.color, borderTopWidth: 4 }}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-lg font-semibold group-hover:text-accent">{t.title}</h3>
                  <span className="shrink-0 text-xs text-muted">{t.category}</span>
                </div>
                <p className="mt-2 flex-1 text-sm text-muted">{t.description}</p>
                <p className="mt-4 font-mono text-xs text-muted">
                  {t.sections} sections · {t.rows} snippets
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
