"use client";

import { CloudSave } from "@/components/account/CloudSave";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CODE_LANGUAGES, generateCode, type CodeLanguage } from "@/lib/regex/codegen";
import { explain, FLAG_INFO, type Explanation } from "@/lib/regex/explain";
import { tokenizePattern, type Token } from "@/lib/regex/highlight";
import { parseRegex, type CaptureGroup } from "@/lib/regex/parse";
import { QUICK_REFERENCE } from "@/lib/regex/reference";
import { MAX_MATCHES, RegexRunner, type MatchResult, type RunResponse } from "@/lib/regex/worker";
import { HighlightedEditor } from "./HighlightedEditor";

type Mode = "match" | "substitution" | "list";

const FLAGS = ["g", "i", "m", "s", "u", "v", "y", "d"] as const;
const STORAGE_KEY = "coderef:regex-tester";

const DEFAULTS = {
  pattern: String.raw`(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})`,
  flags: "gm",
  text: [
    "Release dates:",
    "v1.0 shipped on 2024-03-18 after a long beta.",
    "v1.1 followed on 2024-07-02, and v2.0 on 2025-01-27.",
    "Not dates: 2024-3-8, 20240318, 24-03-18",
  ].join("\n"),
  replacement: "$<day>/$<month>/$<year>",
  mode: "match" as Mode,
};

// Fallbacks keep highlights visible even if the stylesheet with the --rx-* tokens is stale.
const GROUP_BG = [
  "var(--rx-g1, rgb(34 197 94 / 0.35))",
  "var(--rx-g2, rgb(249 115 22 / 0.35))",
  "var(--rx-g3, rgb(236 72 153 / 0.3))",
  "var(--rx-g4, rgb(139 92 246 / 0.35))",
  "var(--rx-g5, rgb(20 184 166 / 0.35))",
];
const groupColor = (n: number) => GROUP_BG[(n - 1) % GROUP_BG.length];
const GROUP_LINE = [
  "var(--rx-line-1, #16a34a)",
  "var(--rx-line-2, #ea580c)",
  "var(--rx-line-3, #db2777)",
  "var(--rx-line-4, #7c3aed)",
  "var(--rx-line-5, #0d9488)",
];
const groupLine = (n: number) => GROUP_LINE[(n - 1) % GROUP_LINE.length];
const MATCH_BG = ["var(--rx-match-a, rgb(250 204 21 / 0.55))", "var(--rx-match-b, rgb(251 191 36 / 0.75))"];
const DEPTH = ["var(--rx-depth-0, #16a34a)", "var(--rx-depth-1, #ea580c)", "var(--rx-depth-2, #db2777)", "var(--rx-depth-3, #ca8a04)"];

const TOKEN_STYLE: Record<Token["kind"], string | undefined> = {
  group: undefined,
  quantifier: "var(--rx-quantifier, #2563eb)",
  class: "var(--rx-class, #0e7490)",
  escape: "var(--rx-escape, #9333ea)",
  anchor: "var(--rx-anchor, #dc2626)",
  alternation: "var(--rx-depth-1, #ea580c)",
  backref: "var(--rx-backref, #c026d3)",
  literal: undefined,
};

function renderPattern(pattern: string): ReactNode {
  return tokenizePattern(pattern).map((token, i) => {
    const color = token.kind === "group" ? DEPTH[(token.depth ?? 0) % DEPTH.length] : TOKEN_STYLE[token.kind];
    const bold = token.kind === "group" || token.kind === "alternation";
    return (
      <span key={i} style={{ color, fontWeight: bold ? 600 : undefined }}>
        {pattern.slice(token.start, token.end)}
      </span>
    );
  });
}

