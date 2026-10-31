"use client";

// Pricing has one tab per product: CodeRef Pro (the original) and CodeRef Start. Both are rendered, so both are in the
// static HTML; ?product=start opens the Start tab.
import { useEffect, useState, type ReactNode } from "react";

const TABS = [
  { id: "pro", label: "CodeRef Pro", sub: "Cheat sheets, tools & Design System exports" },
  { id: "start", label: "CodeRef Start", sub: "Start pages & new tab, for you and your team" },
] as const;
type Tab = (typeof TABS)[number]["id"];

export function ProductTabs({ pro, start }: { pro: ReactNode; start: ReactNode }) {
  const [tab, setTab] = useState<Tab>("pro");
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of the URL on a static page
    if (new URLSearchParams(window.location.search).get("product") === "start") setTab("start");
  }, []);
  const select = (t: Tab) => {
    setTab(t);
    const url = new URL(window.location.href);
    if (t === "start") url.searchParams.set("product", "start");
    else url.searchParams.delete("product");
    window.history.replaceState(null, "", url);
  };
  return (
    <div>
      <div role="tablist" aria-label="Product" className="mb-8 inline-grid w-full grid-cols-2 gap-1 rounded-2xl border border-border bg-chip p-1 sm:w-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            onClick={() => select(t.id)}
            className={`rounded-xl px-4 py-2.5 text-left transition sm:min-w-64 ${tab === t.id ? "bg-surface shadow-sm" : "hover:bg-surface/60"}`}
          >
            <span className="flex items-center gap-2 text-sm font-semibold">
              {t.label}
              {t.id === "start" && <span className="rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-bold text-white">NEW</span>}
            </span>
            <span className="block text-xs text-muted">{t.sub}</span>
          </button>
        ))}
      </div>
      <div role="tabpanel" id="panel-pro" aria-labelledby="tab-pro" hidden={tab !== "pro"}>
        {pro}
      </div>
      <div role="tabpanel" id="panel-start" aria-labelledby="tab-start" hidden={tab !== "start"}>
        {start}
      </div>
    </div>
  );
}
