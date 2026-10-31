// Every /api route. Mutating requests must be JSON (which a cross-site form can't send) and same-origin.
import { adminLogout, adminSessionCookie, clearAdminCookie, createEmployee, deleteEmployee, listCustomers, listEmployees, listSubscriptions, requireAdmin, requestAdminCode, requireSuperadmin, updateEmployee, verifyAdminCode } from "./admin.ts";
import { listRefundRequests, requestRefund, resolveRefundRequest, transactionsWithRefunds } from "./refunds.ts";
import { linkProduct, planOverview, syncPlans } from "./admin-plans.ts";
import { bearerToken, clearSessionCookie, createStartToken, currentUser, deleteStartToken, endSession, listStartTokens, normalizeEmail, requestCode, requireStartUser, requireUser, sessionCookie, verifyCode } from "./auth.ts";
import { config } from "./config.ts";
import { db, isPro, rateLimit, type User } from "./db.ts";
import { applyEvent, cancelSubscription, cardUpdateLink, changePlan, createCheckout, invoicePdf, lifetimeSold, setCancelAtPeriodEnd, subscriptionDetails, verifyWebhook } from "./dodo.ts";
import { exportCollection, exportDesign, previewExport, type FileOut } from "./exports.ts";
import { HttpError, json, readJson, str, type Req, type Res } from "./http.ts";
import { createItem, deleteItem, getItem, getShared, kindOf, listItems, shareItem, updateItem, usage } from "./items.ts";
import * as start from "./start.ts";
import { cancelAllStart, createStartCheckout, isStartPlan, setStartCancel, startSubscriptions } from "./start-billing.ts";
import { geocode, getCalendar, getFeed, getRates, getWeather } from "./start-feeds.ts";
import { requireStartTier } from "./start-entitlements.ts";
import { LIFETIME_CAP, type PlanId } from "../lib/plans.ts";

function publicUser(u: User) {
  return {
    email: u.email,
    createdAt: u.created_at,
    pro: isPro(u),
    plan: u.lifetime ? "lifetime" : (u.subscription_plan as PlanId | null),
    status: u.lifetime ? "lifetime" : u.subscription_status,
    proUntil: u.lifetime ? null : u.pro_until,
    billing: !!u.dodo_customer_id,
  };
}

const file = (f: FileOut): Res => ({
  status: 200,
  headers: { "content-type": f.mime, "content-disposition": `attachment; filename="${f.filename}"`, "cache-control": "no-store" },
  body: f.body,
  base64: f.base64,
});

async function requirePro(req: Req): Promise<User> {
  const user = await requireUser(req);
  if (!isPro(user)) throw new HttpError(402, "This is a Pro feature", "pro_required");
  return user;
}

/** Browsers send Origin on cross-site POSTs; it must match the host serving the API (works on preview URLs too). */
function sameOrigin(req: Req) {
  const origin = req.headers.origin;
  if (!origin) return;
  let host: string;
  try {
    host = new URL(origin).host;
  } catch {
    throw new HttpError(403, "Cross-origin request refused", "bad_origin");
  }
  const served = req.headers["x-forwarded-host"] ?? req.headers.host;
  if (host !== served && origin.replace(/\/+$/, "") !== config.siteUrl) throw new HttpError(403, "Cross-origin request refused", "bad_origin");
}

async function billingLimit(user: User) {
  if (!(await rateLimit(`billing:${user.id}`, 30))) throw new HttpError(429, "Too many billing requests. Try again later.", "rate_limited");
}

