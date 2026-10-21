// A parser for JavaScript (ECMAScript) regular expressions, used to explain patterns.
// It assumes the pattern has already been validated with `new RegExp(...)`.

export type GroupKind =
  | "capture"
  | "named"
  | "noncapture"
  | "lookahead"
  | "negLookahead"
  | "lookbehind"
  | "negLookbehind"
  | "modifier";

type Span = { start: number; end: number };

export type RNode = Span &
  (
    | { type: "alternation"; alternatives: RNode[] }
    | { type: "sequence"; terms: RNode[] }
    | { type: "group"; kind: GroupKind; name?: string; index?: number; modifiers?: string; body: RNode }
    | { type: "quantifier"; min: number; max: number | null; lazy: boolean; target: RNode }
    | { type: "class"; negated: boolean; items: RNode[] }
    | { type: "range"; from: RNode; to: RNode }
    | { type: "literal"; value: string }
    | { type: "escape"; raw: string; inClass: boolean }
    | { type: "backref"; ref: number | string }
    | { type: "setOperation"; op: "--" | "&&" }
    | { type: "dot" }
    | { type: "start" }
    | { type: "end" }
  );

export type CaptureGroup = { index: number; name?: string };

export type ParseResult = { ast: RNode; groups: CaptureGroup[] };

// Counts capturing groups up front: in non-unicode mode `\N` is only a backreference if group N exists.
function countCaptures(src: string): number {
  let count = 0;
  let inClass = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (c === "\\") {
      i++;
      continue;
    }
    if (inClass) {
      if (c === "]") inClass = false;
    } else if (c === "[") {
      inClass = true;
    } else if (c === "(") {
      if (src[i + 1] !== "?") count++;
      else if (src[i + 2] === "<" && src[i + 3] !== "=" && src[i + 3] !== "!") count++;
    }
  }
  return count;
}

class Parser {
  i = 0;
  groups: CaptureGroup[] = [];
  private totalCaptures: number;

  constructor(
    private src: string,
    private unicode: boolean,
    private unicodeSets: boolean,
  ) {
    this.totalCaptures = countCaptures(src);
  }

  private peek(offset = 0) {
    return this.src[this.i + offset];
  }

  parse(): RNode {
    return this.alternation();
  }

  private alternation(): RNode {
    const start = this.i;
    const alternatives = [this.sequence()];
    while (this.peek() === "|") {
      this.i++;
      alternatives.push(this.sequence());
    }
    if (alternatives.length === 1) return alternatives[0];
    return { type: "alternation", start, end: this.i, alternatives };
  }

  private sequence(): RNode {
    const start = this.i;
    const terms: RNode[] = [];
    while (this.i < this.src.length && this.peek() !== "|" && this.peek() !== ")") {
      const atom = this.atom();
      terms.push(this.quantifier(atom));
    }
    return { type: "sequence", start, end: this.i, terms: mergeLiterals(terms) };
  }

  private quantifier(target: RNode): RNode {
    const c = this.peek();
    let min: number;
    let max: number | null;
    if (c === "*") [min, max] = [0, null];
    else if (c === "+") [min, max] = [1, null];
    else if (c === "?") [min, max] = [0, 1];
    else if (c === "{") {
      const m = /^\{(\d+)(,(\d*))?\}/.exec(this.src.slice(this.i));
      if (!m) return target;
      min = Number(m[1]);
      max = m[2] === undefined ? min : m[3] === "" ? null : Number(m[3]);
      this.i += m[0].length - 1;
    } else return target;
    this.i++;
    const lazy = this.peek() === "?";
    if (lazy) this.i++;
    return { type: "quantifier", start: target.start, end: this.i, min, max, lazy, target };
  }

  private atom(): RNode {
    const start = this.i;
    const c = this.peek();
    if (c === "(") return this.group();
    if (c === "[") return this.charClass();
    if (c === ".") return { type: "dot", start, end: ++this.i };
    if (c === "^") return { type: "start", start, end: ++this.i };
    if (c === "$") return { type: "end", start, end: ++this.i };
    if (c === "\\") return this.escape(false);
    return this.literalChar();
  }

  private literalChar(): RNode {
    const start = this.i;
    const cp = this.src.codePointAt(this.i)!;
    const value = this.unicode || this.unicodeSets ? String.fromCodePoint(cp) : this.src[this.i];
    this.i += value.length;
    return { type: "literal", start, end: this.i, value };
  }

