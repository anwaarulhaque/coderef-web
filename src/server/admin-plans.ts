// Admin view of the three plans and their Dodo products, plus the same setup `npm run dodo:setup` does: create what's
// missing in Dodo, record the ids in dodo_products (which the app reads, see products.ts).
import { config } from "./config.ts";
import { db } from "./db.ts";
import { dodo } from "./dodo.ts";
import { HttpError } from "./http.ts";
import { PLANS, type PlanId } from "../lib/plans.ts";

type DodoProduct = { product_id: string; name?: string; is_recurring?: boolean; price?: number; currency?: string; price_detail?: { price?: number; currency?: string; payment_frequency_interval?: string } };

const price = (id: PlanId, cents: number) =>
  id === "lifetime"
    ? { type: "one_time_price", currency: "USD", price: cents, purchasing_power_parity: false }
    : { type: "recurring_price", currency: "USD", price: cents, purchasing_power_parity: false, payment_frequency_count: 1, payment_frequency_interval: id === "monthly" ? "Month" : "Year", subscription_period_count: 10, subscription_period_interval: "Year", trial_period_days: 0 };

async function save(plan: PlanId, productId: string) {
  await db()`insert into dodo_products (mode, plan, product_id) values (${config.dodo.mode}, ${plan}, ${productId})
    on conflict (mode, plan) do update set product_id = excluded.product_id, updated_at = now()`;
  config.dodo.products[plan] = productId;
}

async function lookup(productId: string): Promise<DodoProduct | null> {
  try {
    return await dodo<DodoProduct>("GET", `/products/${encodeURIComponent(productId)}`);
  } catch {
    return null;
  }
}

export async function planOverview() {
  const sql = db();
  const rows = (await sql`select plan, product_id, updated_at from dodo_products where mode = ${config.dodo.mode}`) as { plan: PlanId; product_id: string; updated_at: string }[];
  const saved = Object.fromEntries(rows.map((r) => [r.plan, r]));
  const subs = (await sql`select coalesce(subscription_plan, 'lifetime') as plan, count(*)::int as n from users where lifetime or subscription_status = 'active' group by 1`) as { plan: string; n: number }[];
  const configured = !!config.dodo.apiKey;
  const plans = await Promise.all(
    PLANS.map(async (p) => {
      const productId = saved[p.id]?.product_id || config.dodo.products[p.id] || "";
      const live = configured && productId ? await lookup(productId) : null;
      return {
        id: p.id,
        name: p.name,
        price: p.price,
        period: p.period,
        cents: p.cents,
        productId,
        source: saved[p.id] ? "database" : productId ? "file" : "none",
        inDodo: productId ? (configured ? !!live : null) : false,
        dodoName: live?.name ?? null,
        activeCustomers: subs.find((s) => s.plan === p.id)?.n ?? 0,
      };
    }),
  );
  return { mode: config.dodo.mode, dodoConfigured: configured, plans };
}

/** Creates any plan with no product in Dodo (or whose product is gone) and records every id in the database. */
export async function syncPlans(): Promise<{ created: PlanId[]; synced: PlanId[] }> {
  if (!config.dodo.apiKey) throw new HttpError(503, "DODO_PAYMENT_KEY is not set", "payments_unconfigured");
  const created: PlanId[] = [];
  const synced: PlanId[] = [];
  for (const p of PLANS) {
    const existing = config.dodo.products[p.id];
    if (existing && (await lookup(existing))) {
      await save(p.id, existing);
      synced.push(p.id);
      continue;
    }
    const { product_id } = await dodo<{ product_id: string }>("POST", "/products", {
      name: `CodeRef ${p.name}`,
      description: p.id === "lifetime" ? "CodeRef Pro forever: cloud save, share links and Design System exports." : `CodeRef Pro, billed ${p.id}.`,
      tax_category: "saas",
      price: price(p.id, p.cents),
      metadata: { plan: p.id },
    });
    await save(p.id, product_id);
    created.push(p.id);
  }
  return { created, synced };
}

/** Points a plan at an existing Dodo product (checked to exist first). */
export async function linkProduct(plan: string, productId: unknown): Promise<void> {
  if (!PLANS.some((p) => p.id === plan)) throw new HttpError(404, "Unknown plan", "not_found");
  if (typeof productId !== "string" || !/^pdt_[A-Za-z0-9]{6,60}$/.test(productId)) throw new HttpError(400, "Enter a Dodo product id (pdt_…)", "invalid_product");
  if (!(await lookup(productId))) throw new HttpError(400, "Dodo has no product with that id in this mode", "invalid_product");
  await save(plan as PlanId, productId);
}