export async function route(req: Req): Promise<Res> {
  const { method, path } = req;
  const seg = path.split("/").filter(Boolean);
  const mutating = method !== "GET" && method !== "HEAD";
  const isWebhook = path === "/webhooks/dodo";
  // The CodeRef Start extension calls /start/* from chrome-extension://… with a bearer token. A browser can't attach
  // that header cross-site without a CORS preflight (which we never answer), and such requests ignore the cookie.
  const extension = seg[0] === "start" && !!bearerToken(req);
  if (mutating && !isWebhook && !extension) sameOrigin(req);

  // ---- auth ----
  if (path === "/auth/request-code" && method === "POST") {
    const body = readJson(req);
    const email = normalizeEmail(body.email);
    const { isNewAccount } = await requestCode(email, req.ip);
    return json(200, { ok: true, isNewAccount });
  }
  if (path === "/auth/verify" && method === "POST") {
    const body = readJson(req);
    const email = normalizeEmail(body.email);
    if (!(await rateLimit(`verify-ip:${req.ip}`, 60))) throw new HttpError(429, "Too many attempts. Try again later.", "rate_limited");
    const { token, user, created } = await verifyCode(email, String(body.code ?? "").trim(), req.headers["user-agent"] ?? "");
    return json(200, { user: publicUser(user), created }, { cookies: [sessionCookie(token)] });
  }
  if (path === "/auth/logout" && method === "POST") {
    await endSession(req);
    return json(200, { ok: true }, { cookies: [clearSessionCookie()] });
  }

  // ---- account ----
  if (path === "/me" && method === "GET") {
    const user = await currentUser(req);
    const lifetimeRemaining = Math.max(0, LIFETIME_CAP - (await lifetimeSold()));
    const paymentsEnabled = config.payments.enabled;
    if (!user) return json(200, { user: null, lifetimeRemaining, paymentsEnabled });
    return json(200, { user: publicUser(user), usage: await usage(user), start: await start.startSummary(user).catch(() => undefined), lifetimeRemaining, paymentsEnabled });
  }
  if (path === "/me" && method === "DELETE") {
    const user = await requireUser(req);
    if (readJson(req).confirm !== user.email) throw new HttpError(400, "Type your email address to confirm", "confirm_required");
    if (user.subscription_id && ["active", "on_hold", "past_due"].includes(user.subscription_status ?? "")) await cancelSubscription(user.subscription_id);
    await cancelAllStart(user.id).catch((e) => console.error("start cancel on account deletion failed", e));
    await db()`delete from users where id = ${user.id}`;
    return json(200, { ok: true }, { cookies: [clearSessionCookie()] });
  }

  // ---- billing ----
  if (path === "/billing/checkout" && method === "POST") {
    const user = await requireUser(req);
    const plan = readJson(req).plan;
    if (plan !== "monthly" && plan !== "yearly" && plan !== "lifetime") throw new HttpError(400, "Unknown plan", "invalid_plan");
    return json(200, { url: await createCheckout(user, plan) });
  }
  if (path === "/billing/transactions" && method === "GET") {
    return json(200, { transactions: await transactionsWithRefunds(await requireUser(req)) });
  }
  if (path === "/billing/refund-request" && method === "POST") {
    const user = await requireUser(req);
    const body = readJson(req);
    await requestRefund(user, body.paymentId, body.reason);
    return json(200, { ok: true });
  }
  if (path === "/billing/subscription" && method === "GET") {
    return json(200, { subscription: await subscriptionDetails(await requireUser(req)).catch(() => null) });
  }
  if (path === "/billing/change-plan" && method === "POST") {
    const user = await requireUser(req);
    await billingLimit(user);
    const plan = readJson(req).plan;
    if (plan !== "monthly" && plan !== "yearly") throw new HttpError(400, "Unknown plan", "invalid_plan");
    await changePlan(user, plan);
    return json(200, { ok: true });
  }
  if (path === "/billing/cancel" && method === "POST") {
    const user = await requireUser(req);
    await billingLimit(user);
    await setCancelAtPeriodEnd(user, readJson(req).cancel !== false);
    return json(200, { ok: true });
  }
  if (path === "/billing/payment-method" && method === "POST") {
    const user = await requireUser(req);
    await billingLimit(user);
    readJson(req);
    return json(200, { url: await cardUpdateLink(user) });
  }
  if (path === "/billing/invoice" && method === "POST") {
    const user = await requireUser(req);
    await billingLimit(user);
    return file(await invoicePdf(user, str(readJson(req).paymentId, 80) ?? ""));
  }
  if (isWebhook && method === "POST") {
    if (!verifyWebhook(config.dodo.webhookSecret, req.headers, req.body)) throw new HttpError(401, "Invalid signature", "bad_signature");
    const id = req.headers["webhook-id"];
    const event = JSON.parse(req.body) as { type?: string; data?: Record<string, unknown> };
    const sql = db();
    const [seen] = await sql`
      insert into webhook_events (id, type, payload) values (${id}, ${event.type ?? null}, ${req.body}::jsonb)
      on conflict (id) do update set id = excluded.id returning processed`;
    if (seen.processed) return json(200, { ok: true, duplicate: true });
    try {
      const result = await applyEvent(event.type ?? "", event.data ?? {});
      await sql`update webhook_events set processed = true, error = null where id = ${id}`;
      return json(200, { ok: true, result });
    } catch (e) {
      await sql`update webhook_events set error = ${String(e instanceof Error ? e.message : e).slice(0, 500)} where id = ${id}`;
      throw e;
    }
  }

  // ---- admin panel (staff: emailed code; employees are managed by the superadmin only) ----
  if (seg[0] === "admin") {
    if (path === "/admin/request-code" && method === "POST") {
      await requestAdminCode(readJson(req).email, req.ip);
      return json(200, { ok: true });
    }
    if (path === "/admin/verify" && method === "POST") {
      const body = readJson(req);
      const { token, admin } = await verifyAdminCode(body.email, body.code, req.ip, req.headers["user-agent"] ?? "");
      return json(200, { admin }, { cookies: [adminSessionCookie(token)] });
    }
    if (path === "/admin/logout" && method === "POST") {
      await adminLogout(req);
      return json(200, { ok: true }, { cookies: [clearAdminCookie()] });
    }
    if (path === "/admin/me" && method === "GET") return json(200, { admin: await requireAdmin(req) });
    if (path === "/admin/customers" && method === "GET") {
      await requireAdmin(req);
      return json(200, await listCustomers(req.query.get("q"), req.query.get("page")));
    }
    if (path === "/admin/subscriptions" && method === "GET") {
      await requireAdmin(req);
      return json(200, await listSubscriptions(req.query.get("status"), req.query.get("page")));
    }
    if (path === "/admin/refunds" && method === "GET") {
      await requireAdmin(req);
      return json(200, { requests: await listRefundRequests() });
    }
    if (seg[1] === "refunds" && seg.length === 3 && method === "PUT") {
      const admin = await requireAdmin(req);
      await resolveRefundRequest(seg[2], readJson(req).status, admin.email);
      return json(200, { ok: true });
    }
    if (path === "/admin/plans" && method === "GET") {
      await requireAdmin(req);
      return json(200, await planOverview());
    }
    if (path === "/admin/plans/sync" && method === "POST") {
      await requireSuperadmin(req);
      readJson(req);
      return json(200, await syncPlans());
    }
    if (seg[1] === "plans" && seg.length === 3 && method === "PUT") {
      await requireSuperadmin(req);
      await linkProduct(seg[2], readJson(req).productId);
      return json(200, { ok: true });
    }
    if (path === "/admin/start" && method === "GET") {
      await requireAdmin(req);
      return json(200, await start.adminStartOverview());
    }
    if (path === "/admin/start/enterprise" && method === "POST") {
      await requireSuperadmin(req);
      await start.grantEnterprise(readJson(req));
      return json(200, { ok: true });
    }
    if (seg[1] === "start" && seg[2] === "templates" && seg.length === 4 && method === "DELETE") {
      await requireAdmin(req);
      await start.unpublishTemplate(seg[3]);
      return json(200, { ok: true });
    }
    if (seg[1] === "employees") {
      await requireSuperadmin(req);
      if (seg.length === 2 && method === "GET") return json(200, { employees: await listEmployees() });
      if (seg.length === 2 && method === "POST") return json(201, { employee: await createEmployee(readJson(req)) });
      if (seg.length === 3 && method === "PUT") return json(200, { employee: await updateEmployee(seg[2], readJson(req)) });
      if (seg.length === 3 && method === "DELETE") {
        await deleteEmployee(seg[2]);
        return json(200, { ok: true });
      }
    }
  }

  // ---- CodeRef Start (start pages, widgets, teams; the extension authenticates with a bearer token) ----
  if (seg[0] === "start") return startRoute(req, seg.slice(1));

  // ---- saved items ----
  if (seg[0] === "items") {
    const user = await requireUser(req);
    if (seg.length === 1 && method === "GET") {
      const kind = req.query.get("kind");
      return json(200, { items: await listItems(user, kind ? kindOf(kind) : undefined), usage: await usage(user) });
    }
    if (seg.length === 1 && method === "POST") return json(201, { item: await createItem(user, readJson(req)) });
    if (seg.length === 2 && method === "GET") return json(200, { item: await getItem(user, seg[1]) });
    if (seg.length === 2 && method === "PUT") return json(200, { item: await updateItem(user, seg[1], readJson(req)) });
    if (seg.length === 2 && method === "DELETE") {
      await deleteItem(user, seg[1]);
      return json(200, { ok: true });
    }
    if (seg.length === 3 && seg[2] === "share" && (method === "POST" || method === "DELETE")) return json(200, { item: await shareItem(user, seg[1], method === "POST") });
  }
  if (seg[0] === "share" && seg.length === 2 && method === "GET") {
    return json(200, await getShared(seg[1]), { headers: { "cache-control": "public, max-age=60" } });
  }

  // ---- Pro exports ----
  // Public: the first lines of an export, so anyone can see what Pro gives them. Cached at the edge for an hour.
  if (path === "/exports/preview" && method === "GET") {
    if (!(await rateLimit(`preview-ip:${req.ip}`, 300))) throw new HttpError(429, "Too many previews. Try again later.", "rate_limited");
    return json(200, await previewExport(str(req.query.get("id"), 200) ?? "", req.query.get("format")), { headers: { "cache-control": "public, max-age=3600, s-maxage=3600" } });
  }
  if (path === "/exports/design" && method === "POST") {
    await requirePro(req);
    const body = readJson(req);
    return file(await exportDesign(str(body.id, 200) ?? "", body.format));
  }
  if (path === "/exports/collection" && method === "POST") {
    const user = await requirePro(req);
    if (!(await rateLimit(`bulk:${user.id}`, 20))) throw new HttpError(429, "Bulk download limit reached. Try again in an hour.", "rate_limited");
    return file(await exportCollection(readJson(req).collection));
  }

  if (path === "/health") return json(200, { ok: true, mode: config.dodo.mode });
  throw new HttpError(404, "Not found", "not_found");
}

