"use client";

import { useState } from "react";
import { copyText } from "@/components/quickref/Snippet";
import { readableOn } from "@/lib/design-md-shared";

/** The palette as big swatches; click one to copy its hex. */
export function Palette({ colors }: { colors: string[] }) {
  const [copied, setCopied] = useState<string | null>(null);
  if (!colors.length) return null;
  return (
    // Columns follow the space the palette is given (a sidebar or a full row), not the screen,
    // so every swatch stays wide enough for its hex.
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] gap-2">
      {colors.map((c) => (
        <li key={c}>
          <button
            type="button"
            title={`Copy ${c}`}
            onClick={async () => {
              if (await copyText(c)) {
                setCopied(c);
                setTimeout(() => setCopied(null), 1100);
              }
            }}
            className="flex h-16 w-full items-end rounded-lg border border-border p-1.5 font-mono text-[11px] transition-transform hover:-translate-y-0.5"
            style={{ backgroundColor: c, color: readableOn(c) }}
          >
            {copied === c ? "Copied" : c}
          </button>
        </li>
      ))}
    </ul>
  );
}

/** Copies a block of text (a template, a prompt) with one click. */
export function CopyTextButton({ text, label, className }: { text: string; label: string; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        if (await copyText(text)) {
          setDone(true);
          setTimeout(() => setDone(false), 1400);
        }
      }}
    >
      {done ? "Copied ✓" : label}
    </button>
  );
}

/** Saves a block of text as a file, without a server round trip. */
export function DownloadTextButton({ text, filename, label, className }: { text: string; filename: string; label: string; className?: string }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        const url = URL.createObjectURL(new Blob([text], { type: "text/markdown;charset=utf-8" }));
        const a = Object.assign(document.createElement("a"), { href: url, download: filename });
        a.click();
        URL.revokeObjectURL(url);
      }}
    >
      {label}
    </button>
  );
}
