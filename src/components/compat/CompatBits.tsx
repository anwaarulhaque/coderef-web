// Small presentational pieces shared by the Browser Support pages (server- and client-safe).
import { BASELINE_INFO, BASELINE_STYLE, BROWSER_LIST, baselineKey, type Baseline, type Support } from "@/lib/compat-shared";

export const BROWSER_SHORT: Record<string, string> = {
  chrome: "Chrome",
  edge: "Edge",
  firefox: "Firefox",
  safari: "Safari",
  chrome_android: "Chrome And.",
  firefox_android: "Firefox And.",
  safari_ios: "Safari iOS",
};

export function BaselineBadge({ baseline, size = "sm" }: { baseline: Baseline; size?: "sm" | "md" }) {
  const key = baselineKey(baseline);
  const info = BASELINE_INFO[key];
  return (
    <span
      title={info.text}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border font-medium whitespace-nowrap ${BASELINE_STYLE[key]} ${
        size === "md" ? "px-3 py-1 text-sm" : "px-2 py-0.5 text-[11px]"
      }`}
    >
      <BaselineIcon baseline={baseline} />
      {size === "md" ? (baseline === false ? info.label : `Baseline · ${info.label}`) : info.short}
    </span>
  );
}

function BaselineIcon({ baseline }: { baseline: Baseline }) {
  if (baseline === "high") return <span aria-hidden>✓</span>;
  if (baseline === "low") return <span aria-hidden>✓</span>;
  return <span aria-hidden>!</span>;
}

/** One cell per browser: the first version with support, or ✕. */
export function SupportCells({ support }: { support: Support }) {
  return (
    <>
      {BROWSER_LIST.map((b) => {
        const v = support[b.id];
        return (
          <span
            key={b.id}
            title={`${b.name}: ${v ? `supported since ${v}` : "not supported"}`}
            className={`flex h-7 items-center justify-center rounded font-mono text-[11px] ${
              v
                ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300"
                : "bg-rose-500/15 text-rose-700 dark:text-rose-300"
            }`}
          >
            {v ?? "✕"}
          </span>
        );
      })}
    </>
  );
}

export const SUPPORT_GRID = "grid grid-cols-[repeat(7,minmax(3.25rem,1fr))] gap-1";
