// Runs matching in a Web Worker so a catastrophic pattern can be killed instead of freezing the page.

export type MatchGroup = { start: number; end: number; text: string } | null;
export type MatchResult = { index: number; end: number; text: string; groups: MatchGroup[] };

export type RunRequest = {
  pattern: string;
  flags: string;
  text: string;
  mode: "match" | "substitution" | "list";
  replacement: string;
};

export type RunResponse =
  | { ok: true; matches: MatchResult[]; truncated: boolean; output: string | null; time: number }
  | { ok: false; error: string }
  | { ok: false; timeout: true };

export const MAX_MATCHES = 1000;
const TIMEOUT_MS = 2000;

// Plain JS (not TypeScript) — it is loaded from a Blob, outside the bundler.
export const WORKER_SOURCE = `
const MAX = ${MAX_MATCHES};
function expand(tpl, m, str) {
  return tpl.replace(/\\$(\\$|&|\`|'|<([^>]*)>|(\\d{1,2}))/g, (all, tok, name, num) => {
    if (tok === "$") return "$";
    if (tok === "&") return m[0];
    if (tok === "\`") return str.slice(0, m.index);
    if (tok === "'") return str.slice(m.index + m[0].length);
    if (name !== undefined) return m.groups ? (m.groups[name] ?? "") : all;
    let n = parseInt(num, 10);
    if (num.length === 2 && n >= m.length) {
      n = parseInt(num[0], 10);
      return n >= 1 && n < m.length ? (m[n] ?? "") + num[1] : all;
    }
    return n >= 1 && n < m.length ? (m[n] ?? "") : all;
  });
}
self.onmessage = (e) => {
  const { id, pattern, flags, text, mode, replacement } = e.data;
  const t0 = performance.now();
  try {
    const re = new RegExp(pattern, flags.includes("d") ? flags : flags + "d");
    const matches = [];
    const list = [];
    let truncated = false;
    const take = (m) => {
      matches.push({
        index: m.index,
        end: m.index + m[0].length,
        text: m[0],
        groups: Array.from(m).slice(1).map((g, i) => {
          const ix = m.indices[i + 1];
          return ix ? { start: ix[0], end: ix[1], text: g } : null;
        }),
      });
      if (mode === "list") list.push(expand(replacement, m, text));
    };
    if (re.global) {
      for (const m of text.matchAll(re)) {
        if (matches.length >= MAX) { truncated = true; break; }
        take(m);
      }
    } else {
      const m = re.exec(text);
      if (m) take(m);
    }
    let output = null;
    if (mode === "substitution") output = text.replace(new RegExp(pattern, flags), replacement);
    if (mode === "list") output = list.join("\\n");
    self.postMessage({ id, ok: true, matches, truncated, output, time: performance.now() - t0 });
  } catch (err) {
    self.postMessage({ id, ok: false, error: String(err && err.message || err) });
  }
};
`;

export class RegexRunner {
  private worker: Worker | null = null;
  private url: string | null = null;
  private nextId = 0;
  private cancelPending: (() => void) | null = null;

  private spawn() {
    this.url ??= URL.createObjectURL(new Blob([WORKER_SOURCE], { type: "text/javascript" }));
    this.worker = new Worker(this.url);
  }

  /** Runs the request; a newer call supersedes (and kills) one still in flight. */
  run(request: RunRequest): Promise<RunResponse | null> {
    if (this.cancelPending) {
      this.cancelPending();
      this.worker?.terminate();
      this.worker = null;
    }
    if (!this.worker) this.spawn();
    const worker = this.worker!;
    const id = ++this.nextId;
    return new Promise((resolve) => {
      const finish = () => {
        clearTimeout(timer);
        worker.removeEventListener("message", onMessage);
        this.cancelPending = null;
      };
      const timer = setTimeout(() => {
        finish();
        // The regex is stuck (e.g. catastrophic backtracking): kill it and start a fresh worker.
        worker.terminate();
        if (this.worker === worker) this.worker = null;
        resolve({ ok: false, timeout: true });
      }, TIMEOUT_MS);
      const onMessage = (e: MessageEvent) => {
        if (e.data.id !== id) return;
        finish();
        const { id: _id, ...response } = e.data;
        void _id;
        resolve(response as RunResponse);
      };
      worker.addEventListener("message", onMessage);
      // Superseded: resolve with null so the caller ignores it.
      this.cancelPending = () => {
        finish();
        resolve(null);
      };
      worker.postMessage({ id, ...request });
    });
  }

  dispose() {
    this.worker?.terminate();
    this.worker = null;
    if (this.url) URL.revokeObjectURL(this.url);
    this.url = null;
  }
}
