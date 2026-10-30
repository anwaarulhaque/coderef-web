"use client";

import { useState } from "react";
import { ApiError, download, requirePro } from "@/lib/account/client";
import { BULK_LIMIT } from "@/lib/plans";

/** Pro: every DESIGN.md in a collection as one ZIP. */
export function BulkDownload({ collection, label, count }: { collection: string; label: string; count: number }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          if (!(await requirePro(`bulk download of the ${label} collection`))) return;
          setBusy(true);
          setError(null);
          try {
            await download("/exports/collection", { collection }, `coderef-${collection}-designs.zip`);
          } catch (e) {
            setError(e instanceof ApiError ? e.message : "Download failed. Please try again.");
          } finally {
            setBusy(false);
          }
        }}
        className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3.5 py-2 text-sm font-medium hover:border-accent hover:text-accent disabled:opacity-60"
      >
        {busy ? "Preparing ZIP…" : `Download all ${Math.min(count, BULK_LIMIT)} DESIGN.md files`}
        <span className="rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">Pro</span>
      </button>
      {error && <p role="alert" className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
