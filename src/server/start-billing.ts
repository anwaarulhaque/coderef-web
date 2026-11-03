// CodeRef Start billing through Dodo. Subscriptions are kept in start_subscriptions, so buying, renewing or cancelling
// Start never changes CodeRef Pro (users.subscription_* / pro_until), and the other way round.
import { config, startPlanForProduct } from "./config.ts";
import { db, type User } from "./db.ts";
import { dodo } from "./dodo.ts";
import { HttpError } from "./http.ts";
import { refreshProducts } from "./products.ts";
import { START_PLANS, START_TEAM_SEATS, type StartPlanId } from "../lib/start-plans.ts";

type Obj = Record<string, unknown>;
const o = (v: unknown): Obj => (v && typeof v === "object" ? (v as Obj) : {});
const s = (v: unknown) => (typeof v === "string" && v ? v : undefined);
const GRACE_MS = 3 * 86400_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isStartPlan = (v: unknown): v is StartPlanId => START_PLANS.some((p) => p.id === v);

export async function createStartCheckout(user: User, plan: StartPlanId): Promise<string> {
  if (!config.payments.enabled) throw new HttpError(503, "Paid plans are coming soon", "payments_frozen");
  await refreshProducts();
  const productId = config.dodo.startProducts[plan];
  if (!productId) throw new HttpError(503, "This plan is not available yet", "plan_unconfigured");
  const [active] = await db()`
    select 1 from start_subscriptions where user_id = ${user.id} and plan = ${plan} and status = 'active' and pro_until > now()`;
  if (active) throw new HttpError(409, "You already have this plan. Manage it from Account > CodeRef Start.", "already_subscribed");

  const session = await dodo<{ checkout_url?: string | null }>("POST", "/checkouts", {
    product_cart: [{ product_id: productId, quantity: 1 }],
    customer: user.dodo_customer_id ? { customer_id: user.dodo_customer_id } : { email: user.email },
    return_url: `${config.siteUrl}/account/start/?checkout=success`,
    cancel_url: `${config.siteUrl}/pricing/?product=start&checkout=cancelled`,
    billing_currency: config.currency,
    feature_flags: { allow_currency_selection: false },
    metadata: { user_id: user.id, plan, product: "start" },
  });
  if (!session.checkout_url) throw new HttpError(502, "The payment provider did not return a checkout page", "payments_error");
  return session.checkout_url;
}

export async function startSubscriptions(user: User) {
  const rows = await db()`
    select s.id, s.plan, s.status, s.pro_until, s.seats, s.subscription_id, s.team_id, t.name as team_name
    from start_subscriptions s left join start_teams t on t.id = s.team_id
    where s.user_id = ${user.id} order by s.created_at desc`;
  return rows.map((r) => ({
    id: r.id as string,
    plan: r.plan as string,
    name: START_PLANS.find((p) => p.id === r.plan)?.name ?? "Start Enterprise",
    status: r.status as string,
    proUntil: r.pro_until as string | null,
    seats: r.seats as number,
    teamId: r.team_id as string | null,
    teamName: r.team_name as string | null,
    manageable: !!r.subscription_id,
  }));
}

/** Cancel at the end of the paid period, or undo that. Only the subscription's owner may. */
export async function setStartCancel(user: User, id: string, cancel: boolean): Promise<void> {
  if (!UUID.test(id)) throw new HttpError(404, "Subscription not found", "not_found");
  const [row] = await db()`select subscription_id from start_subscriptions where id = ${id} and user_id = ${user.id}`;
  if (!row?.subscription_id) throw new HttpError(404, "Subscription not found", "not_found");
  await dodo("PATCH", `/subscriptions/${encodeURIComponent(row.subscription_id as string)}`, { cancel_at_next_billing_date: cancel });
  await db()`update start_subscriptions set status = ${cancel ? "cancelling" : "active"}, updated_at = now() where id = ${id}`;
}

/** Cancels every Start subscription a user pays for (account deletion). */
export async function cancelAllStart(userId: string): Promise<void> {
  const rows = await db()`select subscription_id from start_subscriptions where user_id = ${userId} and subscription_id is not null and status in ('active', 'cancelling', 'on_hold', 'past_due')`;
  for (const r of rows) await dodo("PATCH", `/subscriptions/${encodeURIComponent(r.subscription_id as string)}`, { status: "cancelled" }).catch((e) => console.error("start cancel failed", e));
}

/** The plan an event is about, when it belongs to CodeRef Start (otherwise the Pro handler takes it). */
export async function startPlanOfEvent(data: Obj): Promise<StartPlanId | null> {
  const meta = o(data.metadata);
  const fromProduct = startPlanForProduct(s(data.product_id));
  if (fromProduct) return fromProduct;
  if (s(meta.product) === "start" && isStartPlan(meta.plan)) return meta.plan;
  const subId = s(data.subscription_id);
  if (subId) {
    // Before `npm run api:migrate` adds the table, this must not break Pro's webhooks.
    const [row] = await db()`select plan from start_subscriptions where subscription_id = ${subId}`.catch(() => []);
    if (row && isStartPlan(row.plan)) return row.plan;
  }
  return null;
}

export async function applyStartEvent(type: string, data: Obj, user: User, plan: StartPlanId): Promise<string> {
  if (!type.startsWith("subscription.")) return "start payment recorded";
  const subId = s(data.subscription_id);
  if (!subId) return "start event without subscription";
  const sql = db();
  const status = s(data.status) ?? type.slice("subscription.".length);
  const next = s(data.next_billing_date);
  const nextMs = next ? new Date(next).getTime() : NaN;
  const [existing] = await sql`select pro_until, team_id from start_subscriptions where subscription_id = ${subId}`;

  let proUntil: string | null = (existing?.pro_until as string | null) ?? null;
  if (["subscription.active", "subscription.renewed", "subscription.updated", "subscription.plan_changed", "subscription.unpaused"].includes(type) && status === "active") {
    proUntil = new Date((Number.isFinite(nextMs) ? nextMs : Date.now() + (plan === "start_pro_yearly" ? 366 : 31) * 86400_000) + GRACE_MS).toISOString();
  } else if (["subscription.expired", "subscription.failed", "subscription.paused"].includes(type)) {
    proUntil = new Date().toISOString();
  }
  // A team plan bought from a team's billing page names the team; otherwise it's linked when the owner creates one.
  const metaTeam = s(o(data.metadata).team_id);
  let teamId = (existing?.team_id as string | null) ?? null;
  if (!teamId && metaTeam && UUID.test(metaTeam)) {
    const [own] = await sql`select id from start_teams where id = ${metaTeam} and owner_id = ${user.id}`;
    if (own) teamId = own.id as string;
  }
  const seats = plan === "start_team_monthly" ? START_TEAM_SEATS : 1;
  await sql`
    insert into start_subscriptions (user_id, team_id, plan, subscription_id, status, pro_until, seats)
    values (${user.id}, ${teamId}, ${plan}, ${subId}, ${status}, ${proUntil}, ${seats})
    on conflict (subscription_id) do update set plan = excluded.plan, status = excluded.status, pro_until = excluded.pro_until,
      team_id = coalesce(start_subscriptions.team_id, excluded.team_id), updated_at = now()`;
  return `start subscription ${status}`;
}
