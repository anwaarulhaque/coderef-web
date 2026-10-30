// DESIGN.md library: design systems for AI coding agents, from data/design-md on the CDN (synced by
// scripts/sync-design-md.mjs, uploaded by scripts/cdn.mjs). Fetched at build time; the browser gets
// design-md/index.json for search.
import MarkdownIt from "markdown-it";
import { cdnJson, cdnText } from "./cdn";
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
  /** DESIGN.md plus platform variants (DESIGN-swiftui.md, …); empty for external designs */
  files: string[];
  tags?: string[];
  /** Listed from a source without an open license: its file is not hosted here, only linked. */
  external?: { url: string; file: string; credit: string };
};

export type Collection = { id: string; label: string; description: string; count: number };

export const COLLECTIONS: Omit<Collection, "count">[] = [
  { id: "web", label: "Web", description: "Design systems of well-known product and brand websites." },
  { id: "mobile", label: "Mobile", description: "Mobile app design systems with SwiftUI, Android and Expo variants." },
  { id: "brands", label: "Brands", description: "Company design systems from around the world." },
  { id: "indie", label: "Indie", description: "Personal sites and portfolios with a distinctive look." },
  { id: "terminal", label: "Terminal", description: "Design systems for terminal and command-line interfaces." },
  { id: "examples", label: "Examples", description: "Reference examples of the DESIGN.md format." },
  { id: "styles", label: "Styles", description: "Visual styles and design movements, from brutalism to aurora gradients." },
];

// Everything the library needs, fetched together once: the catalog, live-site screenshots and their URLs
// (scripts/design-md-sites.mjs, scripts/screenshot-design-md.mjs; kept in data/design-shots because
// sync-design-md wipes data/design-md), and how much CJK text each DESIGN.md quotes (scripts/cdn.mjs).
type Library = { designs: Design[]; shots: Record<string, DesignShot>; sites: Record<string, string | null>; cjk: Record<string, number> };
let loading: Promise<Library> | null = null;
let library: Library | null = null;

function loadLibrary(): Promise<Library> {
  loading ??= Promise.all([
    cdnJson<Design[]>("data/design-md/catalog.json"),
    cdnJson<Record<string, DesignShot>>("data/design-shots/shots.json"),
    cdnJson<Record<string, string | null>>("data/design-shots/sites.json"),
    cdnJson<Record<string, number>>("data/bundle/design-cjk.json"),
  ]).then(([designs, shots, sites, cjk]) => {
    designs.sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }));
    return (library = { designs, shots, sites, cjk });
  });
  return loading;
}

/** For the synchronous helpers below, which only ever run on designs that came from getDesigns()/getDesign(). */
function loaded(): Library {
  if (!library) throw new Error("design-md: await getDesigns() before using the library helpers");
  return library;
}

export const getDesigns = async (): Promise<Design[]> => (await loadLibrary()).designs;

export const getDesign = async (id: string) => (await getDesigns()).find((d) => d.id === id);

export async function getCollections(): Promise<Collection[]> {
  const designs = await getDesigns();
  return COLLECTIONS.map((c) => ({ ...c, count: designs.filter((d) => d.collection === c.id).length })).filter((c) => c.count > 0);
}

export const getCollection = async (id: string) => (await getCollections()).find((c) => c.id === id);

export const readDesignFile = (id: string, file = "DESIGN.md") => cdnText(`design-md/files/${id}/${file}`);

export const getShot = (id: string): DesignShot | undefined => loaded().shots[id];

export const getSiteUrl = (id: string): string | undefined => loaded().sites[id] ?? undefined;

// Country domains of non-English-speaking markets; .co, .io, .ai, .me and friends are used worldwide.
const LOCAL_TLD = /\.(?:kr|jp|tw|cn|hk|de|fr|nl|se|es|it|br|ru|pl|ch|at|be|dk|no|fi|pt|cz|tr|vn|th|id)\/?$/;
const localCache = new Map<string, boolean>();

/** A site in another language: a CJK name, a DESIGN.md quoting a lot of CJK UI text (counted by scripts/cdn.mjs),
 * or a local country domain. */
export function isNonEnglish(d: Design): boolean {
  let local = localCache.get(d.id);
  if (local === undefined) {
    const host = getSiteUrl(d.id)?.replace(/^https?:\/\/([^/]+).*/, "$1") ?? "";
    const cjk = loaded().cjk[d.id] ?? 0;
    local = /[぀-ヿ㐀-鿿가-힯]/.test(d.name) || cjk >= 15 || LOCAL_TLD.test(host);
    localCache.set(d.id, local);
  }
  return local;
}

// Best-known brands, listed first in the library in this order. Matched by slug ("linear" also matches
// "linear.app"); a brand in several collections is ranked once, on its best entry.
const TOP_BRANDS = [
  "apple", "google", "microsoft", "netflix", "spotify", "airbnb", "uber", "stripe", "tesla", "nike", "meta", "openai",
  "anthropic", "claude", "notion", "figma", "linear", "vercel", "github", "slack", "discord", "shopify", "coinbase",
  "paypal", "revolut", "wise", "pinterest", "reddit", "twitch", "duolingo", "dropbox", "airtable", "framer", "webflow",
  "supabase", "cursor", "raycast", "nvidia", "ibm", "samsung", "bmw", "ferrari", "lamborghini", "spacex",
  "playstation", "starbucks", "lego", "ikea", "zara", "adobe", "salesforce", "huggingface", "mastercard", "intercom",
  "zapier", "miro", "zoom",
];
const BRAND_COLLECTIONS = ["web", "brands", "indie"];
let topRanks: Map<string, number> | null = null;

/** Position in TOP_BRANDS (0 = first), for the one entry that represents each top brand. */
export function getTopRank(id: string): number | undefined {
  if (!topRanks) {
    const key = (d: Design) => d.slug.toLowerCase().replace(/\.(com|ai|io|app|dev|so)$/, "");
    const candidates = loaded().designs.filter((d) => BRAND_COLLECTIONS.includes(d.collection) && !d.external);
    topRanks = new Map();
    TOP_BRANDS.forEach((brand, rank) => {
      const best = candidates
        .filter((d) => key(d) === brand)
        .sort((a, b) => Number(Boolean(getShot(b.id))) - Number(Boolean(getShot(a.id))) || BRAND_COLLECTIONS.indexOf(a.collection) - BRAND_COLLECTIONS.indexOf(b.collection) || b.words - a.words)[0];
      if (best) topRanks!.set(best.id, rank);
    });
  }
  return topRanks.get(id);
}

export function toIndexEntry(d: Design): DesignIndexEntry {
  const shot = getShot(d.id);
  const rank = getTopRank(d.id);
  return {
    i: d.id, n: d.name, c: d.collection, g: d.category, s: d.summary, p: d.colors.slice(0, 6), f: d.fonts, t: d.theme, h: d.hue, w: d.words, v: d.files.length,
    ...(shot && { x: shot.v }), ...(isNonEnglish(d) && { l: 1 as const }), ...(rank !== undefined && { r: rank }),
    ...(d.external && { e: d.external.url, ef: d.external.file }),
  };
}

/** Same collection first, then shared hue and theme; a cheap "more like this". */
export function getRelated(design: Design, limit = 6): Design[] {
  const score = (d: Design) => (d.collection === design.collection ? 2 : 0) + (d.category === design.category ? 2 : 0) + (d.hue === design.hue ? 3 : 0) + (d.theme === design.theme ? 1 : 0);
  return loaded()
    .designs.filter((d) => d.id !== design.id)
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
