// Passwordless accounts: an emailed 6-digit code both verifies the address and signs in. New addresses get an
// account only once their code is confirmed, so every account has a verified email.
import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { config } from "./config.ts";
import { db, rateLimit, type User } from "./db.ts";
import { sendCodeEmail } from "./email.ts";
import { HttpError, cookie, type Req } from "./http.ts";

export const SESSION_COOKIE = "cr_session";
const SESSION_DAYS = 30;
const CODE_MINUTES = 10;
const MAX_ATTEMPTS = 5;

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normalizeEmail(v: unknown): string {
  const e = typeof v === "string" ? v.trim().toLowerCase() : "";
  if (!e || e.length > 254 || !EMAIL.test(e)) throw new HttpError(400, "Enter a valid email address", "invalid_email");
  return e;
}

const codeHash = (email: string, code: string) => sha256(`${email}:${code}`);

export async function requestCode(email: string, ip: string): Promise<{ isNewAccount: boolean }> {
  if (!(await rateLimit(`code:${email}`, 5)) || !(await rateLimit(`code-ip:${ip}`, 30))) {
    throw new HttpError(429, "Too many codes requested. Try again in an hour.", "rate_limited");
  }
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const sql = db();
  await sql`
    insert into login_codes (email, code_hash, expires_at, attempts, created_at)
    values (${email}, ${codeHash(email, code)}, now() + make_interval(mins => ${CODE_MINUTES}), 0, now())
    on conflict (email) do update set code_hash = excluded.code_hash, expires_at = excluded.expires_at, attempts = 0, created_at = now()`;
  const [existing] = await sql`select 1 from users where email = ${email}`;
  // Local development only: print the code instead of needing an inbox.
  if (process.env.DEV_LOG_CODES === "1") console.log(`[dev] code for ${email}: ${code}`);
  await sendCodeEmail(email, code, !existing);
  return { isNewAccount: !existing };
}

/** Checks the code and opens a session; creates the (now verified) account on first sign-in. */
export async function verifyCode(email: string, code: string, userAgent: string): Promise<{ token: string; user: User; created: boolean }> {
  if (!/^\d{6}$/.test(code)) throw new HttpError(400, "The code is 6 digits", "invalid_code");
  const sql = db();
  const [row] = await sql`update login_codes set attempts = attempts + 1 where email = ${email} returning code_hash, expires_at, attempts`;
  const bad = () => new HttpError(400, "That code is wrong or has expired. Request a new one.", "invalid_code");
  if (!row) throw bad();
  if ((row.attempts as number) > MAX_ATTEMPTS || new Date(row.expires_at as string).getTime() < Date.now()) {
    await sql`delete from login_codes where email = ${email}`;
    throw bad();
  }
  const a = Buffer.from(row.code_hash as string);
  const b = Buffer.from(codeHash(email, code));
  if (a.length !== b.length || !timingSafeEqual(a, b)) throw bad();

  await sql`delete from login_codes where email = ${email}`;
  const [user] = await sql`
    insert into users (email, last_login_at) values (${email}, now())
    on conflict (email) do update set last_login_at = now()
    returning *, (xmax = 0) as created`;
  const token = randomBytes(32).toString("base64url");
  await sql`
    insert into sessions (token_hash, user_id, expires_at, user_agent)
    values (${sha256(token)}, ${user.id}, now() + make_interval(days => ${SESSION_DAYS}), ${userAgent.slice(0, 300)})`;
  // Housekeeping, cheap enough to do on sign-in.
  await sql`delete from sessions where expires_at < now()`;
  return { token, user: user as User, created: !!user.created };
}

export async function currentUser(req: Req): Promise<User | null> {
  const token = req.cookies[SESSION_COOKIE];
  if (!token || token.length > 100) return null;
  const [user] = await db()`
    select u.* from sessions s join users u on u.id = s.user_id
    where s.token_hash = ${sha256(token)} and s.expires_at > now()`;
  return (user as User) ?? null;
}

export async function requireUser(req: Req): Promise<User> {
  const user = await currentUser(req);
  if (!user) throw new HttpError(401, "Sign in to continue", "unauthenticated");
  return user;
}

export async function endSession(req: Req): Promise<void> {
  const token = req.cookies[SESSION_COOKIE];
  if (token) await db()`delete from sessions where token_hash = ${sha256(token)}`;
}

export const sessionCookie = (token: string) => cookie(SESSION_COOKIE, token, { maxAge: SESSION_DAYS * 86400, secure: config.secureCookies });
export const clearSessionCookie = () => cookie(SESSION_COOKIE, "", { maxAge: 0, secure: config.secureCookies });

// The session cookie is HttpOnly, so the browser can't tell whether it exists. This readable marker (no secret in it)
// lets the client skip calling /me when nobody is signed in.
export const SESSION_FLAG_COOKIE = "cr_in";
export const sessionFlagCookie = () => cookie(SESSION_FLAG_COOKIE, "1", { maxAge: SESSION_DAYS * 86400, secure: config.secureCookies, httpOnly: false });
export const clearSessionFlagCookie = () => cookie(SESSION_FLAG_COOKIE, "", { maxAge: 0, secure: config.secureCookies, httpOnly: false });
