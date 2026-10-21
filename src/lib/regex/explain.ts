import type { RNode } from "./parse";

export type Explanation = { raw: string; text: string; children?: Explanation[] };

export const FLAG_INFO: Record<string, { name: string; text: string }> = {
  g: { name: "global", text: "Find all matches instead of stopping after the first." },
  i: { name: "ignoreCase", text: "Case insensitive: letters match regardless of case." },
  m: { name: "multiline", text: "^ and $ match at the start and end of each line, not only of the whole string." },
  s: { name: "dotAll", text: ". also matches line terminators (\\n, \\r, …)." },
  u: { name: "unicode", text: "Treat the pattern as Unicode code points; enables \\u{…} and \\p{…}." },
  v: { name: "unicodeSets", text: "Unicode mode plus set operations and string properties in classes." },
  y: { name: "sticky", text: "Only match at lastIndex — no searching ahead." },
  d: { name: "hasIndices", text: "Report start and end indices for every capture group." },
};

const ordinal = (n: number) => {
  const suffix = n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] ?? "th";
  return `${n}${suffix}`;
};

const charName = (ch: string) => {
  const cp = ch.codePointAt(0)!;
  const visible: Record<string, string> = { " ": "space", "\t": "tab", "\n": "line feed", "\r": "carriage return" };
  return `${visible[ch] ?? ch} (index ${cp})`;
};

function quantifierText(min: number, max: number | null, lazy: boolean) {
  const range =
    max === null
      ? min === 0
        ? "between zero and unlimited times"
        : min === 1
          ? "between one and unlimited times"
          : `between ${min} and unlimited times`
      : min === max
        ? `exactly ${min} ${min === 1 ? "time" : "times"}`
        : min === 0 && max === 1
          ? "between zero and one times"
          : `between ${min} and ${max} times`;
  if (max !== null && min === max) return `matches the previous token ${range}`;
  return lazy
    ? `matches the previous token ${range}, as few times as possible, expanding as needed (lazy)`
    : `matches the previous token ${range}, as many times as possible, giving back as needed (greedy)`;
}

const UNICODE_PROPS: Record<string, string> = {
  L: "any kind of letter from any language",
  Letter: "any kind of letter from any language",
  Lu: "an uppercase letter",
  Ll: "a lowercase letter",
  N: "any kind of numeric character",
  Nd: "a decimal digit in any script",
  P: "any kind of punctuation character",
  S: "any math, currency, modifier or other symbol",
  Z: "any kind of whitespace or invisible separator",
  Emoji: "an emoji",
  Emoji_Presentation: "a character presented as an emoji by default",
};

function octal(raw: string) {
  const code = parseInt(raw.slice(1), 8);
  return `matches the character with octal code ${raw.slice(1)} — ${charName(String.fromCharCode(code))} (legacy octal escape)`;
}

function escapeText(raw: string, inClass: boolean, flags: string): string {
  const c = raw[1];
  switch (c) {
    case "d": return "matches a digit (equivalent to [0-9])";
    case "D": return "matches any character that's not a digit (equivalent to [^0-9])";
    case "w": return "matches any word character (equivalent to [a-zA-Z0-9_])";
    case "W": return "matches any non-word character (equivalent to [^a-zA-Z0-9_])";
    case "s": return "matches any whitespace character (space, tab, line breaks, and Unicode spaces)";
    case "S": return "matches any non-whitespace character";
    case "b": return inClass ? "matches a backspace character (U+0008)" : "assert position at a word boundary: (^\\w|\\w$|\\W\\w|\\w\\W)";
    case "B": return "assert position where \\b does not match";
    case "t": return "matches a tab character (U+0009)";
    case "n": return "matches a line-feed (newline) character (U+000A)";
    case "r": return "matches a carriage return (U+000D)";
    case "f": return "matches a form-feed character (U+000C)";
    case "v": return "matches a vertical tab character (U+000B)";
    case "0":
      return raw.length === 2 ? "matches a null character (U+0000)" : octal(raw);
    case "1": case "2": case "3": case "4": case "5": case "6": case "7":
      return octal(raw);
    case "x": return `matches the character with code 0x${raw.slice(2)} — ${charName(String.fromCharCode(parseInt(raw.slice(2), 16)))}`;
    case "c": return `matches the control character Ctrl+${raw[2].toUpperCase()}`;
    case "u": {
      const hex = raw.slice(2).replace(/[{}]/g, "");
      return `matches the character U+${hex.toUpperCase()} — ${charName(String.fromCodePoint(parseInt(hex, 16)))}`;
    }
    case "p":
    case "P": {
      const prop = raw.slice(3, -1);
      const key = prop.replace(/^(General_Category|gc)=/, "");
      const desc = UNICODE_PROPS[key] ?? `a character with the Unicode property ${prop}`;
      const needsU = flags.includes("u") || flags.includes("v") ? "" : " (requires the u or v flag; without it this is a literal \"p\")";
      return `${c === "P" ? "matches any character that is not" : "matches"} ${desc}${needsU}`;
    }
    default:
      return raw.length > 1 ? `matches the character ${charName(raw.slice(1))} literally` : "a lone backslash";
  }
}

