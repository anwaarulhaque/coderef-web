// Formatting, repair, stats, escaping, diff and JSONPath for the JSON Formatter.
import JSON5 from "json5";

export type Indent = 2 | 3 | 4 | "\t";

export const format = (value: unknown, indent: Indent) => JSON.stringify(value, null, indent);
export const minify = (value: unknown) => JSON.stringify(value);

/** Recursively sorts object keys A→Z (arrays keep their order). */
export function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value as object)
        .sort((a, b) => a.localeCompare(b))
        .map((k) => [k, sortKeys((value as Record<string, unknown>)[k])]),
    );
  }
  return value;
}

/**
 * Tries hard to turn almost-JSON into JSON: comments, trailing commas, single quotes, unquoted keys
 * (via JSON5), plus smart quotes and Python literals. Returns null if it can't.
 */
export function repair(text: string): unknown | null {
  const attempts = [
    text,
    text.replace(/[“”]/g, '"').replace(/[‘’]/g, "'"),
  ];
  // Python-style literals, only outside strings.
  attempts.push(
    attempts[1].replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|\b(True|False|None)\b/g, (m, str, word) =>
      str ? str : word === "True" ? "true" : word === "False" ? "false" : "null",
    ),
  );
  // Missing commas between "value" "key" on separate lines.
  attempts.push(attempts[2].replace(/(["\d\]}eE]|true|false|null)(\s*\n\s*)(")/g, "$1,$2$3"));
  for (const t of attempts) {
    try {
      return JSON5.parse(t);
    } catch {
      // try the next one
    }
  }
  return null;
}

export type JsonStats = { keys: number; values: number; depth: number; arrays: number; objects: number };

export function stats(value: unknown): JsonStats {
  const s: JsonStats = { keys: 0, values: 0, depth: 0, arrays: 0, objects: 0 };
  const walk = (v: unknown, d: number) => {
    s.values++;
    s.depth = Math.max(s.depth, d);
    if (Array.isArray(v)) {
      s.arrays++;
      v.forEach((x) => walk(x, d + 1));
    } else if (v && typeof v === "object") {
      s.objects++;
      for (const [, x] of Object.entries(v)) {
        s.keys++;
        walk(x, d + 1);
      }
    }
  };
  walk(value, 0);
  return s;
}

/** Turns text into a JSON string literal (escaped), or a JSON string literal back into text. */
export const escapeJson = (text: string) => JSON.stringify(text);
export function unescapeJson(text: string): string {
  const t = text.trim();
  const quoted = t.startsWith('"') && t.endsWith('"') ? t : `"${t.replace(/(?<!\\)"/g, '\\"')}"`;
  return JSON.parse(quoted) as string;
}

// ---------- Paths ----------

const IDENT = /^[A-Za-z_$][\w$]*$/;
export const childPath = (parent: string, key: string | number) =>
  typeof key === "number" ? `${parent}[${key}]` : IDENT.test(key) ? `${parent}.${key}` : `${parent}[${JSON.stringify(key)}]`;

export const typeOf = (v: unknown) => (v === null ? "null" : Array.isArray(v) ? "array" : typeof v);

// ---------- Diff ----------

export type DiffEntry = { path: string; kind: "added" | "removed" | "changed" | "type"; left?: unknown; right?: unknown };

export function diff(left: unknown, right: unknown, path = "$", out: DiffEntry[] = []): DiffEntry[] {
  const lt = typeOf(left);
  const rt = typeOf(right);
  if (lt !== rt) {
    out.push({ path, kind: "type", left, right });
    return out;
  }
  if (lt === "array") {
    const a = left as unknown[];
    const b = right as unknown[];
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      if (i >= a.length) out.push({ path: childPath(path, i), kind: "added", right: b[i] });
      else if (i >= b.length) out.push({ path: childPath(path, i), kind: "removed", left: a[i] });
      else diff(a[i], b[i], childPath(path, i), out);
    }
  } else if (lt === "object") {
    const a = left as Record<string, unknown>;
    const b = right as Record<string, unknown>;
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
      if (!(k in b)) out.push({ path: childPath(path, k), kind: "removed", left: a[k] });
      else if (!(k in a)) out.push({ path: childPath(path, k), kind: "added", right: b[k] });
      else diff(a[k], b[k], childPath(path, k), out);
    }
  } else if (left !== right) {
    out.push({ path, kind: "changed", left, right });
  }
  return out;
}

