// Browser side of CodeRef Start: typed calls to /api/start, a local cache so the new tab opens instantly, and theme
// helpers shared by the app, public pages and the gallery.
import type { CSSProperties } from "react";
import { api } from "@/lib/account/client";
import type { StartPage, StartTheme, StartWidget } from "@/lib/start-plans";

export type { StartPage, StartWidget, StartTheme };
export type { StartSummary } from "@/lib/account/client";
export type InboxItem = { id: string; title: string; url: string; createdAt: string };
export type TeamRole = "owner" | "admin" | "editor" | "viewer";
export type TeamSummary = { id: string; name: string; slug: string; role: TeamRole; members: number; seatLimit: number; logoUrl: string | null; brandColor: string | null; defaultPageId: string | null; announcement: string; allowedDomains: string[]; active: boolean };
export type TeamDetail = {
  team: { id: string; name: string; slug: string; logoUrl: string | null; brandColor: string | null; defaultPageId: string | null; seatLimit: number; allowedDomains: string[]; announcement: string; active: boolean };
  role: TeamRole;
  members: { id: string; email: string; role: TeamRole; joinedAt: string }[];
  invites: { id: string; email: string; role: TeamRole; expiresAt: string }[];
  pages: StartPage[];
};
export type GalleryTemplate = { shareId: string; title: string; icon: string; category: string | null; description: string; clones: number; views: number; widgets: number; types: string[]; theme: StartTheme };

export const startApi = {
  pages: () => api<{ pages: StartPage[] }>("GET", "/start/pages").then((r) => r.pages),
  page: (id: string) => api<{ page: StartPage }>("GET", `/start/pages/${id}`).then((r) => r.page),
  createPage: (body: { title?: string; teamId?: string; starter?: boolean; theme?: StartTheme }) => api<{ page: StartPage }>("POST", "/start/pages", body).then((r) => r.page),
  updatePage: (id: string, body: Partial<Pick<StartPage, "title" | "icon" | "theme">>) => api<{ page: StartPage }>("PUT", `/start/pages/${id}`, body).then((r) => r.page),
  deletePage: (id: string) => api("DELETE", `/start/pages/${id}`),
  reorderPages: (ids: string[]) => api("POST", "/start/pages/reorder", { ids }),
  duplicatePage: (id: string) => api<{ page: StartPage }>("POST", `/start/pages/${id}/duplicate`).then((r) => r.page),
  saveLayout: (id: string, items: { id: string; col: number; position: number }[]) => api("POST", `/start/pages/${id}/layout`, { items }),
  share: (id: string, body: { visibility: "private" | "public"; password?: string | null }) => api<{ page: StartPage }>("POST", `/start/pages/${id}/share`, body).then((r) => r.page),
  publishTemplate: (id: string, body: { publish: boolean; category?: string; description?: string }) => api<{ ok: true; shareId?: string }>("POST", `/start/pages/${id}/template`, body),
  addWidget: (pageId: string, body: { type: string; title?: string; col?: number; config?: object; data?: object }) => api<{ widget: StartWidget }>("POST", `/start/pages/${pageId}/widgets`, body).then((r) => r.widget),
  updateWidget: (id: string, body: Partial<Omit<StartWidget, "id" | "type">>) => api<{ widget: StartWidget }>("PUT", `/start/widgets/${id}`, body).then((r) => r.widget),
  deleteWidget: (id: string) => api("DELETE", `/start/widgets/${id}`),
  addLinks: (pageId: string, widgetTitle: string, links: { title: string; url: string }[]) => api<{ widgetId: string; added: number }>("POST", `/start/pages/${pageId}/links`, { widgetTitle, links }),
  importFile: (content: string, title: string) => api<{ page: { id: string }; links: number }>("POST", "/start/import/file", { content, title }),
  inbox: () => api<{ items: InboxItem[] }>("GET", "/start/inbox").then((r) => r.items),
  deleteInbox: (id: string) => api("DELETE", `/start/inbox/${id}`),
  moveInbox: (id: string, pageId: string, widgetTitle: string) => api("POST", `/start/inbox/${id}/move`, { pageId, widgetTitle }),
  publicPage: (shareId: string, password?: string) =>
    (password === undefined ? api<{ page: StartPage }>("GET", `/start/public/${shareId}`) : api<{ page: StartPage }>("POST", `/start/public/${shareId}`, { password })).then((r) => r.page),
  clone: (shareId: string, password?: string) => api<{ page: { id: string } }>("POST", `/start/public/${shareId}/clone`, { password }),
  gallery: (category?: string, q?: string) => api<{ templates: GalleryTemplate[] }>("GET", `/start/gallery?${new URLSearchParams({ ...(category && { category }), ...(q && { q }) })}`).then((r) => r.templates),
  tokens: () => api<{ tokens: { id: string; name: string; createdAt: string; lastUsedAt: string | null }[] }>("GET", "/start/tokens").then((r) => r.tokens),
  createToken: (name: string) => api<{ token: string }>("POST", "/start/tokens", { name }).then((r) => r.token),
  deleteToken: (id: string) => api("DELETE", `/start/tokens/${id}`),
  teams: () => api<{ teams: TeamSummary[] }>("GET", "/start/teams").then((r) => r.teams),
  createTeam: (name: string, slug: string) => api<{ id: string; slug: string }>("POST", "/start/teams", { name, slug }),
  team: (id: string) => api<TeamDetail>("GET", `/start/teams/${id}`),
  updateTeam: (id: string, body: Record<string, unknown>) => api<TeamDetail>("PUT", `/start/teams/${id}`, body),
  invite: (id: string, email: string, role: TeamRole) => api<{ url: string }>("POST", `/start/teams/${id}/invites`, { email, role }),
  revokeInvite: (id: string, inviteId: string) => api("DELETE", `/start/teams/${id}/invites/${inviteId}`),
  setRole: (id: string, userId: string, role: TeamRole) => api("PUT", `/start/teams/${id}/members/${userId}`, { role }),
  removeMember: (id: string, userId: string) => api("DELETE", `/start/teams/${id}/members/${userId}`),
  teamBySlug: (slug: string) => api<({ member: true; canJoin: false } & TeamDetail) | { member: false; canJoin: boolean; team: { name: string; slug: string; logoUrl: string | null } }>("GET", `/start/t/${slug}`),
  joinTeam: (slug: string) => api<{ slug: string }>("POST", `/start/t/${slug}/join`),
  acceptInvite: (token: string) => api<{ slug: string }>("POST", "/start/invites/accept", { token }),
  analytics: (id: string) => api<{ top: { url: string; clicks: number; page: string }[]; daily: { day: string; clicks: number }[]; pages: { title: string; views: number }[] }>("GET", `/start/teams/${id}/analytics`),
  billing: () => api<{ subscriptions: { id: string; plan: string; name: string; status: string; proUntil: string | null; seats: number; teamId: string | null; teamName: string | null; manageable: boolean }[] }>("GET", "/start/billing").then((r) => r.subscriptions),
  checkout: (plan: string) => api<{ url: string }>("POST", "/start/billing/checkout", { plan }),
  cancel: (id: string, cancel: boolean) => api("POST", "/start/billing/cancel", { id, cancel }),
};

