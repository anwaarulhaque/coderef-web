// Builds the global search index at build time. Served as /search-index.json and loaded
// the first time someone opens search, so normal page loads don't pay for it.
import { getCompatFeatures } from "./compat";
import { getDesigns } from "./design-md";
import { getEmmetIndex } from "./emmet-index";
import { getMarkdownCheatSheet } from "./markdown/cheatsheet";
import { getQuickRefs, sectionAnchor } from "./quickref";
import { getAllSheets } from "./sheets";
import { NAV_PAGES } from "./site";

/** Compact on purpose: thousands of these ship to the browser. */
export type SearchEntry = {
  /** kind */
  k: SearchKind;
  /** title */
  t: string;
  /** subtitle / where it lives */
  s: string;
  /** url */
  u: string;
  /** optional code preview */
  c?: string;
};

export type SearchKind = "page" | "sheet" | "entry" | "snippet" | "feature" | "abbr" | "markdown" | "design";

export async function buildSearchIndex(): Promise<SearchEntry[]> {
  const out: SearchEntry[] = [];

  for (const p of NAV_PAGES) out.push({ k: "page", t: p.label, s: p.description || "Page", u: p.href });
  out.push({ k: "page", t: "Quick Reference", s: "Copy-paste snippets for 24 languages and tools", u: "/quick-reference/" });

  for (const sheet of await getAllSheets()) {
    const links = sheet.kind === "links";
    out.push({ k: "sheet", t: sheet.title, s: links ? `${sheet.category} · reference links` : `${sheet.category} cheat sheet`, u: `/${sheet.slug}/` });
    if (links) continue;
    for (const section of sheet.sections) {
      for (const group of section.groups) {
        for (const item of group.items) {
          // Visual sheets: the property is the useful result, not each example.
          if (sheet.kind === "visual") continue;
          out.push({ k: "entry", t: item.name, s: `${sheet.title} · ${section.title}`, u: item.url ?? `/${sheet.slug}/` });
        }
        if (sheet.kind === "visual" && group.title) {
          out.push({ k: "entry", t: group.title, s: `${sheet.title} · ${group.description ?? section.title}`, u: `/${sheet.slug}/` });
        }
      }
    }
  }

  for (const topic of await getQuickRefs()) {
    out.push({ k: "sheet", t: `${topic.title} Quick Reference`, s: topic.description, u: `/quick-reference/${topic.slug}/` });
    for (const section of topic.sections) {
      for (const [task, ...cells] of section.rows) {
        const first = cells.map((c) => (Array.isArray(c) ? c[0] : c));
        out.push({
          k: "snippet",
          t: task,
          s: `${topic.title} · ${section.title}`,
          u: `/quick-reference/${topic.slug}/#${sectionAnchor(section.title)}`,
          c: (topic.keys ? first.join("  ·  ") : first[0]).slice(0, 120),
        });
      }
    }
  }

  for (const f of getCompatFeatures()) {
    const label = f.baseline === "high" ? "Widely available" : f.baseline === "low" ? "Newly available" : "Limited availability";
    out.push({ k: "feature", t: f.name, s: `Browser support · ${label}`, u: `/browser-support/${f.id}/` });
  }

  for (const e of getEmmetIndex()) {
    out.push({
      k: "abbr",
      t: e.abbr,
      s: `${e.syntax.toUpperCase()} abbreviation · ${e.group.replace(/^(HTML|CSS): /, "")}`,
      u: `/abbreviations/#${new URLSearchParams({ a: e.abbr, s: e.syntax })}`,
      c: e.output.split("\n")[0].slice(0, 80),
    });
  }

  for (const d of await getDesigns()) {
    out.push({ k: "design", t: `${d.name} DESIGN.md`, s: `Design system · ${d.category}`, u: `/design-md/${d.id}/` });
  }

  for (const m of getMarkdownCheatSheet()) {
    out.push({ k: "markdown", t: `Markdown: ${m.element}`, s: `Markdown ${m.group.toLowerCase()}`, u: "/markdown/", c: m.markdown.split("\n")[0] });
  }

  return out;
}
