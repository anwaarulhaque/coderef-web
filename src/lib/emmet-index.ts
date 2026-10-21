// Builds the Emmet abbreviation index at build time from the emmet package's own snippet
// registry, so every expansion shown is exactly what Emmet produces.
import expand, { resolveConfig } from "emmet";

export type EmmetSyntax = "html" | "css";
export type EmmetEntry = {
  abbr: string;
  output: string;
  syntax: EmmetSyntax;
  group: string;
  description?: string;
  /** CSS keyword values with the short form that expands to each, e.g. { abbr: "d:ib", value: "inline-block" }. */
  values?: { abbr: string; value: string }[];
};

// Core syntax — operators and features, written for this site.
const SYNTAX: { group: string; abbr: string; description: string }[] = [
  { group: "Nesting operators", abbr: "nav>ul>li", description: "> creates a child element." },
  { group: "Nesting operators", abbr: "div+p+bq", description: "+ creates a sibling on the same level." },
  { group: "Nesting operators", abbr: "div+div>p>span+em^bq", description: "^ climbs up one level, so bq becomes a sibling of p." },
  { group: "Nesting operators", abbr: "div+div>p>span+em^^bq", description: "Each extra ^ climbs one more level." },
  { group: "Grouping", abbr: "div>(header>ul>li*2>a)+footer>p", description: "( ) groups a subtree so the next operator applies to the whole group." },
  { group: "Grouping", abbr: "(div>dl>(dt+dd)*3)+footer>p", description: "Groups can be nested and multiplied." },
  { group: "Multiplication", abbr: "ul>li*5", description: "* repeats an element (or group) N times." },
  { group: "Item numbering", abbr: "ul>li.item$*5", description: "$ is replaced with the repeat counter (1, 2, 3…)." },
  { group: "Item numbering", abbr: "h$[title=item$]{Header $}*3", description: "$ works in tag names, attributes and text." },
  { group: "Item numbering", abbr: "ul>li.item$$$*5", description: "Multiple $ zero-pad the number (001, 002…)." },
  { group: "Item numbering", abbr: "ul>li.item$@-*5", description: "@- counts down." },
  { group: "Item numbering", abbr: "ul>li.item$@3*5", description: "@N starts counting from N." },
  { group: "ID & class", abbr: "#header", description: "#name adds an id (on a div by default)." },
  { group: "ID & class", abbr: ".title", description: ".name adds a class (on a div by default)." },
  { group: "ID & class", abbr: "form#search.wide", description: "Combine a tag, an id and classes." },
  { group: "ID & class", abbr: "p.class1.class2.class3", description: "Chain as many classes as you need." },
  { group: "Attributes", abbr: 'p[title="Hello world"]', description: "[attr=value] adds attributes." },
  { group: "Attributes", abbr: "td[rowspan=2 colspan=3 title]", description: "Several attributes, separated by spaces; empty ones are allowed." },
  { group: "Attributes", abbr: "[a='value1' b=\"value2\"]", description: "Quotes are optional unless the value has spaces." },
  { group: "Text", abbr: "a{Click me}", description: "{text} adds text content." },
  { group: "Text", abbr: "p>{Click }+a{here}+{ to continue}", description: "Text can be a sibling node, to mix text and elements." },
  { group: "Implicit tag names", abbr: ".class", description: "With no tag, the parent decides: div by default…" },
  { group: "Implicit tag names", abbr: "em>.class", description: "…span inside inline elements…" },
  { group: "Implicit tag names", abbr: "ul>.class", description: "…li inside lists…" },
  { group: "Implicit tag names", abbr: "table>.row>.col", description: "…tr and td inside tables." },
  { group: "Lorem ipsum", abbr: "lorem", description: "Generates 30 words of dummy text." },
  { group: "Lorem ipsum", abbr: "lorem10", description: "loremN generates N words." },
  { group: "Lorem ipsum", abbr: "p*3>lorem5", description: "Combine with multiplication for placeholder paragraphs." },
  { group: "CSS values", abbr: "m10", description: "Numbers become the value; px is added for integers." },
  { group: "CSS values", abbr: "m10-20", description: "- separates multiple values." },
  { group: "CSS values", abbr: "m-10--20", description: "A double hyphen gives negative values." },
  { group: "CSS values", abbr: "w100p", description: "Unit aliases: p → %, e → em, x → ex, r → rem." },
  { group: "CSS values", abbr: "c#3", description: "Colors expand: #3 → #333, #e0 → #e0e0e0." },
  { group: "CSS values", abbr: "p10!", description: "! adds !important." },
  { group: "CSS values", abbr: "d:ib", description: "prop:value abbreviates keyword values." },
  { group: "CSS values", abbr: "m10+p5+bd", description: "+ expands several properties at once." },
];

