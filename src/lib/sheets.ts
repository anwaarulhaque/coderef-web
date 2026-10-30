import { cdnJson } from "./cdn";
import type { Sheet, SheetSummary } from "./types";

// Every data/sheets/*.json file on the CDN becomes a page at /<slug>/ at build time. They arrive as one
// bundle (scripts/cdn.mjs), each tagged with its file name.
function checkSheet({ file, ...sheet }: Sheet & { file: string }): Sheet {
  const expectedSlug = file.replace(/\.json$/, "");
  if (sheet.slug !== expectedSlug) {
    throw new Error(
      `data/sheets/${file}: slug "${sheet.slug}" must match file name "${expectedSlug}"`,
    );
  }
  return sheet;
}

let cache: Promise<Sheet[]> | null = null;

export function getAllSheets(): Promise<Sheet[]> {
  cache ??= cdnJson<(Sheet & { file: string })[]>("data/bundle/sheets.json").then((all) =>
    all.map(checkSheet).sort((a, b) => a.title.localeCompare(b.title)),
  );
  return cache;
}

export async function getSheet(slug: string): Promise<Sheet | undefined> {
  return (await getAllSheets()).find((sheet) => sheet.slug === slug);
}

export function countItems(sheet: Sheet): number {
  return sheet.sections.reduce(
    (total, section) =>
      total + section.groups.reduce((sum, group) => sum + group.items.length, 0),
    0,
  );
}

export async function getSheetSummaries(): Promise<SheetSummary[]> {
  return (await getAllSheets()).map(({ sections, ...rest }) => ({
    ...rest,
    itemCount: countItems({ ...rest, sections }),
  }));
}
