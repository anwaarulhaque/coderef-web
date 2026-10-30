"use client";

import expand from "emmet";
import { useEffect, useMemo, useRef, useState } from "react";
import type { EmmetEntry } from "@/lib/emmet-index";

const MARKUP = ["html", "xml", "jsx", "pug", "haml", "slim"] as const;
const STYLESHEET = ["css", "scss", "sass", "less", "stylus"] as const;
type Syntax = (typeof MARKUP)[number] | (typeof STYLESHEET)[number];
const isStylesheet = (s: Syntax) => (STYLESHEET as readonly string[]).includes(s);

const EXAMPLES: { abbr: string; syntax: Syntax }[] = [
  { abbr: "!", syntax: "html" },
  { abbr: "nav>ul>li*4>a[href=#]{Link $}", syntax: "html" },
  { abbr: "form#signup>(label+input)*2+button:s{Sign up}", syntax: "html" },
  { abbr: "table>tr*3>td*4", syntax: "html" },
  { abbr: ".card>img+.body>h3{Title}+p>lorem10", syntax: "html" },
  { abbr: "ul.list>li.list__item*3", syntax: "jsx" },
  { abbr: "d:f+jc:sb+ai:c+g16", syntax: "css" },
  { abbr: "pos:a+t0+l0+w100p+h100p", syntax: "css" },
];

type Tab = "syntax" | "html" | "css";

