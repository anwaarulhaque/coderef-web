// The cdn.coderef.xyz bucket is the home of the site's data files; they are not kept in git. The build reads
// them over https://cdn.coderef.xyz (src/lib/cdn.ts), so this script is only needed to change them:
//
//   node scripts/cdn.mjs pull      -> download data/ and public/design-md/files to edit them (needs AWS credentials)
//   node scripts/cdn.mjs upload    -> stage ./cdn, then `aws s3 sync ./cdn s3://$CDN_BUCKET` (default cdn.coderef.xyz);
//                                     adds and updates only, never deletes from the bucket
//   node scripts/cdn.mjs clean     -> delete the local copies again
//
// After changing data: pull, edit, upload, `npm run build` (reads the new data), upload again (refreshes the
// two search indexes from out/; the GitHub deploy also does this).
//
// ./cdn mirrors the bucket:
//   data/**/*.json, data/**/*.md         the source data the site is built from (sheets, quickref, catalog, …)
//   search-index.json                    global search index        (from out/)
//   design-md/index.json                 DESIGN.md library index    (from out/)
//   design-md/files/<id>/DESIGN*.md      raw design files           (from public/)
//   data/bundle/*.json                   generated: every sheet, every quick reference, CJK counts per design,
//                                        so the build fetches a few files instead of listing folders
//   design-md/shots/<id>/{thumb,full}.webp  site screenshots        (uploaded straight from public/, when present)
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const OUT = path.resolve("cdn");
const BUCKET = process.env.CDN_BUCKET ?? "cdn.coderef.xyz";

function copyTree(from, to, keep) {
  if (!fs.existsSync(from)) return 0;
  let n = 0;
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dest = path.join(to, entry.name);
    if (entry.isDirectory()) n += copyTree(src, dest, keep);
    else if (keep(entry.name)) {
      fs.mkdirSync(to, { recursive: true });
      fs.copyFileSync(src, dest);
      n++;
    }
  }
  return n;
}

// Local folder <- bucket prefix.
const MIRRORS = [
  ["data", "data"],
  ["public/design-md/files", "design-md/files"],
];

/** Only fills in what is missing, so local edits that are not uploaded yet are never overwritten. */
function pull() {
  for (const [dir, prefix] of MIRRORS) {
    if (fs.existsSync(dir) && fs.readdirSync(dir).length) continue;
    console.log(`Downloading s3://${BUCKET}/${prefix} -> ${dir}`);
    aws("s3", "sync", `s3://${BUCKET}/${prefix}`, dir, "--only-show-errors");
  }
}

function clean() {
  for (const [dir] of MIRRORS) fs.rmSync(dir, { recursive: true, force: true });
  console.log(`Deleted ${MIRRORS.map(([dir]) => dir).join(", ")} (the bucket keeps them; "pull" brings them back)`);
}

function stage() {
  for (const [dir] of MIRRORS) {
    if (!fs.existsSync(dir) || !fs.readdirSync(dir).length) throw new Error(`${dir} is empty; run "node scripts/cdn.mjs pull" first`);
  }
  fs.rmSync(OUT, { recursive: true, force: true });
  const data = copyTree("data", path.join(OUT, "data"), (f) => /\.(json|md)$/.test(f));
  const files = copyTree("public/design-md/files", path.join(OUT, "design-md/files"), (f) => f.endsWith(".md"));
  writeBundles();
  const indexes = INDEXES.filter(([from]) => fs.existsSync(from));
  for (const [from, to] of indexes) fs.copyFileSync(from, path.join(OUT, to));
  console.log(`Staged ${data} data files, ${files} DESIGN.md files, bundles and ${indexes.length} indexes in ${OUT}`);
  return indexes.length === INDEXES.length;
}

// Built by `npm run build`, served to the browser.
const INDEXES = [
  ["out/search-index.json", "search-index.json"],
  ["out/design-md/index.json", "design-md/index.json"],
];

// Same pattern as isNonEnglish() in src/lib/design-md.ts.
const CJK = /[぀-ヿ㐀-鿿가-힯豈-﫿]/g;

function writeBundles() {
  const dir = path.join(OUT, "data/bundle");
  fs.mkdirSync(dir, { recursive: true });
  // Sheets keep their file name so the build can check it matches the slug.
  const all = (sub, tag) =>
    fs
      .readdirSync(path.join("data", sub))
      .filter((f) => f.endsWith(".json"))
      .sort()
      .map((f) => ({ ...(tag && { file: f }), ...JSON.parse(fs.readFileSync(path.join("data", sub, f), "utf8")) }));
  fs.writeFileSync(path.join(dir, "sheets.json"), JSON.stringify(all("sheets", true)));
  fs.writeFileSync(path.join(dir, "quickref.json"), JSON.stringify(all("quickref", false)));
  const catalog = JSON.parse(fs.readFileSync("data/design-md/catalog.json", "utf8"));
  const cjk = {};
  for (const d of catalog) {
    const file = path.join("public/design-md/files", d.id, "DESIGN.md");
    const n = fs.existsSync(file) ? (fs.readFileSync(file, "utf8").match(CJK)?.length ?? 0) : 0;
    if (n) cjk[d.id] = n;
  }
  fs.writeFileSync(path.join(dir, "design-cjk.json"), JSON.stringify(cjk));
}

const aws = (...args) => execFileSync("aws", args, { stdio: "inherit" });

function upload() {
  const withIndexes = stage();
  // Two passes so each type gets the right Content-Type; nothing is content-hashed, so caching stays short.
  // Never --delete: the bucket is the only copy, and a partial local folder must not remove anything from it.
  // Without a build in out/, the indexes are left alone in the bucket.
  const keep = withIndexes ? [] : INDEXES.flatMap(([, to]) => ["--exclude", to]);
  const common = ["s3", "sync", OUT, `s3://${BUCKET}`, "--exclude", "*"];
  aws(...common, "--include", "*.json", ...keep, "--content-type", "application/json; charset=utf-8", "--cache-control", "public, max-age=300");
  aws(...common, "--include", "*.md", "--content-type", "text/markdown; charset=utf-8", "--cache-control", "public, max-age=3600");
  // Screenshots are only shown in the browser, never read by the build, so nothing pulls them back. New captures
  // are uploaded from public/design-md/shots without --delete, and the folder can be removed afterwards.
  const shots = "public/design-md/shots";
  if (fs.existsSync(shots)) {
    aws("s3", "sync", shots, `s3://${BUCKET}/design-md/shots`, "--content-type", "image/webp", "--cache-control", "public, max-age=86400");
  }
  if (process.env.CDN_DISTRIBUTION_ID) {
    aws("cloudfront", "create-invalidation", "--distribution-id", process.env.CDN_DISTRIBUTION_ID, "--paths", "/*");
  }
}

const cmd = process.argv[2];
if (cmd === "pull") pull();
else if (cmd === "clean") clean();
else if (cmd === "upload") upload();
else {
  console.error("usage: node scripts/cdn.mjs pull|upload|clean");
  process.exit(1);
}
