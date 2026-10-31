// CodeRef Start: plans, limits and the widget catalogue, shared by the pricing tab, the /start app, the marketing pages
// and the API (src/server/start.ts). A separate product from CodeRef Pro (src/lib/plans.ts), with its own billing.

export type StartPlanId = "start_pro_yearly" | "start_team_monthly";
export type StartTier = "free" | "pro" | "team" | "enterprise";

export const START_PLANS: { id: StartPlanId; tier: StartTier; name: string; price: string; cents: number; period: string; note: string }[] = [
  { id: "start_pro_yearly", tier: "pro", name: "Start PRO", price: "$24", cents: 2400, period: "/ year", note: "One person. About $2 a month, billed yearly." },
  { id: "start_team_monthly", tier: "team", name: "Start Team", price: "$29", cents: 2900, period: "/ month", note: "One shared workspace with up to 20 PRO members." },
];

export const START_TEAM_SEATS = 20;

export const START_LIMITS: Record<StartTier, { pages: number; widgetsPerPage: number; teams: number }> = {
  free: { pages: 3, widgetsPerPage: 20, teams: 0 },
  // "Unlimited" in the copy; these are fair-use ceilings that protect the service, not plan limits.
  pro: { pages: 1000, widgetsPerPage: 100, teams: 0 },
  team: { pages: 1000, widgetsPerPage: 100, teams: 1 },
  enterprise: { pages: 5000, widgetsPerPage: 200, teams: 50 },
};

/** Largest widget payload (links, notes, to-dos), in bytes of JSON. */
export const START_MAX_WIDGET_BYTES = 128 * 1024;
export const START_MAX_LINKS_PER_WIDGET = 500;

export type WidgetTier = "free" | "pro" | "team";
export type WidgetCategory = "Links" | "Productivity" | "News & info" | "Media" | "Developer" | "Team";

export type WidgetDef = { type: string; label: string; description: string; tier: WidgetTier; category: WidgetCategory };

export const START_WIDGETS: WidgetDef[] = [
  { type: "bookmarks", label: "Bookmarks", description: "A list or icon grid of links with favicons. Drag to reorder, drop links in from your Inbox.", tier: "free", category: "Links" },
  { type: "search", label: "Search", description: "Search Google, Bing, DuckDuckGo, CodeRef or any site with a custom URL template.", tier: "free", category: "Links" },
  { type: "notes", label: "Notes", description: "Markdown notes that sync everywhere you open your page.", tier: "free", category: "Productivity" },
  { type: "todo", label: "To-do", description: "A checklist with due dates. Done items move to the bottom.", tier: "free", category: "Productivity" },
  { type: "clock", label: "Clock", description: "Local time, or several cities as a world clock.", tier: "free", category: "Productivity" },
  { type: "rss", label: "RSS feed", description: "Headlines from any RSS or Atom feed, as titles or with summaries.", tier: "free", category: "News & info" },
  { type: "weather", label: "Weather", description: "Today and the next five days for any city.", tier: "free", category: "News & info" },
  { type: "calendar", label: "Calendar", description: "A month view with today highlighted.", tier: "free", category: "Productivity" },
  { type: "embed", label: "Embed", description: "Any page that allows embedding, in a resizable frame.", tier: "free", category: "Media" },
  { type: "image", label: "Image", description: "A picture or logo, optionally linking somewhere.", tier: "free", category: "Media" },
  { type: "speeddial", label: "Speed dial", description: "Big tiles for the sites you open most.", tier: "pro", category: "Links" },
  { type: "multirss", label: "News mix", description: "Several feeds merged into one list, newest first.", tier: "pro", category: "News & info" },
  { type: "kanban", label: "Kanban", description: "To-do, doing, done columns with drag and drop.", tier: "pro", category: "Productivity" },
  { type: "countdown", label: "Countdown", description: "Days, hours and minutes to a launch, holiday or deadline.", tier: "pro", category: "Productivity" },
  { type: "pomodoro", label: "Pomodoro", description: "Focus timer with work and break intervals.", tier: "pro", category: "Productivity" },
  { type: "calculator", label: "Calculator", description: "Quick sums without leaving the tab.", tier: "pro", category: "Productivity" },
  { type: "ticker", label: "Currency & crypto", description: "Live exchange rates and crypto prices you choose.", tier: "pro", category: "News & info" },
  { type: "quote", label: "Quote of the day", description: "A fresh quote every morning.", tier: "pro", category: "News & info" },
  { type: "ics", label: "Google / Outlook calendar", description: "Upcoming events from any calendar's ICS link.", tier: "pro", category: "Productivity" },
  { type: "github", label: "GitHub activity", description: "Recent public activity for a user or repository.", tier: "pro", category: "Developer" },
  { type: "cheatsheets", label: "CodeRef cheat sheets", description: "Pin the CodeRef cheat sheets and tools you use every day.", tier: "pro", category: "Developer" },
  { type: "html", label: "Custom HTML", description: "Your own HTML, CSS and JavaScript, safely sandboxed.", tier: "pro", category: "Developer" },
  { type: "announcement", label: "Announcement", description: "A banner for news everyone on the team should see.", tier: "team", category: "Team" },
  { type: "directory", label: "Team directory", description: "Names, roles and contact links for your team.", tier: "team", category: "Team" },
  { type: "apps", label: "Company apps", description: "A branded grid of the tools your company uses.", tier: "team", category: "Team" },
];

