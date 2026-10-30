// End-to-end check of the API against the real database and SES (mailbox simulator, nothing is delivered).
// Signs up a throwaway user, exercises every route, simulates Dodo webhooks, then deletes the user.
//   npm run api:smoke
import { createHmac } from "node:crypto";
import { parseCookies, type Req } from "../src/server/http.ts";

process.env.DEV_LOG_CODES = "1";
process.env.SITE_URL ??= "http://localhost:3000";
const secret = `whsec_${Buffer.from("smoke-test-key-" + Date.now()).toString("base64")}`;
process.env.DODO_WEBHOOK_SECRET = secret;
const { handle } = await import("../src/server/router.ts");
const { db } = await import("../src/server/db.ts");

const EMAIL = "success@simulator.amazonses.com";
let cookieJar = "";
let lastCode = "";
const log = console.log;
console.log = (...a: unknown[]) => {
  const m = String(a[0]).match(/^\[dev\] code for .*: (\d{6})$/);
  if (m) lastCode = m[1];
  else log(...a);
};

async function call(method: string, path: string, body?: unknown, headers: Record<string, string> = {}) {
  const raw = body === undefined ? "" : typeof body === "string" ? body : JSON.stringify(body);
  const req: Req = {
    method, path, query: new URLSearchParams(path.split("?")[1] ?? ""), body: raw, ip: "smoke",
    headers: { "content-type": "application/json", ...headers }, cookies: parseCookies(cookieJar),
  };
  req.path = path.split("?")[0];
  const res = await handle(req);
  for (const c of res.cookies ?? []) cookieJar = c.split(";")[0];
  const isJson = res.headers?.["content-type"]?.startsWith("application/json");
  return { status: res.status, json: isJson ? JSON.parse(res.body || "null") : null, res };
}

let failures = 0;
const check = (label: string, ok: boolean, detail?: unknown) => {
  log(`${ok ? "✓" : "✗"} ${label}${ok ? "" : ` — ${JSON.stringify(detail)}`}`);
  if (!ok) failures++;
};

const webhook = async (type: string, data: Record<string, unknown>) => {
  const body = JSON.stringify({ business_id: "bus_test", type, timestamp: new Date().toISOString(), data });
  const id = `msg_${Math.random().toString(36).slice(2)}`;
  const ts = String(Math.floor(Date.now() / 1000));
  const sig = createHmac("sha256", Buffer.from(secret.slice(6), "base64")).update(`${id}.${ts}.${body}`).digest("base64");
  return call("POST", "/webhooks/dodo", body, { "webhook-id": id, "webhook-timestamp": ts, "webhook-signature": `v1,${sig}` });
};

