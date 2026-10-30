"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BROWSER_LIST, supportedIn, type BrowserId, type FeatureSummary } from "@/lib/compat-shared";
import { BaselineBadge } from "./CompatBits";

type Release = { version: string; date: string };
type Side = { browser: BrowserId; version: string };
type Tab = "onlyA" | "onlyB" | "both" | "neither";

const nameOf = (id: BrowserId) => BROWSER_LIST.find((b) => b.id === id)!.name;

function SidePicker({
  label,
  side,
  releases,
  onChange,
}: {
  label: string;
  side: Side;
  releases: Record<BrowserId, Release[]>;
  onChange: (side: Side) => void;
}) {
  const versions = [...(releases[side.browser] ?? [])].reverse();
  return (
    <fieldset className="flex-1 rounded-xl border border-border bg-surface p-4">
      <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-muted">{label}</legend>
      <div className="flex flex-wrap gap-2">
        <select
          value={side.browser}
          aria-label={`${label} browser`}
          onChange={(e) => {
            const browser = e.target.value as BrowserId;
            const list = releases[browser] ?? [];
            onChange({ browser, version: list[list.length - 1]?.version ?? "" });
          }}
          className="h-10 flex-1 rounded-lg border border-border bg-background px-2 text-sm"
        >
          {BROWSER_LIST.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <select
          value={side.version}
          aria-label={`${label} version`}
          onChange={(e) => onChange({ ...side, version: e.target.value })}
          className="h-10 w-44 rounded-lg border border-border bg-background px-2 text-sm"
        >
          {versions.map((r, i) => (
            <option key={r.version} value={r.version}>
              {r.version} ({r.date.slice(0, 4)}){i === 0 ? " · latest" : ""}
            </option>
          ))}
        </select>
      </div>
    </fieldset>
  );
}

export function BrowserCompare({
  features,
  releases,
}: {
  features: FeatureSummary[];
  releases: Record<BrowserId, Release[]>;
}) {
  const latest = (b: BrowserId) => releases[b]?.[releases[b].length - 1]?.version ?? "";
  const [a, setA] = useState<Side>({ browser: "chrome", version: latest("chrome") });
  const [b, setB] = useState<Side>({ browser: "safari", version: latest("safari") });
  const [tab, setTab] = useState<Tab>("onlyA");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [loaded, setLoaded] = useState(false);

  // Shareable state in the URL hash: #a=chrome:141&b=safari:26
  useEffect(() => {
    const params = new URLSearchParams(location.hash.slice(1));
    const parse = (v: string | null): Side | null => {
      if (!v) return null;
      const [browser, version] = v.split(":");
      if (!BROWSER_LIST.some((x) => x.id === browser)) return null;
      return releases[browser as BrowserId]?.some((r) => r.version === version) ? { browser: browser as BrowserId, version } : null;
    };
    /* eslint-disable react-hooks/set-state-in-effect -- one-time hydration from the URL */
    const pa = parse(params.get("a"));
    const pb = parse(params.get("b"));
    if (pa) setA(pa);
    if (pb) setB(pb);
    setLoaded(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [releases]);

  useEffect(() => {
    if (loaded) history.replaceState(null, "", `#a=${a.browser}:${a.version}&b=${b.browser}:${b.version}`);
  }, [a, b, loaded]);

  const result = useMemo(() => {
    const groups: Record<Tab, FeatureSummary[]> = { onlyA: [], onlyB: [], both: [], neither: [] };
    for (const f of features) {
      const inA = supportedIn(f.support[a.browser], a.version);
      const inB = supportedIn(f.support[b.browser], b.version);
      groups[inA && inB ? "both" : inA ? "onlyA" : inB ? "onlyB" : "neither"].push(f);
    }
    return groups;
  }, [features, a, b]);

  const labelA = `${nameOf(a.browser)} ${a.version}`;
  const labelB = `${nameOf(b.browser)} ${b.version}`;
  const totalA = result.onlyA.length + result.both.length;
  const totalB = result.onlyB.length + result.both.length;

  const q = query.trim().toLowerCase();
  const rows = result[tab].filter(
    (f) => (category === "All" || f.category === category) && (!q || f.name.toLowerCase().includes(q) || f.id.includes(q)),
  );
  const categories = useMemo(() => [...new Set(features.map((f) => f.category))].sort(), [features]);

  const presets: { label: string; a: Side; b: Side }[] = [
    { label: "Chrome vs Safari", a: { browser: "chrome", version: latest("chrome") }, b: { browser: "safari", version: latest("safari") } },
    { label: "Chrome vs Firefox", a: { browser: "chrome", version: latest("chrome") }, b: { browser: "firefox", version: latest("firefox") } },
    { label: "Firefox vs Safari", a: { browser: "firefox", version: latest("firefox") }, b: { browser: "safari", version: latest("safari") } },
    { label: "Desktop vs iOS Safari", a: { browser: "safari", version: latest("safari") }, b: { browser: "safari_ios", version: latest("safari_ios") } },
  ];
  const prev = (id: BrowserId, back: number) => releases[id]?.[Math.max(0, releases[id].length - 1 - back)]?.version ?? "";
  presets.push(
    { label: `New in Safari ${latest("safari")}`, a: { browser: "safari", version: latest("safari") }, b: { browser: "safari", version: prev("safari", 1) } },
    { label: "Chrome: last 6 releases", a: { browser: "chrome", version: latest("chrome") }, b: { browser: "chrome", version: prev("chrome", 6) } },
  );

  const TABS: { id: Tab; label: string; count: number }[] = [
    { id: "onlyA", label: `Only in ${labelA}`, count: result.onlyA.length },
    { id: "onlyB", label: `Only in ${labelB}`, count: result.onlyB.length },
    { id: "both", label: "In both", count: result.both.length },
    { id: "neither", label: "In neither", count: result.neither.length },
  ];

  return (
    <div>
      <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-stretch">
        <SidePicker label="Browser A" side={a} releases={releases} onChange={setA} />
        <button
          type="button"
          onClick={() => {
            setA(b);
            setB(a);
          }}
          className="self-center rounded-full border border-border bg-surface px-3 py-2 text-sm hover:border-accent hover:text-accent"
          title="Swap A and B"
        >
          ⇄ Swap
        </button>
        <SidePicker label="Browser B" side={b} releases={releases} onChange={setB} />
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <span className="self-center text-xs text-muted">Quick compare:</span>
        {presets.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => {
              setA(p.a);
              setB(p.b);
            }}
            className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted hover:border-accent hover:text-accent"
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-4">
        {[
          { label: labelA, value: totalA, sub: "features supported" },
          { label: labelB, value: totalB, sub: "features supported" },
          { label: "Difference", value: result.onlyA.length + result.onlyB.length, sub: "supported by only one" },
          { label: "Shared", value: result.both.length, sub: `of ${features.length} features` },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-surface p-4">
            <p className="truncate text-xs text-muted">{s.label}</p>
            <p className="text-2xl font-semibold">{s.value.toLocaleString("en")}</p>
            <p className="text-xs text-muted">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="mb-3 flex flex-wrap gap-1 border-b border-border" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm ${
              tab === t.id ? "border-accent font-medium text-foreground" : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {t.label} <span className="text-muted">({t.count})</span>
          </button>
        ))}
      </div>

      <div className="mb-3 flex flex-col gap-2 sm:flex-row">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter these features…"
          aria-label="Filter features"
          className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-accent sm:max-w-xs"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Category"
          className="h-9 rounded-lg border border-border bg-surface px-2 text-sm"
        >
          <option value="All">All categories</option>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-border bg-surface p-6 text-center text-sm text-muted">No features in this group.</p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
          {rows.slice(0, 300).map((f) => (
            <li key={f.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5">
              <div className="min-w-0 flex-1">
                <Link href={`/browser-support/${f.id}/`} className="font-medium hover:text-accent hover:underline">
                  {f.name}
                </Link>
                <span className="ml-2 text-xs text-muted">{f.category}</span>
              </div>
              <BaselineBadge baseline={f.baseline} />
              {[a, b].map((side, i) => {
                const v = f.support[side.browser];
                const ok = supportedIn(v, side.version);
                return (
                  <span
                    key={i}
                    className={`w-36 rounded px-2 py-0.5 text-center font-mono text-[11px] ${
                      ok ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300" : "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                    }`}
                    title={`${nameOf(side.browser)}: ${v ? `since ${v}` : "not supported"}`}
                  >
                    {nameOf(side.browser)} {v ? `${v}+` : "✕"}
                  </span>
                );
              })}
            </li>
          ))}
          {rows.length > 300 && <li className="px-4 py-2 text-xs text-muted">…and {rows.length - 300} more — narrow it with the filter.</li>}
        </ul>
      )}
    </div>
  );
}
