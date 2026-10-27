// Finds the live website behind each DESIGN.md so scripts/screenshot-design-md.mjs can capture it.
//
//   node scripts/design-md-sites.mjs
//
// Writes data/design-shots/sites.json: { "<design id>": "https://…" | null }.
// Existing entries are never overwritten, so hand edits stick: replace a null with the right URL,
// or set a wrong guess to null to skip it. Lives outside data/design-md, which sync-design-md wipes.
import fs from "node:fs";
import path from "node:path";

const catalog = JSON.parse(fs.readFileSync(path.resolve("data/design-md/catalog.json"), "utf8"));
const file = path.resolve("data/design-shots/sites.json");
const sites = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : {};

// Apps, terminal UIs and format examples have no website to screenshot.
const WEBSITE_COLLECTIONS = new Set(["web", "brands", "indie"]);
const DOMAIN = /\b(?:www\.)?([a-z0-9][a-z0-9-]*)\.((?:co\.|com\.|ne\.|or\.|go\.|ac\.)?[a-z]{2,10})\b/g;
// File names ("brand.json") and side domains ("brand.jobs") look like domains but are not the site.
const NOT_A_SITE = new Set(["json", "md", "css", "js", "mjs", "ts", "tsx", "jsx", "svg", "png", "jpg", "jpeg", "webp", "gif", "avif", "woff", "woff2", "ttf", "otf", "html", "htm", "yml", "yaml", "txt", "map", "jobs", "design", "blog", "help", "dev", "github", "ameba", "easycard"]);
const squash = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/** The domain mentioned most often in the file whose name matches the design's slug. */
function domainFromFile(design) {
  const md = fs.readFileSync(path.resolve("public/design-md/files", design.id, "DESIGN.md"), "utf8").toLowerCase();
  const slug = squash(design.slug);
  const counts = new Map();
  for (const [, name, tld] of md.matchAll(DOMAIN)) {
    if (squash(name) !== slug || NOT_A_SITE.has(tld)) continue;
    const host = `${name}.${tld}`;
    counts.set(host, (counts.get(host) ?? 0) + 1);
  }
  const best = [...counts].sort((a, b) => b[1] - a[1] || Number(b[0].endsWith(".com")) - Number(a[0].endsWith(".com")))[0];
  return best ? `https://${best[0]}/` : null;
}

let added = 0;
for (const d of catalog) {
  if (!WEBSITE_COLLECTIONS.has(d.collection) || d.id in sites) continue;
  // Indie sites are named after their domain ("abjt.dev").
  sites[d.id] = d.slug.includes(".") ? `https://${d.slug}/` : domainFromFile(d);
  added++;
}

const sorted = Object.fromEntries(Object.keys(sites).sort().map((k) => [k, sites[k]]));
fs.mkdirSync(path.dirname(file), { recursive: true });
fs.writeFileSync(file, `${JSON.stringify(sorted, null, 2)}\n`);

const missing = Object.values(sorted).filter((u) => !u).length;
console.log(`${added} new entries; ${Object.keys(sorted).length - missing} with a URL, ${missing} null (edit ${path.relative(".", file)} to fill them in).`);
