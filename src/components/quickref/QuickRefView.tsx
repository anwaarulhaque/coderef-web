"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { QuickRefCell, QuickRefTopic } from "@/lib/quickref";
import { tryItHref } from "@/lib/tryit/document";
import { Keys, Snippet } from "./Snippet";

const anchor = (title: string) =>
  title
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const alts = (cell: QuickRefCell) => (Array.isArray(cell) ? cell : [cell]);

/** Snippets in these topics open in the Try It editor. */
const TRY_IT: Record<string, (code: string) => string> = {
  html: (code) => tryItHref({ html: code }, "/html-editor/"),
  javascript: (code) => tryItHref({ js: code }, "/javascript-compiler/"),
};

type Platform = "both" | "win" | "mac";

export function QuickRefView({ topic }: { topic: QuickRefTopic }) {
  const [query, setQuery] = useState("");
  const [platform, setPlatform] = useState<Platform>("both");
  const [active, setActive] = useState(anchor(topic.sections[0]?.title ?? ""));

  // Shortcut sheets: start on the visitor's platform.
  useEffect(() => {
    if (!topic.keys) return;
    const mac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time platform detection
    setPlatform(mac ? "mac" : "win");
  }, [topic.keys]);

  // Highlight the section being read in the table of contents.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "0px 0px -70% 0px" },
    );
    document.querySelectorAll("[data-qr-section]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const q = query.trim().toLowerCase();
  const sections = topic.sections
    .map((s) => ({
      ...s,
      rows: s.rows.filter(([task, ...cells]) => !q || task.toLowerCase().includes(q) || cells.flatMap(alts).some((c) => c.toLowerCase().includes(q))),
    }))
    .filter((s) => s.rows.length > 0);

  const baseColumns = topic.columns ?? ["Task", "Code"];
  // For shortcut sheets, hide the other platform's column when one is chosen.
  const visibleCols = (cols: string[]) =>
    cols.map((_, i) => i === 0 || !topic.keys || platform === "both" || (platform === "win" ? i === 1 : i === 2));

  return (
    <div className="grid gap-8 lg:grid-cols-[13rem_minmax(0,1fr)]">
      <aside className="no-print hidden lg:block">
        <nav aria-label="Sections" className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">On this page</p>
          <ul className="space-y-0.5 border-l border-border">
            {topic.sections.map((s) => {
              const id = anchor(s.title);
              return (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    className={`-ml-px block border-l-2 py-1 pl-3 text-sm ${
                      active === id ? "border-accent font-medium text-foreground" : "border-transparent text-muted hover:text-foreground"
                    }`}
                  >
                    {s.title}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      <div className="min-w-0">
        <div className="no-print mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Filter ${topic.title}… e.g. "${topic.keys ? "comment" : "sort"}"`}
            aria-label={`Filter ${topic.title}`}
            className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-accent sm:max-w-sm"
          />
          {topic.keys && (
            <div className="flex rounded-lg border border-border bg-surface p-0.5 text-sm" role="tablist" aria-label="Platform">
              {(
                [
                  ["both", "Both"],
                  ["win", "Windows / Linux"],
                  ["mac", "macOS"],
                ] as [Platform, string][]
              ).map(([p, label]) => (
                <button
                  key={p}
                  type="button"
                  role="tab"
                  aria-selected={platform === p}
                  onClick={() => setPlatform(p)}
                  className={`rounded-md px-2.5 py-1 ${platform === p ? "bg-chip font-medium text-foreground" : "text-muted hover:text-foreground"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
          <span className="text-sm text-muted sm:ml-auto">Click any snippet to copy it.</span>
        </div>

        {sections.length === 0 && <p className="text-muted">Nothing matches “{query}”.</p>}

        <div className="space-y-8">
          {sections.map((s) => {
            const cols = s.columns ?? baseColumns;
            const show = visibleCols(cols);
            const shown = cols.filter((_, i) => show[i]);
            const grid = shown.length === 2 ? "md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]" : "md:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,1.5fr)]";
            return (
              <section key={s.title} id={anchor(s.title)} data-qr-section className="scroll-mt-4 break-inside-avoid-page">
                <h2 className="text-xl font-semibold tracking-tight">{s.title}</h2>
                {s.description && <p className="mt-1 text-sm text-muted">{s.description}</p>}
                <div className="mt-3 overflow-hidden rounded-xl border border-border bg-surface">
                  <div className={`hidden gap-4 border-b border-border bg-chip/50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted md:grid ${grid}`}>
                    {shown.map((c) => (
                      <span key={c}>{c}</span>
                    ))}
                  </div>
                  <ul className="divide-y divide-border">
                    {s.rows.map(([task, ...cells]) => (
                      <li key={task} className={`grid gap-2 px-4 py-2.5 md:items-start md:gap-4 ${grid}`}>
                        <span className="pt-1 text-sm font-medium">{task}</span>
                        {cells.map((cell, i) =>
                          show[i + 1] ? (
                            <div key={i} className="min-w-0 space-y-1">
                              {topic.keys && <span className="text-[10px] font-semibold uppercase tracking-wide text-muted md:hidden">{cols[i + 1]}</span>}
                              {alts(cell).map((c) =>
                                topic.keys ? (
                                  <div key={c} className="py-0.5">
                                    <Keys combo={c} />
                                  </div>
                                ) : (
                                  <div key={c}>
                                    <Snippet code={c} />
                                    {TRY_IT[topic.slug] && (
                                      <Link href={TRY_IT[topic.slug](c)} className="no-print mt-1 inline-block text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-400">
                                        Try it Yourself »
                                      </Link>
                                    )}
                                  </div>
                                ),
                              )}
                            </div>
                          ) : null,
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            );
          })}
        </div>

        <p className="no-print mt-10 text-sm text-muted">
          <Link href="/quick-reference/" className="text-accent hover:underline">
            ← All quick references
          </Link>
        </p>
      </div>
    </div>
  );
}
