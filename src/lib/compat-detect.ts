// Builds a feature-detection snippet from a feature's BCD compat keys.
export type Detection = { language: "css" | "js" | "html"; code: string; note?: string };

// Built-ins that exist but aren't reachable as globals (they're syntax-backed).
const NON_GLOBAL_BUILTINS = new Set(["AsyncFunction", "AsyncGeneratorFunction", "GeneratorFunction", "AsyncGenerator", "Generator", "TypedArray", "AsyncIterator"]);

// Features whose best check isn't derivable from their compat keys.
const OVERRIDES: Record<string, Detection> = {
  nesting: {
    language: "css",
    code: `@supports selector(&) {\n  /* nested rules are understood here */\n}\n\n/* or in JavaScript */\nif (CSS.supports("selector(&)")) {\n  // CSS nesting is supported\n}`,
  },
  grid: { language: "css", code: `@supports (display: grid) {\n  .layout { display: grid; }\n}` },
  flexbox: { language: "css", code: `@supports (display: flex) {\n  .row { display: flex; }\n}` },
  fetch: { language: "js", code: `if ("fetch" in globalThis) {\n  // fetch() is available\n} else {\n  // fall back to XMLHttpRequest or load a polyfill\n}` },
};

// [property, sample value] for CSS value types and functions.
const TYPE_SAMPLES: Record<string, [string, string]> = {
  "color-mix": ["color", "color-mix(in srgb, red, blue)"],
  "light-dark": ["color", "light-dark(black, white)"],
  oklch: ["color", "oklch(60% 0.15 250)"],
  oklab: ["color", "oklab(60% 0.1 -0.1)"],
  lch: ["color", "lch(60% 50 250)"],
  lab: ["color", "lab(60% 20 -40)"],
  hwb: ["color", "hwb(200 10% 20%)"],
  color: ["color", "color(display-p3 1 0 0)"],
  "contrast-color": ["color", "contrast-color(red)"],
  clamp: ["width", "clamp(1px, 2px, 3px)"],
  min: ["width", "min(1px, 2px)"],
  max: ["width", "max(1px, 2px)"],
  round: ["width", "round(1.5px, 1px)"],
  mod: ["width", "mod(5px, 2px)"],
  rem: ["width", "rem(5px, 2px)"],
  abs: ["width", "abs(-1px)"],
  sign: ["z-index", "sign(-1)"],
  sin: ["width", "calc(1px * sin(30deg))"],
  pow: ["width", "calc(1px * pow(2, 2))"],
  sqrt: ["width", "calc(1px * sqrt(4))"],
  "calc-size": ["height", "calc-size(auto, size)"],
  "image-set": ["background-image", 'image-set("a.png" 1x)'],
  "cross-fade": ["background-image", 'cross-fade(url("a.png") 50%, url("b.png"))'],
  "conic-gradient": ["background-image", "conic-gradient(red, blue)"],
  "repeating-conic-gradient": ["background-image", "repeating-conic-gradient(red 0 10%, blue 10% 20%)"],
  attr: ["width", "attr(data-size type(<length>))"],
  container_query_length_units: ["width", "10cqi"],
  viewport_percentage_units_dynamic: ["height", "100dvh"],
  viewport_percentage_units_small: ["height", "100svh"],
  viewport_percentage_units_large: ["height", "100lvh"],
};

const FUNCTIONAL_SELECTORS = new Set(["has", "is", "where", "not", "nth-child", "nth-last-child", "host", "host-context", "dir", "lang", "state"]);

