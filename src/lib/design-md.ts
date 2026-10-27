// DESIGN.md library: design systems for AI coding agents, from data/design-md (synced by
// scripts/sync-design-md.mjs). Read at build time; the browser gets /design-md/index.json for search.
import fs from "node:fs";
import path from "node:path";
import MarkdownIt from "markdown-it";
import type { DesignIndexEntry, DesignShot } from "./design-md-shared";

export * from "./design-md-shared";

export type Design = {
  /** "<collection>/<slug>" or "<collection>/<category>/<slug>" */
  id: string;
  collection: string;
  category: string;
  slug: string;
  name: string;
  title: string;
  summary: string;
  words: number;
  colors: string[];
  fonts: string[];
  theme: "light" | "dark";
  hue: string;
  /** DESIGN.md plus platform variants (DESIGN-swiftui.md, …) */
  files: string[];
};

export type Collection = { id: string; label: string; description: string; count: number };

export type DesignTemplate = { id: string; file: string; count: number; sections: string[]; markdown: string };

const DIR = path.join(process.cwd(), "data", "design-md");
const FILES_DIR = path.join(process.cwd(), "public", "design-md", "files");

export const COLLECTIONS: Omit<Collection, "count">[] = [
  { id: "web", label: "Web", description: "Design systems of well-known product and brand websites." },
  { id: "mobile", label: "Mobile", description: "Mobile app design systems with SwiftUI, Android and Expo variants." },
  { id: "brands", label: "Brands", description: "Company design systems from around the world." },
  { id: "indie", label: "Indie", description: "Personal sites and portfolios with a distinctive look." },
  { id: "terminal", label: "Terminal", description: "Design systems for terminal and command-line interfaces." },
  { id: "examples", label: "Examples", description: "Reference examples of the DESIGN.md format." },
];

let cache: Design[] | null = null;

export function getDesigns(): Design[] {
  if (!cache) {
    const file = path.join(DIR, "catalog.json");
    cache = fs.existsSync(file) ? (JSON.parse(fs.readFileSync(file, "utf8")) as Design[]) : [];
    cache.sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }));
  }
  return cache;
}

export const getDesign = (id: string) => getDesigns().find((d) => d.id === id);

export function getCollections(): Collection[] {
  const designs = getDesigns();
  return COLLECTIONS.map((c) => ({ ...c, count: designs.filter((d) => d.collection === c.id).length })).filter((c) => c.count > 0);
}

export const getCollection = (id: string) => getCollections().find((c) => c.id === id);

export function readDesignFile(id: string, file = "DESIGN.md"): string {
  return fs.readFileSync(path.join(FILES_DIR, id, file), "utf8");
}

// Live-site screenshots and their URLs (scripts/design-md-sites.mjs, scripts/screenshot-design-md.mjs).
// Kept in data/design-shots because sync-design-md wipes data/design-md.
const SHOTS_DIR = path.join(process.cwd(), "data", "design-shots");
let shots: Record<string, DesignShot> | null = null;
let sites: Record<string, string | null> | null = null;

const readJson = <T,>(file: string, fallback: T): T => (fs.existsSync(file) ? (JSON.parse(fs.readFileSync(file, "utf8")) as T) : fallback);

export function getShot(id: string): DesignShot | undefined {
  shots ??= readJson(path.join(SHOTS_DIR, "shots.json"), {});
  return shots[id];
}

export function getSiteUrl(id: string): string | undefined {
  sites ??= readJson(path.join(SHOTS_DIR, "sites.json"), {});
  return sites[id] ?? undefined;
}

export function toIndexEntry(d: Design): DesignIndexEntry {
  const shot = getShot(d.id);
  return { i: d.id, n: d.name, c: d.collection, g: d.category, s: d.summary, p: d.colors.slice(0, 6), f: d.fonts, t: d.theme, h: d.hue, w: d.words, v: d.files.length, ...(shot && { x: shot.v }) };
}

/** Same collection first, then shared hue and theme; a cheap "more like this". */
export function getRelated(design: Design, limit = 6): Design[] {
  const score = (d: Design) => (d.collection === design.collection ? 2 : 0) + (d.category === design.category ? 2 : 0) + (d.hue === design.hue ? 3 : 0) + (d.theme === design.theme ? 1 : 0);
  return getDesigns()
    .filter((d) => d.id !== design.id)
    .map((d) => ({ d, s: score(d) }))
    .sort((a, b) => b.s - a.s || b.d.words - a.d.words)
    .slice(0, limit)
    .map((x) => x.d);
}

/** Front matter (YAML tokens) is shown separately, so the rendered document starts at the prose. */
export function splitFrontMatter(md: string): { frontMatter: string | null; body: string } {
  const m = md.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  return m ? { frontMatter: m[1], body: md.slice(m[0].length) } : { frontMatter: null, body: md };
}

export type TocItem = { id: string; title: string };

// Design files are third-party Markdown baked into static pages, so raw HTML is off (unlike the
// editor's renderer in lib/markdown/render.ts).
let md: InstanceType<typeof MarkdownIt> | null = null;

const decode = (s: string) => s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");

/** Renders a design file and gives every h2 an id for the table of contents. */
export function renderDesign(source: string, idPrefix = ""): { html: string; toc: TocItem[] } {
  md ??= new MarkdownIt({ html: false, linkify: false, typographer: true });
  const toc: TocItem[] = [];
  const used = new Set<string>();
  const html = md.render(source).replace(/<h2>([\s\S]*?)<\/h2>/g, (_: string, inner: string) => {
    const title = decode(inner.replace(/<[^>]+>/g, "")).trim();
    let id = idPrefix + (title.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "") || "section");
    while (used.has(id)) id += "-";
    used.add(id);
    toc.push({ id, title: title.replace(/^\d+\.\s*/, "") });
    return `<h2 id="${id}">${inner}</h2>`;
  });
  return { html, toc };
}

export function getTemplates(): DesignTemplate[] {
  const dir = path.join(DIR, "templates");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => /^DESIGN\.template\..+\.md$/.test(f))
    .sort()
    .map((file) => {
      const id = file.replace(/^DESIGN\.template\.|\.md$/g, "");
      const stats = JSON.parse(fs.readFileSync(path.join(dir, `heading-stats.${id}.json`), "utf8")) as { documents: number; sections: { title: string }[] };
      return { id, file, count: stats.documents, sections: stats.sections.map((s) => s.title), markdown: fs.readFileSync(path.join(dir, file), "utf8") };
    });
}

export function getLicensesMarkdown(): string {
  const file = path.join(DIR, "THIRD_PARTY_LICENSES.md");
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
}
