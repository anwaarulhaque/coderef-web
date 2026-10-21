// Browser-support data for the "Browser Support" section, built from:
//  - web-features (feature list, Baseline status, first-supported versions) — Apache-2.0
//  - @mdn/browser-compat-data (MDN documentation links per compat key) — CC0
// Both are read from node_modules at build time; nothing is fetched at runtime.
import fs from "node:fs";
import path from "node:path";
import { BROWSER_LIST, type Baseline, type BrowserId, type FeatureSummary, type Support } from "./compat-shared";

export const BROWSERS = BROWSER_LIST;
export type { Baseline, BrowserId, FeatureSummary, Support };

export type CompatKey = { key: string; baseline: Baseline; support: Support; mdn?: string };

export type CompatFeature = {
  id: string;
  name: string;
  description: string;
  descriptionHtml: string;
  category: string;
  groups: string[];
  baseline: Baseline;
  baselineLowDate?: string;
  baselineHighDate?: string;
  support: Support;
  spec: string[];
  caniuse: string[];
  mdn: { title: string; url: string }[];
  compatKeys: CompatKey[];
  discouraged?: { reason: string; alternatives: string[] };
};

export type MovedFeature = { id: string; kind: "moved" | "split"; targets: string[] };

export type Release = { version: string; date: string };

type RawStatus = {
  baseline: Baseline;
  baseline_low_date?: string;
  baseline_high_date?: string;
  support: Support;
  by_compat_key?: Record<string, { baseline: Baseline; support: Support }>;
};
type RawFeature =
  | {
      kind: "feature";
      name: string;
      description: string;
      description_html: string;
      group?: string | string[];
      spec?: string | string[];
      caniuse?: string | string[];
      compat_features?: string[];
      status: RawStatus;
      discouraged?: { according_to: string[]; alternatives?: string[]; reason?: string };
    }
  | { kind: "moved"; redirect_target: string }
  | { kind: "split"; redirect_targets: string[] };
type RawData = {
  features: Record<string, RawFeature>;
  groups: Record<string, { name: string; parent?: string }>;
  browsers: Record<string, { name: string; releases: Release[] }>;
};

const list = (v: string | string[] | undefined) => (v === undefined ? [] : Array.isArray(v) ? v : [v]);

let cache: { features: CompatFeature[]; moved: MovedFeature[]; releases: Record<BrowserId, Release[]> } | null = null;

function readJson<T>(pkgFile: string): T {
  return JSON.parse(fs.readFileSync(path.join(process.cwd(), "node_modules", pkgFile), "utf8")) as T;
}

// Ungrouped features get a category from their compat keys, e.g. "css.properties.x" -> CSS.
const KEY_CATEGORY: Record<string, string> = {
  css: "CSS",
  html: "HTML",
  javascript: "JavaScript",
  api: "Web APIs",
  svg: "SVG",
  http: "HTTP",
  mathml: "MathML",
  webassembly: "WebAssembly",
  webdriver: "WebDriver",
  webextensions: "Web extensions",
};

function load() {
  if (cache) return cache;
  const data = readJson<RawData>("web-features/data.json");
  const bcd = readJson<Record<string, unknown>>("@mdn/browser-compat-data/data.json");

  const mdnUrl = (key: string): string | undefined => {
    let node: unknown = bcd;
    for (const part of key.split(".")) node = (node as Record<string, unknown> | undefined)?.[part];
    const url = (node as { __compat?: { mdn_url?: string } } | undefined)?.__compat?.mdn_url;
    return url?.replace("https://developer.mozilla.org/docs/", "https://developer.mozilla.org/en-US/docs/");
  };

  const topGroup = (id: string): string => {
    let g = data.groups[id];
    while (g?.parent && data.groups[g.parent]) g = data.groups[g.parent];
    return g?.name ?? id;
  };

  const features: CompatFeature[] = [];
  const moved: MovedFeature[] = [];
  for (const [id, raw] of Object.entries(data.features)) {
    if (raw.kind === "moved") {
      moved.push({ id, kind: "moved", targets: [raw.redirect_target] });
      continue;
    }
    if (raw.kind === "split") {
      moved.push({ id, kind: "split", targets: raw.redirect_targets });
      continue;
    }
    const groups = list(raw.group);
    const keys = raw.compat_features ?? [];
    const category = groups.length ? topGroup(groups[0]) : (KEY_CATEGORY[keys[0]?.split(".")[0] ?? ""] ?? "Other");
    const compatKeys: CompatKey[] = keys.map((key) => ({
      key,
      baseline: raw.status.by_compat_key?.[key]?.baseline ?? false,
      support: raw.status.by_compat_key?.[key]?.support ?? {},
      mdn: mdnUrl(key),
    }));
    // Unique MDN pages, titled by the last segment of their URL.
    const mdn = [...new Map(compatKeys.filter((k) => k.mdn).map((k) => [k.mdn!, k.mdn!])).values()]
      .slice(0, 8)
      .map((url) => ({ url, title: decodeURIComponent(url.split("/").pop() ?? url).replace(/_/g, " ") }));
    features.push({
      id,
      name: raw.name,
      description: raw.description,
      descriptionHtml: raw.description_html,
      category,
      groups: groups.map((g) => data.groups[g]?.name ?? g),
      baseline: raw.status.baseline,
      baselineLowDate: raw.status.baseline_low_date,
      baselineHighDate: raw.status.baseline_high_date,
      support: raw.status.support ?? {},
      spec: list(raw.spec),
      caniuse: list(raw.caniuse),
      mdn,
      compatKeys,
      discouraged: raw.discouraged
        ? { reason: raw.discouraged.reason ?? "", alternatives: raw.discouraged.alternatives ?? [] }
        : undefined,
    });
  }
  features.sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }));

  // Only releases that have shipped as of the build.
  const today = new Date().toISOString().slice(0, 10);
  const releases = Object.fromEntries(
    BROWSERS.map(({ id }) => [id, (data.browsers[id]?.releases ?? []).filter((r) => r.date <= today)]),
  ) as Record<BrowserId, Release[]>;

  cache = { features, moved, releases };
  return cache;
}

export function getCompatFeatures(): CompatFeature[] {
  return load().features;
}

export function getCompatFeature(id: string): CompatFeature | undefined {
  return load().features.find((f) => f.id === id);
}

export function getMovedFeatures(): MovedFeature[] {
  return load().moved;
}

export function getReleases(): Record<BrowserId, Release[]> {
  return load().releases;
}

export function getFeatureSummaries(): FeatureSummary[] {
  return load().features.map(({ id, name, category, baseline, support, description, baselineLowDate }) => ({
    id,
    name,
    category,
    baseline,
    support,
    description,
    since: baselineLowDate,
  }));
}
