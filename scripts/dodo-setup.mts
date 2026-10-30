// Creates the three Pro products in Dodo Payments for the current PAYMENT_MODE and records their ids in
// src/server/dodo-products.json (ids are not secret) and in the dodo_products table, which the app reads. Safe to re-run:
// plans that already have an id are skipped, and every id is (re)synced to the database.
//   npm run dodo:setup
import { readFileSync, writeFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
import { PLANS, type PlanId } from "../src/lib/plans.ts";

const mode = (process.env.PAYMENT_MODE ?? "TEST").toLowerCase() === "live" ? "live" : "test";
const key = process.env.DODO_PAYMENT_KEY;
if (!key) throw new Error("DODO_PAYMENT_KEY is not set (add it to .env)");
if (mode === "test" && !key.startsWith("dodo_test_")) console.warn("Warning: PAYMENT_MODE is TEST but the key does not start with dodo_test_");
const base = mode === "live" ? "https://live.dodopayments.com" : "https://test.dodopayments.com";
const file = new URL("../src/server/dodo-products.json", import.meta.url);
const ids = JSON.parse(readFileSync(file, "utf8")) as Record<string, Record<PlanId, string>>;

const price = (id: PlanId, cents: number) =>
  id === "lifetime"
    ? { type: "one_time_price", currency: "USD", price: cents, purchasing_power_parity: false }
    : { type: "recurring_price", currency: "USD", price: cents, purchasing_power_parity: false, payment_frequency_count: 1, payment_frequency_interval: id === "monthly" ? "Month" : "Year", // Renews until cancelled; Dodo requires a maximum period, so allow ten years.
        subscription_period_count: 10, subscription_period_interval: "Year", trial_period_days: 0 };

for (const plan of PLANS) {
  if (ids[mode]?.[plan.id]) {
    console.log(`${plan.id}: already ${ids[mode][plan.id]}`);
    continue;
  }
  const res = await fetch(`${base}/products`, {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({
      name: `CodeRef ${plan.name}`,
      description: plan.id === "lifetime" ? "CodeRef Pro forever: cloud save, share links, Design System exports and bulk downloads." : `CodeRef Pro, billed ${plan.id}.`,
      tax_category: "saas",
      price: price(plan.id, plan.cents),
      metadata: { plan: plan.id },
    }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${plan.id}: HTTP ${res.status} ${text.slice(0, 400)}`);
  const { product_id } = JSON.parse(text) as { product_id: string };
  ids[mode] = { ...ids[mode], [plan.id]: product_id };
  writeFileSync(file, JSON.stringify(ids, null, 2) + "\n");
  console.log(`${plan.id}: created ${product_id}`);
}
if (process.env.DATABASE_URL) {
  const sql = neon(process.env.DATABASE_URL);
  await sql`create table if not exists dodo_products (mode text not null, plan text not null, product_id text not null, updated_at timestamptz not null default now(), primary key (mode, plan))`;
  for (const plan of PLANS) {
    const id = ids[mode]?.[plan.id];
    if (id) await sql`insert into dodo_products (mode, plan, product_id) values (${mode}, ${plan.id}, ${id}) on conflict (mode, plan) do update set product_id = excluded.product_id, updated_at = now()`;
  }
  console.log(`Synced ${mode} product ids to the dodo_products table.`);
} else console.warn("DATABASE_URL is not set: product ids were not synced to the database.");
console.log(`Done (${mode} mode). Next: add a webhook in the Dodo dashboard → https://coderef.xyz/api/webhooks/dodo, and put its secret in DODO_WEBHOOK_SECRET.`);
