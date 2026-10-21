"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import { CodeEditor, type EditorLanguage } from "@/components/json/CodeEditor";
import { copyText } from "@/components/quickref/Snippet";
import { buildDocument, decodeShareHash, encodeShareHash, TRY_IT_MESSAGE, type TryItCode } from "@/lib/tryit/document";
import { fitToTabs, MODES, type CodeTab as Tab, type EditorMode } from "@/lib/tryit/modes";
import { emmetTab } from "./emmet";

type Layout = "row" | "col";
type LogLine = { id: number; level: string; text: string };
type Saved = TryItCode & { autoRun?: boolean; layout?: Layout; split?: number };

const TAB_INFO: Record<Tab, { label: string; language: EditorLanguage }> = {
  html: { label: "HTML", language: "html" },
  css: { label: "CSS", language: "css" },
  js: { label: "JavaScript", language: "javascript" },
};

// Created once: CodeEditor applies `extensions` when it mounts.
const EXTENSIONS = { html: emmetTab("markup"), css: emmetTab("stylesheet"), js: emmetTab(null) };

const btn =
  "inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-sm font-medium transition-colors hover:border-accent hover:text-accent disabled:pointer-events-none disabled:opacity-40";
// Green, like the classic "Run »" button.
const runBtn = "inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-emerald-700";

const LEVEL_STYLE: Record<string, string> = {
  error: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
  warn: "bg-amber-500/10 text-amber-800 dark:text-amber-300",
  info: "text-accent",
  debug: "text-muted",
};

function loadSaved(key: string): Saved | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Saved) : null;
  } catch {
    return null;
  }
}

