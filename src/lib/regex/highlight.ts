// Splits a regex pattern into colored tokens for the editor.
export type TokenKind = "group" | "quantifier" | "class" | "escape" | "anchor" | "alternation" | "backref" | "literal";
export type Token = { start: number; end: number; kind: TokenKind; depth?: number };

export function tokenizePattern(src: string): Token[] {
  const tokens: Token[] = [];
  let depth = 0;
  let i = 0;
  const push = (end: number, kind: TokenKind, d?: number) => {
    tokens.push({ start: i, end, kind, depth: d });
    i = end;
  };

  while (i < src.length) {
    const c = src[i];
    const rest = src.slice(i);
    if (c === "\\") {
      const m = /^\\(k<[^>]*>|[1-9]\d*|[pP]\{[^}]*\}|u\{[0-9a-fA-F]*\}|u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2}|c[A-Za-z]|[\s\S]?)/.exec(rest)!;
      push(i + m[0].length, /^\\(k<|[1-9])/.test(m[0]) ? "backref" : "escape");
    } else if (c === "[") {
      // Whole class in one pass; escapes inside get their own color.
      push(i + (src[i + 1] === "^" ? 2 : 1), "class");
      let nested = 0;
      while (i < src.length) {
        if (src[i] === "\\") {
          const m = /^\\([pP]\{[^}]*\}|u\{[0-9a-fA-F]*\}|u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2}|c[A-Za-z]|[\s\S]?)/.exec(src.slice(i))!;
          push(i + m[0].length, "escape");
        } else if (src[i] === "[") {
          nested++;
          push(i + 1, "class");
        } else if (src[i] === "]") {
          push(i + 1, "class");
          if (nested-- === 0) break;
        } else {
          let j = i + 1;
          while (j < src.length && !"\\[]".includes(src[j])) j++;
          push(j, "class");
        }
      }
    } else if (c === "(") {
      const m = /^\((\?(:|=|!|<=|<!|<[^>]*>|[ims-]*:))?/.exec(rest)!;
      push(i + m[0].length, "group", depth++);
    } else if (c === ")") {
      depth = Math.max(0, depth - 1);
      push(i + 1, "group", depth);
    } else if (c === "|") {
      push(i + 1, "alternation");
    } else if ("*+?".includes(c)) {
      push(i + (src[i + 1] === "?" ? 2 : 1), "quantifier");
    } else if (c === "{" && /^\{\d+(,\d*)?\}/.test(rest)) {
      const m = /^\{\d+(,\d*)?\}\??/.exec(rest)!;
      push(i + m[0].length, "quantifier");
    } else if (c === "^" || c === "$") {
      push(i + 1, "anchor");
    } else if (c === ".") {
      push(i + 1, "escape");
    } else {
      let j = i + 1;
      while (j < src.length && !"\\[()|*+?{^$.".includes(src[j])) j++;
      push(j, "literal");
    }
  }
  return tokens;
}
