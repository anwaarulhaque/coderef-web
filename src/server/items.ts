// Cloud save: one table for every tool's saved work, plus public share links (Pro).
import { randomBytes } from "node:crypto";
import { db, isPro, type User } from "./db.ts";
import { HttpError, str } from "./http.ts";
import { FAVORITE_LIMIT, FREE_ITEM_LIMIT, ITEM_KINDS, MAX_ITEM_BYTES, PRO_ITEM_LIMIT, type ItemKind } from "../lib/plans.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (s: string) => UUID.test(s);

export function kindOf(v: unknown): ItemKind {
  if (typeof v === "string" && (ITEM_KINDS as readonly string[]).includes(v)) return v as ItemKind;
  throw new HttpError(400, "Unknown item kind", "invalid_kind");
}

function checkData(data: unknown): string {
  if (data === undefined) throw new HttpError(400, "Missing data", "invalid_data");
  const raw = JSON.stringify(data);
  if (Buffer.byteLength(raw) > MAX_ITEM_BYTES) throw new HttpError(413, `Saved items are limited to ${MAX_ITEM_BYTES / 1024} KB`, "too_large");
  return raw;
}

const title = (v: unknown) => str(v, 120) ?? "Untitled";
const row = (r: Record<string, unknown>, withData = false) => ({
  id: r.id, kind: r.kind, title: r.title, shareId: r.share_id ?? null, createdAt: r.created_at, updatedAt: r.updated_at, ...(withData && { data: r.data }),
});

export async function listItems(user: User, kind?: ItemKind) {
  const sql = db();
  const rows = kind
    ? await sql`select id, kind, title, share_id, created_at, updated_at, case when kind = 'favorite' then data end as data from items where user_id = ${user.id} and kind = ${kind} order by updated_at desc limit 1000`
    : await sql`select id, kind, title, share_id, created_at, updated_at, case when kind = 'favorite' then data end as data from items where user_id = ${user.id} order by updated_at desc limit 1000`;
  return rows.map((r) => row(r, r.kind === "favorite"));
}

export async function usage(user: User) {
  const [r] = await db()`select count(*) filter (where kind <> 'favorite')::int as saved, count(*) filter (where kind = 'favorite')::int as favorites from items where user_id = ${user.id}`;
  return { saved: r.saved as number, favorites: r.favorites as number, limit: isPro(user) ? PRO_ITEM_LIMIT : FREE_ITEM_LIMIT };
}

export async function getItem(user: User, id: string) {
  if (!isUuid(id)) throw new HttpError(404, "Not found", "not_found");
  const [r] = await db()`select * from items where id = ${id} and user_id = ${user.id}`;
  if (!r) throw new HttpError(404, "Not found", "not_found");
  return row(r, true);
}

export async function createItem(user: User, body: Record<string, unknown>) {
  const kind = kindOf(body.kind);
  const raw = checkData(body.data);
  const sql = db();
  const u = await usage(user);
  if (kind === "favorite") {
    if (u.favorites >= FAVORITE_LIMIT) throw new HttpError(403, "Favourite limit reached", "limit_reached");
    // Favourites are keyed by design id: saving twice is a no-op.
    const [existing] = await sql`select * from items where user_id = ${user.id} and kind = 'favorite' and title = ${title(body.title)}`;
    if (existing) return row(existing, true);
  } else if (u.saved >= u.limit) {
    throw new HttpError(403, isPro(user) ? `You've reached ${u.limit} saved items` : `Free accounts can save ${u.limit} items. Upgrade to Pro for up to ${PRO_ITEM_LIMIT}.`, "limit_reached");
  }
  const [r] = await sql`insert into items (user_id, kind, title, data) values (${user.id}, ${kind}, ${title(body.title)}, ${raw}::jsonb) returning *`;
  return row(r, true);
}

export async function updateItem(user: User, id: string, body: Record<string, unknown>) {
  if (!isUuid(id)) throw new HttpError(404, "Not found", "not_found");
  const raw = body.data === undefined ? null : checkData(body.data);
  const t = body.title === undefined ? null : title(body.title);
  const [r] = await db()`
    update items set title = coalesce(${t}, title), data = coalesce(${raw}::jsonb, data), updated_at = now()
    where id = ${id} and user_id = ${user.id} returning *`;
  if (!r) throw new HttpError(404, "Not found", "not_found");
  return row(r, true);
}

export async function deleteItem(user: User, id: string) {
  if (!isUuid(id)) throw new HttpError(404, "Not found", "not_found");
  await db()`delete from items where id = ${id} and user_id = ${user.id}`;
}

export async function shareItem(user: User, id: string, on: boolean) {
  if (!isUuid(id)) throw new HttpError(404, "Not found", "not_found");
  if (on && !isPro(user)) throw new HttpError(402, "Share links are a Pro feature", "pro_required");
  const shareId = on ? randomBytes(9).toString("base64url") : null;
  const [r] = await db()`
    update items set share_id = case when ${on} then coalesce(share_id, ${shareId}) else null end
    where id = ${id} and user_id = ${user.id} and kind <> 'favorite' returning *`;
  if (!r) throw new HttpError(404, "Not found", "not_found");
  return row(r);
}

/** Public read of a shared item. */
export async function getShared(shareId: string) {
  if (!/^[\w-]{6,32}$/.test(shareId)) throw new HttpError(404, "This link does not exist", "not_found");
  const [r] = await db()`select kind, title, data, updated_at from items where share_id = ${shareId}`;
  if (!r) throw new HttpError(404, "This link does not exist or was turned off", "not_found");
  return { kind: r.kind, title: r.title, data: r.data, updatedAt: r.updated_at };
}
