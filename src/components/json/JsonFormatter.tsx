"use client";

import { CloudSave } from "@/components/account/CloudSave";
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { convertFrom, convertTo, TARGETS, type Source, type Target } from "@/lib/json/convert";
import { diff, escapeJson, format, minify, queryJsonPath, repair, sortKeys, stats, unescapeJson, type DiffEntry, type Indent } from "@/lib/json/tools";
import { parseJson } from "@/lib/json/validate";
import { CodeEditor, type EditorLanguage } from "./CodeEditor";
import { JsonTree } from "./JsonTree";

type Mode = "format" | "convert" | "compare" | "query";
type Message = { kind: "ok" | "error" | "info"; text: string } | null;

const STORAGE_KEY = "coderef:json-input";
const MAX_SAVED = 2_000_000;

const SAMPLE = `{
  "company": "Acme Corp",
  "founded": 1999,
  "public": true,
  "address": { "street": "1 Infinite Loop", "city": "Springfield", "country": "US" },
  "employees": [
    { "id": 1, "name": "Ada Lovelace", "role": "engineer", "skills": ["math", "algorithms"], "salary": 120000, "remote": false },
    { "id": 2, "name": "Grace Hopper", "role": "manager", "skills": ["cobol", "leadership"], "salary": 135000, "remote": true },
    { "id": 3, "name": "Linus Torvalds", "role": "engineer", "skills": ["c", "git"], "salary": 128000, "remote": true, "manager": 2 }
  ],
  "metadata": { "updated": "2026-10-14T09:30:00Z", "version": "2.4.1", "tags": null }
}`;

const BROKEN_SAMPLE = `{
  // A config with the usual mistakes
  name: 'my-app',
  "version": "1.0.0",
  "private": True,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
  },
  "keywords": ['json', 'formatter',],
}`;

const QUERY_EXAMPLES = ["$.employees[*].name", "$..skills", "$.employees[?(@.remote)].name", "$.employees[?(@.salary > 125000)]", "$.employees[0:2].role", "$.address.city"];