const HTML_GROUPS: [string, RegExp][] = [
  ["Document & head", /^(!|doc|html|head|link|meta|script|style|base|title|noscript)/],
  ["Links", /^a(:|$)/],
  ["Forms", /^(form|input|inp|btn|button|select|opt|textarea|tarea|label|fieldset|fset|legend|leg|datalist|output|keygen|kg|menu|cmd)/],
  ["Tables", /^(table|tr|td|th|caption|cap|col|tbody|thead|tfoot)/],
  ["Media & embeds", /^(img|pic|picture|video|audio|src|source|track|iframe|ifr|emb|embed|obj|object|param|map|area|canvas|svg)/],
  ["Lists", /^(ul|ol|dl|li)\b/],
];

const CSS_GROUPS: [string, RegExp][] = [
  ["At-rules & imports", /^[@!]/],
  ["Lists & tables", /^(list-style|table-layout|caption-side|empty-cells|border-collapse|border-spacing)/],
  ["Flexbox & grid", /^(flex|justify|align|order|gap|row-gap|column-gap|grid|place)/],
  ["Margin & padding", /^(margin|padding)/],
  ["Sizing", /^(width|height|min-|max-|aspect-ratio|box-sizing)/],
  ["Layout & position", /^(display|position|top|right|bottom|left|inset|float|clear|visibility|overflow|z-index|zoom|clip|object|resize|columns|column|break|page-break|orphans|widows)/],
  ["Typography", /^(font|text|line-height|letter-spacing|word|white-space|vertical-align|hyphens|direction|unicode|writing|tab-size|quotes|src)/],
  ["Color & background", /^(color|background|opacity|box-shadow|filter|mix-blend|backdrop)/],
  ["Border & outline", /^(border|outline)/],
  ["Animation & transform", /^(animation|transition|transform|perspective|backface|will-change)/],
];

const groupFor = (rules: [string, RegExp][], key: string, fallback: string) =>
  rules.find(([, re]) => re.test(key))?.[0] ?? fallback;

function safeExpand(abbr: string, syntax: string, type: "markup" | "stylesheet") {
  try {
    return expand(abbr, { syntax, type });
  } catch {
    return "";
  }
}

// Shortest keyword abbreviation Emmet resolves to the given value: initials ("ib"), then prefixes.
function keywordAbbr(snippet: string, value: string): string | null {
  const initials = value.split("-").map((w) => w[0]).join("");
  const candidates = [...new Set([initials, ...Array.from({ length: value.length }, (_, i) => value.slice(0, i + 1))])].sort(
    (a, b) => a.length - b.length,
  );
  for (const c of candidates) {
    const out = safeExpand(`${snippet}:${c}`, "css", "stylesheet");
    if (new RegExp(`:\\s*${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")};`).test(out)) return `${snippet}:${c}`;
  }
  return null;
}

let cache: EmmetEntry[] | null = null;

export function getEmmetIndex(): EmmetEntry[] {
  if (cache) return cache;
  const entries: EmmetEntry[] = [];

  for (const s of SYNTAX) {
    const css = s.group === "CSS values";
    entries.push({
      abbr: s.abbr,
      group: s.group,
      description: s.description,
      syntax: css ? "css" : "html",
      output: safeExpand(s.abbr, css ? "css" : "html", css ? "stylesheet" : "markup"),
    });
  }

  const html = resolveConfig({ type: "markup", syntax: "html" }).snippets;
  for (const key of Object.keys(html)) {
    entries.push({
      abbr: key,
      syntax: "html",
      group: `HTML: ${groupFor(HTML_GROUPS, key, "Elements & text")}`,
      output: safeExpand(key, "html", "markup"),
    });
  }

  const css = resolveConfig({ type: "stylesheet", syntax: "css" }).snippets;
  for (const [key, raw] of Object.entries(css)) {
    const property = raw.startsWith("@") ? raw : raw.split(":")[0];
    const options = raw.includes(":") && !raw.startsWith("@") ? raw.slice(raw.indexOf(":") + 1).split("|") : [];
    const keywords = options.filter((o) => /^[a-z-]+$/.test(o));
    const values =
      keywords.length > 1
        ? [...new Set(keywords)].map((value) => ({ value, abbr: keywordAbbr(key, value) ?? "" })).filter((v) => v.abbr)
        : undefined;
    entries.push({
      abbr: key,
      syntax: "css",
      group: `CSS: ${groupFor(CSS_GROUPS, key.startsWith("@") ? key : property, "Other properties")}`,
      output: safeExpand(key, "css", "stylesheet"),
      values,
    });
  }

  cache = entries;
  return entries;
}
