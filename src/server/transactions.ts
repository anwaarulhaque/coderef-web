// Purchase history for the account page, read from the payment and refund events both webhook services store in
// webhook_events.payload. No extra table, and no call to Dodo, so it still works when Dodo's API is slow or down.
import { planForProduct } from "./config.ts";
import { refreshProducts } from "./products.ts";
import { db, type User } from "./db.ts";
import { PLANS, type PlanId } from "../lib/plans.ts";

export type Transaction = {
  id: string;
  date: string;
  kind: "payment" | "refund" | "failed";
  plan: PlanId | null;
  /** What was bought, in words: "Pro monthly", "Pro yearly renewal", "Lifetime". */
  description: string;
  /** Smallest currency unit (cents), as Dodo reports it; null when the payload doesn't say. */
  amount: number | null;
  currency: string | null;
};

type Obj = Record<string, unknown>;
const o = (v: unknown): Obj => (v && typeof v === "object" ? (v as Obj) : {});
const s = (v: unknown) => (typeof v === "string" && v ? v : undefined);
const n = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);

function planOf(data: Obj): PlanId | null {
  const meta = s(o(data.metadata).plan);
  const cart = Array.isArray(data.product_cart) ? (data.product_cart as Obj[]) : [];
  return (
    cart.map((p) => planForProduct(s(p.product_id))).find(Boolean) ??
    planForProduct(s(data.product_id)) ??
    (meta === "monthly" || meta === "yearly" || meta === "lifetime" ? meta : null)
  );
}

export async function listTransactions(user: User): Promise<Transaction[]> {
  await refreshProducts();
  const sql = db();
  const payments = await sql`
    select id, type, received_at, payload from webhook_events
    where type in ('payment.succeeded', 'payment.failed')
      and (payload->'data'->'metadata'->>'user_id' = ${user.id}
        or lower(payload->'data'->'customer'->>'email') = ${user.email}
        or (${user.dodo_customer_id}::text is not null and payload->'data'->'customer'->>'customer_id' = ${user.dodo_customer_id}))
    order by received_at desc limit 200`;
  const paymentIds = [...new Set(payments.map((p) => s(o(o(p.payload).data).payment_id)).filter((x): x is string => !!x))];
  const refunds = paymentIds.length
    ? await sql`select id, type, received_at, payload from webhook_events where type = 'refund.succeeded' and payload->'data'->>'payment_id' = any(${paymentIds}) order by received_at desc`
    : [];

  // The same payment can be delivered more than once (retries carry new webhook ids): keep one row per payment.
  const seen = new Set<string>();
  const out: Transaction[] = [];
  // A subscription's first payment is the purchase; later ones are renewals.
  const firstSubscriptionPayment = new Map<string, string>();
  const ordered = [...payments].sort((a, b) => +new Date(a.received_at as string) - +new Date(b.received_at as string));
  for (const row of ordered) {
    const data = o(o(row.payload).data);
    const sub = s(data.subscription_id);
    const pid = s(data.payment_id);
    if (sub && pid && row.type === "payment.succeeded" && !firstSubscriptionPayment.has(sub)) firstSubscriptionPayment.set(sub, pid);
  }

  for (const row of [...payments, ...refunds]) {
    const payload = o(row.payload);
    const data = o(payload.data);
    const kind = row.type === "refund.succeeded" ? "refund" : row.type === "payment.failed" ? "failed" : "payment";
    const key = `${kind}:${s(data.refund_id) ?? s(data.payment_id) ?? row.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const plan = planOf(data);
    const name = plan ? PLANS.find((p) => p.id === plan)!.name : "CodeRef Pro";
    const sub = s(data.subscription_id);
    const renewal = kind === "payment" && !!sub && firstSubscriptionPayment.get(sub) !== s(data.payment_id);
    out.push({
      id: s(data.refund_id) ?? s(data.payment_id) ?? (row.id as string),
      date: s(payload.timestamp) ?? s(data.created_at) ?? new Date(row.received_at as string).toISOString(),
      kind,
      plan,
      description: kind === "refund" ? `Refund: ${name}` : kind === "failed" ? `${name} (payment failed)` : renewal ? `${name} renewal` : name,
      amount: n(data.total_amount) ?? n(data.amount),
      currency: s(data.currency) ?? null,
    });
  }
  // Refunds don't carry the plan: take it from the payment they refund.
  for (const t of out) {
    if (t.kind !== "refund" || t.plan) continue;
    const refund = refunds.find((r) => (s(o(o(r.payload).data).refund_id) ?? s(o(o(r.payload).data).payment_id)) === t.id);
    const paid = out.find((p) => p.kind === "payment" && p.id === s(o(o(refund?.payload).data).payment_id));
    if (paid) Object.assign(t, { plan: paid.plan, description: `Refund: ${paid.description.replace(/ renewal$/, "")}`, currency: t.currency ?? paid.currency });
  }
  return out.sort((a, b) => +new Date(b.date) - +new Date(a.date));
}
