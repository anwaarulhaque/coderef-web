// A strict JSON scanner used only to explain *why* JSON.parse failed, with an exact position and a
// human-readable message (browser messages differ and are often cryptic).

export type JsonError = { message: string; offset: number; line: number; column: number };

export function positionOf(text: string, offset: number): { line: number; column: number } {
  let line = 1;
  let col = 1;
  for (let i = 0; i < offset && i < text.length; i++) {
    if (text[i] === "\n") {
      line++;
      col = 1;
    } else col++;
  }
  return { line, column: col };
}

class Fail extends Error {
  constructor(
    public why: string,
    public at: number,
  ) {
    super(why);
  }
}

const describe = (ch: string | undefined) => (ch === undefined ? "end of input" : ch === "\n" ? "a line break" : `'${ch}'`);

export function findJsonError(text: string): JsonError | null {
  let i = 0;
  const ws = () => {
    while (i < text.length && " \t\n\r".includes(text[i])) i++;
    // Comments are the most common "almost JSON" — name them wherever they appear.
    if (text.startsWith("//", i) || text.startsWith("/*", i)) throw new Fail("Comments aren't allowed in JSON — remove them, or use Repair", i);
  };
  const fail = (why: string, at = i): never => {
    throw new Fail(why, at);
  };

  const string = () => {
    const start = i;
    i++; // opening "
    while (i < text.length) {
      const c = text[i];
      if (c === '"') {
        i++;
        return;
      }
      if (c === "\\") {
        const e = text[i + 1];
        if (e === "u") {
          if (!/^[0-9a-fA-F]{4}$/.test(text.slice(i + 2, i + 6))) fail("Invalid \\u escape — it needs exactly 4 hex digits", i);
          i += 6;
          continue;
        }
        if (!e || !`"\\/bfnrt`.includes(e)) fail(`Invalid escape sequence \\${e ?? ""} — use \\\\ for a literal backslash`, i);
        i += 2;
        continue;
      }
      if (c === "\n" || c === "\r") fail("Unterminated string — strings can't contain raw line breaks (use \\n)", start);
      if (c.charCodeAt(0) < 0x20) fail("Control characters must be escaped inside strings", i);
      i++;
    }
    fail("Unterminated string — missing closing \"", start);
  };

  const number = () => {
    const m = /^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/.exec(text.slice(i));
    if (!m) fail(text[i] === "-" ? "A minus sign must be followed by digits" : `Invalid number`);
    const after = text[i + m![0].length];
    if (/^0\d/.test(text.slice(i)) || /^-0\d/.test(text.slice(i))) fail("Numbers can't have leading zeros");
    if (after === ".") fail("A decimal point must be followed by digits", i + m![0].length);
    i += m![0].length;
  };

  const value = (): void => {
    ws();
    const c = text[i];
    if (c === "{") return object();
    if (c === "[") return array();
    if (c === '"') return string();
    if (c === "-" || (c >= "0" && c <= "9")) return number();
    for (const word of ["true", "false", "null"]) {
      if (text.startsWith(word, i)) {
        i += word.length;
        return;
      }
    }
    if (c === "'") fail("Strings must use double quotes (\"), not single quotes");
    if (/^(True|False|None)\b/.test(text.slice(i))) fail("Use lowercase true / false / null (this looks like Python)");
    if (/^(undefined|NaN|Infinity|-Infinity)\b/.test(text.slice(i))) fail(`${/^-?\w+/.exec(text.slice(i))![0]} isn't valid JSON — use null or a number`);
    if (c === "}" || c === "]") fail(`Unexpected ${describe(c)} — a value was expected here`);
    if (c === undefined) fail("Unexpected end of input — a value was expected");
    fail(`Unexpected ${describe(c)} — expected a value (string, number, object, array, true, false or null)`);
  };

  const object = () => {
    i++; // {
    ws();
    if (text[i] === "}") {
      i++;
      return;
    }
    for (;;) {
      ws();
      if (text[i] === "}") fail("Trailing comma before } — remove the last comma");
      if (text[i] === "'") fail("Property names must be in double quotes, not single quotes");
      if (text[i] !== '"') fail(text[i] === undefined ? "Unexpected end of input — missing }" : "Property names must be in double quotes");
      string();
      ws();
      if (text[i] !== ":") fail(`Expected ':' after the property name, found ${describe(text[i])}`);
      i++;
      value();
      ws();
      if (text[i] === ",") {
        i++;
        continue;
      }
      if (text[i] === "}") {
        i++;
        return;
      }
      if (text[i] === undefined) fail("Unexpected end of input — missing }");
      fail(`Expected ',' or '}' after a property value, found ${describe(text[i])}. Is a comma missing?`);
    }
  };

  const array = () => {
    i++; // [
    ws();
    if (text[i] === "]") {
      i++;
      return;
    }
    for (;;) {
      ws();
      if (text[i] === "]") fail("Trailing comma before ] — remove the last comma");
      value();
      ws();
      if (text[i] === ",") {
        i++;
        continue;
      }
      if (text[i] === "]") {
        i++;
        return;
      }
      if (text[i] === undefined) fail("Unexpected end of input — missing ]");
      fail(`Expected ',' or ']' after an array item, found ${describe(text[i])}. Is a comma missing?`);
    }
  };

  try {
    if (text.charCodeAt(0) === 0xfeff) i = 1; // BOM
    ws();
    if (text.startsWith("//", i) || text.startsWith("/*", i)) fail("Comments aren't allowed in JSON — try Repair");
    value();
    ws();
    if (i < text.length) {
      if (text.startsWith("//", i) || text.startsWith("/*", i)) fail("Comments aren't allowed in JSON — try Repair");
      fail(`Unexpected ${describe(text[i])} after the end of the JSON value. Is there extra text, or a missing comma?`);
    }
    return null;
  } catch (e) {
    if (!(e instanceof Fail)) throw e;
    return { message: e.why, offset: e.at, ...positionOf(text, e.at) };
  }
}

/** Parses JSON, returning either the value or a friendly error. */
export function parseJson(text: string): { ok: true; value: unknown } | { ok: false; error: JsonError } {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (err) {
    const found = findJsonError(text);
    if (found) return { ok: false, error: found };
    // Shouldn't happen, but fall back to the engine's message.
    return { ok: false, error: { message: (err as Error).message, offset: 0, line: 1, column: 1 } };
  }
}
