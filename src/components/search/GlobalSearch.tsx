"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { startTopLoader } from "@/components/layout/TopLoader";
import type { SearchEntry, SearchKind } from "@/lib/search-index";

const KIND_LABEL: Record<SearchKind, string> = {
  page: "Pages",
  sheet: "Cheat sheets",
  snippet: "Quick reference",
  entry: "API & commands",
  feature: "Browser support",
  abbr: "HTML & CSS abbreviations",
  markdown: "Markdown",
  design: "DESIGN.md library",
};
const KIND_ORDER: SearchKind[] = ["page", "sheet", "snippet", "entry", "design", "feature", "markdown", "abbr"];
const PER_GROUP = 6;

let indexPromise: Promise<SearchEntry[]> | null = null;
const loadIndex = () =>
  (indexPromise ??= fetch("/search-index.json")
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
    .catch((err) => {
      indexPromise = null; // allow a retry next time
      throw err;
    }));

/** Higher is better; 0 = no match. Every query word must appear somewhere. */
function score(entry: SearchEntry, words: string[], phrase: string): number {
  const title = entry.t.toLowerCase();
  const hay = `${title} ${entry.s.toLowerCase()} ${entry.c?.toLowerCase() ?? ""}`;
  // Also match with spaces ignored, so "vscode" finds "VS Code".
  const squashed = hay.replace(/\s+/g, "");
  if (!words.every((w) => hay.includes(w) || squashed.includes(w))) return 0;
  let s = 1;
  if (title === phrase) s += 100;
  else if (title.startsWith(phrase)) s += 60;
  else if (title.includes(phrase)) s += 40;
  else if (words.every((w) => title.includes(w))) s += 25;
  s += Math.max(0, 20 - title.length / 3); // prefer short, specific titles
  if (entry.k === "page" || entry.k === "sheet") s += 15;
  return s;
}

const isExternal = (url: string) => /^https?:\/\//.test(url);

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState<SearchEntry[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const openSearch = useCallback(() => {
    setOpen(true);
    setFailed(false);
    loadIndex().then(setIndex, () => setFailed(true));
  }, []);

  // Ctrl/⌘+K anywhere, or "/" when not typing in a field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && (e.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName));
      if ((e.key === "k" || e.key === "K") && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (open) setOpen(false);
        else openSearch();
      } else if (e.key === "/" && !typing && !open) {
        e.preventDefault();
        openSearch();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, openSearch]);

  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(id);
      document.body.style.overflow = "";
    };
  }, [open]);

  const groups = useMemo(() => {
    const phrase = query.trim().toLowerCase();
    if (!index || !phrase) return [];
    const words = phrase.split(/\s+/);
    const scored = index
      .map((e) => ({ e, s: score(e, words, phrase) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s);
    return KIND_ORDER.map((kind) => ({ kind, items: scored.filter((x) => x.e.k === kind).slice(0, PER_GROUP).map((x) => x.e) })).filter(
      (g) => g.items.length > 0,
    );
  }, [index, query]);

  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);

  const go = (entry: SearchEntry) => {
    setOpen(false);
    setQuery("");
    if (isExternal(entry.u)) window.open(entry.u, "_blank", "noopener,noreferrer");
    else {
      startTopLoader(entry.u);
      router.push(entry.u);
    }
  };

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  let n = -1;

  return (
    <>
      <button
        type="button"
        onClick={openSearch}
        className="flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm text-muted transition-colors hover:border-accent hover:text-foreground"
        aria-label="Search the site"
      >
        <svg aria-hidden width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <span className="hidden sm:inline">Search…</span>
        <kbd className="hidden rounded border border-border bg-surface px-1.5 font-mono text-[11px] lg:inline">Ctrl K</kbd>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 pt-[10vh] backdrop-blur-[2px]"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div role="dialog" aria-modal="true" aria-label="Search" className="flex max-h-[75vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-2xl">
            <div className="flex items-center gap-3 border-b border-border px-4">
              <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0 text-muted">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setOpen(false);
                  else if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setActive((a) => Math.min(flat.length - 1, a + 1));
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setActive((a) => Math.max(0, a - 1));
                  } else if (e.key === "Enter" && flat[active]) {
                    e.preventDefault();
                    go(flat[active]);
                  }
                }}
                placeholder="Search cheat sheets, snippets, browser support, shortcuts…"
                aria-label="Search"
                role="combobox"
                aria-expanded={flat.length > 0}
                aria-controls="global-search-results"
                aria-activedescendant={flat[active] ? `gs-${active}` : undefined}
                className="h-14 flex-1 bg-transparent text-base outline-none placeholder:text-muted"
              />
              <kbd className="rounded border border-border px-1.5 font-mono text-[11px] text-muted">Esc</kbd>
            </div>

            <div ref={listRef} id="global-search-results" role="listbox" className="overflow-y-auto p-2">
              {failed ? (
                <p className="px-3 py-8 text-center text-sm text-muted">Couldn&apos;t load the search index. Check your connection and try again.</p>
              ) : !index ? (
                <p className="px-3 py-8 text-center text-sm text-muted">Loading search…</p>
              ) : !query.trim() ? (
                <div className="px-3 py-6 text-sm text-muted">
                  <p className="mb-3">Search {index.length.toLocaleString("en")} items across the whole site. Try:</p>
                  <div className="flex flex-wrap gap-2">
                    {["array map", "reverse list", "container queries", "git rebase", "comment line", "flexbox center", "dialog"].map((s) => (
                      <button key={s} type="button" onClick={() => setQuery(s)} className="rounded-full border border-border px-3 py-1 hover:border-accent hover:text-accent">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : flat.length === 0 ? (
                <p className="px-3 py-8 text-center text-sm text-muted">No results for “{query}”.</p>
              ) : (
                groups.map((g) => (
                  <div key={g.kind} className="mb-2">
                    <p className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">{KIND_LABEL[g.kind]}</p>
                    {g.items.map((e) => {
                      n++;
                      const i = n;
                      return (
                        <button
                          key={`${e.u}-${e.t}`}
                          id={`gs-${i}`}
                          data-index={i}
                          type="button"
                          role="option"
                          aria-selected={i === active}
                          onMouseMove={() => setActive(i)}
                          onClick={() => go(e)}
                          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left ${i === active ? "bg-accent/10" : ""}`}
                        >
                          <div className="min-w-0 flex-1">
                            <p className={`truncate text-sm font-medium ${e.k === "entry" || e.k === "abbr" ? "font-mono" : ""}`}>{e.t}</p>
                            <p className="truncate text-xs text-muted">{e.s}</p>
                          </div>
                          {e.c && <code className="hidden max-w-[40%] truncate rounded bg-chip px-1.5 py-0.5 font-mono text-[11px] text-muted sm:block">{e.c}</code>}
                          <span className="shrink-0 text-xs text-muted">{isExternal(e.u) ? "↗" : "↵"}</span>
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
            <div className="flex items-center gap-4 border-t border-border px-4 py-2 text-[11px] text-muted">
              <span>
                <kbd className="font-mono">↑↓</kbd> navigate
              </span>
              <span>
                <kbd className="font-mono">↵</kbd> open
              </span>
              <span>
                <kbd className="font-mono">Esc</kbd> close
              </span>
              <span className="ml-auto">↗ opens official docs</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