/** Fire-and-forget click count for team analytics (team pages only; the server ignores the rest). */
export function trackClick(pageId: string, widgetId: string, url: string) {
  fetch("/api/start/click/", { method: "POST", keepalive: true, credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ pageId, widgetId, url }) }).catch(() => undefined);
}

// ---- local cache: the last version of each page, so it paints before the network answers ----

const KEY = "coderef-start:";
export const cache = {
  get<T>(k: string): T | null {
    try {
      const v = localStorage.getItem(KEY + k);
      return v ? (JSON.parse(v) as T) : null;
    } catch {
      return null;
    }
  },
  set(k: string, v: unknown) {
    try {
      localStorage.setItem(KEY + k, JSON.stringify(v));
    } catch {
      // Storage full or blocked: the page still works, it just won't open instantly next time.
    }
  },
  del(k: string) {
    try {
      localStorage.removeItem(KEY + k);
    } catch {
      /* ignore */
    }
  },
};

// ---- theme ----

export const BACKGROUND_PRESETS: { label: string; value: string }[] = [
  { label: "Default", value: "" },
  { label: "Ocean", value: "linear-gradient(135deg, #0f2027, #203a43, #2c5364)" },
  { label: "Sunset", value: "linear-gradient(135deg, #ff7e5f, #feb47b)" },
  { label: "Lavender", value: "linear-gradient(135deg, #e0c3fc, #8ec5fc)" },
  { label: "Forest", value: "linear-gradient(135deg, #134e5e, #71b280)" },
  { label: "Midnight", value: "linear-gradient(135deg, #232526, #414345)" },
  { label: "Peach", value: "linear-gradient(135deg, #ffecd2, #fcb69f)" },
  { label: "Mint", value: "#d1fae5" },
  { label: "Slate", value: "#1e293b" },
  { label: "Paper", value: "#faf7f0" },
  { label: "Aurora", value: "linear-gradient(135deg, #00c6ff, #0072ff)" },
  { label: "Dusk", value: "linear-gradient(135deg, #2c3e50, #fd746c)" },
  { label: "Grape", value: "linear-gradient(135deg, #654ea3, #eaafc8)" },
  { label: "Coral", value: "linear-gradient(135deg, #ff9a9e, #fecfef)" },
  { label: "Night sky", value: "linear-gradient(160deg, #0f0c29, #302b63, #24243e)" },
];

