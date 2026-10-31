// Dodo product ids live in the dodo_products table (kept in sync by `npm run dodo:setup`); dodo-products.json is the
// fallback. Refreshes config.dodo.products at most once a minute, so planForProduct stays synchronous.
import { config } from "./config.ts";
import { db } from "./db.ts";
import type { PlanId } from "../lib/plans.ts";
import type { StartPlanId } from "../lib/start-plans.ts";

const TTL_MS = 60_000;
let loadedAt = 0;

export async function refreshProducts(): Promise<void> {
  if (Date.now() - loadedAt < TTL_MS) return;
  loadedAt = Date.now();
  try {
    const rows = await db()`select plan, product_id from dodo_products where mode = ${config.dodo.mode}`;
    for (const r of rows as { plan: PlanId | StartPlanId; product_id: string }[]) {
      if (r.plan in config.dodo.startProducts) config.dodo.startProducts[r.plan as StartPlanId] = r.product_id;
      else config.dodo.products[r.plan as PlanId] = r.product_id;
    }
  } catch (e) {
    console.error("dodo_products read failed, using dodo-products.json", e);
  }
}