export const widgetDef = (type: string) => START_WIDGETS.find((w) => w.type === type);

/** Whether a tier may add a widget type. Team tiers include every PRO widget. */
export function canUseWidget(tier: StartTier, type: string): boolean {
  const def = widgetDef(type);
  if (!def) return false;
  if (def.tier === "free") return true;
  if (def.tier === "pro") return tier !== "free";
  return tier === "team" || tier === "enterprise";
}

export const START_FREE_FEATURES = [
  `Up to ${START_LIMITS.free.pages} start pages`,
  `${START_WIDGETS.filter((w) => w.tier === "free").length} essential widgets: bookmarks, search, notes, to-do, RSS, weather and more`,
  "New tab page with the CodeRef Start Chrome extension",
  "Save pages and tabs, import your browser bookmarks",
  "Themes, backgrounds and 1 to 5 columns",
  "Share public pages and use templates from the gallery",
];

export const START_PRO_FEATURES = [
  "Unlimited start pages",
  `All ${START_WIDGETS.filter((w) => w.tier !== "team").length} widgets, including speed dial, Kanban, news mix, calendars and GitHub`,
  "Inbox for links saved from the extension",
  "Custom backgrounds, fonts and custom CSS",
  "Password-protected shared pages",
  "Instant offline new tab and keyboard shortcuts",
  "Priority email support",
];

export const START_TEAM_FEATURES = [
  `${START_TEAM_SEATS} PRO members in one shared workspace`,
  "Shared team pages at coderef.xyz/start/t/your-team",
  "Roles: owner, admin, editor and viewer",
  "Your logo and brand colour",
  "Set the team page as everyone's new tab",
  "Announcement, directory and company-apps widgets",
  "Link-click analytics per page",
];

export const START_ENTERPRISE_FEATURES = [
  "Unlimited teams and members",
  "Single sign-on (SAML / OIDC) and allowed email domains",
  "Managed Chrome rollout with policy-pushed team pages",
  "Advanced analytics and audit history",
  "Custom contract, invoicing and volume discounts",
  "Dedicated onboarding and support",
];

/** Search engines for the search widget; {q} is replaced by the encoded query. */
export const SEARCH_ENGINES: { id: string; label: string; url: string }[] = [
  { id: "google", label: "Google", url: "https://www.google.com/search?q={q}" },
  { id: "bing", label: "Bing", url: "https://www.bing.com/search?q={q}" },
  { id: "duckduckgo", label: "DuckDuckGo", url: "https://duckduckgo.com/?q={q}" },
  { id: "coderef", label: "CodeRef", url: "/search/?q={q}" },
  { id: "github", label: "GitHub", url: "https://github.com/search?q={q}" },
  { id: "mdn", label: "MDN", url: "https://developer.mozilla.org/en-US/search?q={q}" },
  { id: "stackoverflow", label: "Stack Overflow", url: "https://stackoverflow.com/search?q={q}" },
  // AI assistants that take the question in the address (same set as the Chrome extension's search menu).
  { id: "chatgpt", label: "ChatGPT", url: "https://chatgpt.com/?q={q}" },
  { id: "claude", label: "Claude", url: "https://claude.ai/new?q={q}" },
  { id: "perplexity", label: "Perplexity", url: "https://www.perplexity.ai/search?q={q}" },
  { id: "googleai", label: "Google AI Mode", url: "https://www.google.com/search?udm=50&q={q}" },
  { id: "copilot", label: "Microsoft Copilot", url: "https://copilot.microsoft.com/?q={q}" },
  { id: "grok", label: "Grok", url: "https://grok.com/?q={q}" },
  { id: "mistral", label: "Le Chat (Mistral)", url: "https://chat.mistral.ai/chat?q={q}" },
  { id: "you", label: "You.com", url: "https://you.com/search?q={q}&tbm=youchat" },
];

export const TEMPLATE_CATEGORIES = ["Developer", "Design", "Marketing", "Education", "News", "Productivity", "Team intranet", "Personal"] as const;

export type StartTheme = {
  background?: string;
  backgroundImage?: string;
  columns?: number;
  density?: "compact" | "comfortable";
  font?: "sans" | "mono" | "serif";
  scheme?: "auto" | "light" | "dark";
  customCss?: string;
};

export type StartLink = { title: string; url: string };

export type StartWidget = {
  id: string;
  type: string;
  title: string;
  col: number;
  position: number;
  collapsed: boolean;
  color: string;
  config: Record<string, unknown>;
  data: Record<string, unknown>;
};

export type StartPage = {
  id: string;
  title: string;
  icon: string;
  position: number;
  theme: StartTheme;
  visibility: "private" | "team" | "public";
  shareId: string | null;
  protected: boolean;
  isTemplate: boolean;
  templateCategory: string | null;
  teamId: string | null;
  teamName?: string | null;
  canEdit: boolean;
  updatedAt: string;
  widgets?: StartWidget[];
};
