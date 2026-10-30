"use client";

import { useState } from "react";

/** Copies text; falls back to a hidden textarea where the async Clipboard API is unavailable (e.g. plain http). */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.append(ta);
    ta.select();
    try {
      return document.execCommand("copy");
    } catch {
      return false;
    } finally {
      ta.remove();
    }
  }
}

/** A code snippet that copies itself on click. */
export function Snippet({ code, compact = false }: { code: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      title="Click to copy"
      onClick={async () => {
        if (await copyText(code)) {
          setCopied(true);
          setTimeout(() => setCopied(false), 1100);
        }
      }}
      className="group relative block w-full rounded-md bg-background text-left transition-colors hover:bg-chip"
    >
      <pre
        className={`overflow-x-auto whitespace-pre font-mono leading-5 [tab-size:2] ${compact ? "px-2 py-1 text-[12px]" : "px-2.5 py-1.5 text-[12.5px]"}`}
      >
        {code}
      </pre>
      <span
        className={`pointer-events-none absolute top-1 right-1 rounded px-1.5 py-0.5 text-[10px] font-medium transition-opacity ${
          copied ? "bg-emerald-600 text-white opacity-100" : "bg-surface text-muted opacity-0 group-hover:opacity-100"
        }`}
      >
        {copied ? "Copied" : "Copy"}
      </span>
    </button>
  );
}

/** Keyboard shortcut: "Ctrl+K Ctrl+S" -> chords of <kbd> keys. */
export function Keys({ combo }: { combo: string }) {
  // "Shift+Alt+Drag" etc. split on "+"; macOS symbol chords like "⇧⌘P" stay as one key.
  const chords = combo.split(" ").filter(Boolean);
  const isNote = /\(.*\)/.test(combo);
  if (isNote) {
    const [keys, note] = combo.split(/\s(?=\()/);
    return (
      <span className="inline-flex flex-wrap items-center gap-1">
        <Keys combo={keys} />
        <span className="text-xs text-muted">{note}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {chords.map((chord, i) => (
        <span key={i} className="inline-flex items-center gap-0.5">
          {chord.split(/(?<=.)\+(?=.)/).map((key, j) => (
            <kbd
              key={j}
              className="min-w-6 rounded border border-border border-b-2 bg-surface px-1.5 py-0.5 text-center font-mono text-[12px] leading-4"
            >
              {key}
            </kbd>
          ))}
        </span>
      ))}
    </span>
  );
}
