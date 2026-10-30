// Run with `npm test`. Fixtures are inline so the suite needs no network.
import assert from "node:assert/strict";
import { test } from "node:test";
import { contrast, parseColor } from "./color.ts";
import { MIME, downloadName, generatePackage, parseDesignSystem, sanitizeFilename, zipName, zipPackage, file, assess } from "./index.ts";
import { crc32 } from "./zip.ts";

const YAML_SRC = `---
version: alpha
name: Acme-Inspired-design-analysis
description: A calm fintech look.
colors:
  primary: "#533afd"
  on-primary: "#ffffff"
  ink: "#0d253d"
  ink-mute: "#64748d"
  canvas: "#ffffff"
  canvas-soft: "#f6f9fc"
  hairline: "#e3e8ee"
typography:
  display-xl:
    fontFamily: "Sohne, system-ui, sans-serif"
    fontSize: 48px
    fontWeight: 300
    lineHeight: 1.1
    letterSpacing: -0.96px
  body-md:
    fontFamily: "Sohne, system-ui, sans-serif"
    fontSize: 16px
    fontWeight: 400
rounded:
  sm: 4px
  pill: 9999px
spacing:
  sm: 8px
  lg: 16px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.pill}"
    padding: 8px 16px
---

# Acme

## Responsive Behavior
Breakpoints: 768px, 1024px, 1440px.
`;

const PROSE_SRC = `# animejs.com — Design System

## 1. Visual Theme & Atmosphere
A near-black canvas for a motion studio.

## 2. Color Palette & Roles
- Canvas: \`#252423\`
- Text: \`#f6f4f2\`

## 3. Typography Rules
- **h2 (hero)**: 64px / 700 weight / 55.36px line-height

## 6. Depth & Elevation
box-shadow: rgba(0, 0, 0, 0.15) 0px 2px 8px 0px

## 7. Do's and Don'ts
### Do
- Keep the canvas near-black
### Don't
- Use pure white
`;

const meta = { id: "web/acme", name: "Acme", colors: [], theme: "light" as const };

test("parseColor normalises hex, rgb and hsl", () => {
  assert.equal(parseColor("#ABC"), "#aabbcc");
  assert.equal(parseColor("rgb(10, 20, 30)"), "#0a141e");
  assert.equal(parseColor("rgba(10 20 30 / 0.4)"), "#0a141e");
  assert.equal(parseColor("hsl(0 100% 50%)"), "#ff0000");
  assert.equal(parseColor("{colors.primary}"), null);
  assert.equal(parseColor(42), null);
});

test("front-matter tokens are read and marked as source", () => {
  const ds = parseDesignSystem(YAML_SRC, meta);
  assert.equal(ds.themes.light.primary.value, "#533afd");
  assert.equal(ds.themes.light.primary.from, "source");
  assert.equal(ds.themes.light.background.value, "#ffffff");
  assert.equal(ds.typeScale.from, "source");
  assert.equal(ds.typeScale.value[0].fontSize, "48px");
  assert.deepEqual(ds.radius.value.map((r) => r.value), ["4px", "9999px"]);
  assert.equal(ds.components[0].backgroundColor, "#533afd", "{colors.primary} reference is resolved");
  assert.equal(ds.components[0].rounded, "9999px");
  assert.equal(ds.breakpoints.from, "source");
  assert.equal(ds.coverage.colors, 7);
});

test("the opposite theme is derived, accessible and labelled", () => {
  const ds = parseDesignSystem(YAML_SRC, meta);
  assert.equal(ds.sourceTheme, "light");
  const dark = ds.themes.dark;
  assert.equal(dark.background.from, "derived");
  assert.ok(contrast(dark.foreground.value, dark.background.value) >= 7);
  assert.ok(contrast(dark.primary.value, dark.background.value) >= 3);
});

test("prose-only files are mined; missing groups fall back to labelled defaults", () => {
  const ds = parseDesignSystem(PROSE_SRC, { id: "indie/animejs.com", name: "animejs.com", colors: ["#252423", "#f6f4f2"], theme: "dark" });
  assert.equal(ds.sourceTheme, "dark");
  assert.equal(ds.themes.dark.background.value, "#252423");
  assert.equal(ds.typeScale.value[0].lineHeight, "55.36px", "px line-height keeps its unit");
  assert.equal(ds.shadows.from, "source");
  assert.equal(ds.spacing.from, "default");
  assert.equal(ds.fonts.display.from, "default");
  assert.deepEqual([ds.principles.dos.length, ds.principles.donts.length], [1, 1]);
});

test("malformed or empty input never throws and is reported", () => {
  const bad = parseDesignSystem("---\ncolors: [unclosed\n  : :\n---\n# Broken", { id: "x/broken" });
  assert.ok(bad.warnings.some((w) => /valid YAML/.test(w)));
  const empty = parseDesignSystem("", { id: "x/empty" });
  assert.ok(empty.warnings.length > 0);
  assert.equal(assess(empty).ok, false);
  assert.equal(parseDesignSystem(undefined as unknown as string, { id: "x/undef" }).name, "undef");
});

