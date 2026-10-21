"use client";

import Link from "next/link";
import { useState } from "react";
import type { Sheet, SheetItem } from "@/lib/types";

const CHIP = "inline-block rounded-md bg-chip px-2 py-0.5 font-mono text-[13px]";
const ROW = "block py-0.5 text-sm";

function ItemLink({ item, className }: { item: SheetItem; className: string }) {
  if (!item.url) return <span className={className}>{item.name}</span>;
  const hover = `${className} transition-colors hover:text-accent`;
  // Internal links (e.g. "Related" topics) stay in the site.
  if (item.url.startsWith("/")) {
    return (
      <Link href={item.url} className={hover}>
        {item.name}
      </Link>
    );
  }
  return (
    <a href={item.url} target="_blank" rel="noopener noreferrer" className={hover}>
      {item.name}
    </a>
  );
}

export function SheetView({ sheet }: { sheet: Sheet }) {
  const isLinks = sheet.kind === "links";
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const matches = (item: SheetItem) => !q || item.name.toLowerCase().includes(q);

  // Drop groups and sections that have nothing left after filtering.
  const sections = sheet.sections
    .map((section) => ({
      ...section,
      groups: section.groups
        .map((group) => ({ ...group, items: group.items.filter(matches) }))
        .filter((group) => group.items.length > 0),
    }))
    .filter((section) => section.groups.length > 0);

  return (
    <>
      {!isLinks && (
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Filter ${sheet.title}…`}
          aria-label={`Filter ${sheet.title} entries`}
          className="mb-6 h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-accent sm:max-w-xs"
        />
      )}

      {sections.length === 0 ? (
        <p className="text-muted">Nothing matches “{query}”.</p>
      ) : (
        <div className={isLinks ? "max-w-2xl" : "columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4"}>
          {sections.map((section) => (
            <section
              key={section.title}
              className="mb-4 break-inside-avoid rounded-xl border border-border bg-surface"
            >
              <h2
                className="rounded-t-xl border-b border-border px-4 py-2 font-semibold"
                style={{ boxShadow: `inset 3px 0 0 ${sheet.color}` }}
              >
                {section.title}
              </h2>
              <div className="space-y-3 p-4">
                {section.groups.map((group, i) => (
                  <div key={group.title ?? i}>
                    {group.title && (
                      <h3 className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted">
                        {group.title}
                      </h3>
                    )}
                    <ul className={isLinks ? "space-y-0.5" : "flex flex-wrap gap-1.5"}>
                      {group.items.map((item) => (
                        <li key={item.name}>
                          <ItemLink
                            item={item}
                            className={isLinks ? ROW : `${CHIP}${item.url ? " hover:bg-chip-hover" : ""}`}
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
