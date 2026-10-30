"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BASELINE_INFO, BROWSER_LIST, type FeatureSummary } from "@/lib/compat-shared";
import { BaselineBadge, BROWSER_SHORT, SUPPORT_GRID, SupportCells } from "./CompatBits";

const PAGE = 60;
type BaselineFilter = "all" | "high" | "low" | "false";
type Sort = "name" | "newest";

export function FeatureIndex({ features }: { features: FeatureSummary[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [baseline, setBaseline] = useState<BaselineFilter>("all");
  const [sort, setSort] = useState<Sort>("name");
  const [limit, setLimit] = useState(PAGE);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const f of features) counts.set(f.category, (counts.get(f.category) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [features]);

  const q = query.trim().toLowerCase();
  const visible = useMemo(() => {
    const filtered = features.filter(
      (f) =>
        (category === "All" || f.category === category) &&
        (baseline === "all" || String(f.baseline) === baseline) &&
        (!q || f.name.toLowerCase().includes(q) || f.id.includes(q) || f.description.toLowerCase().includes(q)),
    );
    if (sort === "newest") {
      return [...filtered].sort((a, b) => (b.since ?? "").localeCompare(a.since ?? ""));
    }
    return filtered;
  }, [features, category, baseline, q, sort]);

  const counts = useMemo(() => {
    const c = { high: 0, low: 0, false: 0 };
    for (const f of features) c[String(f.baseline) as keyof typeof c]++;
    return c;
  }, [features]);

  const reset = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setLimit(PAGE);
  };

  return (
    <section>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <input
          type="search"
          value={query}
          onChange={(e) => reset(setQuery)(e.target.value)}
          placeholder={`Search ${features.length} features — e.g. "container", "dialog", "fetch"…`}
          aria-label="Search features"
          className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-accent lg:max-w-md"
        />
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={category}
            onChange={(e) => reset(setCategory)(e.target.value)}
            aria-label="Category"
            className="h-9 rounded-lg border border-border bg-surface px-2 text-sm"
          >
            <option value="All">All categories</option>
            {categories.map(([name, n]) => (
              <option key={name} value={name}>
                {name} ({n})
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            aria-label="Sort"
            className="h-9 rounded-lg border border-border bg-surface px-2 text-sm"
          >
            <option value="name">Sort: A–Z</option>
            <option value="newest">Sort: newest Baseline</option>
          </select>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Baseline status">
        {(["all", "high", "low", "false"] as BaselineFilter[]).map((b) => (
          <button
            key={b}
            type="button"
            onClick={() => reset(setBaseline)(b)}
            aria-pressed={baseline === b}
            className={`h-8 rounded-full border px-3 text-sm transition-colors ${
              baseline === b ? "border-accent bg-accent text-surface" : "border-border bg-surface text-muted hover:text-foreground"
            }`}
          >
            {b === "all" ? `All (${features.length})` : `${BASELINE_INFO[b].label} (${counts[b]})`}
          </button>
        ))}
      </div>

      <p className="mb-2 text-sm text-muted">
        {visible.length} {visible.length === 1 ? "feature" : "features"}
      </p>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <div className="min-w-[860px]">
          <div className="sticky top-0 grid grid-cols-[minmax(0,1fr)_auto_28rem] items-end gap-4 border-b border-border bg-surface px-4 py-2 text-[11px] font-medium text-muted">
            <span>Feature</span>
            <span className="w-32">Baseline</span>
            <div className={SUPPORT_GRID}>
              {BROWSER_LIST.map((b) => (
                <span key={b.id} className="text-center leading-tight" title={b.name}>
                  {BROWSER_SHORT[b.id]}
                </span>
              ))}
            </div>
          </div>
          <ul>
            {visible.slice(0, limit).map((f) => (
              <li
                key={f.id}
                className="grid grid-cols-[minmax(0,1fr)_auto_28rem] items-center gap-4 border-b border-border px-4 py-2.5 last:border-b-0 hover:bg-chip/50"
              >
                <div className="min-w-0">
                  <Link href={`/browser-support/${f.id}/`} className="font-medium hover:text-accent hover:underline">
                    {f.name}
                  </Link>
                  <p className="truncate text-xs text-muted" title={f.description}>
                    {f.category} · {f.description}
                  </p>
                </div>
                <span className="w-32">
                  <BaselineBadge baseline={f.baseline} />
                </span>
                <div className={SUPPORT_GRID}>
                  <SupportCells support={f.support} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {visible.length > limit && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setLimit((n) => n + PAGE * 2)}
            className="rounded-lg border border-border bg-surface px-4 py-2 text-sm hover:border-accent hover:text-accent"
          >
            Show more ({visible.length - limit} remaining)
          </button>
        </div>
      )}
    </section>
  );
}
