// Screenshots the live website behind each DESIGN.md, for the library's card and full-page previews.
//
//   node scripts/screenshot-design-md.mjs [--only brands/apple,indie/abjt.dev] [--limit 20] [--workers 4] [--force]
//
// Reads data/design-shots/sites.json (from scripts/design-md-sites.mjs) and writes
//   public/design-md/shots/<id>/thumb.webp   600×800, top of the page    (catalog cards)
//   public/design-md/shots/<id>/full.webp    1440 wide, whole page        (design page)
//   data/design-shots/shots.json             { "<id>": { "h": <full height>, "v": "<version>" } }
// Already captured designs are skipped unless --force. Uses the installed Chrome (or Edge); no browser download.
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright-core";
import sharp from "sharp";

const WIDTH = 1440;
const MAX_HEIGHT = 12000; // keeps endless feeds finite and full.webp under the format's 16383px limit
const THUMB = { width: 600, height: 800 };

const arg = (name) => {
  const i = process.argv.indexOf(`--${name}`);
  return i < 0 ? undefined : (process.argv[i + 1] ?? "");
};
const only = arg("only")?.split(",").filter(Boolean);
const limit = Number(arg("limit") ?? Infinity);
const workers = Number(arg("workers") ?? 4);
const force = process.argv.includes("--force");

const sitesFile = path.resolve("data/design-shots/sites.json");
const shotsFile = path.resolve("data/design-shots/shots.json");
const outDir = path.resolve("public/design-md/shots");
const sites = JSON.parse(fs.readFileSync(sitesFile, "utf8"));
const shots = fs.existsSync(shotsFile) ? JSON.parse(fs.readFileSync(shotsFile, "utf8")) : {};

const saveManifest = () => {
  const sorted = Object.fromEntries(Object.keys(shots).sort().map((k) => [k, shots[k]]));
  fs.writeFileSync(shotsFile, `${JSON.stringify(sorted, null, 2)}\n`);
};

const queue = Object.entries(sites)
  .filter(([id, url]) => url && (!only || only.includes(id)))
  .filter(([id]) => force || only || !shots[id] || !fs.existsSync(path.join(outDir, id, "thumb.webp")))
  .slice(0, limit);

if (!queue.length) {
  console.log("Nothing to capture.");
  process.exit(0);
}

async function launch() {
  for (const channel of ["chrome", "msedge"]) {
    try {
      return await chromium.launch({ channel });
    } catch {}
  }
  throw new Error("Neither Chrome nor Edge is installed. Install one, or run `npx playwright install chromium`.");
}

// Bot checks and error pages that would otherwise be saved as the site's screenshot.
const BLOCKED = /just a moment|attention required|access denied|are you a robot|verify you are human|captcha|403 forbidden|request blocked|pardon our interruption|application error/i;
// Below this average color spread the thumbnail is a blank page, a spinner or a one-line error.
const MIN_DETAIL = 9;

// Cookie and consent banners would cover every screenshot.
const HIDE_BANNERS = `
  #onetrust-consent-sdk, #onetrust-banner-sdk, #CybotCookiebotDialog, #usercentrics-root, #truste-consent-track,
  .cc-window, .cky-consent-container, .osano-cm-window, [id^="sp_message_container"], [class*="cookie-banner" i],
  [id*="cookie-banner" i], [class*="CookieBanner"], [class*="cookieConsent" i], [id*="cookieConsent" i],
  [aria-label*="cookie" i][role="dialog"], [aria-label*="consent" i][role="dialog"] { display: none !important; }
  html, body { overflow: visible !important; }
`;

async function capture(browser, id, url) {
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: 900 },
    deviceScaleFactor: 1,
    locale: "en-US",
    colorScheme: "light",
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  try {
    // Ads and trackers can hold back "load" indefinitely; the HTML is enough to start with.
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
    await page.waitForLoadState("load", { timeout: 15_000 }).catch(() => {});
    await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});
    const title = await page.title().catch(() => "");
    const text = await page.evaluate(() => document.body?.innerText.slice(0, 2000) ?? "").catch(() => "");
    if (BLOCKED.test(title) || BLOCKED.test(text.slice(0, 400))) throw new Error(`Blocked by a bot check ("${title}")`);
    await page.addStyleTag({ content: HIDE_BANNERS }).catch(() => {});
    // Scroll through once so lazy images and reveal-on-scroll sections render, then back to the top.
    await page.evaluate(async (max) => {
      for (let y = 0; y < Math.min(document.documentElement.scrollHeight, max); y += 700) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 120));
      }
      window.scrollTo(0, 0);
    }, MAX_HEIGHT);
    await page.waitForTimeout(1200);

    const height = Math.min(await page.evaluate(() => document.documentElement.scrollHeight), MAX_HEIGHT);
    const png = await page.screenshot({ fullPage: true, clip: { x: 0, y: 0, width: WIDTH, height }, animations: "disabled", timeout: 60_000 });

    const full = sharp(png, { limitInputPixels: false });
    const { height: h } = await full.metadata();
    // Top of the page at 3:4, like a phone-shaped card.
    const cropHeight = Math.min(h, Math.round((WIDTH * THUMB.height) / THUMB.width));
    const thumb = await full
      .clone()
      .extract({ left: 0, top: 0, width: WIDTH, height: cropHeight })
      .resize(THUMB.width, THUMB.height, { fit: "cover", position: "top" })
      .webp({ quality: 72 })
      .toBuffer();
    const { channels } = await sharp(thumb).stats();
    if (channels.slice(0, 3).reduce((sum, c) => sum + c.stdev, 0) / 3 < MIN_DETAIL) throw new Error("Blank or error page");

    const dir = path.join(outDir, id);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "thumb.webp"), thumb);
    await full.clone().webp({ quality: 68 }).toFile(path.join(dir, "full.webp"));

    shots[id] = { h, v: Date.now().toString(36) };
    saveManifest();
  } finally {
    await context.close();
  }
}

const browser = await launch();
const failed = [];
let done = 0;
console.log(`Capturing ${queue.length} site(s) with ${workers} worker(s)…`);

await Promise.all(
  Array.from({ length: Math.min(workers, queue.length) }, async () => {
    for (let job = queue.shift(); job; job = queue.shift()) {
      const [id, url] = job;
      try {
        await capture(browser, id, url);
        console.log(`✓ ${++done} ${id}  ${url}`);
      } catch (e) {
        failed.push(id);
        console.log(`✗ ${id}  ${url}  ${String(e.message ?? e).split("\n")[0]}`);
      }
    }
  }),
);

await browser.close();
console.log(`\n${done} captured, ${failed.length} failed.${failed.length ? ` Fix their URLs in ${path.relative(".", sitesFile)} or set them to null:\n  ${failed.join("\n  ")}` : ""}`);
