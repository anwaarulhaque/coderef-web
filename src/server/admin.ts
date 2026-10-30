// Admin panel backend: emailed one-time-code sign-in for staff, the superadmin-only employee list, and read-only views of
// customers and subscriptions. Plans (Dodo setup) are in admin-plans.ts. Admin sessions are separate from customer ones.
import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { normalizeEmail } from "./auth.ts";
import { config } from "./config.ts";
import { db, isPro, rateLimit } from "./db.ts";
import { sendCodeEmail } from "./email.ts";
import { HttpError, cookie, str, type Req } from "./http.ts";

export const ADMIN_COOKIE = "cr_admin";
const SESSION_DAYS = 7;
const CODE_MINUTES = 10;
const MAX_ATTEMPTS = 5;

export type Admin = { id: string; email: string; name: string; role: "superadmin" | "employee"; active: boolean; created_at: string; last_login_at: string | null };
const ADMIN_FIELDS = "id, email, name, role, active, created_at, last_login_at";

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

const codeHash = (email: string, code: string) => sha256(`admin:${email}:${code}`);

/** Emails a code if (and only if) the address is an active admin. Answers the same either way, so the form can't be used to find admins. */
export async function requestAdminCode(emailInput: unknown, ip: string): Promise<void> {
  const email = normalizeEmail(emailInput);
  if (!(await rateLimit(`admin-code:${email}`, 5)) || !(await rateLimit(`admin-code-ip:${ip}`, 30))) {
    throw new HttpError(429, "Too many codes requested. Try again in an hour.", "rate_limited");
  }
  const sql = db();
  const [admin] = await sql`select 1 from admins where email = ${email} and active`;
  if (!admin) return;
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await sql`
    insert into admin_login_codes (email, code_hash, expires_at, attempts, created_at)
    values (${email}, ${codeHash(email, code)}, now() + make_interval(mins => ${CODE_MINUTES}), 0, now())
    on conflict (email) do update set code_hash = excluded.code_hash, expires_at = excluded.expires_at, attempts = 0, created_at = now()`;
  if (process.env.DEV_LOG_CODES === "1") console.log(`[dev] admin code for ${email}: ${code}`);
  await sendCodeEmail(email, code, false, true);
}

export async function verifyAdminCode(emailInput: unknown, codeInput: unknown, ip: string, userAgent: string): Promise<{ token: string; admin: Admin }> {
  const email = normalizeEmail(emailInput);
  const code = String(codeInput ?? "").trim();
  if (!(await rateLimit(`admin-verify-ip:${ip}`, 60))) throw new HttpError(429, "Too many attempts. Try again later.", "rate_limited");
  if (!/^\d{6}$/.test(code)) throw new HttpError(400, "The code is 6 digits", "invalid_code");
  const sql = db();
  const bad = () => new HttpError(400, "That code is wrong or has expired. Request a new one.", "invalid_code");
  const [row] = await sql`update admin_login_codes set attempts = attempts + 1 where email = ${email} returning code_hash, expires_at, attempts`;
  if (!row) throw bad();
  if ((row.attempts as number) > MAX_ATTEMPTS || new Date(row.expires_at as string).getTime() < Date.now()) {
    await sql`delete from admin_login_codes where email = ${email}`;
    throw bad();
  }
  const a = Buffer.from(row.code_hash as string);
  const b = Buffer.from(codeHash(email, code));
  if (a.length !== b.length || !timingSafeEqual(a, b)) throw bad();
  await sql`delete from admin_login_codes where email = ${email}`;
  const [admin] = await sql`update admins set last_login_at = now() where email = ${email} and active returning *`;
  if (!admin) throw bad();
  const token = randomBytes(32).toString("base64url");
  await sql`insert into admin_sessions (token_hash, admin_id, expires_at, user_agent) values (${sha256(token)}, ${admin.id}, now() + make_interval(days => ${SESSION_DAYS}), ${userAgent.slice(0, 300)})`;
  await sql`delete from admin_sessions where expires_at < now()`;
  return { token, admin: publicAdmin(admin as unknown as Admin) };
}

export const publicAdmin = (a: Admin): Admin => ({ id: a.id, email: a.email, name: a.name, role: a.role, active: a.active, created_at: a.created_at, last_login_at: a.last_login_at });

export async function currentAdmin(req: Req): Promise<Admin | null> {
  const token = req.cookies[ADMIN_COOKIE];
  if (!token || token.length > 100) return null;
  const [a] = await db()`
    select a.* from admin_sessions s join admins a on a.id = s.admin_id
    where s.token_hash = ${sha256(token)} and s.expires_at > now() and a.active`;
  return a ? publicAdmin(a as unknown as Admin) : null;
}

export async function requireAdmin(req: Req): Promise<Admin> {
  const a = await currentAdmin(req);
  if (!a) throw new HttpError(401, "Sign in to the admin panel", "admin_unauthenticated");
  return a;
}

export async function requireSuperadmin(req: Req): Promise<Admin> {
  const a = await requireAdmin(req);
  if (a.role !== "superadmin") throw new HttpError(403, "Only the superadmin can do this", "forbidden");
  return a;
}