export function TryItEditor({ heading, mode = "web" }: { heading: ReactNode; mode?: EditorMode }) {
  const config = MODES[mode];
  const { tabs, starter, examples, storageKey } = config;
  const consoleFirst = config.output === "console";
  const [code, setCode] = useState<TryItCode>(() => fitToTabs(starter, tabs));
  const [tab, setTab] = useState<Tab>(tabs[0]);
  // JavaScript compiler: which output fills the right-hand pane.
  const [view, setView] = useState<"console" | "result">(consoleFirst ? "console" : "result");
  const [layout, setLayout] = useState<Layout>("row");
  const [split, setSplit] = useState(50);
  const [autoRun, setAutoRun] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [srcDoc, setSrcDoc] = useState("");
  const [runId, setRunId] = useState(0);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [example, setExample] = useState("");

  const frame = useRef<HTMLIFrameElement | null>(null);
  const area = useRef<HTMLDivElement | null>(null);
  const logId = useRef(0);
  const codeRef = useRef(code);
  useEffect(() => {
    codeRef.current = code;
  });

  const flash = (text: string) => {
    setNotice(text);
    setTimeout(() => setNotice(null), 1800);
  };

  const run = useCallback((next?: TryItCode) => {
    setLogs([]);
    setSrcDoc(buildDocument(next ?? codeRef.current));
    // A new key reloads the frame even when the code is unchanged.
    setRunId((n) => n + 1);
  }, []);

  // Load: a shared link wins, then this browser's last session, then the starter example.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const shared = location.hash ? await decodeShareHash(location.hash) : null;
      if (cancelled) return;
      const saved = loadSaved(storageKey);
      const raw = shared ?? (saved ? { html: saved.html ?? "", css: saved.css ?? "", js: saved.js ?? "" } : null);
      const start = raw ? fitToTabs(raw, tabs) : null;
      if (saved?.layout) setLayout(saved.layout);
      if (saved?.split) setSplit(saved.split);
      if (saved?.autoRun) setAutoRun(true);
      if (start) {
        setCode(start);
        // Open the first tab that has something in it.
        setTab(tabs.find((t) => start[t].trim()) ?? tabs[0]);
      }
      // The code now lives in this browser; a refresh shouldn't bring back the original link's code.
      if (shared) history.replaceState(null, "", location.pathname + location.search);
      setLoaded(true);
      run(start ?? undefined);
    })();
    return () => {
      cancelled = true;
    };
  }, [run, storageKey, tabs]);

  // Autosave.
  useEffect(() => {
    if (!loaded) return;
    const id = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify({ ...code, autoRun, layout, split } satisfies Saved));
      } catch {
        // Storage full or blocked: the editor still works, it just won't remember.
      }
    }, 400);
    return () => clearTimeout(id);
  }, [code, autoRun, layout, split, loaded, storageKey]);

  // Auto-run after typing pauses.
  useEffect(() => {
    if (!loaded || !autoRun) return;
    const id = setTimeout(() => run(), 800);
    return () => clearTimeout(id);
  }, [code, autoRun, loaded, run]);

  // Console output from the result frame.
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow || e.data?.source !== TRY_IT_MESSAGE) return;
      const { level, text } = e.data as { level: string; text: string };
      if (level === "clear") return setLogs([]);
      setLogs((l) => [...l.slice(-499), { id: ++logId.current, level, text: String(text) }]);
      setConsoleOpen(true);
      if (consoleFirst) setView("console");
    };
    addEventListener("message", onMessage);
    return () => removeEventListener("message", onMessage);
  }, [consoleFirst]);

  const update = (key: Tab) => (value: string) => setCode((c) => (c[key] === value ? c : { ...c, [key]: value }));

  const loadCode = (next: TryItCode) => {
    const fitted = fitToTabs(next, tabs);
    setCode(fitted);
    setTab(tabs[0]);
    setExample("");
    run(fitted);
  };

  const loadExample = (id: string) => {
    const ex = examples.find((e) => e.id === id);
    if (ex) loadCode(ex);
  };

  const share = async () => {
    const url = `${location.origin}${location.pathname}#${await encodeShareHash(code)}`;
    flash((await copyText(url)) ? "Link copied" : "Couldn't copy the link");
  };

  const download = () => {
    const blob = new Blob([buildDocument(code, { bridge: false })], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "index.html";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const reset = () => {
    if (!confirm("Replace your code with the starter example?")) return;
    loadCode(starter);
  };

  // Drag the divider between code and result.
  const startDrag = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
  };
  const drag = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragging || !area.current) return;
    const r = area.current.getBoundingClientRect();
    const pct = layout === "row" ? ((e.clientX - r.left) / r.width) * 100 : ((e.clientY - r.top) / r.height) * 100;
    setSplit(Math.round(Math.min(80, Math.max(20, pct))));
  };

  const groups = [...new Set(examples.map((e) => e.group))];

  return (
    <div className="flex flex-col gap-2.5 px-3 py-3 sm:px-4 lg:h-[calc(100dvh-3.5rem)]">
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {heading}
        <button type="button" className={runBtn} onClick={() => run()} title="Run (Ctrl/⌘+Enter)">
          Run ❯
        </button>
        <label className="flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 text-sm">
          <input type="checkbox" checked={autoRun} onChange={(e) => setAutoRun(e.target.checked)} className="accent-[var(--accent)]" />
          Auto-run
        </label>
        <select
          aria-label="Load an example"
          value={example}
          onChange={(e) => loadExample(e.target.value)}
          className="h-9 rounded-lg border border-border bg-surface px-2 text-sm"
        >
          <option value="" disabled>
            Examples…
          </option>
          {groups.map((g) => (
            <optgroup key={g} label={g}>
              {examples.filter((e) => e.group === g).map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {notice && (
            <span role="status" className="text-sm text-emerald-700 dark:text-emerald-400">
              {notice}
            </span>
          )}
          <button
            type="button"
            className={`${btn} hidden lg:inline-flex`}
            onClick={() => setLayout((l) => (l === "row" ? "col" : "row"))}
            title="Switch between side-by-side and stacked"
          >
            {layout === "row" ? "⬒ Stack" : "◫ Side by side"}
          </button>
          <button type="button" className={btn} onClick={share} title="Copy a link that opens this code">
            Share
          </button>
          <button type="button" className={btn} onClick={download} title="Download as one HTML file">
            Download
          </button>
          <button type="button" className={btn} onClick={reset}>
            Reset
          </button>
        </div>
      </div>

      <div
        ref={area}
        className={`flex min-h-0 flex-1 flex-col gap-2.5 lg:gap-0 ${layout === "row" ? "lg:flex-row" : ""}`}
        style={{ "--split": `${split}%` } as CSSProperties}
      >
        {/* Code */}
        <section className="flex h-[55vh] min-h-[280px] min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-surface lg:h-auto lg:min-h-0 lg:shrink-0 lg:grow-0 lg:basis-[var(--split)]">
          <div className="flex shrink-0 items-center gap-1 border-b border-border px-2 py-1.5" role="tablist" aria-label="Code">
            {tabs.map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-sm transition-colors ${
                  tab === t ? "bg-chip font-medium text-foreground" : "text-muted hover:bg-chip hover:text-foreground"
                }`}
              >
                {TAB_INFO[t].label}
                {tabs.length > 1 && code[t].trim() && <span className="size-1.5 rounded-full bg-accent" aria-label="(has code)" />}
              </button>
            ))}
            <span className="ml-auto hidden pr-1 text-xs text-muted xl:inline">Tab expands Emmet · Ctrl/⌘+Enter runs</span>
          </div>
          {/* All three stay mounted so each keeps its own undo history. */}
          {tabs.map((t) => (
            <div key={t} className={tab === t ? "min-h-0 flex-1" : "hidden"} role="tabpanel">
              <CodeEditor
                value={code[t]}
                onChange={update(t)}
                language={TAB_INFO[t].language}
                label={`${TAB_INFO[t].label} code`}
                onSubmit={() => run()}
                extensions={EXTENSIONS[t]}
              />
            </div>
          ))}
        </section>

        {/* Divider */}
        <div
          role="separator"
          aria-orientation={layout === "row" ? "vertical" : "horizontal"}
          aria-valuenow={split}
          aria-valuemin={20}
          aria-valuemax={80}
          aria-label="Resize"
          tabIndex={0}
          onPointerDown={startDrag}
          onPointerMove={drag}
          onPointerUp={() => setDragging(false)}
          onKeyDown={(e) => {
            const step = e.key === "ArrowLeft" || e.key === "ArrowUp" ? -5 : e.key === "ArrowRight" || e.key === "ArrowDown" ? 5 : 0;
            if (step) setSplit((s) => Math.min(80, Math.max(20, s + step)));
          }}
          className={`group hidden shrink-0 touch-none items-center justify-center lg:flex ${
            layout === "row" ? "w-2.5 cursor-col-resize" : "h-2.5 cursor-row-resize"
          }`}
        >
          <span className={`rounded-full bg-border transition-colors group-hover:bg-accent ${dragging ? "bg-accent" : ""} ${layout === "row" ? "h-10 w-1" : "h-1 w-10"}`} />
        </div>

        {/* Result */}
        <section className="flex h-[65vh] min-h-[320px] min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-surface lg:h-auto lg:min-h-0 lg:flex-1">
          <div className="flex shrink-0 items-center gap-1 border-b border-border px-2 py-1.5">
            {consoleFirst ? (
              <div role="tablist" aria-label="Output" className="flex gap-1">
                {(["console", "result"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    role="tab"
                    aria-selected={view === v}
                    onClick={() => setView(v)}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-sm transition-colors ${
                      view === v ? "bg-chip font-medium text-foreground" : "text-muted hover:bg-chip hover:text-foreground"
                    }`}
                  >
                    {v === "console" ? "Output" : "Preview"}
                    {v === "console" && logs.some((l) => l.level === "error") && <span className="size-2 rounded-full bg-rose-500" aria-label="has errors" />}
                  </button>
                ))}
              </div>
            ) : (
              <span className="px-1 py-1 text-sm font-medium">Result</span>
            )}
            {autoRun && <span className="text-xs text-muted">updates as you type</span>}
            {consoleFirst && view === "console" && (
              <button type="button" onClick={() => setLogs([])} className="ml-auto pr-1 text-xs text-muted hover:text-foreground">
                Clear
              </button>
            )}
          </div>
          {/* The frame stays mounted while hidden so the code keeps running. */}
          <div className={`relative min-h-0 flex-1 bg-white ${consoleFirst && view === "console" ? "hidden" : ""}`}>
            {srcDoc && (
              <iframe
                key={runId}
                ref={frame}
                title="Result"
                srcDoc={srcDoc}
                // No allow-same-origin: the code runs in its own origin, away from this site's storage and cookies.
                sandbox="allow-scripts allow-modals allow-forms allow-popups"
                className={`absolute inset-0 size-full border-0 ${dragging ? "pointer-events-none" : ""}`}
              />
            )}
          </div>

          {consoleFirst ? (
            view === "console" && <ConsoleLines logs={logs} className="min-h-0 flex-1" empty={runId ? "No output. Print values with console.log()." : "Press Run to see the output of console.log() here."} />
          ) : (
            <div className="shrink-0 border-t border-border">
              <div className="flex items-center gap-2 px-3 py-1">
                <button type="button" onClick={() => setConsoleOpen((o) => !o)} aria-expanded={consoleOpen} className="flex items-center gap-1.5 py-1 text-sm font-medium">
                  <span className={`inline-block text-muted transition-transform ${consoleOpen ? "rotate-90" : ""}`}>›</span>
                  Console
                  {logs.length > 0 && <span className="rounded-full bg-chip px-1.5 text-xs text-muted">{logs.length}</span>}
                  {logs.some((l) => l.level === "error") && <span className="size-2 rounded-full bg-rose-500" aria-label="has errors" />}
                </button>
                {consoleOpen && (
                  <button type="button" onClick={() => setLogs([])} className="ml-auto text-xs text-muted hover:text-foreground">
                    Clear
                  </button>
                )}
              </div>
              {consoleOpen && <ConsoleLines logs={logs} className="max-h-40 min-h-16 border-t border-border" empty="console.log() output and errors appear here." />}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function ConsoleLines({ logs, className, empty }: { logs: LogLine[]; className: string; empty: string }) {
  return (
    <ol className={`overflow-y-auto font-mono text-[12.5px] ${className}`} aria-live="polite">
      {logs.length === 0 && <li className="px-3 py-2 text-muted">{empty}</li>}
      {logs.map((l) => (
        <li key={l.id} className={`whitespace-pre-wrap break-words border-b border-border/60 px-3 py-1 ${LEVEL_STYLE[l.level] ?? ""}`}>
          {l.text}
        </li>
      ))}
    </ol>
  );
}