try {
  await db()`delete from users where email = ${EMAIL}`;
  await db()`delete from rate_limits where key like ${"%" + EMAIL + "%"} or key like '%smoke%'`;

  let r = await call("POST", "/auth/request-code", { email: EMAIL });
  check("request code (SES send)", r.status === 200 && r.json.isNewAccount === true && /^\d{6}$/.test(lastCode), r.json);
  r = await call("POST", "/auth/verify", { email: EMAIL, code: lastCode === "000000" ? "111111" : "000000" });
  check("wrong code is refused", r.status === 400, r.json);
  r = await call("POST", "/auth/verify", { email: EMAIL, code: lastCode });
  check("right code signs up a verified account", r.status === 200 && r.json.created === true && !!cookieJar, r.json);
  r = await call("POST", "/auth/verify", { email: EMAIL, code: lastCode });
  check("a code works only once", r.status === 400, r.json);

  r = await call("GET", "/me");
  check("/me returns the user (free)", r.json.user?.email === EMAIL && r.json.user.pro === false && r.json.usage.limit === 3, r.json);

  const ids: string[] = [];
  for (let i = 1; i <= 3; i++) {
    r = await call("POST", "/items", { kind: "regex", title: `r${i}`, data: { pattern: "a+", flags: "g" } });
    ids.push(r.json.item?.id);
  }
  check("free account saves 3 items", ids.every(Boolean), ids);
  r = await call("POST", "/items", { kind: "palette", title: "p", data: {} });
  check("4th item hits the free limit", r.status === 403 && r.json.error === "limit_reached", r.json);
  r = await call("POST", "/items", { kind: "favorite", title: "web/stripe", data: { id: "web/stripe", name: "Stripe" } });
  check("favourites don't count against the limit", r.status === 201, r.json);
  r = await call("GET", `/items/${ids[0]}`);
  check("load an item with its data", r.json.item?.data?.pattern === "a+", r.json);
  r = await call("PUT", `/items/${ids[0]}`, { title: "renamed", data: { pattern: "b+" } });
  check("update an item", r.json.item?.title === "renamed" && r.json.item.data.pattern === "b+", r.json);
  r = await call("POST", "/items", { kind: "nope", title: "x", data: {} });
  check("unknown kinds are refused", r.status === 400, r.json);
  r = await call("POST", `/items/${ids[0]}/share`, {});
  check("share links need Pro", r.status === 402, r.json);
  r = await call("POST", "/exports/design", { id: "web/stripe", format: "tailwind" });
  check("exports need Pro", r.status === 402, r.json);

  const saved = cookieJar;
  cookieJar = "";
  r = await call("GET", `/items/${ids[0]}`);
  check("signed-out requests are refused", r.status === 401, r.json);
  cookieJar = saved;

  // Payments: a bad signature, then a subscription that grants Pro.
  r = await call("POST", "/webhooks/dodo", "{}", { "webhook-id": "x", "webhook-timestamp": String(Math.floor(Date.now() / 1000)), "webhook-signature": "v1,AAAA" });
  check("webhook with a bad signature is refused", r.status === 401, r.json);
  const [u] = await db()`select id from users where email = ${EMAIL}`;
  const next = new Date(Date.now() + 30 * 86400_000).toISOString();
  r = await webhook("subscription.active", { payload_type: "Subscription", subscription_id: "sub_smoke", status: "active", next_billing_date: next, customer: { customer_id: "cus_smoke", email: EMAIL }, metadata: { user_id: u.id, plan: "monthly" } });
  check("subscription.active webhook is applied", r.status === 200 && /active/.test(r.json.result), r.json);
  r = await call("GET", "/me");
  check("user is now Pro (monthly)", r.json.user?.pro === true && r.json.user.plan === "monthly" && r.json.user.billing === true && r.json.usage.limit === 500, r.json);

  r = await call("POST", `/items/${ids[0]}/share`, {});
  const shareId = r.json.item?.shareId;
  check("Pro can create a share link", !!shareId, r.json);
  cookieJar = "";
  r = await call("GET", `/share/${shareId}`);
  check("share link is public", r.status === 200 && r.json.data?.pattern === "b+" && !!r.res.headers?.["cache-control"]?.includes("public"), r.json);
  cookieJar = saved;
  r = await call("DELETE", `/items/${ids[0]}/share`);
  r = await call("GET", `/share/${shareId}`);
  check("turning sharing off kills the link", r.status === 404, r.json);

  r = await call("POST", "/exports/design", { id: "web/stripe", format: "shadcn" });
  check("Pro export: shadcn theme", r.status === 200 && !!r.res.body?.includes("--primary:") && !!r.res.headers?.["content-disposition"]?.includes("stripe-shadcn-theme.css"), r.res.headers);
  r = await call("POST", "/exports/design", { id: "web/stripe", format: "zip" });
  const zip = Buffer.from(r.res.body ?? "", "base64");
  check("Pro export: complete ZIP", r.status === 200 && zip.readUInt32LE(0) === 0x04034b50 && zip.length > 5000, { status: r.status, bytes: zip.length });
  r = await call("POST", "/exports/collection", { collection: "terminal" });
  const bulk = Buffer.from(r.res.body ?? "", "base64");
  check("Pro export: bulk collection ZIP", r.status === 200 && bulk.readUInt32LE(0) === 0x04034b50, { status: r.status, bytes: bulk.length });
  log(`  (bulk terminal ZIP: ${(bulk.length / 1024).toFixed(0)} KB, base64 response ${(r.res.body!.length / 1024).toFixed(0)} KB)`);

  r = await webhook("subscription.expired", { subscription_id: "sub_smoke", status: "expired", customer: { email: EMAIL } });
  r = await call("GET", "/me");
  check("expired subscription removes Pro", r.json.user?.pro === false, r.json);
  r = await webhook("payment.succeeded", { payload_type: "Payment", payment_id: "pay_smoke", customer: { email: EMAIL }, metadata: { user_id: u.id, plan: "lifetime" } });
  r = await call("GET", "/me");
  check("lifetime payment grants Pro forever", r.json.user?.pro === true && r.json.user.plan === "lifetime", r.json);
  const dup = await webhook("refund.succeeded", { payment_id: "pay_smoke" });
  r = await call("GET", "/me");
  check("refund revokes lifetime", dup.status === 200 && r.json.user?.pro === false, r.json);

  r = await call("DELETE", "/me", { confirm: "wrong@example.com" });
  check("account deletion needs the email typed", r.status === 400, r.json);
  r = await call("DELETE", "/me", { confirm: EMAIL });
  check("account deletion works", r.status === 200, r.json);
  const left = await db()`select (select count(*) from users where email = ${EMAIL})::int as u, (select count(*) from items where user_id = ${u.id})::int as i`;
  check("user and their items are gone", left[0].u === 0 && left[0].i === 0, left[0]);
} finally {
  await db()`delete from users where email = ${EMAIL}`;
  await db()`delete from webhook_events where payload->'data'->>'subscription_id' = 'sub_smoke' or payload->'data'->>'payment_id' = 'pay_smoke'`;
  await db()`delete from rate_limits where key like '%smoke%' or key like ${"%" + EMAIL + "%"}`;
}
log(failures ? `\n${failures} check(s) failed` : "\nAll checks passed");
process.exitCode = failures ? 1 : 0;
