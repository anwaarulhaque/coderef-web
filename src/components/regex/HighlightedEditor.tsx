"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

// A textarea with a colored copy of its text rendered underneath (the textarea's own text is
// transparent). Both layers share font, padding and wrapping so the colors line up exactly.
const SHARED = "whitespace-pre-wrap break-words px-3 py-2 font-mono text-[13px] leading-6 [tab-size:4]";

export function HighlightedEditor({
  value,
  onChange,
  highlighted,
  singleLine = false,
  placeholder,
  label,
  textareaRef,
  minRows = 1,
}: {
  value: string;
  onChange: (value: string) => void;
  highlighted: ReactNode;
  singleLine?: boolean;
  placeholder?: string;
  label: string;
  textareaRef?: (el: HTMLTextAreaElement | null) => void;
  minRows?: number;
}) {
  const innerRef = useRef<HTMLTextAreaElement | null>(null);

  // Grow with the content so neither layer ever scrolls on its own.
  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <div className="relative min-w-0 flex-1">
      <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden text-foreground ${SHARED}`}>
        {highlighted}
        {/* Keeps a trailing newline from collapsing the last line. */}
        {"​"}
      </div>
      <textarea
        ref={(el) => {
          innerRef.current = el;
          textareaRef?.(el);
        }}
        value={value}
        rows={minRows}
        aria-label={label}
        placeholder={placeholder}
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        onChange={(e) => onChange(singleLine ? e.target.value.replace(/[\r\n]/g, "") : e.target.value)}
        onKeyDown={(e) => {
          if (singleLine && e.key === "Enter") e.preventDefault();
        }}
        className={`relative block w-full resize-none overflow-hidden bg-transparent text-transparent caret-foreground outline-none placeholder:text-muted selection:bg-accent/25 selection:text-transparent ${SHARED}`}
      />
    </div>
  );
}
