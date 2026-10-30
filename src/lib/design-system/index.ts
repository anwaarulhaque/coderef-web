// Public entry point: source Markdown in, a design-system package out. Pure and dependency-light, so it runs
// in the browser (on demand, from the CDN file) and in Node (bulk validation, tests).
import { tokensCss, componentsCss } from "./css.ts";
import { renderDesignMd, renderTokensJson } from "./designmd.ts";
import { assess, parseDesignSystem } from "./parse.ts";
import { renderPreviewHtml } from "./preview.ts";
import type { DesignMeta, DesignSystem, PackageFile, ThemeName } from "./types.ts";
import { createZip } from "./zip.ts";

export * from "./types.ts";
export { assess, parseDesignSystem } from "./parse.ts";
export { renderDesignMd } from "./designmd.ts";
export { renderPreviewHtml } from "./preview.ts";
export { frameworkFiles, tailwindV3, tailwindV4, shadcnTheme, dtcgTokens, tokensStudio, parseShadow, figmaFamily } from "./frameworks.ts";

export const MIME = {
  md: "text/markdown;charset=utf-8",
  html: "text/html;charset=utf-8",
  json: "application/json;charset=utf-8",
  css: "text/css;charset=utf-8",
  zip: "application/zip",
} as const;

/** A safe download file name: letters, digits, dot, dash and underscore only. */
export const sanitizeFilename = (name: string) =>
  name.normalize("NFKD").replace(/[^\w.-]+/g, "-").replace(/^[-.]+|[-.]+$/g, "").replace(/-+\./g, ".").replace(/-{2,}/g, "-").slice(0, 80) || "design";

export type DesignSystemPackage = {
  system: DesignSystem;
  files: PackageFile[];
  assessment: { ok: boolean; reason?: string };
};

export const file = (pkg: DesignSystemPackage, name: string) => pkg.files.find((f) => f.name === name)!;

/** styles.css: the tokens plus base component classes, usable on their own. */
const renderStyles = (ds: DesignSystem) => `${tokensCss(ds)}\n${componentsCss(ds)}`;

const cache = new Map<string, DesignSystemPackage>();

/**
 * Generates the whole package for one source file. Results are cached by design id and source version, so the same
 * source is only ever processed once per session, and a changed source never serves a stale package.
 */
export function generatePackage(source: string, meta: DesignMeta): DesignSystemPackage {
  const system = parseDesignSystem(source, meta);
  const key = `${meta.id}@${system.version}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const files: PackageFile[] = [
    { name: "DESIGN.md", mime: MIME.md, content: renderDesignMd(system) },
    { name: "light.html", mime: MIME.html, content: renderPreviewHtml(system, "light") },
    { name: "dark.html", mime: MIME.html, content: renderPreviewHtml(system, "dark") },
    { name: "tokens.json", mime: MIME.json, content: renderTokensJson(system) },
    { name: "styles.css", mime: MIME.css, content: renderStyles(system) },
  ];
  const pkg = { system, files, assessment: assess(system) };
  cache.set(key, pkg);
  return pkg;
}

export const themeFile = (theme: ThemeName) => `${theme}.html`;

/** The complete package as a ZIP, with every file inside a folder named after the design. */
export function zipPackage(pkg: DesignSystemPackage, extra: PackageFile[] = [], deflate?: (d: Uint8Array) => Uint8Array): Uint8Array {
  const enc = new TextEncoder();
  const dir = sanitizeFilename(pkg.system.slug);
  return createZip([...pkg.files, ...extra].map((f) => ({ name: `${dir}/${f.name}`, data: enc.encode(f.content) })), deflate);
}

/** Suggested download names, prefixed with the design's slug so files from different designs do not collide. */
export const downloadName = (pkg: DesignSystemPackage, name: string) => (name === "DESIGN.md" ? "DESIGN.md" : `${sanitizeFilename(pkg.system.slug)}-${name}`);
export const zipName = (pkg: DesignSystemPackage) => `${sanitizeFilename(pkg.system.slug)}-design-system.zip`;
