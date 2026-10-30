"use client";

import { useState } from "react";
import { kv, uid, type KV } from "@/lib/api/request";

const input =
  "h-8 w-full min-w-0 rounded-md border border-transparent bg-transparent px-2 font-mono text-[12.5px] outline-none placeholder:text-muted/70 hover:border-border focus:border-accent focus:bg-surface";

/** Postman-style rows: enable checkbox, key, value, remove. Typing in the blank last row adds a row. */
export function KeyValueEditor({
  rows,
  onChange,
  keyPlaceholder = "Key",
  valuePlaceholder = "Value",
  warn,
}: {
  rows: KV[];
  onChange: (rows: KV[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  /** A warning to show under a row, e.g. a header the browser won't send. */
  warn?: (row: KV) => string | null;
}) {
  // The blank row's id becomes the new row's id, so the input being typed in keeps focus.
  const [pendingId, setPendingId] = useState(uid);
  const set = (id: string, patch: Partial<KV>) => onChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const all = [...rows, { ...kv(), id: pendingId }];

  return (
    <div className="text-sm">
      <div className="grid grid-cols-[2rem_minmax(0,1fr)_minmax(0,1.4fr)_2rem] border-b border-border px-1 py-1 text-xs font-semibold uppercase tracking-wide text-muted">
        <span />
        <span className="px-2">{keyPlaceholder}</span>
        <span className="px-2">{valuePlaceholder}</span>
        <span />
      </div>
      {all.map((row) => {
        const isNew = row.id === pendingId;
        const add = (patch: Partial<KV>) => {
          onChange([...rows, { ...kv(), ...patch, id: pendingId }]);
          setPendingId(uid());
        };
        const message = !isNew && warn?.(row);
        return (
          <div key={row.id} className="border-b border-border/60">
            <div className={`grid grid-cols-[2rem_minmax(0,1fr)_minmax(0,1.4fr)_2rem] items-center px-1 py-0.5 ${!isNew && !row.enabled ? "opacity-50" : ""}`}>
              <span className="flex justify-center">
                {!isNew && (
                  <input
                    type="checkbox"
                    checked={row.enabled}
                    onChange={(e) => set(row.id, { enabled: e.target.checked })}
                    aria-label={`Enable ${row.key || "row"}`}
                    className="accent-[var(--accent)]"
                  />
                )}
              </span>
              <input
                className={input}
                value={row.key}
                placeholder={keyPlaceholder}
                aria-label={keyPlaceholder}
                onChange={(e) => (isNew ? add({ key: e.target.value }) : set(row.id, { key: e.target.value }))}
              />
              <input
                className={input}
                value={row.value}
                placeholder={valuePlaceholder}
                aria-label={valuePlaceholder}
                onChange={(e) => (isNew ? add({ value: e.target.value }) : set(row.id, { value: e.target.value }))}
              />
              <span className="flex justify-center">
                {!isNew && (
                  <button
                    type="button"
                    onClick={() => onChange(rows.filter((r) => r.id !== row.id))}
                    className="flex size-7 items-center justify-center rounded-md text-muted hover:bg-chip hover:text-foreground"
                    aria-label={`Remove ${row.key || "row"}`}
                  >
                    ×
                  </button>
                )}
              </span>
            </div>
            {message && <p className="px-11 pb-1 text-xs text-amber-700 dark:text-amber-400">{message}</p>}
          </div>
        );
      })}
    </div>
  );
}