function caseNote(flags: string) {
  return flags.includes("i") ? "(case insensitive)" : "(case sensitive)";
}

export function explain(node: RNode, src: string, flags: string): Explanation[] {
  const raw = src.slice(node.start, node.end);
  switch (node.type) {
    case "sequence":
      return node.terms.flatMap((term) => explain(term, src, flags));
    case "alternation":
      return node.alternatives.map((alt, i) => ({
        raw: src.slice(alt.start, alt.end) || "(empty)",
        text: `${ordinal(i + 1)} Alternative`,
        children: explain(alt, src, flags),
      }));
    case "group": {
      const label: Record<string, string> = {
        capture: `${ordinal(node.index ?? 0)} Capturing Group`,
        named: `Named Capture Group "${node.name}" (group ${node.index})`,
        noncapture: "Non-capturing group",
        lookahead: "Positive Lookahead — assert that the pattern below matches next, without consuming it",
        negLookahead: "Negative Lookahead — assert that the pattern below does not match next",
        lookbehind: "Positive Lookbehind — assert that the pattern below matches just before this position",
        negLookbehind: "Negative Lookbehind — assert that the pattern below does not match just before this position",
        modifier: `Modifier group — applies flags "${node.modifiers}" to the pattern inside`,
      };
      return [{ raw, text: label[node.kind], children: explain(node.body, src, flags) }];
    }
    case "quantifier": {
      const [target] = explain(node.target, src, flags);
      const quantRaw = src.slice(node.target.end, node.end);
      const quantLine: Explanation = { raw: quantRaw, text: quantifierText(node.min, node.max, node.lazy) };
      const extra: Explanation[] =
        node.target.type === "group" && (node.target.kind === "capture" || node.target.kind === "named")
          ? [{ raw: "Note", text: "A repeated capturing group only captures the last iteration. Wrap the repetition in a group to capture all of it." }]
          : [];
      return [{ ...target, raw, children: [quantLine, ...extra, ...(target.children ?? [])] }];
    }
    case "class":
      return [
        {
          raw,
          text: node.negated
            ? "Match a single character not present in the list below"
            : "Match a single character present in the list below",
          children: node.items.flatMap((item) => explain(item, src, flags)),
        },
      ];
    case "range": {
      const from = node.from.type === "literal" ? node.from.value : src.slice(node.from.start, node.from.end);
      const to = node.to.type === "literal" ? node.to.value : src.slice(node.to.start, node.to.end);
      const fromCp = from.length === 1 ? ` (index ${from.codePointAt(0)})` : "";
      const toCp = to.length === 1 ? ` (index ${to.codePointAt(0)})` : "";
      return [{ raw, text: `matches a single character in the range between ${from}${fromCp} and ${to}${toCp} ${caseNote(flags)}` }];
    }
    case "literal":
      return [
        {
          raw,
          text:
            [...node.value].length === 1
              ? `matches the character ${charName(node.value)} literally ${caseNote(flags)}`
              : `matches the characters ${node.value} literally ${caseNote(flags)}`,
        },
      ];
    case "escape":
      return [{ raw, text: escapeText(node.raw, node.inClass, flags) }];
    case "setOperation":
      return [
        {
          raw,
          text:
            node.op === "--"
              ? "Subtraction: remove the characters matched by the next operand"
              : "Intersection: keep only characters also matched by the next operand",
        },
      ];
    case "backref":
      return [
        {
          raw,
          text:
            typeof node.ref === "number"
              ? `matches the same text as most recently matched by the ${ordinal(node.ref)} capturing group`
              : `matches the same text as most recently matched by the group named "${node.ref}"`,
        },
      ];
    case "dot":
      return [
        {
          raw,
          text: flags.includes("s")
            ? "matches any character, including line terminators"
            : "matches any character except line terminators (\\n, \\r, \\u2028, \\u2029)",
        },
      ];
    case "start":
      return [{ raw, text: flags.includes("m") ? "asserts position at the start of a line" : "asserts position at the start of the string" }];
    case "end":
      return [{ raw, text: flags.includes("m") ? "asserts position at the end of a line" : "asserts position at the end of the string" }];
  }
}