  private group(): RNode {
    const start = this.i;
    this.i++; // (
    const rest = this.src.slice(this.i);
    let kind: GroupKind = "capture";
    let name: string | undefined;
    let modifiers: string | undefined;
    let m: RegExpExecArray | null;
    if (rest.startsWith("?:")) [kind, this.i] = ["noncapture", this.i + 2];
    else if (rest.startsWith("?=")) [kind, this.i] = ["lookahead", this.i + 2];
    else if (rest.startsWith("?!")) [kind, this.i] = ["negLookahead", this.i + 2];
    else if (rest.startsWith("?<=")) [kind, this.i] = ["lookbehind", this.i + 3];
    else if (rest.startsWith("?<!")) [kind, this.i] = ["negLookbehind", this.i + 3];
    else if ((m = /^\?<([^>]+)>/.exec(rest))) {
      [kind, name] = ["named", m[1]];
      this.i += m[0].length;
    } else if ((m = /^\?([ims]*)(?:-([ims]*))?:/.exec(rest))) {
      kind = "modifier";
      modifiers = m[0].slice(1, -1);
      this.i += m[0].length;
    }
    let index: number | undefined;
    if (kind === "capture" || kind === "named") {
      index = this.groups.length + 1;
      this.groups.push({ index, name });
    }
    const body = this.alternation();
    if (this.peek() === ")") this.i++;
    return { type: "group", start, end: this.i, kind, name, index, modifiers, body };
  }

  private charClass(): RNode {
    const start = this.i;
    this.i++; // [
    const negated = this.peek() === "^";
    if (negated) this.i++;
    const items: RNode[] = [];
    while (this.i < this.src.length && this.peek() !== "]") {
      if (this.unicodeSets && this.peek() === "[") {
        items.push(this.charClass());
        continue;
      }
      if (this.unicodeSets && (this.src.startsWith("--", this.i) || this.src.startsWith("&&", this.i))) {
        const op = this.src.slice(this.i, this.i + 2) as "--" | "&&";
        items.push({ type: "setOperation", start: this.i, end: this.i + 2, op });
        this.i += 2;
        continue;
      }
      const from = this.classAtom();
      if (this.peek() === "-" && this.peek(1) !== "]" && this.peek(1) !== undefined && !(this.unicodeSets && this.peek(1) === "-")) {
        this.i++;
        const to = this.classAtom();
        items.push({ type: "range", start: from.start, end: to.end, from, to });
      } else {
        items.push(from);
      }
    }
    this.i++; // ]
    return { type: "class", start, end: this.i, negated, items };
  }

  private classAtom(): RNode {
    if (this.peek() === "\\") return this.escape(true);
    return this.literalChar();
  }

  private escape(inClass: boolean): RNode {
    const start = this.i;
    const rest = this.src.slice(this.i + 1);
    const c = rest[0];
    let len = 2;
    let m: RegExpExecArray | null;

    if (!inClass && /[1-9]/.test(c)) {
      // \N is a backreference only if group N exists; otherwise (non-unicode) it's a legacy octal escape.
      const digits = /^\d+/.exec(rest)![0];
      if (Number(digits) <= this.totalCaptures) {
        this.i += 1 + digits.length;
        return { type: "backref", start, end: this.i, ref: Number(digits) };
      }
    }
    if (!this.unicode && !this.unicodeSets && (m = /^(?:[0-3][0-7]{0,2}|[4-7][0-7]?)/.exec(rest)) && m[0] !== "0") {
      this.i += 1 + m[0].length;
      return { type: "escape", start, end: this.i, raw: this.src.slice(start, this.i), inClass };
    }
    if (!inClass && c === "k" && (m = /^k<([^>]+)>/.exec(rest))) {
      this.i += 1 + m[0].length;
      return { type: "backref", start, end: this.i, ref: m[1] };
    }
    if ((c === "p" || c === "P") && (m = /^[pP]\{[^}]+\}/.exec(rest))) len = 1 + m[0].length;
    else if (c === "x" && /^x[0-9a-fA-F]{2}/.test(rest)) len = 4;
    else if (c === "u" && (m = /^u\{[0-9a-fA-F]+\}/.exec(rest)) && (this.unicode || this.unicodeSets)) len = 1 + m[0].length;
    else if (c === "u" && /^u[0-9a-fA-F]{4}/.test(rest)) len = 6;
    else if (c === "c" && /^c[A-Za-z]/.test(rest)) len = 3;
    else if (c === undefined) len = 1;
    else len = 1 + String.fromCodePoint(rest.codePointAt(0)!).length;

    this.i += len;
    return { type: "escape", start, end: this.i, raw: this.src.slice(start, this.i), inClass };
  }
}

// "a", "b", "c" literals in a row read better as one "abc" step.
function mergeLiterals(terms: RNode[]): RNode[] {
  const merged: RNode[] = [];
  for (const term of terms) {
    const last = merged[merged.length - 1];
    if (term.type === "literal" && last?.type === "literal") {
      merged[merged.length - 1] = { ...last, end: term.end, value: last.value + term.value };
    } else {
      merged.push(term);
    }
  }
  return merged;
}

export function parseRegex(pattern: string, flags: string): ParseResult {
  const parser = new Parser(pattern, flags.includes("u"), flags.includes("v"));
  const ast = parser.parse();
  return { ast, groups: parser.groups };
}
