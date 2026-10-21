// Client-safe helpers for browser-support data (no fs imports).
export const BROWSER_LIST = [
  { id: "chrome", name: "Chrome", platform: "Desktop" },
  { id: "edge", name: "Edge", platform: "Desktop" },
  { id: "firefox", name: "Firefox", platform: "Desktop" },
  { id: "safari", name: "Safari", platform: "Desktop" },
  { id: "chrome_android", name: "Chrome Android", platform: "Mobile" },
  { id: "firefox_android", name: "Firefox Android", platform: "Mobile" },
  { id: "safari_ios", name: "Safari iOS", platform: "Mobile" },
] as const;

export type BrowserId = (typeof BROWSER_LIST)[number]["id"];
export type Baseline = "high" | "low" | false;
export type Support = Partial<Record<BrowserId, string>>;

/** What the index and compare pages need on the client. */
export type FeatureSummary = {
  id: string;
  name: string;
  category: string;
  baseline: Baseline;
  support: Support;
  description: string;
  /** Date the feature became Baseline (newly available), if it has. */
  since?: string;
};

/** "≤79" -> [79]; "16.4" -> [16, 4] */
const parts = (v: string) => v.replace(/^≤/, "").split(".").map(Number);

export function compareVersions(a: string, b: string): number {
  const [pa, pb] = [parts(a), parts(b)];
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d) return d;
  }
  return 0;
}

/** Is a feature supported in `version` of a browser, given the first version that supports it? */
export function supportedIn(firstSupported: string | undefined, version: string): boolean {
  return firstSupported !== undefined && compareVersions(version, firstSupported) >= 0;
}

export const BASELINE_INFO: Record<"high" | "low" | "false", { label: string; short: string; text: string }> = {
  high: {
    label: "Widely available",
    short: "Widely available",
    text: "Supported in all major browsers for at least 30 months — safe to use without fallbacks.",
  },
  low: {
    label: "Newly available",
    short: "Newly available",
    text: "Works in the latest version of every major browser, but older devices may not support it yet.",
  },
  false: {
    label: "Limited availability",
    short: "Limited",
    text: "Not yet supported in all major browsers — check the table and provide a fallback.",
  },
};

export const baselineKey = (b: Baseline) => (b === false ? "false" : b);

export const BASELINE_STYLE: Record<"high" | "low" | "false", string> = {
  high: "border-emerald-600/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  low: "border-sky-600/30 bg-sky-500/15 text-sky-700 dark:text-sky-300",
  false: "border-amber-600/30 bg-amber-500/15 text-amber-700 dark:text-amber-300",
};