/** Curated photos (Unsplash, free licence), sized for a full-screen background. Same set as the Chrome extension. */
export const PHOTO_PRESETS = [
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2400&q=70",
  "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=2400&q=70",
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=2400&q=70",
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=2400&q=70",
  "https://images.unsplash.com/photo-1477346611705-65d1883cee1e?auto=format&fit=crop&w=2400&q=70",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2400&q=70",
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=2400&q=70",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2400&q=70",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=2400&q=70",
  "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=2400&q=70",
  "https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?auto=format&fit=crop&w=2400&q=70",
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2400&q=70",
  "https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=2400&q=70",
  "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=2400&q=70",
  "https://images.unsplash.com/photo-1433086966358-54859d0ed716?auto=format&fit=crop&w=2400&q=70",
  "https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=2400&q=70",
  "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=2400&q=70",
  "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=2400&q=70",
  "https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?auto=format&fit=crop&w=2400&q=70",
  "https://images.unsplash.com/photo-1439853949127-fa647821eba0?auto=format&fit=crop&w=2400&q=70",
  "https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?auto=format&fit=crop&w=2400&q=70",
  "https://images.unsplash.com/photo-1517816743773-6e0fd518b4a6?auto=format&fit=crop&w=2400&q=70",
];

const LIGHT = { "--background": "#f6f7f9", "--surface": "#ffffff", "--foreground": "#16181d", "--muted": "#5f6673", "--border": "#e3e6eb", "--accent": "#2563eb", "--chip": "#f1f3f6", "--chip-hover": "#e4e9f2" };
const DARK = { "--background": "#0d0f13", "--surface": "#161920", "--foreground": "#e8eaee", "--muted": "#9198a5", "--border": "#262a33", "--accent": "#60a5fa", "--chip": "#1f232b", "--chip-hover": "#2a303b" };

/** Inline styles for a page: forced light/dark tokens, background and font. */
export function themeStyle(theme: StartTheme, brandColor?: string | null): CSSProperties {
  const style: Record<string, string> = {};
  if (theme.scheme === "light") Object.assign(style, LIGHT, { colorScheme: "light" });
  if (theme.scheme === "dark") Object.assign(style, DARK, { colorScheme: "dark" });
  if (brandColor) style["--accent"] = brandColor;
  if (theme.backgroundImage) {
    style.backgroundImage = `url("${theme.backgroundImage}")`;
    style.backgroundSize = "cover";
    style.backgroundPosition = "center";
    style.backgroundAttachment = "fixed";
  } else if (theme.background && !theme.background.startsWith("anim:")) style.background = theme.background;
  if (theme.font === "mono") style.fontFamily = "var(--font-geist-mono), ui-monospace, monospace";
  if (theme.font === "serif") style.fontFamily = "ui-serif, Georgia, serif";
  return style as CSSProperties;
}

export const hasBackdrop = (theme: StartTheme) => !!(theme.backgroundImage || theme.background);

export const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

export const favicon = (url: string) => {
  try {
    return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`;
  } catch {
    return "";
  }
};

export const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

/** A page as Markdown: every bookmarks widget as a heading with its links (export / copy). */
export function pageToMarkdown(page: StartPage): string {
  const out = [`# ${page.title}`, ""];
  for (const w of [...(page.widgets ?? [])].sort((a, b) => a.col - b.col || a.position - b.position)) {
    const links = (w.data.links as { title: string; url: string }[] | undefined) ?? [];
    if (!links.length) continue;
    out.push(`## ${w.title}`, "", ...links.map((l) => `- [${l.title.replace(/[[\]]/g, "")}](${l.url})`), "");
  }
  return out.join("\n");
}

/** Netscape bookmark HTML, which every browser (and start.me) can import. */
export function pageToBookmarksHtml(page: StartPage): string {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const lines = ["<!DOCTYPE NETSCAPE-Bookmark-file-1>", '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">', `<TITLE>${esc(page.title)}</TITLE>`, `<H1>${esc(page.title)}</H1>`, "<DL><p>"];
  for (const w of page.widgets ?? []) {
    const links = (w.data.links as { title: string; url: string }[] | undefined) ?? [];
    if (!links.length) continue;
    lines.push(`  <DT><H3>${esc(w.title)}</H3>`, "  <DL><p>", ...links.map((l) => `    <DT><A HREF="${esc(l.url)}">${esc(l.title)}</A>`), "  </DL><p>");
  }
  lines.push("</DL><p>");
  return lines.join("\n");
}