// ---------- JSONPath (common subset) ----------
// $  .key  ['key']  [0]  [-1]  [*]  .*  ..key  ..*  [0:3]  [0,2]  ['a','b']  [?(@.price < 10)]  [?(@.tag)]

export type PathMatch = { path: string; value: unknown };

type Seg =
  | { t: "key"; key: string }
  | { t: "index"; index: number }
  | { t: "wild" }
  | { t: "slice"; start?: number; end?: number; step?: number }
  | { t: "union"; keys: (string | number)[] }
  | { t: "filter"; expr: string }
  | { t: "descend"; inner: Seg };

function parsePath(src: string): Seg[] {
  let s = src.trim();
  if (!s.startsWith("$")) throw new Error("A JSONPath starts with $");
  s = s.slice(1);
  const segs: Seg[] = [];
  let i = 0;
  const readBracket = (): Seg => {
    // at "["
    let depth = 0;
    let j = i;
    let quote: string | null = null;
    for (; j < s.length; j++) {
      const c = s[j];
      if (quote) {
        if (c === "\\") j++;
        else if (c === quote) quote = null;
      } else if (c === "'" || c === '"') quote = c;
      else if (c === "[") depth++;
      else if (c === "]" && --depth === 0) break;
    }
    if (j >= s.length) throw new Error("Unclosed [ in path");
    const body = s.slice(i + 1, j).trim();
    i = j + 1;
    if (body === "*") return { t: "wild" };
    if (body.startsWith("?")) return { t: "filter", expr: body.replace(/^\?\s*\(?/, "").replace(/\)\s*$/, "") };
    if (/^-?\d*:-?\d*(:-?\d+)?$/.test(body)) {
      const [a, b, c] = body.split(":");
      return { t: "slice", start: a ? Number(a) : undefined, end: b ? Number(b) : undefined, step: c ? Number(c) : undefined };
    }
    const parts = body.split(/,(?=(?:[^'"]|'[^']*'|"[^"]*")*$)/).map((p) => p.trim());
    const keys = parts.map((p) => (/^-?\d+$/.test(p) ? Number(p) : p.replace(/^['"]|['"]$/g, "")));
    if (keys.length === 1) return typeof keys[0] === "number" ? { t: "index", index: keys[0] } : { t: "key", key: keys[0] };
    return { t: "union", keys };
  };
  while (i < s.length) {
    if (s.startsWith("..", i)) {
      i += 2;
      if (s[i] === "[") segs.push({ t: "descend", inner: readBracket() });
      else {
        const m = /^(\*|[^.[\s]+)/.exec(s.slice(i));
        if (!m) throw new Error("Expected a name after ..");
        i += m[0].length;
        segs.push({ t: "descend", inner: m[0] === "*" ? { t: "wild" } : { t: "key", key: m[0] } });
      }
    } else if (s[i] === ".") {
      i++;
      const m = /^(\*|[^.[\s]+)/.exec(s.slice(i));
      if (!m) throw new Error("Expected a name after .");
      i += m[0].length;
      segs.push(m[0] === "*" ? { t: "wild" } : { t: "key", key: m[0] });
    } else if (s[i] === "[") segs.push(readBracket());
    else if (/\s/.test(s[i])) i++;
    else throw new Error(`Unexpected '${s[i]}' in path`);
  }
  return segs;
}

// Filter: @.a.b <op> literal, or just @.a (exists / truthy). Supports && and ||.
function evalFilter(expr: string, item: unknown): boolean {
  const ors = expr.split("||");
  return ors.some((or) =>
    or.split("&&").every((cond) => {
      const m = /^\s*@((?:\.[\w$]+|\[\d+\]|\['[^']*'\])*)\s*(==|!=|<=|>=|<|>|=~)?\s*(.*?)\s*$/.exec(cond);
      if (!m) throw new Error(`Unsupported filter: ${cond.trim()}`);
      const [, sub, op, lit] = m;
      let v: unknown = item;
      for (const part of sub.match(/\.[\w$]+|\[\d+\]|\['[^']*'\]/g) ?? []) {
        if (v === null || typeof v !== "object") return false;
        const key = part.startsWith(".") ? part.slice(1) : part.startsWith("['") ? part.slice(2, -2) : Number(part.slice(1, -1));
        v = (v as Record<string | number, unknown>)[key];
      }
      if (!op) return v !== undefined && v !== null && v !== false;
      if (op === "=~") {
        const rm = /^\/(.*)\/([a-z]*)$/.exec(lit);
        return rm ? new RegExp(rm[1], rm[2]).test(String(v)) : false;
      }
      let rhs: unknown;
      try {
        rhs = JSON.parse(lit.replace(/^'(.*)'$/, '"$1"'));
      } catch {
        throw new Error(`Couldn't read the value ${lit} in the filter`);
      }
      switch (op) {
        case "==": return v === rhs;
        case "!=": return v !== rhs;
        case "<": return (v as number) < (rhs as number);
        case "<=": return (v as number) <= (rhs as number);
        case ">": return (v as number) > (rhs as number);
        case ">=": return (v as number) >= (rhs as number);
      }
      return false;
    }),
  );
}

function children(node: PathMatch): PathMatch[] {
  const v = node.value;
  if (Array.isArray(v)) return v.map((x, i) => ({ path: childPath(node.path, i), value: x }));
  if (v && typeof v === "object") return Object.entries(v).map(([k, x]) => ({ path: childPath(node.path, k), value: x }));
  return [];
}

function applySeg(nodes: PathMatch[], seg: Seg): PathMatch[] {
  const out: PathMatch[] = [];
  for (const node of nodes) {
    const v = node.value;
    switch (seg.t) {
      case "key":
        if (v && typeof v === "object" && !Array.isArray(v) && seg.key in v) out.push({ path: childPath(node.path, seg.key), value: (v as Record<string, unknown>)[seg.key] });
        break;
      case "index":
        if (Array.isArray(v)) {
          const i = seg.index < 0 ? v.length + seg.index : seg.index;
          if (i >= 0 && i < v.length) out.push({ path: childPath(node.path, i), value: v[i] });
        }
        break;
      case "wild":
        out.push(...children(node));
        break;
      case "slice":
        if (Array.isArray(v)) {
          const step = seg.step ?? 1;
          const norm = (n: number | undefined, d: number) => (n === undefined ? d : n < 0 ? Math.max(0, v.length + n) : Math.min(n, v.length));
          for (let i = norm(seg.start, 0); i < norm(seg.end, v.length); i += step > 0 ? step : 1) out.push({ path: childPath(node.path, i), value: v[i] });
        }
        break;
      case "union":
        for (const k of seg.keys) out.push(...applySeg([node], typeof k === "number" ? { t: "index", index: k } : { t: "key", key: k }));
        break;
      case "filter":
        for (const c of children(node)) if (evalFilter(seg.expr, c.value)) out.push(c);
        break;
      case "descend": {
        const stack = [node];
        while (stack.length) {
          const n = stack.shift()!;
          out.push(...applySeg([n], seg.inner));
          stack.push(...children(n));
        }
        break;
      }
    }
  }
  return out;
}

export function queryJsonPath(root: unknown, path: string): PathMatch[] {
  return parsePath(path).reduce((nodes, seg) => applySeg(nodes, seg), [{ path: "$", value: root }] as PathMatch[]);
}
