// The calculator widget's expression parser: a small recursive-descent evaluator, so no user input reaches eval().

/** Safe arithmetic: digits, operators, parentheses, %, ^ and a few Math functions; no eval of arbitrary code. */
export function calculate(expr: string): number | null {
  const src = expr.replace(/\s+/g, "").replace(/×/g, "*").replace(/÷/g, "/");
  if (!src || !/^[\d+\-*/().,%^a-z]+$/i.test(src)) return null;
  let i = 0;
  const peek = () => src[i];
  const fns: Record<string, (x: number) => number> = { sqrt: Math.sqrt, sin: Math.sin, cos: Math.cos, tan: Math.tan, log: Math.log10, ln: Math.log, abs: Math.abs, round: Math.round };
  const consts: Record<string, number> = { pi: Math.PI, e: Math.E };
  function primary(): number {
    if (peek() === "(") {
      i++;
      const v = expression();
      if (peek() !== ")") throw new Error();
      i++;
      return v;
    }
    if (peek() === "-") {
      i++;
      return -primary();
    }
    const word = src.slice(i).match(/^[a-z]+/i)?.[0];
    if (word) {
      i += word.length;
      const k = word.toLowerCase();
      if (k in consts) return consts[k];
      if (k in fns) return fns[k](primary());
      throw new Error();
    }
    const num = src.slice(i).match(/^\d*\.?\d+(?:e[+-]?\d+)?/i)?.[0];
    if (!num) throw new Error();
    i += num.length;
    let v = Number(num);
    if (peek() === "%") {
      i++;
      v /= 100;
    }
    return v;
  }
  function power(): number {
    const b = primary();
    if (peek() === "^") {
      i++;
      return b ** power();
    }
    return b;
  }
  function term(): number {
    let v = power();
    while (peek() === "*" || peek() === "/") v = src[i++] === "*" ? v * power() : v / power();
    return v;
  }
  function expression(): number {
    let v = term();
    while (peek() === "+" || peek() === "-") v = src[i++] === "+" ? v + term() : v - term();
    return v;
  }
  try {
    const v = expression();
    return i === src.length && Number.isFinite(v) ? v : null;
  } catch {
    return null;
  }
}
