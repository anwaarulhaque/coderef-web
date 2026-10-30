"use client";

import { useEffect, useMemo, useState } from "react";
import { cdnFetchPath, type DesignIndexEntry, HUES, HUE_SWATCH } from "@/lib/design-md-shared";
import { DesignCard } from "./DesignCard";

const PAGE = 48;
/** Pseudo-collection: the curated top brands across every collection. */
const TOP = "top";

type CollectionChip = { id: string; label: string; count: number };
type Sort = "relevance" | "name" | "detail";

let indexPromise: Promise<DesignIndexEntry[]> | null = null;
const loadIndex = () =>
  (indexPromise ??= fetch(cdnFetchPath("design-md/index.json"))
    .then((r) => (r.ok ? (r.json() as Promise<DesignIndexEntry[]>) : Promise.reject(r.status)))
    .catch((e) => {
      indexPromise = null;
      throw e;
    }));

/**
 * Search and filters for the DESIGN.md library. Everything runs in the browser over a static JSON
 * index (/design-md/index.json) — there is no database or server. Pass `items` to browse a fixed
 * set (a collection page) instead of fetching the index.
 */
export function DesignBrowser({ collections, items, initial = [], fixedCollection }: { collections: CollectionChip[]; items?: DesignIndexEntry[]; initial?: DesignIndexEntry[]; fixedCollection?: string }) {
  const [all, setAll] = useState<DesignIndexEntry[]>(items ?? initial);
  const [loaded, setLoaded] = useState(Boolean(items));
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState("");
  const [collection, setCollection] = useState(fixedCollection ?? "all");
  const [category, setCategory] = useState("all");
  const [theme, setTheme] = useState<"all" | "light" | "dark">("all");
  const [hue, setHue] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>("relevance");
  // "Show more" count, remembered per filter combination so changing a filter starts at page one.
  const filterKey = [query, collection, category, theme, hue, sort].join("|");
  const [paging, setPaging] = useState({ key: filterKey, limit: PAGE });
  const limit = paging.key === filterKey ? paging.limit : PAGE;

  useEffect(() => {
    if (items) return;
    loadIndex().then(
      (data) => {
        setAll(data);
        setLoaded(true);
      },
      () => setFailed(true),
    );
  }, [items]);

  // Restore filters from the URL once, so searches can be shared and survive the back button.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- one-time restore from the URL */
    const p = new URLSearchParams(window.location.search);
    if (p.get("q")) setQuery(p.get("q")!);
    if (!fixedCollection && p.get("collection")) setCollection(p.get("collection")!);
    if (p.get("theme") === "light" || p.get("theme") === "dark") setTheme(p.get("theme") as "light" | "dark");
    if (p.get("color")) setHue(p.get("color"));
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [fixedCollection]);

  useEffect(() => {
    const p = new URLSearchParams();
    if (query) p.set("q", query);
    if (!fixedCollection && collection !== "all") p.set("collection", collection);
    if (theme !== "all") p.set("theme", theme);
    if (hue) p.set("color", hue);
    const qs = p.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [query, collection, theme, hue, fixedCollection]);

  const inCollection = useMemo(() => all.filter((d) => collection === "all" || (collection === TOP ? d.r !== undefined : d.c === collection)), [all, collection]);
  const topCount = useMemo(() => all.filter((d) => d.r !== undefined).length, [all]);
  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const d of inCollection) if (d.g.toLowerCase() !== d.c) counts.set(d.g, (counts.get(d.g) ?? 0) + 1);
    return counts.size > 1 ? [...counts].sort((a, b) => a[0].localeCompare(b[0])) : [];
  }, [inCollection]);

  const results = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    const scored: { d: DesignIndexEntry; score: number }[] = [];
    for (const d of inCollection) {
      if (category !== "all" && d.g !== category) continue;
      if (theme !== "all" && d.t !== theme) continue;
      if (hue && d.h !== hue) continue;
      let score = 0;
      if (words.length) {
        const name = d.n.toLowerCase();
        const hay = `${name} ${d.i} ${d.s} ${d.f.join(" ")} ${d.g} ${d.c} ${d.h} ${d.t}`.toLowerCase();
        if (!words.every((w) => hay.includes(w))) continue;
        const q = words.join(" ");
        score = name === q ? 100 : name.startsWith(q) ? 50 : name.includes(q) ? 25 : words.filter((w) => name.includes(w)).length * 5;
      }
      scored.push({ d, score });
    }
    const effective = sort === "relevance" && !words.length ? "detail" : sort;
    // Top brands first, then English sites, then the rest; a search still ranks by how well the name matches.
    // Two unranked entries give Infinity - Infinity = NaN, which `|| 0` turns into a tie.
    const top = (a: DesignIndexEntry, b: DesignIndexEntry) => (a.r ?? Infinity) - (b.r ?? Infinity) || 0;
    const english = (a: DesignIndexEntry, b: DesignIndexEntry) => (a.l ?? 0) - (b.l ?? 0);
    scored.sort((a, b) =>
      effective === "name"
        ? english(a.d, b.d) || a.d.n.localeCompare(b.d.n)
        : effective === "detail"
          ? top(a.d, b.d) || english(a.d, b.d) || b.d.w - a.d.w
          : b.score - a.score || top(a.d, b.d) || english(a.d, b.d) || b.d.w - a.d.w,
    );
    return scored.map((x) => x.d);
  }, [inCollection, query, category, theme, hue, sort]);

  const labelOf = (id: string) => collections.find((c) => c.id === id)?.label;
  const chip = (active: boolean) =>
    `h-8 rounded-full border px-3 text-sm transition-colors ${active ? "border-accent bg-accent text-surface" : "border-border bg-surface text-muted hover:text-foreground"}`;
  const filtered = query || category !== "all" || theme !== "all" || hue || (!fixedCollection && collection !== "all");

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${loaded ? all.length.toLocaleString("en") : "1,000+"} design systems — try "fintech dark", "Inter", "editorial", "playful"…`}
          aria-label="Search design systems"
          className="h-12 w-full rounded-xl border border-border bg-surface px-4 text-base outline-none focus:border-accent"
        />
        {!fixedCollection && (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Collection">
            <button type="button" className={chip(collection === "all")} aria-pressed={collection === "all"} onClick={() => { setCollection("all"); setCategory("all"); }}>
              All
            </button>
            {topCount > 0 && (
              <button type="button" className={chip(collection === TOP)} aria-pressed={collection === TOP} onClick={() => { setCollection(TOP); setCategory("all"); }}>
                ★ Top brands <span className="opacity-70">{topCount}</span>
              </button>
            )}
            {collections.map((c) => (
              <button key={c.id} type="button" className={chip(collection === c.id)} aria-pressed={collection === c.id} onClick={() => { setCollection(c.id); setCategory("all"); }}>
                {c.label} <span className="opacity-70">{c.count}</span>
              </button>
            ))}
          </div>
        )}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Category">
            <button type="button" className={chip(category === "all")} aria-pressed={category === "all"} onClick={() => setCategory("all")}>
              All categories
            </button>
            {categories.map(([g, n]) => (
              <button key={g} type="button" className={`${chip(category === g)} capitalize`} aria-pressed={category === g} onClick={() => setCategory(g)}>
                {g} <span className="opacity-70">{n}</span>
              </button>
            ))}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Main color">
            <span className="mr-1 text-sm text-muted">Color</span>
            {HUES.map((h) => (
              <button
                key={h}
                type="button"
                title={h}
                aria-label={h}
                aria-pressed={hue === h}
                onClick={() => setHue(hue === h ? null : h)}
                className={`size-6 rounded-full border-2 transition-transform hover:scale-110 ${hue === h ? "border-foreground" : "border-transparent"}`}
                style={{ backgroundColor: HUE_SWATCH[h] }}
              />
            ))}
          </div>
          <div className="flex items-center gap-1.5" role="group" aria-label="Theme">
            <span className="mr-1 text-sm text-muted">Theme</span>
            {(["all", "light", "dark"] as const).map((t) => (
              <button key={t} type="button" className={`${chip(theme === t)} capitalize`} aria-pressed={theme === t} onClick={() => setTheme(t)}>
                {t}
              </button>
            ))}
          </div>
          <label className="ml-auto flex items-center gap-2 text-sm text-muted">
            Sort
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="h-8 rounded-lg border border-border bg-surface px-2 text-foreground">
              <option value="relevance">Best match</option>
              <option value="detail">Most detailed</option>
              <option value="name">Name A–Z</option>
            </select>
          </label>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between text-sm text-muted">
        <p aria-live="polite">
          {failed ? "Couldn't load the full library — showing featured designs." : !loaded ? "Loading the library…" : `${results.length.toLocaleString("en")} design system${results.length === 1 ? "" : "s"}`}
        </p>
        {filtered && (
          <button
            type="button"
            className="hover:text-accent"
            onClick={() => {
              setQuery("");
              if (!fixedCollection) setCollection("all");
              setCategory("all");
              setTheme("all");
              setHue(null);
            }}
          >
            Clear filters
          </button>
        )}
      </div>

      {results.length === 0 && loaded ? (
        <p className="rounded-xl border border-dashed border-border p-10 text-center text-muted">No design systems match. Try fewer words or clear a filter.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {results.slice(0, limit).map((d) => (
            <li key={d.i}>
              <DesignCard d={d} collectionLabel={labelOf(d.c)} />
            </li>
          ))}
        </ul>
      )}

      {results.length > limit && (
        <div className="mt-8 flex justify-center">
          <button type="button" onClick={() => setPaging({ key: filterKey, limit: limit + PAGE })} className="rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-medium hover:border-accent hover:text-accent">
            Show more ({(results.length - limit).toLocaleString("en")} left)
          </button>
        </div>
      )}
    </div>
  );
}
