// CodeRef Start: start pages made of widgets, personal or shared with a team, plus the browser extension's endpoints
// (save links, import bookmarks), the inbox, public sharing, the template gallery, teams and link analytics.
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { normalizeEmail } from "./auth.ts";
import { config } from "./config.ts";
import { db, type User } from "./db.ts";
import { sendPlainEmail } from "./email.ts";
import { HttpError, str } from "./http.ts";
import { atLeast, limitsFor, requireStartTier, startTier, teamActive } from "./start-entitlements.ts";
import { canUseWidget, START_MAX_LINKS_PER_WIDGET, START_MAX_WIDGET_BYTES, TEMPLATE_CATEGORIES, widgetDef, type StartLink, type StartTheme, type StartTier } from "../lib/start-plans.ts";

type Row = Record<string, unknown>;
type Role = "owner" | "admin" | "editor" | "viewer";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
const notFound = () => new HttpError(404, "Not found", "not_found");
const uuid = (v: unknown) => {
  if (typeof v !== "string" || !UUID.test(v)) throw notFound();
  return v;
};
const int = (v: unknown, min: number, max: number, fallback: number) => (typeof v === "number" && Number.isInteger(v) ? Math.min(max, Math.max(min, v)) : fallback);
const EDIT_ROLES: Role[] = ["owner", "admin", "editor"];
const ADMIN_ROLES: Role[] = ["owner", "admin"];

// ---- shapes ----

