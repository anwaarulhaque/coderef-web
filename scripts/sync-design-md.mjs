// Copies the DESIGN.md library built by coderef-scrapper (build_site.py) into this site.
//
//   node scripts/sync-design-md.mjs [path-to-coderef-folder]   (default: ../coderef/coderef-scrapper/coderef)
//
// data/design-md/   catalog.json, THIRD_PARTY_LICENSES.md  (read at build time)
// public/design-md/files/<collection>/<slug>/DESIGN*.md               (served as raw downloads)
import fs from "node:fs";
import path from "node:path";

const src = path.resolve(process.argv[2] ?? "../coderef/coderef-scrapper/coderef");
const dataDir = path.resolve("data/design-md");
const filesDir = path.resolve("public/design-md/files");

if (!fs.existsSync(path.join(src, "catalog.json"))) {
  console.error(`No catalog.json in ${src}. Run "python build_site.py" in coderef-scrapper first.`);
  process.exit(1);
}

for (const dir of [dataDir, filesDir]) fs.rmSync(dir, { recursive: true, force: true });
fs.mkdirSync(dataDir, { recursive: true });

fs.copyFileSync(path.join(src, "catalog.json"), path.join(dataDir, "catalog.json"));
fs.copyFileSync(path.join(src, "THIRD_PARTY_LICENSES.md"), path.join(dataDir, "THIRD_PARTY_LICENSES.md"));

const catalog = JSON.parse(fs.readFileSync(path.join(src, "catalog.json"), "utf8"));
let files = 0;
for (const design of catalog) {
  if (!design.files.length) continue; // external designs are linked, not hosted
  const from = path.join(src, "designs", design.id);
  const to = path.join(filesDir, design.id);
  fs.mkdirSync(to, { recursive: true });
  for (const f of design.files) {
    fs.copyFileSync(path.join(from, f), path.join(to, f));
    files++;
  }
}
console.log(`Synced ${catalog.length} designs (${files} files) from ${src}`);