const bytes = (s: string) => new TextEncoder().encode(s).length;
const fmtBytes = (n: number) => (n < 1024 ? `${n} B` : n < 1024 * 1024 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1024 / 1024).toFixed(2)} MB`);
const lines = (s: string) => (s ? s.split("\n").length : 0);

function download(name: string, content: string, type = "application/json") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.append(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
}

// ---------- small UI pieces ----------

const btn = "inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-sm font-medium transition-colors hover:border-accent hover:text-accent disabled:pointer-events-none disabled:opacity-40";
const btnPrimary = "inline-flex h-9 items-center gap-1.5 rounded-lg bg-accent px-3.5 text-sm font-medium text-surface transition-opacity hover:opacity-90";

function Pane({ title, actions, children, footer }: { title: ReactNode; actions?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  return (
    <section className="flex h-[65vh] min-h-[320px] min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-surface lg:h-full lg:min-h-0">
      <header className="flex min-h-11 flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-1.5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">{title}</h2>
        {actions && <div className="flex flex-wrap items-center gap-1">{actions}</div>}
      </header>
      <div className="min-h-0 flex-1 bg-background/40">{children}</div>
      {footer && <footer className="border-t border-border px-3 py-1.5 text-xs text-muted">{footer}</footer>}
    </section>
  );
}

const smallBtn = "rounded-md px-2 py-1 text-xs text-muted hover:bg-chip hover:text-foreground disabled:opacity-40";

export function JsonFormatter({ heading }: { heading?: ReactNode }) {
  const [mode, setMode] = useState<Mode>("format");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [outputLang, setOutputLang] = useState<EditorLanguage>("json");
  const [outputView, setOutputView] = useState<"code" | "tree">("code");
  const [indent, setIndent] = useState<Indent>(2);
  const [message, setMessage] = useState<Message>(null);
  const [reveal, setReveal] = useState(0);
  const [elapsed, setElapsed] = useState<number | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [urlOpen, setUrlOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [dragging, setDragging] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  // Convert
  const [direction, setDirection] = useState<"to" | "from">("to");
  const [target, setTarget] = useState<Target>("yaml");
  const [source, setSource] = useState<Source>("yaml");
  // Compare
  const [right, setRight] = useState("");
  // Query
  const [path, setPath] = useState("$.employees[*].name");
  const fileRef = useRef<HTMLInputElement | null>(null);

  // ----- persistence -----
  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch {
      // storage unavailable
    }
    /* eslint-disable react-hooks/set-state-in-effect -- one-time hydration from storage */
    setInput(saved ?? SAMPLE);
    setRight((saved ?? SAMPLE).replace('"Linus Torvalds"', '"Linus B. Torvalds"').replace('"version": "2.4.1"', '"version": "2.5.0"'));
    setLoaded(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const id = setTimeout(() => {
      try {
        if (input.length <= MAX_SAVED) localStorage.setItem(STORAGE_KEY, input);
      } catch {
        // storage full or unavailable
      }
    }, 600);
    return () => clearTimeout(id);
  }, [input, loaded]);

  const notify = (text: string) => {
    setFlash(text);
    setTimeout(() => setFlash(null), 1400);
  };

  // ----- live validation (deferred so typing in big documents stays smooth) -----
  const deferredInput = useDeferredValue(input);
  const parsed = useMemo(() => (deferredInput.trim() ? parseJson(deferredInput) : null), [deferredInput]);
  const inputError = parsed && !parsed.ok && (mode !== "convert" || direction === "to") ? { offset: parsed.error.offset, message: parsed.error.message } : null;
  const inputStats = useMemo(() => (parsed?.ok ? stats(parsed.value) : null), [parsed]);

  const timed = <T,>(fn: () => T): T => {
    const t0 = performance.now();
    const r = fn();
    setElapsed(performance.now() - t0);
    return r;
  };

  /** Runs `fn` on the parsed input, or reports the parse error. */
  const withJson = (fn: (value: unknown) => void) => {
    if (!input.trim()) {
      setMessage({ kind: "info", text: "Paste or type some JSON first." });
      return;
    }
    const r = timed(() => parseJson(input));
    if (!r.ok) {
      setMessage({ kind: "error", text: `Line ${r.error.line}, column ${r.error.column}: ${r.error.message}` });
      setReveal((n) => n + 1);
      return;
    }
    fn(r.value);
  };

  const showJson = (value: unknown, text: string, msg: string) => {
    setOutput(text);
    setOutputLang("json");
    setMessage({ kind: "ok", text: msg });
    void value;
  };

  const actions = {
    format: () => withJson((v) => showJson(v, timed(() => format(v, indent)), "Valid JSON — formatted.")),
    minify: () => withJson((v) => {
      const out = timed(() => minify(v));
      setOutputView("code");
      showJson(v, out, `Minified: ${fmtBytes(bytes(input))} → ${fmtBytes(bytes(out))} (${Math.round((1 - bytes(out) / Math.max(1, bytes(input))) * 100)}% smaller).`);
    }),
    validate: () => withJson(() => setMessage({ kind: "ok", text: "✓ Valid JSON." })),
    sort: () => withJson((v) => showJson(v, timed(() => format(sortKeys(v), indent)), "Keys sorted A→Z (recursively).")),
    repair: () => {
      if (!input.trim()) return setMessage({ kind: "info", text: "Paste some broken JSON to repair." });
      const already = parseJson(input);
      if (already.ok) return showJson(already.value, format(already.value, indent), "Already valid JSON — nothing to repair.");
      const fixed = timed(() => repair(input));
      if (fixed === null) {
        setMessage({ kind: "error", text: "Couldn't repair automatically — see the highlighted error and fix it by hand." });
        setReveal((n) => n + 1);
        return;
      }
      showJson(fixed, format(fixed, indent), "Repaired: removed comments and trailing commas, fixed quotes and literals. Check the result.");
    },
    escape: () => {
      setOutput(escapeJson(input));
      setOutputLang("text");
      setOutputView("code");
      setMessage({ kind: "ok", text: "Escaped as a JSON string literal." });
    },
    unescape: () => {
      try {
        const text = unescapeJson(input);
        setOutput(text);
        const asJson = parseJson(text);
        setOutputLang(asJson.ok ? "json" : "text");
        setMessage({ kind: "ok", text: asJson.ok ? "Unescaped — the result is valid JSON." : "Unescaped." });
      } catch (e) {
        setMessage({ kind: "error", text: `Not a valid JSON string literal: ${(e as Error).message}` });
      }
    },
  };

  // ----- loading -----
  const loadText = (text: string, name?: string) => {
    setInput(text);
    setOutput("");
    setMessage({ kind: "info", text: name ? `Loaded ${name} (${fmtBytes(bytes(text))}).` : `Loaded ${fmtBytes(bytes(text))}.` });
  };

  const loadFile = async (file: File) => {
    if (file.size > 50 * 1024 * 1024) return setMessage({ kind: "error", text: "That file is over 50 MB — too large to edit in the browser." });
    loadText(await file.text(), file.name);
  };

  const loadUrl = async () => {
    const target = url.trim();
    if (!/^https?:\/\//.test(target)) return setMessage({ kind: "error", text: "Enter a full http(s):// URL." });
    setMessage({ kind: "info", text: "Loading…" });
    try {
      const res = await fetch(target);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      loadText(await res.text(), new URL(target).hostname);
      setUrlOpen(false);
    } catch (e) {
      setMessage({ kind: "error", text: `Couldn't load that URL (${(e as Error).message}). The server may not allow cross-site requests (CORS) — download the file and open it instead.` });
    }
  };

  // ----- convert -----
  const convert = useCallback(() => {
    if (!input.trim()) return;
    try {
      const t0 = performance.now();
      if (direction === "to") {
        const r = parseJson(input);
        if (!r.ok) {
          setMessage({ kind: "error", text: `Line ${r.error.line}, column ${r.error.column}: ${r.error.message}` });
          return;
        }
        setOutput(convertTo(target, r.value));
        setOutputLang(TARGETS.find((x) => x.id === target)!.language as EditorLanguage);
        setMessage({ kind: "ok", text: `Converted JSON → ${TARGETS.find((x) => x.id === target)!.label}.` });
      } else {
        const value = convertFrom(source, input);
        setOutput(format(value, indent));
        setOutputLang("json");
        setMessage({ kind: "ok", text: `Converted ${source.toUpperCase()} → JSON.` });
      }
      setElapsed(performance.now() - t0);
    } catch (e) {
      setMessage({ kind: "error", text: (e as Error).message });
    }
  }, [direction, target, source, input, indent]);

  // Convert live while in convert mode.
  useEffect(() => {
    if (mode !== "convert") return;
    const id = setTimeout(convert, 250);
    return () => clearTimeout(id);
  }, [mode, convert]);

  // ----- compare -----
  const comparison = useMemo(() => {
    if (mode !== "compare") return null;
    const a = parseJson(input);
    const b = parseJson(right);
    if (!a.ok) return { error: `Left: line ${a.error.line}, column ${a.error.column}: ${a.error.message}` };
    if (!b.ok) return { error: `Right: line ${b.error.line}, column ${b.error.column}: ${b.error.message}` };
    return { entries: diff(a.value, b.value) };
  }, [mode, input, right]);

  // ----- query -----
  const queryResult = useMemo(() => {
    if (mode !== "query" || !parsed?.ok) return null;
    try {
      return { matches: queryJsonPath(parsed.value, path) };
    } catch (e) {
      return { error: (e as Error).message };
    }
  }, [mode, parsed, path]);

  // Fullscreen: Esc to leave, no page scroll behind.
  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setFullscreen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [fullscreen]);

  const outputValue = useMemo(() => {
    if (outputLang !== "json" || !output) return undefined;
    const r = parseJson(output);
    return r.ok ? r.value : undefined;
  }, [output, outputLang]);

  const inputLanguage: EditorLanguage = mode === "convert" && direction === "from" ? (source === "csv" ? "text" : source) : "json";
  const outputExt = mode === "convert" && direction === "to" ? TARGETS.find((t) => t.id === target)!.ext : outputLang === "text" ? "txt" : "json";

  const MODES: { id: Mode; label: string }[] = [
    { id: "format", label: "Format & Validate" },
    { id: "convert", label: "Convert" },
    { id: "compare", label: "Compare" },
    { id: "query", label: "JSONPath Query" },
  ];

  // ----- render helpers -----
  const inputPane = (title = "Input") => (
    <div
      className="relative min-w-0 lg:h-full lg:min-h-0"
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) void loadFile(file);
      }}
    >
      <Pane
        title={title}
        actions={
          <>
            <button type="button" className={smallBtn} onClick={() => fileRef.current?.click()}>
              Open file
            </button>
            <button type="button" className={smallBtn} onClick={() => setUrlOpen((o) => !o)}>
              Load URL
            </button>
            <button type="button" className={smallBtn} onClick={() => loadText(mode === "convert" && direction === "from" ? sampleFor(source) : SAMPLE, "sample")}>
              Sample
            </button>
            {mode === "format" && (
              <button type="button" className={smallBtn} onClick={() => loadText(BROKEN_SAMPLE, "broken sample")}>
                Broken sample
              </button>
            )}
            <button type="button" className={smallBtn} onClick={() => { setInput(""); setOutput(""); setMessage(null); }}>
              Clear
            </button>
          </>
        }
        footer={
          <span className="flex flex-wrap gap-x-3">
            <span>{fmtBytes(bytes(input))}</span>
            <span>{lines(input).toLocaleString("en")} lines</span>
            {inputStats && (
              <>
                <span>{inputStats.keys.toLocaleString("en")} keys</span>
                <span>depth {inputStats.depth}</span>
              </>
            )}
            {inputLanguage === "json" && input.trim() && (
              parsed?.ok ? <span className="text-emerald-600 dark:text-emerald-400">✓ valid</span> : parsed && !parsed.ok ? (
                <button type="button" onClick={() => setReveal((n) => n + 1)} className="text-rose-600 underline dark:text-rose-400">
                  ✕ error at line {parsed.error.line}:{parsed.error.column}
                </button>
              ) : null
            )}
          </span>
        }
      >
        {urlOpen && (
          <div className="flex gap-2 border-b border-border bg-surface p-2">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void loadUrl()}
              placeholder="https://api.example.com/data.json"
              aria-label="URL to load"
              className="h-8 min-w-0 flex-1 rounded-md border border-border bg-background px-2 text-sm outline-none focus:border-accent"
            />
            <button type="button" className={btnPrimary + " h-8"} onClick={() => void loadUrl()}>
              Load
            </button>
          </div>
        )}
        <div className={urlOpen ? "h-[calc(100%-49px)]" : "h-full"}>
          <CodeEditor
            label="JSON input"
            value={input}
            onChange={setInput}
            language={inputLanguage}
            error={inputError}
            revealError={reveal}
            onSubmit={mode === "format" ? actions.format : undefined}
            placeholder={inputLanguage === "json" ? "Paste JSON here, drop a file, or press Sample…" : `Paste ${source.toUpperCase()} here…`}
          />
        </div>
        {dragging && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-xl border-2 border-dashed border-accent bg-accent/10 text-sm font-medium text-accent">
            Drop a file to load it
          </div>
        )}
      </Pane>
    </div>
  );

  const outputPane = (title = "Output") => (
    <Pane
      title={title}
      actions={
        <>
          {outputValue !== undefined && (
            <div className="mr-1 flex rounded-md border border-border p-0.5" role="tablist" aria-label="Output view">
              {(["code", "tree"] as const).map((v) => (
                <button key={v} type="button" role="tab" aria-selected={outputView === v} onClick={() => setOutputView(v)} className={`rounded px-2 py-0.5 text-xs capitalize ${outputView === v ? "bg-chip font-medium" : "text-muted"}`}>
                  {v}
                </button>
              ))}
            </div>
          )}
          <button type="button" className={smallBtn} disabled={!output} onClick={async () => notify((await copy(output)) ? "Copied!" : "Copy failed")}>
            Copy
          </button>
          <button type="button" className={smallBtn} disabled={!output} onClick={() => download(`formatted.${outputExt}`, output, outputExt === "json" ? "application/json" : "text/plain")}>
            Download
          </button>
          <button type="button" className={smallBtn} disabled={!output || mode !== "format"} onClick={() => { setInput(output); notify("Moved to input"); }} title="Use the output as the new input">
            ⇦ Use as input
          </button>
        </>
      }
      footer={
        <span className="flex flex-wrap gap-x-3">
          <span>{fmtBytes(bytes(output))}</span>
          <span>{lines(output).toLocaleString("en")} lines</span>
          {elapsed !== null && <span>{elapsed < 1 ? "<1" : elapsed.toFixed(1)} ms</span>}
          {flash && <span className="font-medium text-accent">{flash}</span>}
        </span>
      }
    >
      {outputView === "tree" && outputValue !== undefined ? (
        <JsonTree value={outputValue} onPick={async (p) => notify((await copy(p)) ? `Copied path ${p}` : p)} />
      ) : output ? (
        <CodeEditor label="Output" value={output} language={outputLang} readOnly />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-sm text-muted">
          <p>Your result appears here.</p>
          {mode === "format" && (
            <p>
              Press <strong>Format</strong> or <kbd className="rounded border border-border px-1 font-mono text-[11px]">Ctrl</kbd>+<kbd className="rounded border border-border px-1 font-mono text-[11px]">Enter</kbd> in the input.
            </p>
          )}
        </div>
      )}
    </Pane>
  );

  return (
    <div className={`flex flex-col gap-2.5 ${fullscreen ? "fixed inset-0 z-50 overflow-auto bg-background p-3 sm:p-4" : "px-3 py-3 sm:px-4 lg:h-[calc(100dvh-3.5rem)]"}`}>
      <input ref={fileRef} type="file" accept=".json,.geojson,.txt,.yaml,.yml,.xml,.csv,application/json,text/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void loadFile(f); e.target.value = ""; }} />

      {/* Mode tabs */}
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {heading}
        <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-surface p-1" role="tablist" aria-label="Tool">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={mode === m.id}
              onClick={() => { setMode(m.id); setMessage(null); if (m.id !== "convert") { setOutputLang("json"); } }}
              className={`rounded-lg px-3 py-1.5 text-sm ${mode === m.id ? "bg-accent font-medium text-surface" : "text-muted hover:bg-chip hover:text-foreground"}`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <CloudSave
          className="ml-auto"
          kind="json"
          noun="document"
          getData={() => ({ input })}
          getTitle={() => "JSON document"}
          onLoad={(d: { input?: unknown }) => setInput(typeof d?.input === "string" ? d.input : "")}
        />
        <button type="button" className={btn} onClick={() => setFullscreen((f) => !f)} aria-pressed={fullscreen}>
          {fullscreen ? "⤡ Exit fullscreen" : "⤢ Fullscreen"}
        </button>
      </div>

      {/* Toolbars */}
      {mode === "format" && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button type="button" className={btnPrimary} onClick={actions.format} title="Ctrl+Enter">
            Format / Beautify
          </button>
          <label className="flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-2 text-sm">
            <span className="text-muted">Indent</span>
            <select value={String(indent)} onChange={(e) => setIndent(e.target.value === "tab" ? "\t" : (Number(e.target.value) as Indent))} className="bg-transparent outline-none" aria-label="Indentation">
              <option value="2">2 spaces</option>
              <option value="3">3 spaces</option>
              <option value="4">4 spaces</option>
              <option value="tab">Tab</option>
            </select>
          </label>
          <button type="button" className={btn} onClick={actions.minify}>Minify</button>
          <button type="button" className={btn} onClick={actions.validate}>Validate</button>
          <button type="button" className={btn} onClick={actions.sort}>Sort keys</button>
          <button type="button" className={btn} onClick={actions.repair}>🔧 Repair</button>
          <button type="button" className={btn} onClick={actions.escape}>Escape</button>
          <button type="button" className={btn} onClick={actions.unescape}>Unescape</button>
        </div>
      )}

      {mode === "convert" && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-border bg-surface p-0.5" role="tablist" aria-label="Direction">
            <button type="button" role="tab" aria-selected={direction === "to"} onClick={() => setDirection("to")} className={`rounded-md px-3 py-1.5 text-sm ${direction === "to" ? "bg-chip font-medium" : "text-muted"}`}>
              JSON → other
            </button>
            <button type="button" role="tab" aria-selected={direction === "from"} onClick={() => setDirection("from")} className={`rounded-md px-3 py-1.5 text-sm ${direction === "from" ? "bg-chip font-medium" : "text-muted"}`}>
              Other → JSON
            </button>
          </div>
          {direction === "to"
            ? TARGETS.map((t) => (
                <button key={t.id} type="button" aria-pressed={target === t.id} onClick={() => setTarget(t.id)} className={target === t.id ? btnPrimary : btn}>
                  {t.label}
                </button>
              ))
            : (["yaml", "xml", "csv"] as Source[]).map((s) => (
                <button key={s} type="button" aria-pressed={source === s} onClick={() => setSource(s)} className={source === s ? btnPrimary : btn}>
                  {s.toUpperCase()}
                </button>
              ))}
        </div>
      )}

      {mode === "query" && (
        <div className="shrink-0 space-y-2">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={path}
              onChange={(e) => setPath(e.target.value)}
              spellCheck={false}
              aria-label="JSONPath expression"
              placeholder="$.store.book[*].author"
              className="h-10 min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 font-mono text-sm outline-none focus:border-accent"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <span className="self-center text-xs text-muted">Examples:</span>
            {QUERY_EXAMPLES.map((q) => (
              <button key={q} type="button" onClick={() => setPath(q)} className="rounded-md border border-border px-2 py-0.5 font-mono text-xs text-muted hover:border-accent hover:text-accent">
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Status message */}
      {message && (
        <div
          role="status"
          className={`flex shrink-0 items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
            message.kind === "error"
              ? "border-rose-600/30 bg-rose-500/10 text-rose-800 dark:text-rose-300"
              : message.kind === "ok"
                ? "border-emerald-600/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                : "border-border bg-surface text-muted"
          }`}
        >
          <span className="flex-1">{message.text}</span>
          {message.kind === "error" && inputError && (
            <button type="button" onClick={() => setReveal((n) => n + 1)} className="shrink-0 underline">
              Go to error
            </button>
          )}
          <button type="button" onClick={() => setMessage(null)} aria-label="Dismiss" className="shrink-0 opacity-60 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      {/* Panes */}
      {mode === "format" && <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-2">{inputPane()}{outputPane()}</div>}

      {mode === "convert" && (
        <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-2">
          {inputPane(direction === "to" ? "JSON input" : `${source.toUpperCase()} input`)}
          {outputPane(direction === "to" ? `${TARGETS.find((t) => t.id === target)!.label} output` : "JSON output")}
        </div>
      )}

      {mode === "compare" && (
        <>
          <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-2">
            {inputPane("Original (left)")}
            <Pane title="Changed (right)">
              <CodeEditor label="Right JSON" value={right} onChange={setRight} language="json" placeholder="Paste the JSON to compare…" />
            </Pane>
          </div>
          <CompareResults result={comparison} />
        </>
      )}

      {mode === "query" && (
        <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-2">
          {inputPane()}
          <Pane
            title={queryResult?.matches ? `${queryResult.matches.length} match${queryResult.matches.length === 1 ? "" : "es"}` : "Results"}
            actions={
              queryResult?.matches && (
                <button type="button" className={smallBtn} onClick={async () => notify((await copy(JSON.stringify(queryResult.matches!.map((m) => m.value), null, 2))) ? "Copied!" : "Copy failed")}>
                  Copy values
                </button>
              )
            }
          >
            {!parsed?.ok ? (
              <p className="p-4 text-sm text-muted">Enter valid JSON on the left to query it.</p>
            ) : queryResult?.error ? (
              <p className="p-4 text-sm text-rose-600 dark:text-rose-400">{queryResult.error}</p>
            ) : (
              <ul className="h-full divide-y divide-border overflow-auto">
                {queryResult?.matches?.length === 0 && <li className="p-4 text-sm text-muted">No matches.</li>}
                {queryResult?.matches?.slice(0, 500).map((m) => (
                  <li key={m.path} className="px-3 py-2">
                    <button type="button" onClick={async () => notify((await copy(m.path)) ? `Copied ${m.path}` : m.path)} className="font-mono text-xs text-accent hover:underline" title="Copy path">
                      {m.path}
                    </button>
                    <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap break-all font-mono text-[12.5px]">{JSON.stringify(m.value, null, 2)}</pre>
                  </li>
                ))}
              </ul>
            )}
          </Pane>
        </div>
      )}
    </div>
  );
}

function sampleFor(source: Source): string {
  if (source === "yaml") return "company: Acme Corp\nfounded: 1999\nemployees:\n  - name: Ada Lovelace\n    role: engineer\n    skills: [math, algorithms]\n  - name: Grace Hopper\n    role: manager\n    skills: [cobol, leadership]\n";
  if (source === "xml") return '<?xml version="1.0"?>\n<company founded="1999">\n  <name>Acme Corp</name>\n  <employee id="1"><name>Ada Lovelace</name><role>engineer</role></employee>\n  <employee id="2"><name>Grace Hopper</name><role>manager</role></employee>\n</company>\n';
  return "id,name,role,salary,remote\n1,Ada Lovelace,engineer,120000,false\n2,Grace Hopper,manager,135000,true\n3,Linus Torvalds,engineer,128000,true\n";
}

function CompareResults({ result }: { result: { error: string } | { entries: DiffEntry[] } | null }) {
  if (!result) return null;
  if ("error" in result) return <p className="shrink-0 rounded-lg border border-rose-600/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-800 dark:text-rose-300">{result.error}</p>;
  const { entries } = result;
  const count = (k: DiffEntry["kind"]) => entries.filter((e) => e.kind === k).length;
  const style: Record<DiffEntry["kind"], string> = {
    added: "border-emerald-600/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
    removed: "border-rose-600/30 bg-rose-500/10 text-rose-800 dark:text-rose-300",
    changed: "border-amber-600/30 bg-amber-500/10 text-amber-800 dark:text-amber-300",
    type: "border-violet-600/30 bg-violet-500/10 text-violet-800 dark:text-violet-300",
  };
  const show = (v: unknown) => (v === undefined ? "" : JSON.stringify(v));
  return (
    <section className="shrink-0 overflow-auto rounded-xl border border-border bg-surface lg:max-h-[38%]">
      <header className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2.5">
        <h2 className="mr-2 text-sm font-semibold">{entries.length === 0 ? "✓ The two documents are identical" : `${entries.length} difference${entries.length === 1 ? "" : "s"}`}</h2>
        {(["added", "removed", "changed", "type"] as const).map((k) =>
          count(k) ? (
            <span key={k} className={`rounded-full border px-2 py-0.5 text-xs ${style[k]}`}>
              {count(k)} {k === "type" ? "type changed" : k}
            </span>
          ) : null,
        )}
      </header>
      {entries.length > 0 && (
        <ul className="max-h-96 divide-y divide-border overflow-auto">
          {entries.slice(0, 1000).map((e) => (
            <li key={`${e.kind}${e.path}`} className="grid gap-1 px-4 py-2 text-sm md:grid-cols-[7rem_minmax(0,1.2fr)_minmax(0,2fr)] md:gap-3">
              <span className={`h-fit w-fit rounded border px-1.5 text-xs ${style[e.kind]}`}>{e.kind === "type" ? "type" : e.kind}</span>
              <code className="break-all font-mono text-xs">{e.path}</code>
              <span className="break-all font-mono text-xs">
                {e.kind === "added" && <span className="text-emerald-700 dark:text-emerald-400">+ {show(e.right)}</span>}
                {e.kind === "removed" && <span className="text-rose-700 dark:text-rose-400">− {show(e.left)}</span>}
                {(e.kind === "changed" || e.kind === "type") && (
                  <>
                    <span className="text-rose-700 line-through dark:text-rose-400">{show(e.left)}</span> → <span className="text-emerald-700 dark:text-emerald-400">{show(e.right)}</span>
                  </>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
