"use client";

import React, { useState } from "react";
import type { ColorPalette, FontPair } from "@/lib/colors/types";
import {
  buildPaletteQuery,
  exportAsCss,
  exportAsJson,
  exportAsScss,
  exportAsTailwind,
} from "@/lib/colors/color-utils";

interface ExportModalProps {
  palette: ColorPalette;
  fontPair: FontPair;
  isOpen: boolean;
  onClose: () => void;
}

type ExportTab = "css" | "tailwind" | "scss" | "json" | "link";

export function ExportModal({ palette, fontPair, isOpen, onClose }: ExportModalProps) {
  const [tab, setTab] = useState<ExportTab>("css");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentUrl = typeof window !== "undefined" ? window.location.origin : "https://coderef.xyz";
  const shareLink = `${currentUrl}/realtime-colors/${buildPaletteQuery(palette, fontPair.id)}`;

  let content = "";
  switch (tab) {
    case "css":
      content = exportAsCss(palette);
      break;
    case "tailwind":
      content = exportAsTailwind(palette);
      break;
    case "scss":
      content = exportAsScss(palette);
      break;
    case "json":
      content = exportAsJson(palette);
      break;
    case "link":
      content = shareLink;
      break;
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-xl rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h3 className="text-xl font-bold tracking-tight">Export Color Palette</h3>
            <p className="mt-1 text-xs text-muted">Copy ready-to-use tokens into your project or share with teammates</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg border border-border text-muted hover:text-foreground hover:bg-chip transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Format Switcher */}
        <div className="mt-5 flex flex-wrap gap-1.5 rounded-xl border border-border bg-chip/50 p-1">
          {[
            { id: "css", label: "CSS Variables" },
            { id: "tailwind", label: "Tailwind" },
            { id: "scss", label: "SCSS" },
            { id: "json", label: "JSON" },
            { id: "link", label: "Share Link" },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id as ExportTab)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                tab === t.id ? "bg-surface text-foreground shadow-xs" : "text-muted hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Code Block / Link Box */}
        <div className="mt-4 relative">
          {tab === "link" ? (
            <div className="rounded-xl border border-border bg-chip/30 p-4">
              <label className="block text-xs font-semibold text-muted mb-1.5">Shareable Palette URL</label>
              <input
                type="text"
                readOnly
                value={shareLink}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs font-mono text-foreground outline-none"
              />
              <p className="mt-2 text-[11px] text-muted">
                Anyone with this link will view the exact colors and typography configuration in real-time.
              </p>
            </div>
          ) : (
            <pre className="max-h-64 overflow-x-auto rounded-xl border border-border bg-chip/40 p-4 font-mono text-xs leading-relaxed text-foreground">
              <code>{content}</code>
            </pre>
          )}
        </div>

        {/* Modal Footer */}
        <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
          <span className="text-xs text-muted">
            {tab === "link" ? "Realtime Colors permalink format" : "Ready to paste into codebase"}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-xs font-semibold text-muted hover:text-foreground hover:bg-chip transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-bold text-white shadow-xs transition-all hover:opacity-90 active:scale-95"
            >
              {copied ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  <span>Copy {tab === "link" ? "Link" : "Code"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
