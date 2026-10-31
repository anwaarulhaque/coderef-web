// API unit tests that need no database or network: npm test
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { test } from "node:test";
import { inflateRawSync, deflateRawSync } from "node:zlib";
import { verifyWebhook } from "./dodo.ts";
import { isPro } from "./db.ts";
import { parseCookies, readJson, HttpError, cookie } from "./http.ts";
import { normalizeEmail } from "./auth.ts";
import { dtcgTokens, frameworkFiles, generatePackage, shadcnTheme, tailwindV3, zipPackage } from "../lib/design-system/index.ts";

const secret = `whsec_${Buffer.from("test-signing-key-0123456789").toString("base64")}`;
const sign = (id: string, ts: string, body: string) => createHmac("sha256", Buffer.from(secret.slice(6), "base64")).update(`${id}.${ts}.${body}`).digest("base64");

test("webhook signatures follow Standard Webhooks", () => {
  const body = '{"type":"payment.succeeded","data":{}}';
  const ts = String(Math.floor(Date.now() / 1000));
  const h = { "webhook-id": "msg_1", "webhook-timestamp": ts, "webhook-signature": `v1,${sign("msg_1", ts, body)}` };
  assert.equal(verifyWebhook(secret, h, body), true);
  assert.equal(verifyWebhook(secret, { ...h, "webhook-signature": `v1,AAAA v1,${sign("msg_1", ts, body)}` }, body), true, "any of several signatures");
  assert.equal(verifyWebhook(secret, h, body + " "), false, "tampered body");
  assert.equal(verifyWebhook(secret, { ...h, "webhook-id": "msg_2" }, body), false, "wrong id");
  assert.equal(verifyWebhook(secret, h, body, Date.now() + 10 * 60_000), false, "stale timestamp");
  assert.equal(verifyWebhook("", h, body), false, "no secret configured");
  assert.equal(verifyWebhook(secret, { ...h, "webhook-signature": "v2,abc" }, body), false);
});

test("Pro access: lifetime, active period and expiry", () => {
  const now = Date.parse("2026-10-30T00:00:00Z");
  assert.equal(isPro({ lifetime: true, pro_until: null }, now), true);
  assert.equal(isPro({ lifetime: false, pro_until: "2026-11-30T00:00:00Z" }, now), true);
  assert.equal(isPro({ lifetime: false, pro_until: "2026-10-29T00:00:00Z" }, now), false);
  assert.equal(isPro({ lifetime: false, pro_until: null }, now), false);
});

test("cookies, JSON bodies and emails are parsed strictly", () => {
  assert.deepEqual(parseCookies("a=1; cr_session=abc%20d", ["b=2"]), { a: "1", cr_session: "abc d", b: "2" });
  const req = (ct: string, body: string) => ({ method: "POST", path: "/", query: new URLSearchParams(), headers: { "content-type": ct }, cookies: {}, body, ip: "x" });
  assert.deepEqual(readJson(req("application/json", '{"a":1}')), { a: 1 });
  assert.throws(() => readJson(req("text/plain", "{}")), (e: HttpError) => e.status === 415, "forms cannot post as JSON");
  assert.throws(() => readJson(req("application/json", "[1]")), (e: HttpError) => e.status === 400);
  assert.equal(normalizeEmail("  Me@Example.COM "), "me@example.com");
  assert.throws(() => normalizeEmail("nope"), (e: HttpError) => e.status === 400);
  assert.match(cookie("cr_session", "t", { maxAge: 60, secure: true }), /HttpOnly; SameSite=Lax; Max-Age=60; Secure$/);
});

const SRC = `---
name: Acme
colors:
  primary: "#533afd"
  canvas: "#ffffff"
  ink: "#0d253d"
typography:
  body-md:
    fontFamily: "Inter, sans-serif"
    fontSize: 16px
rounded:
  md: 8px
---
# Acme
`;

