// Plans and limits, shared by the pricing page, the account UI and the API (api/), so they never disagree.

export type PlanId = "monthly" | "yearly" | "lifetime";

export const PLANS: { id: PlanId; name: string; price: string; cents: number; period: string; note?: string }[] = [
  { id: "monthly", name: "Pro monthly", price: "$7", cents: 700, period: "/ month" },
  { id: "yearly", name: "Pro yearly", price: "$59", cents: 5900, period: "/ year", note: "About $4.90 a month, 30% off" },
  { id: "lifetime", name: "Lifetime", price: "$99", cents: 9900, period: "one time", note: "Launch offer, limited to the first 100 buyers" },
];

export const LIFETIME_CAP = 100;

/** Where customers reach a human (shown on pricing, account and legal pages). Must be a real, monitored inbox. */
export const SUPPORT_EMAIL = "support@coderef.xyz";
/** Days after a first purchase in which a full refund is given on request. */
export const REFUND_DAYS = 14;

/** Saved items a free account can keep (favourites don't count). */
export const FREE_ITEM_LIMIT = 3;
export const PRO_ITEM_LIMIT = 500;
export const FAVORITE_LIMIT = 1000;
/** Largest saved item, in bytes of JSON. */
export const MAX_ITEM_BYTES = 256 * 1024;
/** Designs per bulk collection download. */
export const BULK_LIMIT = 200;

export const ITEM_KINDS = ["palette", "api-request", "regex", "markdown", "json", "favorite"] as const;
export type ItemKind = (typeof ITEM_KINDS)[number];

export const EXPORT_FORMATS = ["zip", "tailwind", "tailwind-v3", "shadcn", "figma", "tokens"] as const;
export type ExportFormat = (typeof EXPORT_FORMATS)[number];

/** The single-file framework exports, described once for the design page, Account > Downloads and pricing. */
export const FRAMEWORK_EXPORTS: { format: Exclude<ExportFormat, "zip">; label: string; file: string; howTo: string }[] = [
  { format: "tailwind", label: "Tailwind v4", file: "tailwind.css", howTo: "Import it from your global CSS (it includes @import \"tailwindcss\"), then use classes like bg-primary, text-muted and rounded-md." },
  { format: "tailwind-v3", label: "Tailwind v3", file: "tailwind.config.js", howTo: "Replace tailwind.config.js and add styles.css from the package to your global CSS so the --ds-* variables exist." },
  { format: "shadcn", label: "shadcn/ui", file: "shadcn-theme.css", howTo: "Paste over the :root and .dark blocks in globals.css. Light and dark are both included." },
  { format: "figma", label: "Figma", file: "figma-tokens.json", howTo: "Figma variables with Light and Dark modes, plus text and shadow styles, via the free Tokens Studio plugin. See the steps below." },
  { format: "tokens", label: "W3C tokens", file: "tokens.dtcg.json", howTo: "Standard W3C design tokens for Style Dictionary and other token tools." },
];

export const FREE_FEATURES = [
  "Every cheat sheet, quick reference and browser-support table",
  "Every tool: Markdown, regex, JSON, API client, colours, editors, Git playground",
  "DESIGN.md library: browse, search, copy and download single files",
  "Design System previews in light and dark, DESIGN.md and HTML downloads",
  `Cloud save for up to ${FREE_ITEM_LIMIT} items, and unlimited favourite designs`,
];

export const PRO_FEATURES = [
  `Cloud save for up to ${PRO_ITEM_LIMIT} palettes, API requests, regexes, Markdown and JSON documents`,
  "Share links for anything you save",
  "Complete Design System package: tokens.json, styles.css and every export in one ZIP",
  "Framework exports: Tailwind v4 theme and v3 config, shadcn/ui theme, Figma variables with Light/Dark modes (via Tokens Studio) and W3C design tokens",
  "Everything synced across your devices",
];