// Splits the test string at every match/group boundary and colors each piece.
function renderMatches(text: string, matches: MatchResult[]): ReactNode {
  if (!matches.length) return text;
  const nodes: ReactNode[] = [];
  let pos = 0;
  matches.forEach((match, mi) => {
    if (match.index > pos) nodes.push(text.slice(pos, match.index));
    if (match.end === match.index) {
      // Zero-length match: a thin marker that takes no space.
      nodes.push(
        <span key={`z${mi}`} className="relative">
          <span className="absolute -left-px top-0.5 h-5 w-0.5 rounded bg-accent" />
        </span>,
      );
      pos = Math.max(pos, match.index);
      return;
    }
    const cuts = new Set([match.index, match.end]);
    for (const g of match.groups) if (g && g.end > g.start) cuts.add(g.start).add(g.end);
    const points = [...cuts].filter((p) => p >= match.index && p <= match.end).sort((a, b) => a - b);
    for (let k = 0; k < points.length - 1; k++) {
      const [a, b] = [points[k], points[k + 1]];
      // Innermost group covering this piece.
      let group = 0;
      let span = Infinity;
      match.groups.forEach((g, gi) => {
        if (g && g.start <= a && b <= g.end && g.end - g.start < span) [group, span] = [gi + 1, g.end - g.start];
      });
      nodes.push(
        <mark
          key={`${mi}-${a}`}
          className={`text-foreground ${k === 0 ? "rounded-l-sm" : ""} ${k === points.length - 2 ? "rounded-r-sm" : ""}`}
          style={{
            background: MATCH_BG[mi % 2],
            boxShadow: group ? `inset 0 -3px 0 ${groupLine(group)}` : undefined,
          }}
        >
          {text.slice(a, b)}
        </mark>,
      );
    }
    pos = match.end;
  });
  if (pos < text.length) nodes.push(text.slice(pos));
  return nodes;
}

