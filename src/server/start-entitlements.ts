// CodeRef Start access: a user's tier comes from their own Start PRO, a team plan they own, or any team they belong to.
// Separate from CodeRef Pro (isPro in db.ts): neither product grants the other.
import { db, type User } from "./db.ts";
import { HttpError } from "./http.ts";
import { START_LIMITS, type StartTier } from "../lib/start-plans.ts";

const RANK: Record<StartTier, number> = { free: 0, pro: 1, team: 2, enterprise: 3 };
const PLAN_TIER: Record<string, StartTier> = { start_pro_yearly: "pro", start_team_monthly: "team", start_enterprise: "enterprise" };

/** Best tier among the plans whose paid period hasn't ended (cancelled plans keep access until then). */
export function tierFromPlans(plans: { plan: string; pro_until: string | null }[], now = Date.now()): StartTier {
  let best: StartTier = "free";
  for (const p of plans) {
    const tier = PLAN_TIER[p.plan];
    if (tier && p.pro_until && new Date(p.pro_until).getTime() > now && RANK[tier] > RANK[best]) best = tier;
  }
  return best;
}

export async function startTier(user: Pick<User, "id">): Promise<StartTier> {
  const rows = await db()`
    select plan, pro_until from start_subscriptions
    where user_id = ${user.id} or team_id in (select team_id from start_team_members where user_id = ${user.id})`;
  return tierFromPlans(rows as { plan: string; pro_until: string | null }[]);
}

/** Whether a team's plan is paid up (members of a lapsed team keep read access but lose team features). */
export async function teamActive(teamId: string): Promise<boolean> {
  const rows = await db()`select plan, pro_until from start_subscriptions where team_id = ${teamId}`;
  const tier = tierFromPlans(rows as { plan: string; pro_until: string | null }[]);
  return tier === "team" || tier === "enterprise";
}

export async function requireStartTier(user: Pick<User, "id">, min: StartTier, feature: string): Promise<StartTier> {
  const tier = await startTier(user);
  if (RANK[tier] < RANK[min]) {
    const plan = min === "pro" ? "Start PRO" : min === "team" ? "Start Team" : "Start Enterprise";
    throw new HttpError(402, `${feature} is part of ${plan}`, "start_upgrade_required");
  }
  return tier;
}

export const atLeast = (tier: StartTier, min: StartTier) => RANK[tier] >= RANK[min];
export const limitsFor = (tier: StartTier) => START_LIMITS[tier];