function sanitizeTheme(v: unknown, tier: StartTier): StartTheme {
  const t = v && typeof v === "object" ? (v as Record<string, unknown>) : {};
  const out: StartTheme = {};
  const bg = str(t.background, 200);
  if (bg && /^(#[0-9a-f]{3,8}|linear-gradient\([#0-9a-z%,.\s()-]+\)|radial-gradient\([#0-9a-z%,.\s()-]+\)|anim:[a-z0-9-]+)$/i.test(bg)) out.background = bg;
  const img = str(t.backgroundImage, 1000);
  if (img && /^https:\/\//i.test(img) && !/["'()\\<>]/.test(img)) out.backgroundImage = img;
  if (typeof t.columns === "number") out.columns = int(t.columns, 1, 5, 4);
  if (t.density === "compact" || t.density === "comfortable") out.density = t.density;
  if (t.font === "sans" || t.font === "mono" || t.font === "serif") out.font = t.font;
  if (t.scheme === "auto" || t.scheme === "light" || t.scheme === "dark") out.scheme = t.scheme;
  // Custom CSS is PRO; it's scoped to the page container on the client and can't load remote resources.
  const css = typeof t.customCss === "string" ? t.customCss.slice(0, 8000) : "";
  if (css && atLeast(tier, "pro") && !/@import|url\s*\(|expression\s*\(|<\/?style/i.test(css)) out.customCss = css;
  return out;
}

function jsonField(v: unknown, label: string): string {
  const raw = JSON.stringify(v && typeof v === "object" && !Array.isArray(v) ? v : {});
  if (Buffer.byteLength(raw) > START_MAX_WIDGET_BYTES) throw new HttpError(413, `${label} is limited to ${START_MAX_WIDGET_BYTES / 1024} KB`, "too_large");
  return raw;
}

const link = (v: unknown): StartLink | null => {
  if (!v || typeof v !== "object") return null;
  const { title, url } = v as Record<string, unknown>;
  if (typeof url !== "string" || url.length > 2000 || !/^https?:\/\/[^\s]+$/i.test(url.trim())) return null;
  return { url: url.trim(), title: (typeof title === "string" && title.trim() ? title.trim() : url.trim()).slice(0, 200) };
};
export const cleanLinks = (v: unknown, max = START_MAX_LINKS_PER_WIDGET): StartLink[] => (Array.isArray(v) ? v.map(link).filter((l): l is StartLink => !!l).slice(0, max) : []);

const pageOut = (r: Row, canEdit: boolean) => ({
  id: r.id as string,
  title: r.title as string,
  icon: (r.icon as string) ?? "",
  position: r.position as number,
  theme: (r.theme ?? {}) as StartTheme,
  visibility: r.visibility as string,
  shareId: (r.share_id as string | null) ?? null,
  protected: !!r.password_hash,
  isTemplate: !!r.is_template,
  templateCategory: (r.template_category as string | null) ?? null,
  teamId: (r.team_id as string | null) ?? null,
  teamName: (r.team_name as string | null) ?? null,
  canEdit,
  updatedAt: r.updated_at as string,
});

const widgetOut = (r: Row) => ({
  id: r.id as string,
  type: r.type as string,
  title: r.title as string,
  col: r.col as number,
  position: r.position as number,
  collapsed: !!r.collapsed,
  color: (r.color as string) ?? "",
  config: (r.config ?? {}) as Record<string, unknown>,
  data: (r.data ?? {}) as Record<string, unknown>,
});

// ---- access ----

async function teamRole(userId: string, teamId: string): Promise<Role | null> {
  const [m] = await db()`select role from start_team_members where team_id = ${teamId} and user_id = ${userId}`;
  return (m?.role as Role) ?? null;
}

/** Loads a page the user may see; `edit` also requires write access (owner, or editor+ on a team page). */
async function pageAccess(user: User, pageId: unknown, need: "view" | "edit"): Promise<{ page: Row; canEdit: boolean; role: Role | null }> {
  const id = uuid(pageId);
  const [page] = await db()`select p.*, t.name as team_name from start_pages p left join start_teams t on t.id = p.team_id where p.id = ${id}`;
  if (!page) throw notFound();
  let canEdit = false;
  let role: Role | null = null;
  if (page.team_id) {
    role = await teamRole(user.id, page.team_id as string);
    if (!role) throw notFound();
    canEdit = EDIT_ROLES.includes(role);
  } else {
    if (page.owner_id !== user.id) throw notFound();
    canEdit = true;
  }
  if (need === "edit" && !canEdit) throw new HttpError(403, "You can view this team page but not change it", "read_only");
  return { page, canEdit, role };
}

async function personalPageCount(userId: string): Promise<number> {
  const [{ n }] = await db()`select count(*)::int as n from start_pages where owner_id = ${userId} and team_id is null`;
  return n as number;
}

async function assertPageRoom(user: User, teamId: string | null) {
  if (teamId) return;
  const tier = await startTier(user);
  const max = limitsFor(tier).pages;
  if ((await personalPageCount(user.id)) >= max) {
    throw new HttpError(402, tier === "free" ? `Free accounts can have ${max} start pages. Upgrade to Start PRO for unlimited pages.` : `You've reached ${max} pages`, "start_upgrade_required");
  }
}

// ---- pages ----

export async function listPages(user: User) {
  const rows = await db()`
    select p.*, t.name as team_name, m.role
    from start_pages p
    left join start_teams t on t.id = p.team_id
    left join start_team_members m on m.team_id = p.team_id and m.user_id = ${user.id}
    where (p.team_id is null and p.owner_id = ${user.id}) or m.user_id is not null
    order by (p.team_id is not null), t.name nulls first, p.position, p.created_at`;
  return rows.map((r) => pageOut(r, !r.team_id || EDIT_ROLES.includes(r.role as Role)));
}

async function pageWithWidgets(page: Row, canEdit: boolean) {
  const widgets = await db()`select * from start_widgets where page_id = ${page.id} order by col, position`;
  return { ...pageOut(page, canEdit), widgets: widgets.map(widgetOut) };
}

export async function getPage(user: User, id: unknown) {
  const { page, canEdit } = await pageAccess(user, id, "view");
  return pageWithWidgets(page, canEdit);
}

/** A new user's first page: a useful starting layout instead of a blank screen. */
const STARTER: { type: string; title: string; col: number; config?: object; data?: object }[] = [
  { type: "search", title: "Search", col: 0, config: { engine: "google" } },
  { type: "bookmarks", title: "Daily", col: 0, data: { links: [{ title: "Gmail", url: "https://mail.google.com/" }, { title: "Calendar", url: "https://calendar.google.com/" }, { title: "YouTube", url: "https://www.youtube.com/" }, { title: "Wikipedia", url: "https://www.wikipedia.org/" }] } },
  { type: "bookmarks", title: "Developer", col: 1, data: { links: [{ title: "GitHub", url: "https://github.com/" }, { title: "Stack Overflow", url: "https://stackoverflow.com/" }, { title: "MDN Web Docs", url: "https://developer.mozilla.org/" }, { title: "CodeRef cheat sheets", url: "https://coderef.xyz/" }] } },
  { type: "notes", title: "Notes", col: 1, data: { text: "Welcome to **CodeRef Start**.\n\nPress **e** to edit this page, drag widgets around, and add more with **+ Widget**." } },
  { type: "clock", title: "Clock", col: 2 },
  { type: "rss", title: "Hacker News", col: 2, config: { url: "https://hnrss.org/frontpage", count: 8 } },
  { type: "todo", title: "To-do", col: 3, data: { items: [{ id: "1", text: "Install the CodeRef Start extension", done: false }, { id: "2", text: "Import my bookmarks", done: false }] } },
  { type: "weather", title: "Weather", col: 3 },
];

export async function createPage(user: User, body: Record<string, unknown>) {
  const teamId = body.teamId ? uuid(body.teamId) : null;
  if (teamId) {
    const role = await teamRole(user.id, teamId);
    if (!role || !EDIT_ROLES.includes(role)) throw new HttpError(403, "Only team editors can add team pages", "forbidden");
    if (!(await teamActive(teamId))) throw new HttpError(402, "This team's plan has ended. Renew Start Team to add pages.", "start_upgrade_required");
  }
  await assertPageRoom(user, teamId);
  const tier = await startTier(user);
  const sql = db();
  const [{ pos }] = teamId
    ? await sql`select coalesce(max(position), -1) + 1 as pos from start_pages where team_id = ${teamId}`
    : await sql`select coalesce(max(position), -1) + 1 as pos from start_pages where owner_id = ${user.id} and team_id is null`;
  const theme = JSON.stringify(sanitizeTheme(body.theme ?? { columns: 4 }, tier));
  const [page] = await sql`
    insert into start_pages (owner_id, team_id, title, icon, position, theme, visibility)
    values (${user.id}, ${teamId}, ${str(body.title, 80) ?? "My start page"}, ${str(body.icon, 8) ?? ""}, ${pos}, ${theme}::jsonb, ${teamId ? "team" : "private"})
    returning *`;
  if (body.starter === true) {
    for (const [i, w] of STARTER.entries()) {
      await sql`insert into start_widgets (page_id, type, title, col, position, config, data)
        values (${page.id}, ${w.type}, ${w.title}, ${w.col}, ${i}, ${JSON.stringify(w.config ?? {})}::jsonb, ${JSON.stringify(w.data ?? {})}::jsonb)`;
    }
  }
  return pageWithWidgets(page, true);
}

export async function updatePage(user: User, id: unknown, body: Record<string, unknown>) {
  const { page } = await pageAccess(user, id, "edit");
  const tier = await startTier(user);
  const title = body.title === undefined ? (page.title as string) : (str(body.title, 80) ?? (page.title as string));
  const icon = body.icon === undefined ? (page.icon as string) : (str(body.icon, 8) ?? "");
  const theme = body.theme === undefined ? JSON.stringify(page.theme ?? {}) : JSON.stringify(sanitizeTheme(body.theme, tier));
  const [r] = await db()`update start_pages set title = ${title}, icon = ${icon}, theme = ${theme}::jsonb, updated_at = now() where id = ${page.id} returning *`;
  return pageOut({ ...r, team_name: page.team_name }, true);
}

export async function deletePage(user: User, id: unknown) {
  const { page, role } = await pageAccess(user, id, "edit");
  if (page.team_id && !ADMIN_ROLES.includes(role as Role)) throw new HttpError(403, "Only team admins can delete team pages", "forbidden");
  await db()`delete from start_pages where id = ${page.id}`;
}

/** Saves the tab order of the user's personal pages (team page order is per team, set by admins). */
export async function reorderPages(user: User, ids: unknown) {
  if (!Array.isArray(ids)) throw new HttpError(400, "Expected a list of page ids", "invalid_order");
  const sql = db();
  for (const [i, id] of ids.slice(0, 500).entries()) {
    if (typeof id === "string" && UUID.test(id)) await sql`update start_pages set position = ${i} where id = ${id} and owner_id = ${user.id} and team_id is null`;
  }
}

async function copyPage(user: User, source: Row, title: string, teamId: string | null = null) {
  const sql = db();
  const [{ pos }] = await sql`select coalesce(max(position), -1) + 1 as pos from start_pages where owner_id = ${user.id} and team_id is null`;
  const [page] = await sql`
    insert into start_pages (owner_id, team_id, title, icon, position, theme, visibility)
    values (${user.id}, ${teamId}, ${title.slice(0, 80)}, ${source.icon ?? ""}, ${pos}, ${JSON.stringify(source.theme ?? {})}::jsonb, ${teamId ? "team" : "private"})
    returning *`;
  await sql`
    insert into start_widgets (page_id, type, title, col, position, collapsed, color, config, data)
    select ${page.id}, type, title, col, position, collapsed, color, config, data from start_widgets where page_id = ${source.id}`;
  return page;
}

export async function duplicatePage(user: User, id: unknown) {
  const { page } = await pageAccess(user, id, "view");
  await assertPageRoom(user, null);
  return pageWithWidgets(await copyPage(user, page, `${page.title} (copy)`), true);
}

/** Bulk column/position update after drag and drop. */
export async function saveLayout(user: User, pageId: unknown, items: unknown) {
  const { page } = await pageAccess(user, pageId, "edit");
  if (!Array.isArray(items)) throw new HttpError(400, "Expected a layout", "invalid_layout");
  const sql = db();
  for (const it of items.slice(0, 300)) {
    const { id, col, position } = (it ?? {}) as Record<string, unknown>;
    if (typeof id !== "string" || !UUID.test(id)) continue;
    await sql`update start_widgets set col = ${int(col, 0, 4, 0)}, position = ${int(position, 0, 10_000, 0)} where id = ${id} and page_id = ${page.id}`;
  }
  await sql`update start_pages set updated_at = now() where id = ${page.id}`;
}

// ---- widgets ----

export async function createWidget(user: User, pageId: unknown, body: Record<string, unknown>) {
  const { page } = await pageAccess(user, pageId, "edit");
  const type = typeof body.type === "string" ? body.type : "";
  const def = widgetDef(type);
  if (!def) throw new HttpError(400, "Unknown widget type", "invalid_widget");
  const tier = await startTier(user);
  if (!canUseWidget(tier, type)) {
    throw new HttpError(402, `The ${def.label} widget is part of ${def.tier === "team" ? "Start Team" : "Start PRO"}`, "start_upgrade_required");
  }
  const sql = db();
  const [{ n }] = await sql`select count(*)::int as n from start_widgets where page_id = ${page.id}`;
  if ((n as number) >= limitsFor(tier).widgetsPerPage) throw new HttpError(402, `A page can hold ${limitsFor(tier).widgetsPerPage} widgets on your plan`, "start_upgrade_required");
  const col = int(body.col, 0, 4, 0);
  const [{ pos }] = await sql`select coalesce(max(position), -1) + 1 as pos from start_widgets where page_id = ${page.id} and col = ${col}`;
  const [w] = await sql`
    insert into start_widgets (page_id, type, title, col, position, color, config, data)
    values (${page.id}, ${type}, ${str(body.title, 80) ?? def.label}, ${col}, ${pos}, ${str(body.color, 20) ?? ""}, ${jsonField(body.config, "Widget settings")}::jsonb, ${jsonField(body.data, "Widget content")}::jsonb)
    returning *`;
  await sql`update start_pages set updated_at = now() where id = ${page.id}`;
  return widgetOut(w);
}

async function widgetAccess(user: User, widgetId: unknown) {
  const id = uuid(widgetId);
  const [w] = await db()`select * from start_widgets where id = ${id}`;
  if (!w) throw notFound();
  await pageAccess(user, w.page_id, "edit");
  return w;
}

export async function updateWidget(user: User, widgetId: unknown, body: Record<string, unknown>) {
  const w = await widgetAccess(user, widgetId);
  const [r] = await db()`
    update start_widgets set
      title = ${body.title === undefined ? w.title : (str(body.title, 80) ?? "")},
      collapsed = ${typeof body.collapsed === "boolean" ? body.collapsed : w.collapsed},
      color = ${body.color === undefined ? w.color : (str(body.color, 20) ?? "")},
      col = ${body.col === undefined ? w.col : int(body.col, 0, 4, w.col as number)},
      position = ${body.position === undefined ? w.position : int(body.position, 0, 10_000, w.position as number)},
      config = ${body.config === undefined ? JSON.stringify(w.config) : jsonField(body.config, "Widget settings")}::jsonb,
      data = ${body.data === undefined ? JSON.stringify(w.data) : jsonField(body.data, "Widget content")}::jsonb,
      updated_at = now()
    where id = ${w.id} returning *`;
  return widgetOut(r);
}

export async function deleteWidget(user: User, widgetId: unknown) {
  const w = await widgetAccess(user, widgetId);
  await db()`delete from start_widgets where id = ${w.id}`;
}

// ---- extension: save links, import bookmarks ----

/** Appends links to the bookmarks widget with this title (created in the shortest column if missing). Skips duplicates. */
export async function addLinks(user: User, pageId: unknown, body: Record<string, unknown>) {
  const { page } = await pageAccess(user, pageId, "edit");
  const links = cleanLinks(body.links, 200);
  if (!links.length) throw new HttpError(400, "No web links to save", "invalid_links");
  const title = str(body.widgetTitle, 80) ?? "Saved";
  const sql = db();
  let [w] = await sql`select * from start_widgets where page_id = ${page.id} and type = 'bookmarks' and lower(title) = lower(${title}) order by position limit 1`;
  if (!w) {
    const cols = Math.min(5, Math.max(1, ((page.theme as StartTheme)?.columns ?? 4) as number));
    const counts = await sql`select col, count(*)::int as n from start_widgets where page_id = ${page.id} group by col`;
    let col = 0;
    for (let c = 0; c < cols; c++) if ((counts.find((r) => r.col === c)?.n ?? 0) < (counts.find((r) => r.col === col)?.n ?? 0)) col = c;
    [w] = await sql`insert into start_widgets (page_id, type, title, col, position, data) values (${page.id}, 'bookmarks', ${title}, ${col}, 0, '{"links":[]}'::jsonb) returning *`;
  }
  const existing = cleanLinks((w.data as Row)?.links);
  const seen = new Set(existing.map((l) => l.url));
  const added = links.filter((l) => !seen.has(l.url) && seen.add(l.url));
  const merged = [...existing, ...added].slice(0, START_MAX_LINKS_PER_WIDGET);
  await sql`update start_widgets set data = jsonb_set(data, '{links}', ${JSON.stringify(merged)}::jsonb), updated_at = now() where id = ${w.id}`;
  await sql`update start_pages set updated_at = now() where id = ${page.id}`;
  return { widgetId: w.id as string, added: added.length };
}

/** Creates a new page from bookmark folders: one bookmarks widget per folder, spread over four columns. */
export async function importFolders(user: User, body: Record<string, unknown>) {
  const folders = (Array.isArray(body.folders) ? body.folders : []).slice(0, 60).map((f) => {
    const r = (f ?? {}) as Record<string, unknown>;
    return { title: str(r.title, 80) ?? "Bookmarks", links: cleanLinks(r.links, 200), feeds: Array.isArray(r.feeds) ? cleanLinks(r.feeds, 20) : [] };
  }).filter((f) => f.links.length || f.feeds.length);
  if (!folders.length) throw new HttpError(400, "Nothing to import", "invalid_import");
  await assertPageRoom(user, null);
  const sql = db();
  const [{ pos }] = await sql`select coalesce(max(position), -1) + 1 as pos from start_pages where owner_id = ${user.id} and team_id is null`;
  const [page] = await sql`insert into start_pages (owner_id, title, position, theme) values (${user.id}, ${str(body.title, 80) ?? "Imported bookmarks"}, ${pos}, '{"columns":4}'::jsonb) returning *`;
  const tier = await startTier(user);
  let i = 0;
  let count = 0;
  for (const f of folders) {
    if (i >= limitsFor(tier).widgetsPerPage) break;
    if (f.links.length) {
      await sql`insert into start_widgets (page_id, type, title, col, position, data) values (${page.id}, 'bookmarks', ${f.title}, ${i % 4}, ${Math.floor(i / 4)}, ${JSON.stringify({ links: f.links })}::jsonb)`;
      count += f.links.length;
      i++;
    }
    for (const feed of f.feeds) {
      if (i >= limitsFor(tier).widgetsPerPage) break;
      await sql`insert into start_widgets (page_id, type, title, col, position, config) values (${page.id}, 'rss', ${feed.title.slice(0, 80)}, ${i % 4}, ${Math.floor(i / 4)}, ${JSON.stringify({ url: feed.url, count: 8 })}::jsonb)`;
      count++;
      i++;
    }
  }
  return { page: { id: page.id as string }, links: count };
}

const unescapeHtml = (s: string) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");

/** Netscape bookmark HTML (what every browser and start.me export) -> folders, keeping the folder path. */
export function parseBookmarkHtml(html: string): { title: string; links: StartLink[] }[] {
  const folders = new Map<string, StartLink[]>();
  const path: string[] = [];
  let pending: string | null = null;
  const re = /<H3[^>]*>([\s\S]*?)<\/H3>|<DL[^>]*>|<\/DL>|<A\s[^>]*HREF="([^"]+)"[^>]*>([\s\S]*?)<\/A>/gi;
  for (let m; (m = re.exec(html)); ) {
    const t = m[0].slice(0, 3).toUpperCase();
    if (m[1] !== undefined) pending = unescapeHtml(m[1].trim()) || "Folder";
    else if (t === "<DL") {
      path.push(pending ?? "");
      pending = null;
    } else if (t === "</D") path.pop();
    else if (m[2]) {
      const l = link({ url: unescapeHtml(m[2]), title: unescapeHtml(m[3].replace(/<[^>]*>/g, "").trim()) });
      if (!l) continue;
      const name = path.filter(Boolean).join(" / ").slice(0, 80) || "Bookmarks";
      if (!folders.has(name)) folders.set(name, []);
      folders.get(name)!.push(l);
    }
  }
  return [...folders].map(([title, links]) => ({ title, links: links.slice(0, 200) })).slice(0, 60);
}

/** OPML (feed-reader export) -> RSS feeds grouped by outline folder. */
export function parseOpml(xml: string): { title: string; links: StartLink[]; feeds: StartLink[] }[] {
  const groups = new Map<string, StartLink[]>();
  let group = "Feeds";
  const re = /<outline\b([^>]*?)(\/?)>|<\/outline>/gi;
  const attr = (a: string, n: string) => unescapeHtml(a.match(new RegExp(`\\b${n}="([^"]*)"`, "i"))?.[1] ?? "");
  for (let m; (m = re.exec(xml)); ) {
    if (m[0].startsWith("</")) {
      group = "Feeds";
      continue;
    }
    const xmlUrl = attr(m[1], "xmlUrl");
    const title = attr(m[1], "title") || attr(m[1], "text");
    if (!xmlUrl && !m[2]) group = title || "Feeds";
    const l = xmlUrl ? link({ url: xmlUrl, title: title || xmlUrl }) : null;
    if (l) {
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group)!.push(l);
    }
  }
  return [...groups].map(([title, feeds]) => ({ title, links: [], feeds: feeds.slice(0, 20) })).slice(0, 30);
}

export async function importFile(user: User, body: Record<string, unknown>) {
  const text = typeof body.content === "string" ? body.content.slice(0, 5_000_000) : "";
  if (!text) throw new HttpError(400, "Choose a file to import", "invalid_import");
  const folders = /<opml[\s>]/i.test(text) ? parseOpml(text) : parseBookmarkHtml(text);
  if (!folders.length) throw new HttpError(400, "No bookmarks or feeds found in that file", "invalid_import");
  return importFolders(user, { folders, title: body.title ?? "Imported" });
}

// ---- inbox ----

export async function listInbox(user: User) {
  const rows = await db()`select id, title, url, created_at from start_inbox where user_id = ${user.id} order by created_at desc limit 500`;
  return rows.map((r) => ({ id: r.id as string, title: r.title as string, url: r.url as string, createdAt: r.created_at as string }));
}

export async function addToInbox(user: User, body: Record<string, unknown>) {
  const links = cleanLinks(body.links, 200);
  if (!links.length) throw new HttpError(400, "No web links to save", "invalid_links");
  const sql = db();
  const [{ n }] = await sql`select count(*)::int as n from start_inbox where user_id = ${user.id}`;
  if ((n as number) + links.length > 500) throw new HttpError(409, "Your inbox is full (500 links). File or delete some first.", "limit_reached");
  for (const l of links) await sql`insert into start_inbox (user_id, title, url) values (${user.id}, ${l.title}, ${l.url})`;
  return { added: links.length };
}

export async function deleteInbox(user: User, id: unknown) {
  if (id === "all") await db()`delete from start_inbox where user_id = ${user.id}`;
  else await db()`delete from start_inbox where id = ${uuid(id)} and user_id = ${user.id}`;
}

/** Files an inbox link into a bookmarks widget on a page. */
export async function moveInbox(user: User, id: unknown, body: Record<string, unknown>) {
  const [item] = await db()`select * from start_inbox where id = ${uuid(id)} and user_id = ${user.id}`;
  if (!item) throw notFound();
  const r = await addLinks(user, body.pageId, { widgetTitle: body.widgetTitle, links: [{ title: item.title, url: item.url }] });
  await db()`delete from start_inbox where id = ${item.id}`;
  return r;
}

// ---- sharing ----

const hashPassword = (pw: string) => {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(pw, salt, 32).toString("hex")}`;
};
const checkPassword = (pw: string, stored: string) => {
  const [salt, hash] = stored.split(":");
  const got = scryptSync(pw, salt, 32);
  const want = Buffer.from(hash, "hex");
  return got.length === want.length && timingSafeEqual(got, want);
};

export async function sharePage(user: User, id: unknown, body: Record<string, unknown>) {
  const { page, role } = await pageAccess(user, id, "edit");
  if (page.team_id && !ADMIN_ROLES.includes(role as Role)) throw new HttpError(403, "Only team admins can share team pages publicly", "forbidden");
  const visibility = body.visibility === "public" ? "public" : page.team_id ? "team" : "private";
  let passwordHash = (page.password_hash as string | null) ?? null;
  if (body.password === null || body.password === "") passwordHash = null;
  else if (typeof body.password === "string") {
    await requireStartTier(user, "pro", "Password-protected pages");
    if (body.password.length < 4 || body.password.length > 100) throw new HttpError(400, "Use 4 to 100 characters for the password", "invalid_password");
    passwordHash = hashPassword(body.password);
  }
  const shareId = visibility === "public" ? ((page.share_id as string | null) ?? randomBytes(9).toString("base64url")) : page.share_id;
  const [r] = await db()`
    update start_pages set visibility = ${visibility}, share_id = ${shareId}, password_hash = ${passwordHash},
      is_template = ${visibility === "public" ? page.is_template : false}, updated_at = now()
    where id = ${page.id} returning *`;
  return pageOut({ ...r, team_name: page.team_name }, true);
}

async function publicPageRow(shareId: unknown, password: unknown): Promise<Row> {
  if (typeof shareId !== "string" || !/^[\w-]{6,30}$/.test(shareId)) throw notFound();
  const [page] = await db()`select * from start_pages where share_id = ${shareId} and visibility = 'public'`;
  if (!page) throw notFound();
  if (page.password_hash && !(typeof password === "string" && password && checkPassword(password, page.password_hash as string))) {
    throw new HttpError(401, password ? "That password is wrong" : "This page is password protected", "password_required");
  }
  return page;
}

export async function getPublicPage(shareId: unknown, password: unknown) {
  const page = await publicPageRow(shareId, password);
  await db()`update start_pages set views = views + 1 where id = ${page.id}`;
  const out = await pageWithWidgets(page, false);
  // Team-only widgets (directory, announcements) and private notes stay private even on a public page.
  return { ...out, widgets: out.widgets.filter((w) => w.type !== "directory") };
}

export async function clonePublicPage(user: User, shareId: unknown, password: unknown) {
  const source = await publicPageRow(shareId, password);
  await assertPageRoom(user, null);
  const page = await copyPage(user, source, source.title as string);
  await db()`update start_pages set clone_count = clone_count + 1 where id = ${source.id}`;
  return { page: { id: page.id as string } };
}

// ---- template gallery ----

export async function listGallery(category: string | null, q: string | null) {
  const cat = category && (TEMPLATE_CATEGORIES as readonly string[]).includes(category) ? category : null;
  const term = (q ?? "").trim().slice(0, 60);
  const like = `%${term.replace(/[%_\\]/g, "\\$&")}%`;
  const rows = await db()`
    select p.id, p.title, p.icon, p.share_id, p.template_category, p.template_description, p.clone_count, p.views, p.theme, p.updated_at,
      (select count(*)::int from start_widgets w where w.page_id = p.id) as widgets,
      (select coalesce(json_agg(distinct w.type), '[]') from start_widgets w where w.page_id = p.id) as types
    from start_pages p
    where p.is_template and p.visibility = 'public' and p.password_hash is null
      and (${cat}::text is null or p.template_category = ${cat})
      and (${term} = '' or p.title ilike ${like} or p.template_description ilike ${like})
    order by p.clone_count desc, p.updated_at desc limit 60`;
  return rows.map((r) => ({
    shareId: r.share_id as string,
    title: r.title as string,
    icon: r.icon as string,
    category: r.template_category as string | null,
    description: r.template_description as string,
    clones: r.clone_count as number,
    views: r.views as number,
    widgets: r.widgets as number,
    types: r.types as string[],
    theme: r.theme as StartTheme,
  }));
}

export async function publishTemplate(user: User, id: unknown, body: Record<string, unknown>) {
  const { page } = await pageAccess(user, id, "edit");
  if (page.team_id) throw new HttpError(400, "Copy a team page to your own pages before publishing it as a template", "invalid_template");
  if (body.publish === false) {
    await db()`update start_pages set is_template = false where id = ${page.id}`;
    return { ok: true };
  }
  const category = typeof body.category === "string" && (TEMPLATE_CATEGORIES as readonly string[]).includes(body.category) ? body.category : "Personal";
  const shareId = (page.share_id as string | null) ?? randomBytes(9).toString("base64url");
  await db()`
    update start_pages set is_template = true, visibility = 'public', share_id = ${shareId}, password_hash = null,
      template_category = ${category}, template_description = ${str(body.description, 280) ?? ""}, updated_at = now()
    where id = ${page.id}`;
  return { ok: true, shareId };
}

/** Admin moderation: take a template out of the gallery. */
export async function unpublishTemplate(shareId: unknown) {
  if (typeof shareId !== "string") throw notFound();
  await db()`update start_pages set is_template = false where share_id = ${shareId}`;
}

// ---- teams ----

const SLUG = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/;
const RESERVED = new Set(["admin", "api", "app", "connect", "new", "settings", "team", "teams", "start", "help", "support", "billing"]);

export async function listTeams(user: User) {
  const rows = await db()`
    select t.*, m.role, (select count(*)::int from start_team_members x where x.team_id = t.id) as members
    from start_team_members m join start_teams t on t.id = m.team_id
    where m.user_id = ${user.id} order by t.name`;
  return Promise.all(
    rows.map(async (r) => ({
      id: r.id as string,
      name: r.name as string,
      slug: r.slug as string,
      role: r.role as Role,
      members: r.members as number,
      seatLimit: r.seat_limit as number,
      logoUrl: (r.logo_url as string | null) ?? null,
      brandColor: (r.brand_color as string | null) ?? null,
      defaultPageId: (r.default_page_id as string | null) ?? null,
      announcement: (r.announcement as string) ?? "",
      allowedDomains: (r.allowed_domains as string[]) ?? [],
      active: await teamActive(r.id as string),
    })),
  );
}

export async function createTeam(user: User, body: Record<string, unknown>) {
  const tier = await requireStartTier(user, "team", "Teams");
  const name = str(body.name, 80);
  if (!name) throw new HttpError(400, "Give your team a name", "invalid_team");
  const slug = (str(body.slug, 40) ?? name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
  if (!SLUG.test(slug) || RESERVED.has(slug)) throw new HttpError(400, "Use 1 to 40 lowercase letters, numbers and dashes for the address", "invalid_slug");
  const sql = db();
  const [{ n }] = await sql`select count(*)::int as n from start_teams where owner_id = ${user.id}`;
  if ((n as number) >= limitsFor(tier).teams) throw new HttpError(402, tier === "team" ? "Start Team includes one team. Contact us about Enterprise for more." : "Team limit reached", "start_upgrade_required");
  const [taken] = await sql`select 1 from start_teams where slug = ${slug}`;
  if (taken) throw new HttpError(409, "That team address is taken", "slug_taken");
  // The team takes its seats from the owner's unassigned team plan.
  const [sub] = await sql`select id, seats, plan from start_subscriptions where user_id = ${user.id} and team_id is null and plan in ('start_team_monthly', 'start_enterprise') and pro_until > now() order by created_at limit 1`;
  if (!sub) throw new HttpError(402, "Each Start Team plan covers one team. Buy another plan for a second team.", "start_upgrade_required");
  const [team] = await sql`insert into start_teams (name, slug, owner_id, seat_limit) values (${name}, ${slug}, ${user.id}, ${sub.plan === "start_enterprise" ? 100_000 : (sub.seats as number)}) returning *`;
  await sql`update start_subscriptions set team_id = ${team.id} where id = ${sub.id}`;
  await sql`insert into start_team_members (team_id, user_id, role) values (${team.id}, ${user.id}, 'owner')`;
  const page = await createPage(user, { teamId: team.id, title: `${name} home`, starter: true });
  await sql`update start_teams set default_page_id = ${page.id} where id = ${team.id}`;
  return { id: team.id as string, slug };
}

async function teamAdmin(user: User, teamId: unknown) {
  const id = uuid(teamId);
  const role = await teamRole(user.id, id);
  if (!role) throw notFound();
  if (!ADMIN_ROLES.includes(role)) throw new HttpError(403, "Only team owners and admins can do that", "forbidden");
  const [team] = await db()`select * from start_teams where id = ${id}`;
  return { team, role };
}

export async function teamDetail(user: User, teamId: unknown) {
  const id = uuid(teamId);
  const role = await teamRole(user.id, id);
  if (!role) throw notFound();
  const sql = db();
  const [team] = await sql`select * from start_teams where id = ${id}`;
  const members = await sql`select u.id, u.email, m.role, m.joined_at from start_team_members m join users u on u.id = m.user_id where m.team_id = ${id} order by m.joined_at`;
  const invites = ADMIN_ROLES.includes(role) ? await sql`select id, email, role, expires_at from start_team_invites where team_id = ${id} and expires_at > now() order by created_at` : [];
  const pages = await sql`select p.*, ${team.name}::text as team_name from start_pages p where p.team_id = ${id} order by p.position`;
  return {
    team: { id, name: team.name, slug: team.slug, logoUrl: team.logo_url, brandColor: team.brand_color, defaultPageId: team.default_page_id, seatLimit: team.seat_limit, allowedDomains: team.allowed_domains, announcement: team.announcement, active: await teamActive(id) },
    role,
    members: members.map((m) => ({ id: m.id, email: m.email, role: m.role, joinedAt: m.joined_at })),
    invites: invites.map((i) => ({ id: i.id, email: i.email, role: i.role, expiresAt: i.expires_at })),
    pages: pages.map((p) => pageOut(p, EDIT_ROLES.includes(role))),
  };
}

export async function updateTeam(user: User, teamId: unknown, body: Record<string, unknown>) {
  const { team } = await teamAdmin(user, teamId);
  const sql = db();
  const name = body.name === undefined ? team.name : (str(body.name, 80) ?? team.name);
  let slug = team.slug as string;
  if (typeof body.slug === "string" && body.slug !== team.slug) {
    slug = body.slug.toLowerCase();
    if (!SLUG.test(slug) || RESERVED.has(slug)) throw new HttpError(400, "Use 1 to 40 lowercase letters, numbers and dashes for the address", "invalid_slug");
    const [taken] = await sql`select 1 from start_teams where slug = ${slug} and id <> ${team.id}`;
    if (taken) throw new HttpError(409, "That team address is taken", "slug_taken");
  }
  const logo = body.logoUrl === undefined ? team.logo_url : typeof body.logoUrl === "string" && /^https:\/\/[^\s"'<>]+$/.test(body.logoUrl) && body.logoUrl.length < 1000 ? body.logoUrl : null;
  const color = body.brandColor === undefined ? team.brand_color : typeof body.brandColor === "string" && /^#[0-9a-f]{6}$/i.test(body.brandColor) ? body.brandColor : null;
  let defaultPage = team.default_page_id;
  if (body.defaultPageId !== undefined) {
    const pid = uuid(body.defaultPageId);
    const [p] = await sql`select 1 from start_pages where id = ${pid} and team_id = ${team.id}`;
    if (!p) throw new HttpError(400, "Pick one of the team's pages", "invalid_page");
    defaultPage = pid;
  }
  const domains = Array.isArray(body.allowedDomains)
    ? body.allowedDomains.filter((d): d is string => typeof d === "string" && /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(d.trim())).map((d) => d.trim().toLowerCase()).slice(0, 20)
    : (team.allowed_domains as string[]);
  const announcement = body.announcement === undefined ? team.announcement : typeof body.announcement === "string" ? body.announcement.slice(0, 500) : "";
  await sql`update start_teams set name = ${name}, slug = ${slug}, logo_url = ${logo}, brand_color = ${color}, default_page_id = ${defaultPage}, allowed_domains = ${domains}, announcement = ${announcement} where id = ${team.id}`;
  return teamDetail(user, team.id);
}

export async function inviteMember(user: User, teamId: unknown, body: Record<string, unknown>) {
  const { team } = await teamAdmin(user, teamId);
  if (!(await teamActive(team.id as string))) throw new HttpError(402, "Renew Start Team to invite people", "start_upgrade_required");
  const email = normalizeEmail(body.email);
  const role = body.role === "admin" || body.role === "editor" ? body.role : "viewer";
  const sql = db();
  const [{ used }] = await sql`
    select (select count(*) from start_team_members where team_id = ${team.id}) + (select count(*) from start_team_invites where team_id = ${team.id} and expires_at > now() and email <> ${email}) as used`;
  if (Number(used) >= (team.seat_limit as number)) throw new HttpError(402, `Your plan has ${team.seat_limit} seats and they're all in use`, "seats_full");
  const [member] = await sql`select 1 from start_team_members m join users u on u.id = m.user_id where m.team_id = ${team.id} and u.email = ${email}`;
  if (member) throw new HttpError(409, "That person is already on the team", "already_member");
  const token = randomBytes(24).toString("base64url");
  await sql`
    insert into start_team_invites (team_id, email, role, token_hash, expires_at) values (${team.id}, ${email}, ${role}, ${sha256(token)}, now() + interval '14 days')
    on conflict (team_id, email) do update set role = excluded.role, token_hash = excluded.token_hash, expires_at = excluded.expires_at`;
  const url = `${config.siteUrl}/start/join/?token=${token}`;
  await sendPlainEmail({
    to: email,
    replyTo: user.email,
    subject: `${user.email} invited you to ${team.name} on CodeRef Start`,
    text: `${user.email} invited you to join ${team.name}'s start pages on CodeRef Start.\n\nAccept the invitation (valid for 14 days):\n${url}\n\nSign in with this email address (${email}) to join.\n\n— CodeRef · ${config.siteUrl}\n`,
  }).catch((e) => console.error("invite email failed", e));
  return { url };
}

export async function revokeInvite(user: User, teamId: unknown, inviteId: unknown) {
  const { team } = await teamAdmin(user, teamId);
  await db()`delete from start_team_invites where id = ${uuid(inviteId)} and team_id = ${team.id}`;
}

export async function acceptInvite(user: User, body: Record<string, unknown>) {
  const token = typeof body.token === "string" ? body.token : "";
  if (!/^[\w-]{20,64}$/.test(token)) throw new HttpError(400, "That invitation link is invalid", "invalid_invite");
  const sql = db();
  const [inv] = await sql`select i.*, t.slug, t.seat_limit from start_team_invites i join start_teams t on t.id = i.team_id where i.token_hash = ${sha256(token)} and i.expires_at > now()`;
  if (!inv) throw new HttpError(400, "That invitation has expired or was already used", "invalid_invite");
  if (inv.email !== user.email) throw new HttpError(403, `This invitation is for ${inv.email}. Sign in with that address to accept it.`, "wrong_account");
  await sql`insert into start_team_members (team_id, user_id, role) values (${inv.team_id}, ${user.id}, ${inv.role}) on conflict (team_id, user_id) do nothing`;
  await sql`delete from start_team_invites where id = ${inv.id}`;
  return { slug: inv.slug as string };
}

/** People whose email domain the team allows can join from the team's address without an invitation. */
export async function joinByDomain(user: User, slug: unknown) {
  const [team] = await db()`select * from start_teams where slug = ${String(slug)}`;
  if (!team) throw notFound();
  const domain = user.email.split("@")[1];
  if (!(team.allowed_domains as string[]).includes(domain)) throw new HttpError(403, "Ask a team admin for an invitation", "forbidden");
  const [{ n }] = await db()`select count(*)::int as n from start_team_members where team_id = ${team.id}`;
  if ((n as number) >= (team.seat_limit as number)) throw new HttpError(402, "This team has no free seats. Ask an admin.", "seats_full");
  await db()`insert into start_team_members (team_id, user_id, role) values (${team.id}, ${user.id}, 'viewer') on conflict do nothing`;
  return { slug: team.slug as string };
}

export async function updateMember(user: User, teamId: unknown, memberId: unknown, body: Record<string, unknown>) {
  const { team, role } = await teamAdmin(user, teamId);
  const target = uuid(memberId);
  const current = await teamRole(target, team.id as string);
  if (!current) throw notFound();
  if (current === "owner") throw new HttpError(403, "The owner's role can't be changed", "forbidden");
  const next = body.role === "admin" || body.role === "editor" || body.role === "viewer" ? body.role : null;
  if (!next) throw new HttpError(400, "Unknown role", "invalid_role");
  if (next === "admin" && role !== "owner") throw new HttpError(403, "Only the owner can make admins", "forbidden");
  await db()`update start_team_members set role = ${next} where team_id = ${team.id} and user_id = ${target}`;
}

export async function removeMember(user: User, teamId: unknown, memberId: unknown) {
  const target = uuid(memberId);
  const id = uuid(teamId);
  // Anyone can leave; admins can remove others. The owner can't leave their own team.
  if (target !== user.id) await teamAdmin(user, id);
  const current = await teamRole(target, id);
  if (current === "owner") throw new HttpError(403, "The owner can't leave or be removed", "forbidden");
  await db()`delete from start_team_members where team_id = ${id} and user_id = ${target}`;
}

/** The team's home for /start/t/{slug}: its branding, pages and default page (members only). */
export async function teamBySlug(user: User, slug: unknown) {
  const [team] = await db()`select * from start_teams where slug = ${String(slug).toLowerCase()}`;
  if (!team) throw notFound();
  const role = await teamRole(user.id, team.id as string);
  if (!role) {
    const canJoin = (team.allowed_domains as string[]).includes(user.email.split("@")[1]);
    return { member: false, canJoin, team: { name: team.name as string, slug: team.slug as string, logoUrl: team.logo_url as string | null } };
  }
  return { member: true, canJoin: false, ...(await teamDetail(user, team.id)) };
}

// ---- analytics (team pages only; no user, IP or cookie is stored) ----

export async function recordClick(body: Record<string, unknown>) {
  const pageId = typeof body.pageId === "string" && UUID.test(body.pageId) ? body.pageId : null;
  const widgetId = typeof body.widgetId === "string" && UUID.test(body.widgetId) ? body.widgetId : null;
  const l = link({ url: body.url, title: "" });
  if (!pageId || !widgetId || !l) return;
  await db()`
    insert into start_link_clicks (page_id, widget_id, url, count)
    select ${pageId}, ${widgetId}, ${l.url.slice(0, 500)}, 1 from start_pages where id = ${pageId} and team_id is not null
    on conflict (page_id, widget_id, url, day) do update set count = start_link_clicks.count + 1`;
}

export async function teamAnalytics(user: User, teamId: unknown) {
  const { team } = await teamAdmin(user, teamId);
  const sql = db();
  const top = await sql`
    select c.url, sum(c.count)::int as clicks, p.title as page from start_link_clicks c join start_pages p on p.id = c.page_id
    where p.team_id = ${team.id} and c.day > current_date - 30 group by c.url, p.title order by clicks desc limit 25`;
  const daily = await sql`
    select c.day::text as day, sum(c.count)::int as clicks from start_link_clicks c join start_pages p on p.id = c.page_id
    where p.team_id = ${team.id} and c.day > current_date - 30 group by c.day order by c.day`;
  const pages = await sql`select title, views from start_pages where team_id = ${team.id} order by views desc limit 10`;
  return { top, daily, pages };
}

/** Summary for /api/me, so the site knows the user's Start plan without another request. */
export async function startSummary(user: User) {
  const [tier, [{ pages }]] = await Promise.all([startTier(user), db()`select count(*)::int as pages from start_pages where owner_id = ${user.id} and team_id is null`]);
  return { tier, pages: pages as number, pageLimit: limitsFor(tier).pages };
}

// ---- admin panel ----

export async function adminStartOverview() {
  const sql = db();
  const subs = await sql`
    select s.id, u.email, s.plan, s.status, s.pro_until, s.seats, t.name as team
    from start_subscriptions s join users u on u.id = s.user_id left join start_teams t on t.id = s.team_id
    order by s.created_at desc limit 200`;
  const teams = await sql`
    select t.id, t.name, t.slug, u.email as owner, t.seat_limit, t.created_at,
      (select count(*)::int from start_team_members m where m.team_id = t.id) as members,
      (select count(*)::int from start_pages p where p.team_id = t.id) as pages
    from start_teams t join users u on u.id = t.owner_id order by t.created_at desc limit 200`;
  const templates = await sql`
    select p.share_id, p.title, p.template_category, p.clone_count, p.views, u.email as owner
    from start_pages p join users u on u.id = p.owner_id where p.is_template order by p.updated_at desc limit 200`;
  const [totals] = await sql`
    select (select count(*)::int from start_pages) as pages, (select count(distinct owner_id)::int from start_pages) as users,
      (select count(*)::int from start_tokens) as browsers`;
  return { subscriptions: subs, teams, templates, totals };
}

/** Enterprise is sold by contract and invoiced outside Dodo; the superadmin grants it here until a date. */
export async function grantEnterprise(body: Record<string, unknown>) {
  const email = normalizeEmail(body.email);
  const until = typeof body.until === "string" && !Number.isNaN(Date.parse(body.until)) ? new Date(body.until).toISOString() : null;
  if (!until) throw new HttpError(400, "Give an end date", "invalid_date");
  const sql = db();
  const [user] = await sql`select id from users where email = ${email}`;
  if (!user) throw new HttpError(404, "No account with that email. Ask them to sign up first.", "not_found");
  const [existing] = await sql`select id from start_subscriptions where user_id = ${user.id} and plan = 'start_enterprise'`;
  if (existing) await sql`update start_subscriptions set pro_until = ${until}, status = 'active', updated_at = now() where id = ${existing.id}`;
  else await sql`insert into start_subscriptions (user_id, plan, status, pro_until, seats) values (${user.id}, 'start_enterprise', 'active', ${until}, 100000)`;
}
