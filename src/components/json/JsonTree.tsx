"use client";

import { memo, useState } from "react";
import { childPath, typeOf } from "@/lib/json/tools";

const PAGE = 100; // array/object children shown before "show more"

const valueClass: Record<string, string> = {
  string: "text-[var(--json-string,#16a34a)]",
  number: "text-[var(--json-number,#2563eb)]",
  boolean: "text-[var(--json-bool,#ea580c)]",
  null: "text-[var(--json-bool,#ea580c)] italic",
};

function Primitive({ value }: { value: unknown }) {
  const type = typeOf(value);
  const text = type === "string" ? JSON.stringify(value) : String(value);
  return <span className={`${valueClass[type] ?? ""} break-all`}>{text}</span>;
}

type NodeProps = {
  name: string | number | null;
  value: unknown;
  path: string;
  depth: number;
  openDepth: number;
  onPick: (path: string, value: unknown) => void;
  filter: string;
};

const matchesFilter = (name: string | number | null, value: unknown, filter: string): boolean => {
  if (!filter) return true;
  if (name !== null && String(name).toLowerCase().includes(filter)) return true;
  if (value === null || typeof value !== "object") return String(value).toLowerCase().includes(filter);
  return Object.entries(value).some(([k, v]) => matchesFilter(Array.isArray(value) ? Number(k) : k, v, filter));
};

const TreeNode = memo(function TreeNode({ name, value, path, depth, openDepth, onPick, filter }: NodeProps) {
  const isArray = Array.isArray(value);
  const isObject = value !== null && typeof value === "object";
  const [open, setOpen] = useState(depth < openDepth || !!filter);
  const [limit, setLimit] = useState(PAGE);

  if (filter && !matchesFilter(name, value, filter)) return null;

  const label =
    name === null ? (
      <span className="text-muted">root</span>
    ) : typeof name === "number" ? (
      <span className="text-muted">{name}</span>
    ) : (
      <span className="text-[var(--json-key,#9333ea)]">{name}</span>
    );

  if (!isObject) {
    return (
      <div className="flex items-start gap-1 py-px pl-5" style={{ paddingLeft: depth * 16 + 20 }}>
        <button type="button" onClick={() => onPick(path, value)} title={`Copy path ${path}`} className="shrink-0 rounded px-0.5 hover:bg-chip">
          {label}
        </button>
        <span className="text-muted">:</span>
        <Primitive value={value} />
      </div>
    );
  }

  const entries = Object.entries(value as object);
  const count = entries.length;
  return (
    <div>
      <div className="flex items-center gap-1 py-px" style={{ paddingLeft: depth * 16 }}>
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={open ? "Collapse" : "Expand"} className="flex size-5 shrink-0 items-center justify-center rounded text-muted hover:bg-chip">
          <svg width="10" height="10" viewBox="0 0 10 10" className={`transition-transform ${open ? "rotate-90" : ""}`} aria-hidden>
            <path d="M3 2l4 3-4 3z" fill="currentColor" />
          </svg>
        </button>
        <button type="button" onClick={() => onPick(path, value)} title={`Copy path ${path}`} className="rounded px-0.5 hover:bg-chip">
          {label}
        </button>
        <span className="text-muted">{isArray ? `[${count}]` : `{${count}}`}</span>
        {!open && <span className="truncate text-xs text-muted">{isArray ? "array" : "object"}</span>}
      </div>
      {open && (
        <>
          {entries.slice(0, limit).map(([k, v]) => {
            const key = isArray ? Number(k) : k;
            return <TreeNode key={k} name={key} value={v} path={childPath(path, key)} depth={depth + 1} openDepth={openDepth} onPick={onPick} filter={filter} />;
          })}
          {count > limit && (
            <button type="button" onClick={() => setLimit((l) => l + PAGE * 5)} className="my-1 rounded border border-border px-2 py-0.5 text-xs text-muted hover:text-foreground" style={{ marginLeft: (depth + 1) * 16 + 20 }}>
              Show {Math.min(PAGE * 5, count - limit)} more of {count - limit}
            </button>
          )}
        </>
      )}
    </div>
  );
});

/** Collapsible, colour-coded tree. Click any key to copy its JSONPath. */
export function JsonTree({ value, onPick }: { value: unknown; onPick: (path: string, value: unknown) => void }) {
  const [openDepth, setOpenDepth] = useState(2);
  const [version, setVersion] = useState(0); // re-mount to apply expand/collapse all
  const [filter, setFilter] = useState("");
  const f = filter.trim().toLowerCase();
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2">
        <input
          type="search"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter keys and values…"
          aria-label="Filter tree"
          className="h-8 min-w-0 flex-1 rounded-md border border-border bg-background px-2 text-sm outline-none focus:border-accent"
        />
        <button type="button" onClick={() => { setOpenDepth(99); setVersion((v) => v + 1); }} className="h-8 rounded-md border border-border px-2 text-xs hover:border-accent hover:text-accent">
          Expand all
        </button>
        <button type="button" onClick={() => { setOpenDepth(1); setVersion((v) => v + 1); }} className="h-8 rounded-md border border-border px-2 text-xs hover:border-accent hover:text-accent">
          Collapse all
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-2 font-mono text-[13px] leading-6" key={`${version}-${f}`}>
        <TreeNode name={null} value={value} path="$" depth={0} openDepth={openDepth} onPick={onPick} filter={f} />
      </div>
    </div>
  );
}