export function EmmetTool({ entries }: { entries: EmmetEntry[] }) {
  const [abbr, setAbbr] = useState("ul>li.item$*3>a[href=#]{Item $}");
  const [syntax, setSyntax] = useState<Syntax>("html");
  const [comments, setComments] = useState(false);
  const [bem, setBem] = useState(false);
  const [preview, setPreview] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<Tab>("syntax");
  const [query, setQuery] = useState("");
  const [loaded, setLoaded] = useState(false);
  const playgroundRef = useRef<HTMLElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Share links: #a=<abbreviation>&s=<syntax>
  useEffect(() => {
    const params = new URLSearchParams(location.hash.slice(1));
    /* eslint-disable react-hooks/set-state-in-effect -- one-time hydration from the URL */
    if (params.get("a")) setAbbr(params.get("a")!);
    const s = params.get("s") as Syntax | null;
    if (s && ([...MARKUP, ...STYLESHEET] as string[]).includes(s)) setSyntax(s);
    setLoaded(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const id = setTimeout(() => history.replaceState(null, "", `#${new URLSearchParams({ a: abbr, s: syntax })}`), 300);
    return () => clearTimeout(id);
  }, [abbr, syntax, loaded]);

  const result = useMemo(() => {
    if (!abbr.trim()) return { output: "", error: null as string | null };
    try {
      const output = expand(abbr, {
        syntax,
        type: isStylesheet(syntax) ? "stylesheet" : "markup",
        options: { "comment.enabled": comments, "bem.enabled": bem, "output.indent": "  " },
      });
      return { output, error: null };
    } catch (err) {
      return { output: "", error: (err as Error).message };
    }
  }, [abbr, syntax, comments, bem]);

  const load = (next: string, nextSyntax: Syntax) => {
    setAbbr(next);
    setSyntax(nextSyntax);
    playgroundRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const q = query.trim().toLowerCase();
  const visible = entries.filter((e) => {
    const inTab = tab === "syntax" ? !e.group.includes(":") : e.group.startsWith(tab === "html" ? "HTML:" : "CSS:");
    if (!inTab) return false;
    if (!q) return true;
    return (
      e.abbr.toLowerCase().includes(q) ||
      e.output.toLowerCase().includes(q) ||
      e.description?.toLowerCase().includes(q) ||
      e.values?.some((v) => v.value.includes(q) || v.abbr.includes(q))
    );
  });
  const groups = new Map<string, EmmetEntry[]>();
  for (const e of visible) groups.set(e.group, [...(groups.get(e.group) ?? []), e]);
  const counts = {
    syntax: entries.filter((e) => !e.group.includes(":")).length,
    html: entries.filter((e) => e.group.startsWith("HTML:")).length,
    css: entries.filter((e) => e.group.startsWith("CSS:")).length,
  };

  const markup = !isStylesheet(syntax);

  return (
    <>
      <section ref={playgroundRef} className="mb-10 scroll-mt-4 rounded-xl border border-border bg-surface">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Playground</h2>
          <span className="text-xs text-muted">Type an abbreviation — it expands as you type</span>
        </header>
        <div className="p-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              ref={inputRef}
              value={abbr}
              onChange={(e) => setAbbr(e.target.value)}
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              aria-label="Emmet abbreviation"
              placeholder="e.g. ul>li*3"
              className="h-11 flex-1 rounded-lg border border-border bg-background px-3 font-mono text-[15px] outline-none focus:border-accent"
            />
            <select
              value={syntax}
              onChange={(e) => setSyntax(e.target.value as Syntax)}
              aria-label="Output syntax"
              className="h-11 rounded-lg border border-border bg-background px-2 text-sm"
            >
              <optgroup label="Markup">
                {MARKUP.map((s) => (
                  <option key={s} value={s}>
                    {s.toUpperCase()}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Stylesheet">
                {STYLESHEET.map((s) => (
                  <option key={s} value={s}>
                    {s.toUpperCase()}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            {markup && (
              <>
                <label className="flex items-center gap-1.5 text-muted">
                  <input type="checkbox" checked={comments} onChange={(e) => setComments(e.target.checked)} />
                  Comment after elements
                </label>
                <label className="flex items-center gap-1.5 text-muted" title="Expands .block__elem / .-elem shorthands">
                  <input type="checkbox" checked={bem} onChange={(e) => setBem(e.target.checked)} />
                  BEM classes
                </label>
                {syntax === "html" && (
                  <label className="flex items-center gap-1.5 text-muted">
                    <input type="checkbox" checked={preview} onChange={(e) => setPreview(e.target.checked)} />
                    Live preview
                  </label>
                )}
              </>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="self-center text-xs text-muted">Try:</span>
            {EXAMPLES.map((ex) => (
              <button
                key={ex.abbr}
                type="button"
                onClick={() => load(ex.abbr, ex.syntax)}
                className="rounded-md border border-border px-2 py-0.5 font-mono text-xs text-muted hover:border-accent hover:text-accent"
              >
                {ex.abbr}
              </button>
            ))}
          </div>

          <div className={`mt-4 grid gap-4 ${preview && syntax === "html" ? "lg:grid-cols-2" : ""}`}>
            <div className="overflow-hidden rounded-lg border border-border bg-background">
              <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
                <span className="text-xs text-muted">Output · {syntax.toUpperCase()}</span>
                <button
                  type="button"
                  disabled={!result.output}
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(result.output);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1200);
                    } catch {
                      // Clipboard unavailable.
                    }
                  }}
                  className="rounded-md border border-border px-2 py-0.5 text-xs text-muted enabled:hover:text-foreground disabled:opacity-50"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              {result.error ? (
                <p className="p-3 font-mono text-[13px] text-rose-600 dark:text-rose-400">{result.error}</p>
              ) : (
                <pre className="max-h-[28rem] min-h-24 overflow-auto p-3 font-mono text-[13px] leading-5 [tab-size:2]">
                  {result.output || <span className="text-muted">Output appears here.</span>}
                </pre>
              )}
            </div>
            {preview && syntax === "html" && (
              <div className="overflow-hidden rounded-lg border border-border bg-white">
                <div className="border-b border-border bg-background px-3 py-1.5 text-xs text-muted">Preview (sandboxed)</div>
                {/* sandbox="" blocks scripts, forms and navigation in the rendered output. */}
                <iframe title="Rendered output" sandbox="" srcDoc={result.output} className="h-80 w-full bg-white" />
              </div>
            )}
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Abbreviation index</h2>
            <p className="text-sm text-muted">
              Every abbreviation Emmet ships with, and exactly what it expands to. Click one to open it in the
              playground.
            </p>
          </div>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search abbreviations or output…"
            aria-label="Search abbreviations"
            className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-accent md:max-w-xs"
          />
        </div>

        <div className="mb-4 flex gap-1 border-b border-border" role="tablist">
          {(
            [
              ["syntax", `Syntax (${counts.syntax})`],
              ["html", `HTML (${counts.html})`],
              ["css", `CSS (${counts.css})`],
            ] as [Tab, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`-mb-px border-b-2 px-3 py-2 text-sm ${
                tab === id ? "border-accent font-medium text-foreground" : "border-transparent text-muted hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {groups.size === 0 ? (
          <p className="text-sm text-muted">Nothing matches “{query}”.</p>
        ) : (
          <div className="columns-1 gap-4 lg:columns-2 2xl:columns-3">
            {[...groups.entries()].map(([group, items]) => (
              <div key={group} className="mb-4 break-inside-avoid rounded-xl border border-border bg-surface">
                <h3 className="border-b border-border px-4 py-2 font-semibold">{group.replace(/^(HTML|CSS): /, "")}</h3>
                <ul className="divide-y divide-border">
                  {items.map((e) => (
                    <li key={`${e.syntax}:${e.abbr}`} className="px-4 py-2.5">
                      <button
                        type="button"
                        onClick={() => load(e.abbr, e.syntax)}
                        title="Open in playground"
                        className="group block w-full text-left"
                      >
                        <code className="font-mono text-[13px] font-semibold text-accent group-hover:underline">{e.abbr}</code>
                        {e.description && <span className="ml-2 text-xs text-muted">{e.description}</span>}
                        <pre className="mt-1 max-h-32 overflow-hidden whitespace-pre-wrap break-words font-mono text-[12px] leading-[1.45] text-foreground/80 [tab-size:2]">
                          {e.output}
                        </pre>
                      </button>
                      {e.values && e.values.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {e.values.map((v) => (
                            <button
                              key={v.abbr}
                              type="button"
                              onClick={() => load(v.abbr, "css")}
                              title={`${v.abbr} → ${v.value}`}
                              className="rounded bg-chip px-1.5 py-0.5 font-mono text-[11px] text-muted hover:bg-chip-hover hover:text-accent"
                            >
                              {v.abbr} <span className="opacity-70">{v.value}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
