// Pro exports, generated on the server so they can't be unlocked from the browser.
import { deflateRawSync } from "node:zlib";
import { config } from "./config.ts";
import { HttpError } from "./http.ts";
import { downloadName, frameworkFiles, generatePackage, sanitizeFilename, zipPackage, type DesignMeta } from "../lib/design-system/index.ts";
import { createZip } from "../lib/design-system/zip.ts";
import { BULK_LIMIT, EXPORT_FORMATS, FRAMEWORK_EXPORTS, type ExportFormat } from "../lib/plans.ts";

type Entry = { id: string; name: string; summary: string; collection: string; colors: string[]; fonts: string[]; theme: "light" | "dark"; files?: string[]; external?: unknown };

// The catalogue changes only on data uploads; keep it for the life of the server instance (refreshed hourly).
let catalog: { at: number; list: Promise<Entry[]> } | null = null;
function getCatalog(): Promise<Entry[]> {
  if (!catalog || Date.now() - catalog.at > 3600_000) {
    const list = fetch(`${config.cdnUrl}/data/design-md/catalog.json`).then((r) => (r.ok ? (r.json() as Promise<Entry[]>) : Promise.reject(new Error(`catalog HTTP ${r.status}`))));
    catalog = { at: Date.now(), list };
    list.catch(() => (catalog = null));
  }
  return catalog.list;
}

const hosted = (d: Entry) => !d.external && (d.files ?? []).includes("DESIGN.md");
const deflate = (d: Uint8Array) => new Uint8Array(deflateRawSync(d, { level: 9 }));

async function sourceOf(id: string): Promise<{ text: string; meta: DesignMeta }> {
  const d = (await getCatalog()).find((x) => x.id === id);
  if (!d || !hosted(d)) throw new HttpError(404, "Unknown design", "not_found");
  const res = await fetch(`${config.cdnUrl}/design-md/files/${d.id}/DESIGN.md`);
  if (!res.ok) throw new HttpError(502, "Could not load the design file", "upstream");
  return { text: await res.text(), meta: { id: d.id, name: d.name, summary: d.summary, colors: d.colors, fonts: d.fonts, theme: d.theme } };
}

export type FileOut = { filename: string; mime: string; body: string; base64: boolean };

export async function exportDesign(id: string, format: unknown): Promise<FileOut> {
  if (typeof format !== "string" || !(EXPORT_FORMATS as readonly string[]).includes(format)) throw new HttpError(400, "Unknown export format", "invalid_format");
  const { text, meta } = await sourceOf(id);
  const pkg = generatePackage(text, meta);
  if (!pkg.assessment.ok) throw new HttpError(422, "This design does not have enough information to export", "insufficient");
  const fw = frameworkFiles(pkg.system);
  const pick = (name: string) => fw.find((f) => f.name === name)!;
  const one = (f: { name: string; mime: string; content: string }): FileOut => ({ filename: downloadName(pkg, f.name), mime: f.mime, body: f.content, base64: false });
  switch (format as ExportFormat) {
    case "zip":
      return { filename: `${sanitizeFilename(pkg.system.slug)}-design-system.zip`, mime: "application/zip", body: Buffer.from(zipPackage(pkg, fw, deflate)).toString("base64"), base64: true };
    case "tailwind":
      return one(pick("tailwind.css"));
    case "tailwind-v3":
      return one(pick("tailwind.config.js"));
    case "shadcn":
      return one(pick("shadcn-theme.css"));
    case "figma":
      return one(pick("figma-tokens.json"));
    case "tokens":
      return one(pick("tokens.dtcg.json"));
  }
}

/** Lines of a framework export shown to everyone on the design page; the full file is Pro. */
export const PREVIEW_LINES = 14;

/** The first PREVIEW_LINES of one framework export, generated here so the full file never reaches free users. */
export async function previewExport(id: string, format: unknown): Promise<{ file: string; lines: string[]; totalLines: number }> {
  const info = FRAMEWORK_EXPORTS.find((f) => f.format === format);
  if (!info) throw new HttpError(400, "Unknown export format", "invalid_format");
  const { text, meta } = await sourceOf(id);
  const pkg = generatePackage(text, meta);
  if (!pkg.assessment.ok) throw new HttpError(422, "This design does not have enough information to export", "insufficient");
  const content = frameworkFiles(pkg.system).find((f) => f.name === info.file)!.content.trimEnd().split("\n");
  return { file: info.file, lines: content.slice(0, PREVIEW_LINES), totalLines: content.length };
}

/** Every DESIGN.md in one collection, deflated, up to BULK_LIMIT files. */
export async function exportCollection(collection: unknown): Promise<FileOut> {
  if (typeof collection !== "string" || !/^[a-z-]{1,30}$/.test(collection)) throw new HttpError(400, "Unknown collection", "invalid_collection");
  const designs = (await getCatalog()).filter((d) => d.collection === collection && hosted(d)).slice(0, BULK_LIMIT);
  if (!designs.length) throw new HttpError(404, "Unknown collection", "not_found");
  const enc = new TextEncoder();
  const files: { name: string; data: Uint8Array }[] = [];
  const queue = [...designs];
  await Promise.all(
    Array.from({ length: 16 }, async () => {
      for (let d; (d = queue.shift()); ) {
        const res = await fetch(`${config.cdnUrl}/design-md/files/${d.id}/DESIGN.md`);
        if (res.ok) files.push({ name: `${collection}/${d.id.split("/").slice(1).join("-")}/DESIGN.md`, data: enc.encode(await res.text()) });
      }
    }),
  );
  files.sort((a, b) => a.name.localeCompare(b.name));
  files.push({ name: `${collection}/README.txt`, data: enc.encode(`${files.length} DESIGN.md files from the CodeRef "${collection}" collection.\nLicences: ${config.cdnUrl}/data/design-md/THIRD_PARTY_LICENSES.md\n`) });
  return { filename: `coderef-${collection}-designs.zip`, mime: "application/zip", body: Buffer.from(createZip(files, deflate)).toString("base64"), base64: true };
}
