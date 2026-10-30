// Neon over HTTP: no connection pool to manage, which suits serverless functions.
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { config } from "./config.ts";

let client: NeonQueryFunction<false, false> | null = null;

export function db(): NeonQueryFunction<false, false> {
  if (!config.databaseUrl) throw new Error("DATABASE_URL is not set");
  client ??= neon(config.databaseUrl);
  return client;
}

export type User = {
  id: string;
  email: string;
  created_at: string;
  dodo_customer_id: string | null;
  subscription_id: string | null;
  subscription_status: string | null;
  subscription_plan: string | null;
  pro_until: string | null;
  lifetime: boolean;
  lifetime_payment_id: string | null;
};

export const isPro = (u: Pick<User, "lifetime" | "pro_until">, now = Date.now()) => u.lifetime || (!!u.pro_until && new Date(u.pro_until).getTime() > now);

/** Fixed-window counter; returns true while under `max` hits per hour for `key`. */
export async function rateLimit(key: string, max: number): Promise<boolean> {
  const [row] = await db()`
    insert into rate_limits (key, window_start, count) values (${key}, date_trunc('hour', now()), 1)
    on conflict (key, window_start) do update set count = rate_limits.count + 1
    returning count`;
  return (row.count as number) <= max;
}
