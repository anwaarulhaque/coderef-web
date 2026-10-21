"use client";

import { useState, type CSSProperties } from "react";
import type { Sheet, SheetDemo, SheetGroup } from "@/lib/types";

// "grid-template-columns: 1fr 2fr; gap: 4px;" -> { gridTemplateColumns: "1fr 2fr", gap: "4px" }
function cssToStyle(css = ""): CSSProperties {
  const style: Record<string, string> = {};
  for (const declaration of css.split(";")) {
    const colon = declaration.indexOf(":");
    if (colon === -1) continue;
    const prop = declaration.slice(0, colon).trim();
    const value = declaration.slice(colon + 1).trim();
    if (prop && value) style[prop.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())] = value;
  }
  return style as CSSProperties;
}

function Demo({ demo, code }: { demo: SheetDemo; code: string }) {
  const count = demo.items ?? 6;
  const onContainer = demo.target === undefined;
  return (
    <div className="h-28 w-full overflow-hidden rounded-md border border-border bg-background p-2" aria-hidden>
      {/* The container itself is tinted and outlined so its bounds — and the free space inside — are visible. */}
      <div
        className="rounded-[3px]"
        style={{
          background: "var(--demo-container, rgb(37 99 235 / 0.07))",
          outline: "1.5px dashed var(--demo-container-line, rgb(37 99 235 / 0.4))",
          ...cssToStyle(demo.base),
          ...(onContainer ? cssToStyle(code) : {}),
        }}
      >
        {Array.from({ length: count }, (_, i) => {
          const isTarget = demo.target === i;
          return (
            <div
              key={i}
              className={`flex min-h-4 min-w-4 items-center justify-center rounded-[4px] font-mono text-[11px] font-semibold leading-none text-white shadow-sm ${
                isTarget ? "bg-demo-target" : i % 2 ? "bg-demo-b" : "bg-demo-a"
              }`}
              style={{
                ...cssToStyle(demo.itemBase),
                ...cssToStyle(demo.itemStyles?.[i]),
                ...(isTarget ? cssToStyle(code) : {}),
              }}
            >
              {i + 1}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PropertyCard({ group }: { group: SheetGroup }) {
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied((current) => (current === code ? null : current)), 1200);
    } catch {
      // Clipboard can be unavailable (insecure context, denied permission); the code is still visible.
    }
  }

  return (
    <article className="rounded-xl border border-border bg-surface p-4">
      <h3 className="font-mono text-base font-semibold">
        {group.url ? (
          <a href={group.url} target="_blank" rel="noopener noreferrer" className="hover:text-accent">
            {group.title}
          </a>
        ) : (
          group.title
        )}
      </h3>
      {group.description && <p className="mt-1 text-sm text-muted">{group.description}</p>}
      <ul className="mt-3 grid grid-cols-2 gap-3">
        {group.items.map((item) => (
          <li key={item.name}>
            <button
              type="button"
              onClick={() => copy(item.name)}
              title="Copy CSS"
              className="group w-full rounded-lg p-1 text-left transition-colors hover:bg-chip"
            >
              {group.demo && <Demo demo={group.demo} code={item.name} />}
              <pre className="mt-1.5 whitespace-pre-wrap break-words font-mono text-[11px] leading-snug text-foreground/90 group-hover:text-accent">
                {copied === item.name ? "Copied!" : item.name}
              </pre>
            </button>
          </li>
        ))}
      </ul>
    </article>
  );
}

export function VisualSheetView({ sheet }: { sheet: Sheet }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const sections = sheet.sections
    .map((section) => ({
      ...section,
      groups: section.groups.filter(
        (group) =>
          !q ||
          group.title?.toLowerCase().includes(q) ||
          group.items.some((item) => item.name.toLowerCase().includes(q)),
      ),
    }))
    .filter((section) => section.groups.length > 0);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Filter ${sheet.title} properties…`}
          aria-label={`Filter ${sheet.title} properties`}
          className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-accent sm:max-w-xs"
        />
        <p className="text-sm text-muted">Click any example to copy its CSS.</p>
      </div>

      {sections.length === 0 ? (
        <p className="text-muted">Nothing matches “{query}”.</p>
      ) : (
        sections.map((section) => (
          <section key={section.title} className="mb-10">
            <h2 className="mb-4 text-xl font-semibold tracking-tight">{section.title}</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {section.groups.map((group) => (
                <PropertyCard key={group.title} group={group} />
              ))}
            </div>
          </section>
        ))
      )}
    </>
  );
}
