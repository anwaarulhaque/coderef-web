import fs from "node:fs";
import path from "node:path";
import type { Sheet, SheetSummary } from "./types";

// Every *.json file in data/sheets becomes a page at /<slug>/ at build time.
const SHEETS_DIR = path.join(process.cwd(), "data", "sheets");

function readSheet(file: string): Sheet {
  const raw = fs.readFileSync(path.join(SHEETS_DIR, file), "utf8");
  const sheet = JSON.parse(raw) as Sheet;
  const expectedSlug = path.basename(file, ".json");
  if (sheet.slug !== expectedSlug) {
    throw new Error(
      `data/sheets/${file}: slug "${sheet.slug}" must match file name "${expectedSlug}"`,
    );
  }
  return sheet;
}

export function getAllSheets(): Sheet[] {
  return fs
    .readdirSync(SHEETS_DIR)
    .filter((file) => file.endsWith(".json"))
    .map(readSheet)
    .sort((a, b) => a.title.localeCompare(b.title));
}

export function getSheet(slug: string): Sheet | undefined {
  return getAllSheets().find((sheet) => sheet.slug === slug);
}

export function countItems(sheet: Sheet): number {
  return sheet.sections.reduce(
    (total, section) =>
      total + section.groups.reduce((sum, group) => sum + group.items.length, 0),
    0,
  );
}

export function getSheetSummaries(): SheetSummary[] {
  return getAllSheets().map(({ sections, ...rest }) => ({
    ...rest,
    itemCount: countItems({ ...rest, sections }),
  }));
}
