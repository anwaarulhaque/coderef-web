import Link from "next/link";
import { BASELINE_INFO } from "@/lib/compat-shared";
import { BaselineBadge } from "./CompatBits";

/** Explains how to read and use the Browser Support pages. */
export function HowToUseGuide({ open = false }: { open?: boolean }) {
  return (
    <details open={open} className="group mb-8 rounded-xl border border-border bg-surface">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-3">
        <span className="font-semibold">How to use Browser Support</span>
        <span className="text-sm text-muted group-open:hidden">Show guide ▾</span>
        <span className="hidden text-sm text-muted group-open:inline">Hide guide ▴</span>
      </summary>
      <div className="grid gap-6 border-t border-border px-5 py-5 md:grid-cols-3">
        <div>
          <h3 className="mb-2 text-sm font-semibold">1. Find a feature</h3>
          <p className="text-sm text-muted">
            Search by name (<em>“container queries”</em>, <em>“dialog”</em>) or filter by category and Baseline
            status. Each row shows the <strong>first version</strong> of every browser that supports the feature;{" "}
            <span className="rounded bg-rose-500/15 px-1 font-mono text-rose-700 dark:text-rose-300">✕</span> means no
            version supports it yet.
          </p>
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold">2. Check its Baseline status</h3>
          <ul className="space-y-2 text-sm text-muted">
            {(["high", "low", false] as const).map((b) => (
              <li key={String(b)} className="flex flex-col gap-1">
                <BaselineBadge baseline={b} />
                <span>{BASELINE_INFO[b === false ? "false" : b].text}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold">3. Open the feature &amp; ship it</h3>
          <p className="text-sm text-muted">
            A feature page has the full support table (desktop &amp; mobile), support for each sub-feature, a{" "}
            <strong>How to use</strong> section with example code and a feature-detection snippet for fallbacks, plus
            links to MDN and the spec.
          </p>
          <p className="mt-3 text-sm text-muted">
            To see what one browser supports that another doesn’t — or what changed between two versions — use{" "}
            <Link href="/browser-support/compare/" className="text-accent hover:underline">
              Compare browsers
            </Link>
            .
          </p>
        </div>
      </div>
    </details>
  );
}
