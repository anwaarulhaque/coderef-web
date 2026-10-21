"use client";

import React from "react";
import type { ColorPalette } from "@/lib/colors/types";
import { evaluateContrast, formatHex } from "@/lib/colors/color-utils";

interface ContrastModalProps {
  palette: ColorPalette;
  isOpen: boolean;
  onClose: () => void;
}

export function ContrastModal({ palette, isOpen, onClose }: ContrastModalProps) {
  if (!isOpen) return null;

  const pairs = [
    { label: "Text on Background", fg: palette.text, bg: palette.background, critical: true },
    { label: "Primary on Background", fg: palette.primary, bg: palette.background, critical: true },
    { label: "Secondary on Background", fg: palette.secondary, bg: palette.background, critical: false },
    { label: "Accent on Background", fg: palette.accent, bg: palette.background, critical: false },
    { label: "Text on Primary (Button)", fg: palette.text, bg: palette.primary, critical: false },
    { label: "Background on Primary (Button CTA)", fg: palette.background, bg: palette.primary, critical: true },
    { label: "Text on Secondary (Card / Chip)", fg: palette.text, bg: palette.secondary, critical: true },
    { label: "Accent on Secondary", fg: palette.accent, bg: palette.secondary, critical: false },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-2xl rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h3 className="text-xl font-bold tracking-tight">WCAG 2.1 Contrast Compliance</h3>
            <p className="mt-1 text-xs text-muted">
              Web Content Accessibility Guidelines contrast ratios for your current palette
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg border border-border text-muted hover:text-foreground hover:bg-chip transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="mt-6 max-h-[60vh] overflow-y-auto space-y-3 pr-1">
          {pairs.map((p, i) => {
            const result = evaluateContrast(p.fg, p.bg);

            return (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl border border-border p-3.5 bg-chip/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {/* Visual preview chip */}
                  <div
                    className="flex h-10 w-16 items-center justify-center rounded-lg font-bold text-xs shadow-inner"
                    style={{ backgroundColor: formatHex(p.bg), color: formatHex(p.fg) }}
                  >
                    Aa
                  </div>
                  <div>
                    <div className="text-sm font-semibold flex items-center gap-2">
                      <span>{p.label}</span>
                      {p.critical && (
                        <span className="rounded bg-accent/10 text-accent px-1.5 py-0.2 text-[10px] font-bold">
                          Essential
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted font-mono">
                      {formatHex(p.fg)} on {formatHex(p.bg)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-bold font-mono">{result.ratio}:1</div>
                    <div className="text-[11px] text-muted">
                      {result.ratio >= 7
                        ? "Enhanced AAA"
                        : result.ratio >= 4.5
                        ? "Minimum AA"
                        : result.ratio >= 3
                        ? "Large Text (AA)"
                        : "Low Contrast"}
                    </div>
                  </div>

                  <span
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                      result.score === "AAA"
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        : result.score === "AA"
                        ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                        : result.score === "AA Large"
                        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                        : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {result.score}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 border-t border-border pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted">
          <div>
            <strong>AA:</strong> ≥ 4.5:1 (normal text) · <strong>AAA:</strong> ≥ 7:1 (strict) · <strong>Large:</strong> ≥ 3:1
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-chip hover:bg-chip-hover px-4 py-2 font-semibold text-foreground transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
