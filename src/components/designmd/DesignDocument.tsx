"use client";

import { useState } from "react";
import { copyText } from "@/components/quickref/Snippet";
import { designFileHref } from "@/lib/design-md-shared";

export type DesignVariant = { file: string; label: string; html: string; toc: { id: string; title: string }[] };

/** The rendered DESIGN.md (and platform variants as tabs) with a sticky table of contents. */
export function DesignDocument({ id, variants, tokens }: { id: string; variants: DesignVariant[]; tokens: string | null }) {
  const [active, setActive] = useState(0);
  const v = variants[active];

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[14rem_minmax(0,1fr)]">
      <aside className="no-print hidden lg:block">
        <nav aria-label="On this page" className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto text-sm">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">On this page</p>
          <ol className="space-y-1.5 border-l border-border">
            {tokens && (
              <li>
                <a href="#design-tokens" className="-ml-px block border-l border-transparent pl-3 text-muted hover:border-accent hover:text-foreground">
                  Design tokens
                </a>
              </li>
            )}
            {v.toc.map((t) => (
              <li key={t.id}>
                <a href={`#${t.id}`} className="-ml-px block border-l border-transparent pl-3 text-muted hover:border-accent hover:text-foreground">
                  {t.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </aside>

      <div className="min-w-0">
        <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
          {variants.length > 1 ? (
            <div role="tablist" aria-label="Platform" className="flex flex-wrap gap-1 rounded-lg border border-border bg-surface p-1">
              {variants.map((x, i) => (
                <button
                  key={x.file}
                  role="tab"
                  type="button"
                  aria-selected={i === active}
                  onClick={() => setActive(i)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium ${i === active ? "bg-accent text-surface" : "text-muted hover:text-foreground"}`}
                >
                  {x.label}
                </button>
              ))}
            </div>
          ) : (
            <p className="font-mono text-sm text-muted">{v.file}</p>
          )}
          <FileActions id={id} file={v.file} />
        </div>

        <article className="rounded-xl border border-border bg-surface p-5 md:p-8">
          {tokens && active === 0 && (
            <details id="design-tokens" className="mb-6 scroll-mt-20 rounded-lg border border-border bg-background/50">
              <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">Design tokens (YAML front matter)</summary>
              <pre className="max-h-96 overflow-auto border-t border-border px-4 py-3 font-mono text-[12.5px] leading-5">{tokens}</pre>
            </details>
          )}
          <div className="md-preview design-doc" dangerouslySetInnerHTML={{ __html: v.html }} />
        </article>
      </div>
    </div>
  );
}

/** Copy / download / raw for one design file. The raw file is a static asset, fetched on demand. */
export function FileActions({ id, file, primary = false }: { id: string; file: string; primary?: boolean }) {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle");
  const href = designFileHref(id, file);
  const btn = "inline-flex items-center rounded-lg border border-border bg-surface px-3.5 py-2 text-sm font-medium hover:border-accent hover:text-accent";
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        className={primary ? "inline-flex items-center rounded-lg bg-accent px-3.5 py-2 text-sm font-medium text-surface hover:opacity-90" : btn}
        onClick={async () => {
          try {
            const text = await fetch(href).then((r) => (r.ok ? r.text() : Promise.reject(r.status)));
            setState((await copyText(text)) ? "copied" : "error");
          } catch {
            setState("error");
          }
          setTimeout(() => setState("idle"), 1600);
        }}
      >
        {state === "copied" ? "Copied ✓" : state === "error" ? "Copy failed" : `Copy ${file}`}
      </button>
      <a href={href} download={file === "DESIGN.md" ? "DESIGN.md" : file} className={btn}>
        Download
      </a>
      <a href={href} target="_blank" rel="noopener" className={btn}>
        Raw
      </a>
    </div>
  );
}