function fromKey(key: string): Detection | null {
  const p = key.split(".");
  if (p[0] === "css" && p[1] === "properties" && p[2]) {
    const prop = p[2];
    const value = p[3] && !/^(_|.*_)/.test(p[3]) ? p[3] : "initial";
    return {
      language: "css",
      code: `@supports (${prop}: ${value}) {\n  /* styles that rely on ${prop}${value !== "initial" ? `: ${value}` : ""} */\n}\n\n/* or in JavaScript */\nif (CSS.supports("${prop}", "${value}")) {\n  // use it\n}`,
    };
  }
  if (p[0] === "css" && p[1] === "selectors" && p[2]) {
    const sel = `:${FUNCTIONAL_SELECTORS.has(p[2]) ? `${p[2]}(*)` : p[2]}`.replace(/^:(before|after|marker|placeholder|selection|backdrop|first-line|first-letter|part|slotted|highlight|view-transition.*)$/, "::$1");
    return {
      language: "css",
      code: `@supports selector(${sel}) {\n  /* styles that use ${sel} */\n}\n\n/* or in JavaScript */\nif (CSS.supports("selector(${sel})")) {\n  // use it\n}`,
    };
  }
  if (p[0] === "css" && p[1] === "types" && p[2]) {
    // Value types are tested by declaring a known-good sample value.
    const sample = TYPE_SAMPLES[p[3] ?? ""] ?? TYPE_SAMPLES[p[2]];
    if (!sample) return null;
    const [prop, value] = sample;
    return {
      language: "css",
      code: `@supports (${prop}: ${value}) {\n  /* styles that use ${p[3] ?? p[2]} */\n}\n\n/* or in JavaScript */\nif (CSS.supports("${prop}", "${value}")) {\n  // use it\n}`,
    };
  }
  if (p[0] === "api" && p[1]) {
    const iface = p[1];
    if (!p[2] || p[2].startsWith("_")) {
      return { language: "js", code: `if ("${iface}" in globalThis) {\n  // ${iface} is available\n} else {\n  // load a polyfill or use a fallback\n}` };
    }
    const member = p[2].replace(/_static$/, "");
    const target = p[2].endsWith("_static") ? iface : `${iface}.prototype`;
    if (member.endsWith("_event")) {
      return { language: "js", code: `if ("on${member.replace(/_event$/, "")}" in ${target}) {\n  // the ${member.replace(/_event$/, "")} event is supported\n}` };
    }
    return { language: "js", code: `if ("${iface}" in globalThis && "${member}" in ${target}) {\n  // ${iface}.${member} is available\n}` };
  }
  if (p[0] === "javascript" && p[1] === "builtins" && p[2] && !NON_GLOBAL_BUILTINS.has(p[2])) {
    const obj = p[2];
    if (!p[3]) return { language: "js", code: `if (typeof ${obj} !== "undefined") {\n  // ${obj} is available\n}` };
    return {
      language: "js",
      code: `if ("${p[3]}" in ${obj} || ("prototype" in ${obj} && "${p[3]}" in ${obj}.prototype)) {\n  // ${obj}.${p[3]} is available\n}`,
    };
  }
  if (p[0] === "javascript") {
    return {
      language: "js",
      code: `// Syntax can't be tested with an if-statement — an unsupported\n// browser fails to parse the whole script. Either transpile for older\n// targets (e.g. Babel/TypeScript/esbuild), or probe in isolation:\nlet supported = true;\ntry {\n  new Function("/* code that uses the syntax */");\n} catch {\n  supported = false;\n}`,
      note: "This is a language syntax feature.",
    };
  }
  if (p[0] === "html" && p[1] === "elements" && p[2]) {
    const el = p[2];
    if (p[3] && !p[3].startsWith("_")) {
      return { language: "js", code: `if ("${p[3]}" in document.createElement("${el}")) {\n  // the ${p[3]} attribute/property of <${el}> is supported\n}` };
    }
    return {
      language: "js",
      code: `const el = document.createElement("${el}");\nif (!(el instanceof HTMLUnknownElement)) {\n  // <${el}> is supported\n}`,
    };
  }
  if (p[0] === "html" && p[1] === "global_attributes" && p[2]) {
    return { language: "js", code: `if ("${p[2]}" in HTMLElement.prototype) {\n  // the ${p[2]} attribute is supported\n}` };
  }
  return null;
}

export function detectionFor(keys: string[], featureId = ""): Detection | null {
  if (OVERRIDES[featureId]) return OVERRIDES[featureId];
  // 1. Keys named after the feature ("view-transitions" -> Document.startViewTransition).
  const words = featureId.split("-").filter((w) => w.length > 2).map((w) => w.replace(/s$/, ""));
  const exact = featureId.toLowerCase().replace(/[_-]/g, "").replace(/s$/, "");
  const relevance = (key: string) => {
    const k = key.toLowerCase().replace(/[_-]/g, "");
    const last = k.split(".").pop()!.replace(/s$/, "");
    return words.filter((w) => k.includes(w)).length + (last === exact ? 2 : 0);
  };
  // 2. The feature's own language: a mostly-CSS feature gets @supports, not a JS API check.
  const domains = new Map<string, number>();
  for (const key of keys) domains.set(key.split(".")[0], (domains.get(key.split(".")[0]) ?? 0) + 1);
  const main = [...domains.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  // 3. The most general key (fewest segments).
  const sorted = [...keys].sort(
    (a, b) =>
      relevance(b) - relevance(a) ||
      Number(b.startsWith(`${main}.`)) - Number(a.startsWith(`${main}.`)) ||
      a.split(".").length - b.split(".").length,
  );
  for (const key of sorted) {
    const d = fromKey(key);
    if (d) return d;
  }
  return null;
}