test("framework exports use the design's real tokens", () => {
  const ds = generatePackage(SRC, { id: "web/acme", name: "Acme" }).system;
  assert.match(tailwindV3(ds), /module\.exports/);
  assert.match(tailwindV3(ds), /"primary": "var\(--ds-primary\)"/);
  assert.match(shadcnTheme(ds), /--primary: #533afd;/);
  assert.match(shadcnTheme(ds), /\.dark \{/);
  const dtcg = JSON.parse(dtcgTokens(ds));
  assert.equal(dtcg.color.light.primary.$value, "#533afd");
  assert.equal(dtcg.color.light.primary.$extensions["xyz.coderef"].provenance, "source");
  assert.equal(dtcg.color.dark.background.$extensions["xyz.coderef"].provenance, "derived");
});

test("the Pro ZIP is deflated, complete and round-trips", () => {
  const pkg = generatePackage(SRC, { id: "web/acme", name: "Acme" });
  const fw = frameworkFiles(pkg.system);
  const zip = zipPackage(pkg, fw, (d) => new Uint8Array(deflateRawSync(d)));
  const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
  const count = view.getUint16(zip.length - 12, true);
  assert.equal(count, pkg.files.length + fw.length);
  let pos = view.getUint32(zip.length - 6, true);
  const names: string[] = [];
  for (let i = 0; i < count; i++) {
    assert.equal(view.getUint16(pos + 10, true), 8, "deflated");
    const csize = view.getUint32(pos + 20, true);
    const size = view.getUint32(pos + 24, true);
    const nameLen = view.getUint16(pos + 28, true);
    const local = view.getUint32(pos + 42, true);
    const name = new TextDecoder().decode(zip.subarray(pos + 46, pos + 46 + nameLen));
    names.push(name);
    const at = local + 30 + view.getUint16(local + 26, true);
    const original = [...pkg.files, ...fw].find((f) => `acme/${f.name}` === name)!.content;
    const out = inflateRawSync(zip.subarray(at, at + csize));
    assert.equal(out.length, size);
    assert.equal(out.toString("utf8"), original);
    pos += 46 + nameLen;
  }
  assert.ok(names.includes("acme/tailwind.config.js") && names.includes("acme/tokens.dtcg.json"));
});
test("Figma (Tokens Studio) export: core/light/dark sets, themes as modes, Figma-safe values", async () => {
  const { tokensStudio, parseShadow, figmaFamily } = await import("../lib/design-system/index.ts");
  const src = `---
name: Acme
colors:
  primary: "#533afd"
  canvas: "#ffffff"
  ink: "#0d253d"
typography:
  display-xl:
    fontFamily: "sohne-var, 'SF Pro Display', system-ui, sans-serif"
    fontSize: 48px
    fontWeight: 300
    lineHeight: 1.1
rounded:
  md: 8px
spacing:
  sm: 8px
---
# Acme
box-shadow: rgba(0,0,0,0.1) 0px 4px 12px 0px, inset 0 1px 0 #ffffff
`;
  const { generatePackage } = await import("../lib/design-system/index.ts");
  const ds = generatePackage(src, { id: "web/acme-fig", name: "Acme" }).system;
  const f = JSON.parse(tokensStudio(ds));
  assert.deepEqual(f.$metadata.tokenSetOrder, ["core", "light", "dark"]);
  assert.deepEqual(f.$themes.map((t: { group: string; name: string }) => `${t.group}/${t.name}`), ["Core/Default", "Mode/Light", "Mode/Dark"]);
  assert.equal(f.$themes[1].selectedTokenSets.light, "enabled");
  assert.equal(f.$themes[1].selectedTokenSets.core, "source");
  assert.equal(f.light.color.primary.$value, "#533afd");
  assert.equal(f.dark.color.background.$type, "color");
  assert.deepEqual(Object.keys(f.light.color), Object.keys(f.dark.color), "same names in both modes");
  assert.equal(f.core.radius.md.$type, "borderRadius");
  assert.equal(f.core.typography["display-xl"].$value.fontFamily, "sohne-var", "one family, not a stack");
  assert.equal(f.core.typography["display-xl"].$value.lineHeight, "110%", "unitless → percent");
  assert.deepEqual(f.core.shadow.sm.$value, { x: "0px", y: "4px", blur: "12px", spread: "0px", color: "rgba(0,0,0,0.1)", type: "dropShadow" }, "shadow becomes a Figma effect");

  const layers = parseShadow("rgba(0,0,0,0.1) 0px 4px 12px 0px, inset 0 1px 0 #ffffff");
  assert.equal(layers?.length, 2, "multi-layer shadow");
  assert.deepEqual(layers?.[1], { x: "0px", y: "1px", blur: "0px", spread: "0px", color: "#ffffff", inset: true });

  assert.equal(parseShadow("none"), null);
  assert.equal(parseShadow("0 0 nonsense"), null);
  assert.deepEqual(parseShadow("2px 2px #000"), [{ x: "2px", y: "2px", blur: "0px", spread: "0px", color: "#000", inset: false }]);
  assert.equal(figmaFamily("ui-sans-serif, system-ui, sans-serif"), "Inter");
  assert.equal(figmaFamily("'Geist Mono', monospace", true), "Geist Mono");
});

// ---- CodeRef Start ----

test("Start tiers: best active plan wins, ended plans don't count, and Pro is separate", async () => {
  const { tierFromPlans } = await import("./start-entitlements.ts");
  const now = Date.parse("2026-10-30T00:00:00Z");
  const future = "2026-12-01T00:00:00Z";
  const past = "2026-10-01T00:00:00Z";
  assert.equal(tierFromPlans([], now), "free");
  assert.equal(tierFromPlans([{ plan: "start_pro_yearly", pro_until: future }], now), "pro");
  assert.equal(tierFromPlans([{ plan: "start_pro_yearly", pro_until: future }, { plan: "start_team_monthly", pro_until: future }], now), "team");
  assert.equal(tierFromPlans([{ plan: "start_team_monthly", pro_until: past }], now), "free", "expired");
  assert.equal(tierFromPlans([{ plan: "start_enterprise", pro_until: future }, { plan: "start_pro_yearly", pro_until: future }], now), "enterprise");
  assert.equal(tierFromPlans([{ plan: "yearly", pro_until: future }], now), "free", "a CodeRef Pro plan isn't a Start plan");
  const { canUseWidget } = await import("../lib/start-plans.ts");
  assert.equal(canUseWidget("free", "bookmarks"), true);
  assert.equal(canUseWidget("free", "kanban"), false);
  assert.equal(canUseWidget("pro", "kanban"), true);
  assert.equal(canUseWidget("pro", "announcement"), false);
  assert.equal(canUseWidget("team", "announcement"), true);
  assert.equal(canUseWidget("enterprise", "nonsense"), false);
});

test("Start feeds: RSS, Atom and ICS parse without a dependency", async () => {
  const { parseFeed, parseIcs } = await import("./start-feeds.ts");
  const rss = parseFeed(`<?xml version="1.0"?><rss><channel><title>News &amp; more</title>
    <item><title><![CDATA[First <b>post</b>]]></title><link>https://example.com/1</link><pubDate>Tue, 03 Nov 2026 09:00:00 GMT</pubDate><description>&lt;p&gt;Hello&lt;/p&gt; world</description></item>
    <item><title>No link</title><guid>https://example.com/2</guid></item></channel></rss>`);
  assert.equal(rss.title, "News & more");
  assert.equal(rss.items.length, 2);
  assert.equal(rss.items[0].title, "First post");
  assert.equal(rss.items[0].url, "https://example.com/1");
  assert.equal(rss.items[0].date, "2026-11-03T09:00:00.000Z");
  assert.equal(rss.items[0].summary, "Hello world");
  assert.equal(rss.items[1].url, "https://example.com/2", "guid fallback");
  const atom = parseFeed(`<feed xmlns="http://www.w3.org/2005/Atom"><title>Blog</title><entry><title>A</title><link rel="alternate" href="https://b.dev/a"/><updated>2026-11-01T00:00:00Z</updated><summary>S</summary></entry></feed>`);
  assert.deepEqual(atom.items[0], { title: "A", url: "https://b.dev/a", date: "2026-11-01T00:00:00.000Z", summary: "S" });
  assert.equal(parseFeed(`<rss><item><title>x</title><link>javascript:alert(1)</link></item></rss>`).items[0].url, "", "only http(s) links");

  const ics = parseIcs("BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nSUMMARY:Stand-up\\, daily\r\nDTSTART:20261105T090000Z\r\nEND:VEVENT\r\nBEGIN:VEVENT\r\nSUMMARY:Old\r\nDTSTART:20200101T090000Z\r\nEND:VEVENT\r\nBEGIN:VEVENT\r\nSUMMARY:Holi\r\n day\r\nDTSTART;VALUE=DATE:20261104\r\nEND:VEVENT\r\nEND:VCALENDAR", Date.parse("2026-11-01T00:00:00Z"));
  assert.deepEqual(ics.map((e) => [e.title, e.allDay]), [["Holiday", true], ["Stand-up, daily", false]], "sorted, past dropped, folded lines joined");
});

test("Start feeds refuse private and local addresses (SSRF)", async () => {
  const { isPrivateAddress, publicUrl } = await import("./start-feeds.ts");
  for (const ip of ["127.0.0.1", "10.1.2.3", "172.16.0.1", "192.168.1.1", "169.254.169.254", "100.64.0.1", "0.0.0.0", "::1", "fd00::1", "fe80::1", "::ffff:127.0.0.1"]) assert.equal(isPrivateAddress(ip), true, ip);
  for (const ip of ["8.8.8.8", "1.1.1.1", "2606:4700::1111"]) assert.equal(isPrivateAddress(ip), false, ip);
  assert.throws(() => publicUrl("file:///etc/passwd"), (e: HttpError) => e.status === 400);
  assert.throws(() => publicUrl("https://user:pw@example.com/"), (e: HttpError) => e.status === 400);
  assert.throws(() => publicUrl("http://example.com:6379/"), (e: HttpError) => e.status === 400);
  assert.equal(publicUrl("https://example.com/feed").hostname, "example.com");
});

test("Start import: browser/start.me bookmark HTML and OPML", async () => {
  const { parseBookmarkHtml, parseOpml, cleanLinks } = await import("./start.ts");
  const html = `<!DOCTYPE NETSCAPE-Bookmark-file-1><DL><p>
    <DT><H3>Bookmarks bar</H3><DL><p>
      <DT><A HREF="https://github.com/" ADD_DATE="1">GitHub</A>
      <DT><H3>Docs &amp; refs</H3><DL><p>
        <DT><A HREF="https://developer.mozilla.org/">MDN</A>
        <DT><A HREF="javascript:void(0)">Bookmarklet</A>
      </DL><p>
    </DL><p>
    <DT><A HREF="https://example.com/">Loose</A>
  </DL><p>`;
  assert.deepEqual(parseBookmarkHtml(html), [
    { title: "Bookmarks bar", links: [{ url: "https://github.com/", title: "GitHub" }] },
    { title: "Bookmarks bar / Docs & refs", links: [{ url: "https://developer.mozilla.org/", title: "MDN" }] },
    { title: "Bookmarks", links: [{ url: "https://example.com/", title: "Loose" }] },
  ]);
  const opml = parseOpml(`<opml><body><outline text="Tech"><outline text="HN" xmlUrl="https://hnrss.org/frontpage"/></outline><outline text="Solo" xmlUrl="https://a.dev/rss"/></body></opml>`);
  assert.deepEqual(opml.map((g) => [g.title, g.feeds.map((f) => f.url)]), [["Tech", ["https://hnrss.org/frontpage"]], ["Feeds", ["https://a.dev/rss"]]]);
  assert.deepEqual(cleanLinks([{ url: "https://x.dev", title: "" }, { url: "ftp://x" }, "nope", { url: " https://y.dev " }]), [{ url: "https://x.dev", title: "https://x.dev" }, { url: "https://y.dev", title: "https://y.dev" }]);
});

test("Start layout: moving widgets renumbers both columns", async () => {
  const { placeWidget } = await import("../lib/start/layout.ts");
  const w = (id: string, col: number, position: number) => ({ id, col, position, type: "notes", title: id, collapsed: false, color: "", config: {}, data: {} });
  const sorted = (ws: ReturnType<typeof w>[]) => ws.map((x) => `${x.id}:${x.col}.${x.position}`).sort();
  const start = [w("a", 0, 0), w("b", 0, 1), w("c", 0, 2), w("d", 1, 0)];
  assert.deepEqual(sorted(placeWidget(start, "b", 1, 0)), ["a:0.0", "b:1.0", "c:0.1", "d:1.1"]);
  assert.deepEqual(sorted(placeWidget(start, "a", 0, 99)), ["a:0.2", "b:0.0", "c:0.1", "d:1.0"], "within a column");
  assert.equal(placeWidget(start, "zzz", 0, 0), start, "unknown id is a no-op");
});

test("Start calculator evaluates safely", async () => {
  const { calculate } = await import("../lib/start/calc.ts");
  assert.equal(calculate("(12 + 30) * 1.5"), 63);
  assert.equal(calculate("2^3^2"), 512, "right-associative power");
  assert.equal(calculate("50% * 80"), 40);
  assert.equal(calculate("sqrt(16) + -2"), 2);
  assert.equal(calculate("1/0"), null, "not finite");
  assert.equal(calculate("alert(1)"), null);
  assert.equal(calculate("constructor"), null);
  assert.equal(calculate("2 +"), null);
});

test("Start API: cross-site writes are refused unless they carry an extension token", async () => {
  const { handle } = await import("./router.ts");
  const req = (headers: Record<string, string>) => ({ method: "POST", path: "/start/pages", query: new URLSearchParams(), headers: { host: "coderef.xyz", "content-type": "application/json", ...headers }, cookies: {}, body: "{}", ip: "1.2.3.4" });
  const evil = await handle(req({ origin: "https://evil.example" }));
  assert.equal(evil.status, 403, "cookie-authenticated cross-site POST is refused");
  const ext = await handle(req({ origin: "chrome-extension://abcdefghijklmnop", authorization: `Bearer crt_${"x".repeat(43)}` }));
  assert.notEqual(ext.status, 403, "extension token requests get past the origin check");
  const { bearerToken } = await import("./auth.ts");
  assert.equal(bearerToken(req({ authorization: "Bearer crt_short" })), null);
  assert.equal(bearerToken(req({ authorization: `Bearer crt_${"a".repeat(30)}` })), `crt_${"a".repeat(30)}`);
});