async function startRoute(req: Req, seg: string[]): Promise<Res> {
  const { method } = req;
  const ok = json(200, { ok: true });
  const path = `/${seg.join("/")}`;

  // Public: shared pages, the template gallery, widget data and click counts. Data endpoints are cached at the edge.
  if (seg[0] === "public" && seg.length === 2 && (method === "GET" || method === "POST")) {
    if (!(await rateLimit(`start-public:${req.ip}`, 600))) throw new HttpError(429, "Too many requests. Try again later.", "rate_limited");
    return json(200, { page: await start.getPublicPage(seg[1], method === "POST" ? readJson(req).password : undefined) });
  }
  if (path === "/gallery" && method === "GET") {
    return json(200, { templates: await start.listGallery(req.query.get("category"), req.query.get("q")) }, { headers: { "cache-control": "public, max-age=60, s-maxage=300" } });
  }
  if (path === "/click" && method === "POST") {
    if (await rateLimit(`start-click:${req.ip}`, 2000)) await start.recordClick(readJson(req));
    return ok;
  }
  const edge = (data: unknown, seconds: number) => json(200, data, { headers: { "cache-control": `public, max-age=${seconds}, s-maxage=${seconds}` } });
  if (path === "/weather" && method === "GET") return edge(await getWeather(req.query.get("lat"), req.query.get("lon")), 1200);
  if (path === "/geocode" && method === "GET") return edge(await geocode(req.query.get("q")), 86400);
  if (path === "/feed" && method === "GET") {
    if (!(await rateLimit(`start-feed:${req.ip}`, 600))) throw new HttpError(429, "Too many feed requests. Try again later.", "rate_limited");
    return edge(await getFeed(req.query.get("url")), 300);
  }
  if (path === "/rates" && method === "GET") return edge(await getRates(req.query.get("base"), req.query.get("symbols"), req.query.get("coins")), 600);

  const user = await requireStartUser(req);
  const body = () => readJson(req);
  if (method !== "GET" && !(await rateLimit(`start-write:${user.id}`, 1200))) throw new HttpError(429, "Too many changes. Try again in a few minutes.", "rate_limited");

  if (path === "/calendar" && method === "GET") {
    await requireStartTier(user, "pro", "The calendar widget");
    return json(200, await getCalendar(req.query.get("url")), { headers: { "cache-control": "private, max-age=600" } });
  }

  // pages and widgets
  if (path === "/pages" && method === "GET") return json(200, { pages: await start.listPages(user) });
  if (path === "/pages" && method === "POST") return json(201, { page: await start.createPage(user, body()) });
  if (path === "/pages/reorder" && method === "POST") {
    await start.reorderPages(user, body().ids);
    return ok;
  }
  if (seg[0] === "pages" && seg.length === 2) {
    if (method === "GET") return json(200, { page: await start.getPage(user, seg[1]) });
    if (method === "PUT") return json(200, { page: await start.updatePage(user, seg[1], body()) });
    if (method === "DELETE") {
      await start.deletePage(user, seg[1]);
      return ok;
    }
  }
  if (seg[0] === "pages" && seg.length === 3 && method === "POST") {
    const [, id, action] = seg;
    if (action === "duplicate") return json(201, { page: await start.duplicatePage(user, id) });
    if (action === "layout") {
      await start.saveLayout(user, id, body().items);
      return ok;
    }
    if (action === "widgets") return json(201, { widget: await start.createWidget(user, id, body()) });
    if (action === "links") return json(200, await start.addLinks(user, id, body()));
    if (action === "share") return json(200, { page: await start.sharePage(user, id, body()) });
    if (action === "template") return json(200, await start.publishTemplate(user, id, body()));
  }
  if (seg[0] === "widgets" && seg.length === 2) {
    if (method === "PUT") return json(200, { widget: await start.updateWidget(user, seg[1], body()) });
    if (method === "DELETE") {
      await start.deleteWidget(user, seg[1]);
      return ok;
    }
  }
  if (seg[0] === "public" && seg.length === 3 && seg[2] === "clone" && method === "POST") return json(201, await start.clonePublicPage(user, seg[1], body().password));

  // extension: import and inbox
  if (path === "/import" && method === "POST") return json(201, await start.importFolders(user, body()));
  if (path === "/import/file" && method === "POST") return json(201, await start.importFile(user, body()));
  if (path === "/inbox" && method === "GET") return json(200, { items: await start.listInbox(user) });
  if (path === "/inbox" && method === "POST") return json(201, await start.addToInbox(user, body()));
  if (seg[0] === "inbox" && seg.length === 2 && method === "DELETE") {
    await start.deleteInbox(user, seg[1]);
    return ok;
  }
  if (seg[0] === "inbox" && seg.length === 3 && seg[2] === "move" && method === "POST") return json(200, await start.moveInbox(user, seg[1], body()));

  // extension tokens: created and managed from the website only, never by another token
  if (seg[0] === "tokens") {
    if (bearerToken(req)) throw new HttpError(403, "Manage connected browsers on coderef.xyz", "forbidden");
    if (seg.length === 1 && method === "GET") return json(200, { tokens: await listStartTokens(user.id) });
    if (seg.length === 1 && method === "POST") return json(201, { token: await createStartToken(user.id, str(body().name, 80) ?? "Browser") });
    if (seg.length === 2 && method === "DELETE") {
      await deleteStartToken(user.id, seg[1]);
      return ok;
    }
  }

  // teams
  if (path === "/teams" && method === "GET") return json(200, { teams: await start.listTeams(user) });
  if (path === "/teams" && method === "POST") return json(201, await start.createTeam(user, body()));
  if (path === "/invites/accept" && method === "POST") return json(200, await start.acceptInvite(user, body()));
  if (seg[0] === "t" && seg.length === 2 && method === "GET") return json(200, await start.teamBySlug(user, seg[1]));
  if (seg[0] === "t" && seg.length === 3 && seg[2] === "join" && method === "POST") return json(200, await start.joinByDomain(user, seg[1]));
  if (seg[0] === "teams" && seg.length >= 2) {
    const id = seg[1];
    if (seg.length === 2 && method === "GET") return json(200, await start.teamDetail(user, id));
    if (seg.length === 2 && method === "PUT") return json(200, await start.updateTeam(user, id, body()));
    if (seg.length === 3 && seg[2] === "invites" && method === "POST") return json(201, await start.inviteMember(user, id, body()));
    if (seg.length === 4 && seg[2] === "invites" && method === "DELETE") {
      await start.revokeInvite(user, id, seg[3]);
      return ok;
    }
    if (seg.length === 4 && seg[2] === "members" && method === "PUT") {
      await start.updateMember(user, id, seg[3], body());
      return ok;
    }
    if (seg.length === 4 && seg[2] === "members" && method === "DELETE") {
      await start.removeMember(user, id, seg[3]);
      return ok;
    }
    if (seg.length === 3 && seg[2] === "analytics" && method === "GET") return json(200, await start.teamAnalytics(user, id));
  }

  // billing (website only)
  if (seg[0] === "billing") {
    if (bearerToken(req)) throw new HttpError(403, "Manage billing on coderef.xyz", "forbidden");
    if (seg.length === 1 && method === "GET") return json(200, { subscriptions: await startSubscriptions(user) });
    if (seg[1] === "checkout" && method === "POST") {
      const plan = body().plan;
      if (!isStartPlan(plan)) throw new HttpError(400, "Unknown plan", "invalid_plan");
      await billingLimit(user);
      return json(200, { url: await createStartCheckout(user, plan) });
    }
    if (seg[1] === "cancel" && method === "POST") {
      await billingLimit(user);
      const b = body();
      await setStartCancel(user, String(b.id ?? ""), b.cancel !== false);
      return ok;
    }
  }
  throw new HttpError(404, "Not found", "not_found");
}

/** Wraps route() with error handling; used by the Next.js route handler (src/app/api/[...path]/route.ts). */
export async function handle(req: Req): Promise<Res> {
  try {
    return await route(req);
  } catch (e) {
    if (e instanceof HttpError) return json(e.status, { error: e.code, message: e.message });
    console.error("api error", req.method, req.path, e);
    return json(500, { error: "server_error", message: "Something went wrong. Please try again." });
  }
}
