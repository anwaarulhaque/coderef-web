"use client";

import { useState } from "react";

export function CodeBlock({ code, language, title }: { code: string; language: string; title?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-background">
      <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
        <span className="text-xs text-muted">
          {title ?? language.toUpperCase()}
        </span>
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(code);
              setCopied(true);
              setTimeout(() => setCopied(false), 1200);
            } catch {
              // Clipboard unavailable; the code is still selectable.
            }
          }}
          className="rounded-md border border-border px-2 py-0.5 text-xs text-muted hover:text-foreground"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-3 font-mono text-[12.5px] leading-5">{code}</pre>
    </div>
  );
}
