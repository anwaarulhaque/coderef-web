// Dodo Payments over plain fetch: hosted checkout, customer portal, and Standard Webhooks verification.
import { createHmac, timingSafeEqual } from "node:crypto";
import { config, planForProduct } from "./config.ts";
import { db, type User } from "./db.ts";
import { HttpError } from "./http.ts";
import type { FileOut } from "./exports.ts";
import { refreshProducts } from "./products.ts";
import { markRefunded } from "./refunds.ts";
import { listTransactions } from "./transactions.ts";
import { LIFETIME_CAP, type PlanId } from "../lib/plans.ts";

export async function dodo<T>(method: string, path: string, body?: unknown): Promise<T> {
  if (!config.dodo.apiKey) throw new HttpError(503, "Payments are not configured yet", "payments_unconfigured");
  const res = await fetch(`${config.dodo.baseUrl}${path}`, {
    method,
    headers: { authorization: `Bearer ${config.dodo.apiKey}`, "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error("dodo error", method, path, res.status, text.slice(0, 500));
    throw new HttpError(502, "The payment provider returned an error. Please try again.", "payments_error");
  }
  return (text ? JSON.parse(text) : {}) as T;
}

export const lifetimeSold = async () => Number((await db()`select count(*)::int as n from users where lifetime`)[0].n);

const requirePaymentsOpen = () => {
  if (!config.payments.enabled) throw new HttpError(503, "Paid plans are coming soon", "payments_frozen");
};

export async function createCheckout(user: User, plan: PlanId): Promise<string> {
  requirePaymentsOpen();
  await refreshProducts();
  const productId = config.dodo.products[plan];
  if (!productId) throw new HttpError(503, "This plan is not available yet", "plan_unconfigured");
  if (user.lifetime) throw new HttpError(409, "You already have lifetime Pro", "already_pro");
  const subscribed = user.subscription_status === "active" && !!user.pro_until && new Date(user.pro_until) > new Date();
  if (subscribed && plan !== "lifetime") throw new HttpError(409, "You already have an active subscription. Change plans from Manage billing.", "already_subscribed");
  if (plan === "lifetime" && (await lifetimeSold()) >= LIFETIME_CAP) throw new HttpError(409, "The lifetime offer has sold out", "sold_out");

  const session = await dodo<{ checkout_url?: string | null; session_id: string }>("POST", "/checkouts", {
    product_cart: [{ product_id: productId, quantity: 1 }],
    customer: user.dodo_customer_id ? { customer_id: user.dodo_customer_id } : { email: user.email },
    return_url: `${config.siteUrl}/account/?checkout=success`,
    cancel_url: `${config.siteUrl}/pricing/?checkout=cancelled`,
    metadata: { user_id: user.id, plan },
  });
  if (!session.checkout_url) throw new HttpError(502, "The payment provider did not return a checkout page", "payments_error");
  return session.checkout_url;
}

// ---- subscription management, all inside /account/subscription/ (no Dodo portal) ----

type DodoSubscription = { status?: string; cancel_at_next_billing_date?: boolean; next_billing_date?: string; product_id?: string; payment_frequency_interval?: string };

function ownSubscription(user: User): string {
  if (!user.subscription_id) throw new HttpError(404, "You don't have a subscription", "no_subscription");
  return encodeURIComponent(user.subscription_id);
}

/** The live state Dodo holds (cancel-at-period-end isn't in our database). Null when there's no subscription. */
export async function subscriptionDetails(user: User) {
  if (!user.subscription_id) return null;
  const sub = await dodo<DodoSubscription>("GET", `/subscriptions/${ownSubscription(user)}`);
  return { status: sub.status ?? user.subscription_status, cancelAtPeriodEnd: !!sub.cancel_at_next_billing_date, nextBillingDate: sub.next_billing_date ?? null };
}

/** Switches a subscription between monthly and yearly. Dodo prorates: an upgrade charges the difference now, a downgrade credits it. */
export async function changePlan(user: User, plan: PlanId): Promise<void> {
  requirePaymentsOpen();
  await refreshProducts();
  if (plan === "lifetime") throw new HttpError(400, "Lifetime is a one-time purchase", "invalid_plan");
  const subscribed = user.subscription_status === "active" && !!user.pro_until && new Date(user.pro_until) > new Date();
  if (!subscribed) throw new HttpError(409, "You don't have an active subscription to change", "no_subscription");
  if (user.subscription_plan === plan) throw new HttpError(409, "You're already on that plan", "same_plan");
  const productId = config.dodo.products[plan];
  if (!productId) throw new HttpError(503, "This plan is not available yet", "plan_unconfigured");
  await dodo("POST", `/subscriptions/${ownSubscription(user)}/change-plan`, { product_id: productId, quantity: 1, proration_billing_mode: "prorated_immediately", on_payment_failure: "prevent_change" });
}

/** Cancel at the end of the paid period (Pro stays until then), or undo that. */
export async function setCancelAtPeriodEnd(user: User, cancel: boolean): Promise<void> {
  await dodo("PATCH", `/subscriptions/${ownSubscription(user)}`, { cancel_at_next_billing_date: cancel });
}

/** Card details can't be typed into our page (card data must stay with Dodo); this is the one hosted step. */
export async function cardUpdateLink(user: User): Promise<string> {
  const r = await dodo<{ payment_link?: string }>("POST", `/subscriptions/${ownSubscription(user)}/update-payment-method`, { type: "new", return_url: `${config.siteUrl}/account/subscription/?card=updated` });
  if (!r.payment_link) throw new HttpError(502, "The payment provider did not return a page to update your card", "payments_error");
  return r.payment_link;
}

/** An invoice PDF, streamed through our API so the customer never leaves coderef.xyz. The payment must be the user's own. */
export async function invoicePdf(user: User, paymentId: string): Promise<FileOut> {
  if (!/^pay_[A-Za-z0-9]{6,60}$/.test(paymentId)) throw new HttpError(400, "Unknown payment", "invalid_payment");
  const own = (await listTransactions(user)).some((t) => t.kind === "payment" && t.id === paymentId);
  if (!own) throw new HttpError(404, "Payment not found", "not_found");
  const res = await fetch(`${config.dodo.baseUrl}/invoices/payments/${encodeURIComponent(paymentId)}`, { headers: { authorization: `Bearer ${config.dodo.apiKey}` } });
  if (!res.ok) {
    console.error("dodo invoice error", paymentId, res.status);
    throw new HttpError(502, "The invoice isn't available yet. Try again in a few minutes.", "payments_error");
  }
  return { filename: `coderef-invoice-${paymentId}.pdf`, mime: "application/pdf", body: Buffer.from(await res.arrayBuffer()).toString("base64"), base64: true };
}

export async function cancelSubscription(subscriptionId: string): Promise<void> {
  await dodo("PATCH", `/subscriptions/${encodeURIComponent(subscriptionId)}`, { status: "cancelled" });
}

// ---- webhooks ----

/** Standard Webhooks: HMAC-SHA256 over "{id}.{timestamp}.{body}" with the base64 key after "whsec_". */
export function verifyWebhook(secret: string, headers: Record<string, string>, body: string, now = Date.now()): boolean {
  const id = headers["webhook-id"];
  const ts = headers["webhook-timestamp"];
  const sigs = headers["webhook-signature"];
  if (!secret || !id || !ts || !sigs) return false;
  if (!/^\d+$/.test(ts) || Math.abs(now / 1000 - Number(ts)) > 300) return false;
  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = createHmac("sha256", key).update(`${id}.${ts}.${body}`).digest();
  return sigs.split(" ").some((s) => {
    const [version, sig] = s.split(",");
    if (version !== "v1" || !sig) return false;
    const got = Buffer.from(sig, "base64");
    return got.length === expected.length && timingSafeEqual(got, expected);
  });
}

type Obj = Record<string, unknown>;
const o = (v: unknown): Obj => (v && typeof v === "object" ? (v as Obj) : {});
const s = (v: unknown) => (typeof v === "string" && v ? v : undefined);
const GRACE_MS = 3 * 86400_000;

async function findUser(data: Obj): Promise<User | null> {
  const sql = db();
  const userId = s(o(data.metadata).user_id);
  if (userId && /^[0-9a-f-]{36}$/i.test(userId)) {
    const [u] = await sql`select * from users where id = ${userId}`;
    if (u) return u as User;
  }
  const subId = s(data.subscription_id);
  if (subId) {
    const [u] = await sql`select * from users where subscription_id = ${subId}`;
    if (u) return u as User;
  }
  const email = s(o(data.customer).email)?.toLowerCase();
  if (email) {
    const [u] = await sql`select * from users where email = ${email}`;
    if (u) return u as User;
  }
  return null;
}

/** Applies one verified event. Payload fields are read defensively: Dodo's docs do not fully specify them. */
export async function applyEvent(type: string, data: Obj): Promise<string> {
  await refreshProducts();
  const sql = db();
  if (type === "refund.succeeded") {
    const paymentId = s(data.payment_id);
    if (paymentId) {
      await sql`update users set lifetime = false where lifetime_payment_id = ${paymentId}`;
      await markRefunded(paymentId);
    }
    return "refund applied";
  }
  const user = await findUser(data);
  if (!user) return "no matching user";
  const customerId = s(o(data.customer).customer_id) ?? s(data.customer_id);
  if (customerId && customerId !== user.dodo_customer_id) await sql`update users set dodo_customer_id = ${customerId} where id = ${user.id}`;

  if (type === "payment.succeeded") {
    const cart = Array.isArray(data.product_cart) ? (data.product_cart as Obj[]) : [];
    const lifetime = s(o(data.metadata).plan) === "lifetime" || cart.some((p) => planForProduct(s(p.product_id)) === "lifetime") || planForProduct(s(data.product_id)) === "lifetime";
    if (lifetime && !s(data.subscription_id)) {
      await sql`update users set lifetime = true, lifetime_payment_id = ${s(data.payment_id) ?? null} where id = ${user.id}`;
      return "lifetime granted";
    }
    return "payment recorded";
  }

  if (!type.startsWith("subscription.")) return "ignored";
  const subId = s(data.subscription_id) ?? user.subscription_id;
  const status = s(data.status) ?? type.slice("subscription.".length);
  const plan = planForProduct(s(data.product_id)) ?? (s(o(data.metadata).plan) as PlanId | undefined) ?? user.subscription_plan;
  const next = s(data.next_billing_date);
  const nextMs = next ? new Date(next).getTime() : NaN;

  let proUntil: string | null = user.pro_until;
  if (["subscription.active", "subscription.renewed", "subscription.updated", "subscription.plan_changed", "subscription.unpaused"].includes(type) && status === "active") {
    proUntil = new Date((Number.isFinite(nextMs) ? nextMs : Date.now() + 31 * 86400_000) + GRACE_MS).toISOString();
  } else if (["subscription.expired", "subscription.failed", "subscription.paused"].includes(type)) {
    proUntil = new Date().toISOString();
  }
  // cancelled / on_hold / past_due keep access until the period already paid for ends.
  await sql`
    update users set subscription_id = ${subId ?? null}, subscription_status = ${status}, subscription_plan = ${plan ?? null}, pro_until = ${proUntil}
    where id = ${user.id}`;
  return `subscription ${status}`;
}