function ExplanationTree({ items }: { items: Explanation[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i}>
          <p className="text-[13px] leading-snug">
            <code className="mr-1.5 rounded bg-chip px-1 py-px font-mono text-[12px] font-semibold break-all">{item.raw}</code>
            <span className="text-muted">{item.text}</span>
          </p>
          {item.children && item.children.length > 0 && (
            <div className="mt-1.5 ml-2 border-l border-border pl-3">
              <ExplanationTree items={item.children} />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

function Panel({ title, actions, children }: { title: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-surface">
      <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">{title}</h2>
        {actions}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

function CopyButton({ text, label = "Copy" }: { text: string | (() => string); label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(typeof text === "function" ? text() : text);
          setDone(true);
          setTimeout(() => setDone(false), 1200);
        } catch {
          // Clipboard unavailable; nothing else to do.
        }
      }}
      className="rounded-md border border-border px-2 py-0.5 text-xs text-muted hover:text-foreground"
    >
      {done ? "Copied!" : label}
    </button>
  );
}

export function RegexTester() {
  const [pattern, setPattern] = useState(DEFAULTS.pattern);
  const [flags, setFlags] = useState(DEFAULTS.flags);
  const [text, setText] = useState(DEFAULTS.text);
  const [replacement, setReplacement] = useState(DEFAULTS.replacement);
  const [mode, setMode] = useState<Mode>(DEFAULTS.mode);
  const [lang, setLang] = useState<CodeLanguage>("JavaScript");
  const [refQuery, setRefQuery] = useState("");
  const [result, setResult] = useState<RunResponse | null>(null);
  const [loaded, setLoaded] = useState(false);
  const runner = useRef<RegexRunner | null>(null);
  const patternRef = useRef<HTMLTextAreaElement | null>(null);

  // Restore state: share link (#p=…) first, then the last session.
  useEffect(() => {
    let saved: URLSearchParams | null = null;
    if (location.hash.length > 1) saved = new URLSearchParams(location.hash.slice(1));
    else {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) saved = new URLSearchParams(stored);
      } catch {
        // Storage blocked: start from the defaults.
      }
    }
    if (saved) {
      /* eslint-disable react-hooks/set-state-in-effect -- one-time hydration from URL/storage */
      if (saved.has("p")) setPattern(saved.get("p")!);
      if (saved.has("f")) setFlags(saved.get("f")!.replace(/[^gimsuvyd]/g, ""));
      if (saved.has("t")) setText(saved.get("t")!);
      if (saved.has("r")) setReplacement(saved.get("r")!);
      const m = saved.get("m");
      if (m === "match" || m === "substitution" || m === "list") setMode(m);
      /* eslint-enable react-hooks/set-state-in-effect */
    }
    setLoaded(true);
    runner.current = new RegexRunner();
    return () => runner.current?.dispose();
  }, []);

  const query = useMemo(
    () => new URLSearchParams({ p: pattern, f: flags, t: text, r: replacement, m: mode }).toString(),
    [pattern, flags, text, replacement, mode],
  );

  // Keep the URL and storage in sync so refresh and "share" keep the current state.
  useEffect(() => {
    if (!loaded) return;
    const id = setTimeout(() => {
      history.replaceState(null, "", `#${query}`);
      try {
        localStorage.setItem(STORAGE_KEY, query);
      } catch {
        // Storage blocked: the URL still holds the state.
      }
    }, 300);
    return () => clearTimeout(id);
  }, [query, loaded]);

  // Compile on the main thread (fast, can't hang) for errors and the explanation.
  const compiled = useMemo(() => {
    if (!pattern) return { error: null, groups: [] as CaptureGroup[], explanation: [] as Explanation[] };
    try {
      new RegExp(pattern, flags);
    } catch (err) {
      return { error: (err as Error).message, groups: [] as CaptureGroup[], explanation: [] as Explanation[] };
    }
    try {
      const { ast, groups } = parseRegex(pattern, flags);
      return { error: null, groups, explanation: explain(ast, pattern, flags) };
    } catch {
      return { error: null, groups: [] as CaptureGroup[], explanation: [] as Explanation[] };
    }
  }, [pattern, flags]);

  // Matching runs in the worker, debounced.
  useEffect(() => {
    if (!loaded || !pattern || compiled.error) return;
    let cancelled = false;
    const id = setTimeout(async () => {
      const response = await runner.current?.run({ pattern, flags, text, mode, replacement });
      if (!cancelled && response) setResult(response);
    }, 120);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [pattern, flags, text, mode, replacement, compiled.error, loaded]);

  const active = pattern && !compiled.error ? result : null;
  const matches = active?.ok ? active.matches : [];

  const toggleFlag = (flag: string) => {
    setFlags((current) => {
      let next = current.includes(flag) ? current.replace(flag, "") : current + flag;
      if (flag === "u" && next.includes("u")) next = next.replace("v", "");
      if (flag === "v" && next.includes("v")) next = next.replace("u", "");
      return FLAGS.filter((f) => next.includes(f)).join("");
    });
  };

  const insertToken = (token: string) => {
    const el = patternRef.current;
    const start = el?.selectionStart ?? pattern.length;
    const end = el?.selectionEnd ?? pattern.length;
    const next = pattern.slice(0, start) + token + pattern.slice(end);
    setPattern(next);
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      // Place the caret inside empty groups like "()" so typing continues there.
      const caret = start + (token.length > 1 && token.endsWith(")") ? token.length - 1 : token.length);
      el.setSelectionRange(caret, caret);
    });
  };

  let status: ReactNode;
  if (!pattern) status = <span className="text-muted">Enter a pattern to start matching.</span>;
  else if (compiled.error) status = <span className="text-[var(--rx-anchor,#dc2626)]">{compiled.error}</span>;
  else if (!active) status = <span className="text-muted">Matching…</span>;
  else if (!active.ok && "timeout" in active)
    status = (
      <span className="text-[var(--rx-anchor,#dc2626)]">
        Timed out after 2 s — the pattern is probably backtracking catastrophically (e.g. nested quantifiers like (a+)+).
      </span>
    );
  else if (!active.ok) status = <span className="text-[var(--rx-anchor,#dc2626)]">{active.error}</span>;
  else
    status = (
      <span className="text-muted">
        <strong className="text-foreground">
          {active.truncated ? `${MAX_MATCHES}+` : active.matches.length} {active.matches.length === 1 ? "match" : "matches"}
        </strong>{" "}
        · {active.time < 1 ? "<1" : active.time.toFixed(1)} ms
      </span>
    );

  const code = generateCode(lang, { pattern, flags, text, substitution: mode === "substitution" ? replacement : undefined });
  const q = refQuery.trim().toLowerCase();
  const reference = QUICK_REFERENCE.map((section) => ({
    ...section,
    items: section.items.filter((item) => !q || item.token.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q)),
  })).filter((section) => section.items.length > 0);

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="min-w-0 space-y-4">
        <Panel
          title="Regular expression"
          actions={
            <div className="flex items-center gap-2">
              <span className="hidden text-xs text-muted sm:inline">ECMAScript (JavaScript) flavor</span>
              <CloudSave
                kind="regex"
                noun="regex"
                getData={() => ({ pattern, flags, text, replacement })}
                getTitle={() => pattern.slice(0, 60) || "Untitled regex"}
                onLoad={(d: { pattern?: unknown; flags?: unknown; text?: unknown; replacement?: unknown }) => {
                  const s = (v: unknown) => (typeof v === "string" ? v : "");
                  setPattern(s(d?.pattern));
                  setFlags(s(d?.flags).replace(/[^dgimsuyv]/g, ""));
                  setText(s(d?.text));
                  setReplacement(s(d?.replacement));
                }}
              />
            </div>
          }
        >
          <div className="flex items-start rounded-lg border border-border bg-background focus-within:border-accent">
            <span className="select-none py-2 pl-3 font-mono text-[13px] leading-6 text-muted">/</span>
            <HighlightedEditor
              label="Regular expression"
              value={pattern}
              onChange={setPattern}
              highlighted={renderPattern(pattern)}
              singleLine
              placeholder="insert your regular expression here"
              textareaRef={(el) => {
                patternRef.current = el;
              }}
            />
            <span className="select-none py-2 pr-3 font-mono text-[13px] leading-6 text-muted">/{flags}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Flags">
            {FLAGS.map((flag) => (
              <button
                key={flag}
                type="button"
                onClick={() => toggleFlag(flag)}
                aria-pressed={flags.includes(flag)}
                title={FLAG_INFO[flag].text}
                className={`rounded-md border px-2 py-0.5 font-mono text-xs transition-colors ${
                  flags.includes(flag)
                    ? "border-accent bg-accent text-surface"
                    : "border-border text-muted hover:text-foreground"
                }`}
              >
                {flag} <span className="font-sans opacity-80">{FLAG_INFO[flag].name}</span>
              </button>
            ))}
          </div>
          <p className="mt-3 text-sm" role="status">
            {status}
          </p>
        </Panel>

        <Panel title="Test string" actions={<span className="text-xs text-muted">{text.length} chars</span>}>
          <div className="rounded-lg border border-border bg-background focus-within:border-accent">
            <HighlightedEditor
              label="Test string"
              value={text}
              onChange={setText}
              highlighted={renderMatches(text, matches)}
              minRows={6}
              placeholder="insert your test string here"
            />
          </div>
        </Panel>

        <Panel
          title="Function"
          actions={
            <div className="flex gap-1" role="tablist" aria-label="Function">
              {(["match", "substitution", "list"] as Mode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => setMode(m)}
                  className={`rounded-md px-2.5 py-1 text-xs capitalize ${
                    mode === m ? "bg-chip font-medium text-foreground" : "text-muted hover:text-foreground"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          }
        >
          {mode === "match" ? (
            <p className="text-sm text-muted">
              Matches are highlighted in the test string; details are under <em>Match information</em>. Switch to{" "}
              <strong>Substitution</strong> to replace matches, or <strong>List</strong> to output a template for each
              match.
            </p>
          ) : (
            <>
              <label className="mb-1.5 block text-xs text-muted" htmlFor="replacement">
                {mode === "substitution" ? "Substitution" : "List template"} — use $&, $1, $&lt;name&gt;, $`, $&apos;, $$
              </label>
              <input
                id="replacement"
                value={replacement}
                onChange={(e) => setReplacement(e.target.value)}
                spellCheck={false}
                className="h-9 w-full rounded-lg border border-border bg-background px-3 font-mono text-[13px] outline-none focus:border-accent"
              />
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-muted">Result</span>
                {active?.ok && active.output !== null && <CopyButton text={active.output} />}
              </div>
              <pre className="mt-1.5 max-h-80 overflow-auto rounded-lg border border-border bg-background px-3 py-2 font-mono text-[13px] leading-6 whitespace-pre-wrap break-words">
                {active?.ok ? active.output : ""}
              </pre>
            </>
          )}
        </Panel>

        <Panel
          title="Code generator"
          actions={<CopyButton text={code.code} />}
        >
          <div className="mb-3 flex flex-wrap gap-1" role="tablist" aria-label="Language">
            {CODE_LANGUAGES.map((l) => (
              <button
                key={l}
                type="button"
                role="tab"
                aria-selected={lang === l}
                onClick={() => setLang(l)}
                className={`rounded-md px-2.5 py-1 text-xs ${
                  lang === l ? "bg-chip font-medium text-foreground" : "text-muted hover:text-foreground"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
          {code.note && <p className="mb-2 text-xs text-muted">{code.note}</p>}
          <pre className="max-h-96 overflow-auto rounded-lg border border-border bg-background p-3 font-mono text-[12px] leading-5">
            {code.code}
          </pre>
        </Panel>
      </div>

      <aside className="min-w-0 space-y-4">
        <Panel title="Explanation" actions={<CopyButton text={() => location.href} label="Copy share link" />}>
          {compiled.explanation.length ? (
            <>
              <p className="mb-3 font-mono text-[13px] break-all">
                /{renderPattern(pattern)}/<span className="text-muted">{flags}</span>
              </p>
              <ExplanationTree items={compiled.explanation} />
              {flags && (
                <div className="mt-4 border-t border-border pt-3">
                  <h3 className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted">Flags</h3>
                  <ul className="space-y-1 text-[13px]">
                    {[...flags].map((f) => (
                      <li key={f}>
                        <code className="mr-1.5 rounded bg-chip px-1 font-mono font-semibold">{f}</code>
                        <span className="text-muted">
                          {FLAG_INFO[f].name} — {FLAG_INFO[f].text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted">{compiled.error ? "Fix the pattern to see its explanation." : "An explanation of your pattern appears here."}</p>
          )}
        </Panel>

        <Panel title="Match information">
          {matches.length === 0 ? (
            <p className="text-sm text-muted">{active?.ok ? "Your pattern does not match the test string." : "Matches appear here."}</p>
          ) : (
            <ol className="max-h-[28rem] space-y-3 overflow-auto pr-1">
              {matches.slice(0, 200).map((match, mi) => (
                <li key={mi} className="text-[13px]">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-medium">Match {mi + 1}</span>
                    <span className="font-mono text-xs text-muted">
                      {match.index}-{match.end}
                    </span>
                  </div>
                  <code
                    className="mt-0.5 block rounded px-1.5 py-0.5 font-mono break-all"
                    style={{ background: MATCH_BG[mi % 2] }}
                  >
                    {match.text || <span className="text-muted">(empty)</span>}
                  </code>
                  {match.groups.map((g, gi) => {
                    const name = compiled.groups.find((cg) => cg.index === gi + 1)?.name;
                    return (
                      <div key={gi} className="mt-1 flex items-baseline gap-2 pl-2">
                        <span className="shrink-0 text-xs text-muted">
                          Group {gi + 1}
                          {name && <span className="font-mono"> {name}</span>}
                        </span>
                        {g ? (
                          <>
                            <code className="rounded px-1 font-mono break-all" style={{ background: groupColor(gi + 1) }}>
                              {g.text || "(empty)"}
                            </code>
                            <span className="ml-auto shrink-0 font-mono text-xs text-muted">
                              {g.start}-{g.end}
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-muted">did not participate</span>
                        )}
                      </div>
                    );
                  })}
                </li>
              ))}
              {matches.length > 200 && <li className="text-xs text-muted">…and {matches.length - 200} more</li>}
            </ol>
          )}
        </Panel>

        <Panel title="Quick reference" actions={<Link href="/regex/" className="text-xs text-accent hover:underline">Full cheat sheet</Link>}>
          <input
            type="search"
            value={refQuery}
            onChange={(e) => setRefQuery(e.target.value)}
            placeholder="Search tokens…"
            aria-label="Search quick reference"
            className="mb-3 h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus:border-accent"
          />
          <div className="max-h-[28rem] space-y-3 overflow-auto pr-1">
            {reference.map((section) => (
              <div key={section.title}>
                <h3 className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">{section.title}</h3>
                <ul>
                  {section.items.map((item) => {
                    const insertable = section.title !== "Substitution";
                    return (
                      <li key={item.token}>
                        <button
                          type="button"
                          disabled={!insertable}
                          onClick={() => insertToken(item.insert ?? item.token)}
                          title={insertable ? "Insert into pattern" : undefined}
                          className="flex w-full items-baseline gap-3 rounded-md px-1.5 py-1 text-left text-[13px] enabled:hover:bg-chip"
                        >
                          <code className="w-24 shrink-0 font-mono font-semibold text-[var(--rx-escape,#9333ea)]">{item.token}</code>
                          <span className="text-muted">{item.desc}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </Panel>
      </aside>
    </div>
  );
}
