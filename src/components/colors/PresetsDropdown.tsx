"use client";

import React, { useEffect, useRef, useState } from "react";
import type { ColorPalette, ColorPreset } from "@/lib/colors/types";
import { COLOR_PRESETS } from "@/lib/colors/presets";
import { formatHex } from "@/lib/colors/color-utils";

interface PresetsDropdownProps {
  currentPalette?: ColorPalette;
  onSelect: (palette: ColorPalette) => void;
}

export function PresetsDropdown({ currentPalette, onSelect }: PresetsDropdownProps) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<ColorPreset["category"] | "all">("all");
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const filtered = COLOR_PRESETS.filter((p) => {
    const matchesCategory = filter === "all" || p.category === filter;
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-chip transition-colors shadow-xs"
        title="Browse 36+ curated palettes"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a10 10 0 0 1 10 10c0 5.523-4.477 10-10 10" />
        </svg>
        <span className="hidden sm:inline">Presets</span>
        <span className="rounded-full bg-chip px-1.5 py-0.2 text-[10px] font-mono text-muted">
          {COLOR_PRESETS.length}
        </span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <path d="M2 3.5 5 6.5 8 3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute bottom-full mb-3 left-0 sm:right-0 sm:left-auto z-50 w-[320px] sm:w-[420px] rounded-2xl border border-border bg-surface/98 backdrop-blur-xl p-3.5 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header & Search */}
          <div className="border-b border-border pb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">
                Curated Palettes ({filtered.length})
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-muted hover:text-foreground text-xs"
              >
                ✕
              </button>
            </div>

            {/* Quick search input */}
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search presets by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-border bg-chip/50 pl-8 pr-3 py-1.5 text-xs text-foreground outline-none focus:border-accent"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="mt-2.5 flex flex-wrap items-center gap-1 text-[11px]">
              {(["all", "trending", "dark", "light", "vibrant", "minimal"] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFilter(cat)}
                  className={`rounded-lg px-2.5 py-1 capitalize transition-all ${
                    filter === cat
                      ? "bg-foreground text-background font-bold shadow-xs"
                      : "bg-chip/60 text-muted hover:text-foreground hover:bg-chip"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Presets List */}
          <div className="mt-2.5 max-h-80 overflow-y-auto space-y-1.5 pr-1">
            {filtered.map((preset) => {
              const isActive =
                currentPalette &&
                currentPalette.primary.toLowerCase() === preset.colors.primary.toLowerCase() &&
                currentPalette.background.toLowerCase() === preset.colors.background.toLowerCase();

              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    onSelect(preset.colors);
                    setOpen(false);
                  }}
                  className={`group flex w-full items-center justify-between rounded-xl p-2.5 text-left transition-all ${
                    isActive
                      ? "bg-accent/10 border border-accent/30"
                      : "hover:bg-chip border border-transparent"
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-foreground group-hover:text-accent transition-colors flex items-center gap-1.5">
                      <span>{preset.name}</span>
                      {isActive && <span className="text-[10px] text-accent">✓ Active</span>}
                    </div>
                    <div className="text-[10px] text-muted capitalize font-medium">{preset.category}</div>
                  </div>

                  {/* 5 Swatches preview pills */}
                  <div className="flex items-center -space-x-1.5">
                    {(
                      [
                        preset.colors.text,
                        preset.colors.background,
                        preset.colors.primary,
                        preset.colors.secondary,
                        preset.colors.accent,
                      ] as const
                    ).map((hex, i) => (
                      <span
                        key={i}
                        className="size-5 rounded-full border border-black/20 shadow-xs transition-transform group-hover:scale-110"
                        style={{ backgroundColor: formatHex(hex) }}
                      />
                    ))}
                  </div>
                </button>
              );
            })}

            {filtered.length === 0 && (
              <div className="py-8 text-center text-xs text-muted">
                No palettes match &ldquo;{search}&rdquo;
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