test("hostile values cannot reach the CSS or HTML unescaped", () => {
  const evil = `---
name: "</title><script>alert(1)</script>"
description: "<img src=x onerror=alert(1)>"
colors:
  primary: "#533afd"
  canvas: "#ffffff"
  ink: "#000000"
typography:
  body:
    fontFamily: "x; } body { background: url(//evil) } /*"
    fontSize: 16px
rounded:
  sm: "4px; } *{display:none}"
---
`;
  const pkg = generatePackage(evil, { id: "x/evil", name: "</title><script>alert(1)</script>", summary: "<img src=x onerror=alert(1)>" });
  for (const name of ["light.html", "dark.html"]) {
    const html = file(pkg, name).content;
    assert.ok(!html.includes("<script"), "no script element");
    assert.ok(!html.includes("<img"), "no injected element");
    assert.ok(!html.includes("url(//evil)"));
    assert.ok(!html.includes("display:none}"));
  }
});

test("light.html and dark.html are standalone, themed and use the source tokens", () => {
  const pkg = generatePackage(YAML_SRC, meta);
  const light = file(pkg, "light.html").content;
  const dark = file(pkg, "dark.html").content;
  for (const html of [light, dark]) {
    assert.match(html, /^<!doctype html>/i);
    assert.match(html, /<meta name="viewport"/);
    assert.ok(!/<script|<link |src="http|@import/.test(html), "no scripts or external requests");
    assert.ok(html.includes("#533afd"), "actual primary colour");
    assert.ok(html.includes("Sohne"), "actual typeface");
    assert.ok(html.includes("button-primary"), "source components shown");
  }
  assert.match(light, /data-theme="light"/);
  assert.match(dark, /data-theme="dark"/);
  assert.notEqual(light, dark);
});

test("different designs produce different output", () => {
  const a = file(generatePackage(YAML_SRC, meta), "DESIGN.md").content;
  const b = file(generatePackage(PROSE_SRC, { id: "indie/other", name: "Other", theme: "dark" }), "DESIGN.md").content;
  assert.notEqual(a, b);
  assert.ok(a.includes("#533afd") && !b.includes("#533afd"));
});

test("DESIGN.md has front matter, every required section and provenance", () => {
  const md = file(generatePackage(PROSE_SRC, { id: "indie/animejs.com", name: "animejs.com", colors: ["#252423", "#f6f4f2"], theme: "dark" }), "DESIGN.md").content;
  assert.match(md, /^---\n[\s\S]+?\n---\n/);
  for (const h of ["Design Principles", "Color Palette", "Light Theme", "Dark Theme", "Typography", "Spacing & Layout", "Borders, Radius & Shadows", "Components", "Responsive Design", "Instructions for AI Coding Tools"]) {
    assert.ok(md.includes(`## ${h}`), `section: ${h}`);
  }
  assert.match(md, /CodeRef default; the source does not define this/);
  assert.match(md, /\| derived \|/);
});

test("results are cached per source version and invalidated when the source changes", () => {
  const a = generatePackage(YAML_SRC, meta);
  assert.equal(generatePackage(YAML_SRC, meta), a);
  const changed = generatePackage(YAML_SRC.replace("#533afd", "#ff0000"), meta);
  assert.notEqual(changed, a);
  assert.notEqual(changed.system.version, a.system.version);
});

test("the package contains the five files with correct MIME types", () => {
  const pkg = generatePackage(YAML_SRC, meta);
  assert.deepEqual(pkg.files.map((f) => [f.name, f.mime]), [
    ["DESIGN.md", MIME.md], ["light.html", MIME.html], ["dark.html", MIME.html], ["tokens.json", MIME.json], ["styles.css", MIME.css],
  ]);
  assert.doesNotThrow(() => JSON.parse(file(pkg, "tokens.json").content));
});

test("zip is a valid archive with every file and correct CRCs", () => {
  const pkg = generatePackage(YAML_SRC, meta);
  const zip = zipPackage(pkg);
  const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
  assert.equal(view.getUint32(zip.length - 22, true), 0x06054b50, "end-of-central-directory");
  assert.equal(view.getUint16(zip.length - 12, true), pkg.files.length);
  let pos = view.getUint32(zip.length - 6, true);
  const seen: string[] = [];
  for (let i = 0; i < pkg.files.length; i++) {
    assert.equal(view.getUint32(pos, true), 0x02014b50);
    const crc = view.getUint32(pos + 16, true);
    const size = view.getUint32(pos + 24, true);
    const nameLen = view.getUint16(pos + 28, true);
    const localAt = view.getUint32(pos + 42, true);
    seen.push(new TextDecoder().decode(zip.subarray(pos + 46, pos + 46 + nameLen)));
    const dataAt = localAt + 30 + view.getUint16(localAt + 26, true);
    assert.equal(crc32(zip.subarray(dataAt, dataAt + size)), crc);
    pos += 46 + nameLen;
  }
  assert.deepEqual(seen, pkg.files.map((f) => `acme/${f.name}`));
  assert.equal(crc32(new TextEncoder().encode("123456789")), 0xcbf43926);
});

test("download names are sanitised", () => {
  assert.equal(sanitizeFilename("../../etc/passwd"), "etc-passwd");
  assert.equal(sanitizeFilename("My Brand™ <b>.com"), "My-BrandTM-b.com");
  assert.equal(sanitizeFilename("///"), "design");
  const pkg = generatePackage(YAML_SRC, { ...meta, id: "web/linear.app" });
  assert.equal(downloadName(pkg, "DESIGN.md"), "DESIGN.md");
  assert.equal(downloadName(pkg, "light.html"), "linear-app-light.html");
  assert.equal(zipName(pkg), "linear-app-design-system.zip");
});
