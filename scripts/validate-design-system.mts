// Bulk-validates the whole DESIGN.md library against the design-system generator and reports files that cannot be
// parsed or lack enough design information. Read-only: nothing is written and no source file is modified.
//   npm run design-system:validate            every hosted design
//   npm run design-system:validate -- --limit 200
//   npm run design-system:validate -- --json  machine-readable report on stdout
import { generatePackage, file } from "../src/lib/design-system/index.ts";

const CDN = (process.env.NEXT_PUBLIC_CDN_URL || "https://cdn.coderef.xyz").replace(/\/+$/, "");
const args = process.argv.slice(2);
const limit = Number(args[args.indexOf("--limit") + 1]) || Infinity;
const asJson = args.includes("--json");

type Entry = { id: string; name: string; summary: string; colors: string[]; fonts: string[]; theme: "light" | "dark"; files: string[]; external?: unknown };
const catalog: Entry[] = await (await fetch(`${CDN}/data/design-md/catalog.json`)).json();
const hosted = catalog.filter((d) => !d.external && d.files?.includes("DESIGN.md")).slice(0, limit);

const failed: { id: string; reason: string }[] = [];
const insufficient: { id: string; reason: string }[] = [];
const warned: { id: string; warnings: string[] }[] = [];
let ok = 0;
const shapes = { yaml: 0, prose: 0 };

async function check(d: Entry) {
  try {
    const res = await fetch(`${CDN}/design-md/files/${d.id}/DESIGN.md`);
    if (!res.ok) return failed.push({ id: d.id, reason: `HTTP ${res.status}` });
    const text = await res.text();
    const pkg = generatePackage(text, { id: d.id, name: d.name, summary: d.summary, colors: d.colors, fonts: d.fonts, theme: d.theme });
    // The generated files must themselves be well-formed.
    const md = file(pkg, "DESIGN.md").content;
    if (!/^---\n[\s\S]+?\n---\n/.test(md) || !file(pkg, "light.html").content.startsWith("<!doctype html>")) return failed.push({ id: d.id, reason: "generated output is malformed" });
    JSON.parse(file(pkg, "tokens.json").content);
    shapes[/^---\r?\n/.test(text) ? "yaml" : "prose"]++;
    if (!pkg.assessment.ok) insufficient.push({ id: d.id, reason: pkg.assessment.reason! });
    else ok++;
    if (pkg.system.warnings.length) warned.push({ id: d.id, warnings: pkg.system.warnings });
  } catch (e) {
    failed.push({ id: d.id, reason: e instanceof Error ? e.message : String(e) });
  }
}

// A small worker pool keeps the CDN happy.
const queue = [...hosted];
await Promise.all(Array.from({ length: 12 }, async () => { for (let d; (d = queue.shift()); ) await check(d); }));

const report = { checked: hosted.length, ok, shapes, insufficient, failed, warned };
if (asJson) console.log(JSON.stringify(report, null, 2));
else {
  console.log(`Checked ${hosted.length} designs: ${ok} ok · ${insufficient.length} lacking design information · ${failed.length} failed · ${warned.length} with warnings`);
  console.log(`Source shapes: ${shapes.yaml} with YAML tokens, ${shapes.prose} prose-only`);
  for (const f of failed.slice(0, 40)) console.log(`  FAILED        ${f.id}: ${f.reason}`);
  for (const f of insufficient.slice(0, 40)) console.log(`  INSUFFICIENT  ${f.id}: ${f.reason}`);
  for (const f of warned.slice(0, 15)) console.log(`  warning       ${f.id}: ${f.warnings.join("; ")}`);
}
process.exitCode = failed.length ? 1 : 0;
