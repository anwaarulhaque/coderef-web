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