export async function adminLogout(req: Req): Promise<void> {
  const token = req.cookies[ADMIN_COOKIE];
  if (token) await db()`delete from admin_sessions where token_hash = ${sha256(token)}`;
}

export const adminSessionCookie = (token: string) => cookie(ADMIN_COOKIE, token, { maxAge: SESSION_DAYS * 86400, secure: config.secureCookies });
export const clearAdminCookie = () => cookie(ADMIN_COOKIE, "", { maxAge: 0, secure: config.secureCookies });

// ---- employees (superadmin only) ----

export const listEmployees = async () =>
  (await db().query(`select ${ADMIN_FIELDS} from admins order by role = 'superadmin' desc, created_at`)) as Admin[];

export async function createEmployee(body: Record<string, unknown>): Promise<Admin> {
  const email = normalizeEmail(body.email);
  if (email === config.admin.superadminEmail) throw new HttpError(400, "That address is the superadmin", "invalid_email");
  const [row] = await db()`
    insert into admins (email, name, role) values (${email}, ${str(body.name, 100) ?? ""}, 'employee')
    on conflict (email) do nothing returning *`;
  if (!row) throw new HttpError(409, "An admin with that email already exists", "exists");
  return publicAdmin(row as unknown as Admin);
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const checkId = (id: string) => {
  if (!UUID.test(id)) throw new HttpError(404, "Employee not found", "not_found");
};

export async function updateEmployee(id: string, body: Record<string, unknown>): Promise<Admin> {
  checkId(id);
  const sql = db();
  const [target] = await sql`select * from admins where id = ${id}`;
  if (!target) throw new HttpError(404, "Employee not found", "not_found");
  if (target.role === "superadmin") throw new HttpError(403, "The superadmin can't be edited here", "forbidden");
  const name = body.name === undefined ? (target.name as string) : (str(body.name, 100) ?? "");
  const active = typeof body.active === "boolean" ? body.active : (target.active as boolean);
  const [row] = await sql`update admins set name = ${name}, active = ${active} where id = ${id} returning *`;
  // Disabling an employee signs them out everywhere.
  if (!active) await sql`delete from admin_sessions where admin_id = ${id}`;
  return publicAdmin(row as unknown as Admin);
}

export async function deleteEmployee(id: string): Promise<void> {
  checkId(id);
  const [t] = await db()`select role from admins where id = ${id}`;
  if (!t) throw new HttpError(404, "Employee not found", "not_found");
  if (t.role === "superadmin") throw new HttpError(403, "The superadmin can't be deleted", "forbidden");
  await db()`delete from admins where id = ${id}`;
}

// ---- customers & subscriptions (read-only) ----

const PAGE = 50;
const page = (v: string | null) => Math.max(0, Math.min(10_000, Number(v) || 0));

function customerView(u: Record<string, unknown>) {
  const row = u as { lifetime: boolean; pro_until: string | null; subscription_plan: string | null; subscription_status: string | null };
  return {
    id: u.id,
    email: u.email,
    createdAt: u.created_at,
    lastLoginAt: u.last_login_at,
    pro: isPro({ lifetime: row.lifetime, pro_until: row.pro_until }),
    lifetime: row.lifetime,
    plan: row.lifetime ? "lifetime" : row.subscription_plan,
    subscriptionStatus: row.subscription_status,
    subscriptionId: u.subscription_id,
    proUntil: row.pro_until,
    dodoCustomerId: u.dodo_customer_id,
  };
}

export async function listCustomers(q: string | null, pageNo: string | null) {
  const sql = db();
  const like = `%${(q ?? "").trim().toLowerCase().replace(/[\\%_]/g, "\\$&")}%`;
  const rows = await sql`select * from users where email like ${like} order by created_at desc limit ${PAGE} offset ${page(pageNo) * PAGE}`;
  const [{ n, pro }] = await sql`select count(*)::int as n, count(*) filter (where lifetime or pro_until > now())::int as pro from users where email like ${like}`;
  return { customers: rows.map(customerView), total: n as number, pro: pro as number, pageSize: PAGE };
}

export async function listSubscriptions(status: string | null, pageNo: string | null) {
  const sql = db();
  const st = status && /^[a-z_]{1,30}$/.test(status) ? status : "";
  const rows = await sql`
    select * from users where (subscription_id is not null or lifetime) and (${st} = '' or subscription_status = ${st} or (${st} = 'lifetime' and lifetime))
    order by coalesce(pro_until, created_at) desc limit ${PAGE} offset ${page(pageNo) * PAGE}`;
  const [{ n }] = await sql`select count(*)::int as n from users where (subscription_id is not null or lifetime) and (${st} = '' or subscription_status = ${st} or (${st} = 'lifetime' and lifetime))`;
  const summary = await sql`select coalesce(subscription_status, 'lifetime') as status, count(*)::int as n from users where subscription_id is not null or lifetime group by 1 order by 2 desc`;
  return { subscriptions: rows.map(customerView), total: n as number, summary, pageSize: PAGE };
}
