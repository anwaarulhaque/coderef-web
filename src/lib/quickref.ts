// Task-oriented quick references ("what you want to do" → copy-paste code), from data/quickref/*.json.
import fs from "node:fs";
import path from "node:path";

/** One cell: a snippet, or several alternatives. */
export type QuickRefCell = string | string[];

export type QuickRefSection = {
  title: string;
  description?: string;
  /** Overrides the topic's column headings for this section. */
  columns?: string[];
  /** [task, ...cells] */
  rows: [string, ...QuickRefCell[]][];
};

export type QuickRefTopic = {
  slug: string;
  title: string;
  category: string;
  color: string;
  language: string;
  description: string;
  updated: string;
  docs?: string;
  note?: string;
  /** Cells are keyboard shortcuts rather than code. */
  keys?: boolean;
  /** Column headings, default ["Task", "Code"]. */
  columns?: string[];
  try?: { label: string; href: string };
  sections: QuickRefSection[];
};

export type QuickRefSummary = Pick<QuickRefTopic, "slug" | "title" | "category" | "color" | "description"> & {
  sections: number;
  rows: number;
};

/** A flattened row for cross-topic search. */
export type QuickRefSearchRow = { slug: string; topic: string; color: string; section: string; anchor: string; task: string; code: string; keys?: boolean };

const DIR = path.join(process.cwd(), "data", "quickref");

export const sectionAnchor = (title: string) =>
  title
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

let cache: QuickRefTopic[] | null = null;

export function getQuickRefs(): QuickRefTopic[] {
  cache ??= fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8")) as QuickRefTopic)
    .sort((a, b) => a.title.localeCompare(b.title));
  return cache;
}

export const getQuickRef = (slug: string) => getQuickRefs().find((t) => t.slug === slug);

export function getQuickRefSummaries(): QuickRefSummary[] {
  return getQuickRefs().map(({ slug, title, category, color, description, sections }) => ({
    slug,
    title,
    category,
    color,
    description,
    sections: sections.length,
    rows: sections.reduce((n, s) => n + s.rows.length, 0),
  }));
}

export function getQuickRefSearchRows(): QuickRefSearchRow[] {
  return getQuickRefs().flatMap((t) =>
    t.sections.flatMap((s) =>
      s.rows.map(([task, ...cells]) => ({
        slug: t.slug,
        topic: t.title,
        color: t.color,
        section: s.title,
        anchor: sectionAnchor(s.title),
        task,
        // First alternative of each cell, e.g. "Ctrl+Shift+P · ⇧⌘P" for shortcuts.
        code: cells.map((c) => (Array.isArray(c) ? c[0] : c)).join(t.keys ? "  ·  " : "\n"),
        keys: t.keys,
      })),
    ),
  );
}
