"use client";

import React, { useRef } from "react";
import type { ColorLocks, ColorPalette, ColorRole, DeviceView, FontPair, TemplateView } from "@/lib/colors/types";
import { cleanHex, evaluateContrast, formatHex } from "@/lib/colors/color-utils";
import { FONT_PAIRS } from "@/lib/colors/fonts";
import { PresetsDropdown } from "./PresetsDropdown";

interface ColorToolbarProps {
  palette: ColorPalette;
  locks: ColorLocks;
  fontPair: FontPair;
  templateView: TemplateView;
  deviceView: DeviceView;
  canUndo: boolean;
  canRedo: boolean;
  onColorChange: (role: ColorRole, hex: string) => void;
  onToggleLock: (role: ColorRole) => void;
  onRandomize: () => void;
  onInvert: () => void;
  onFontChange: (font: FontPair) => void;
  onTemplateChange: (t: TemplateView) => void;
  onDeviceChange: (d: DeviceView) => void;
  onUndo: () => void;
  onRedo: () => void;
  onOpenContrast: () => void;
  onOpenShades: () => void;
  onOpenExport: () => void;
  onSelectPreset: (palette: ColorPalette) => void;
}

export function ColorToolbar({
  palette,
  locks,
  fontPair,
  templateView,
  deviceView,
  canUndo,
  canRedo,
  onColorChange,
  onToggleLock,
  onRandomize,
  onInvert,
  onFontChange,
  onTemplateChange,
  onDeviceChange,
  onUndo,
  onRedo,
  onOpenContrast,
  onOpenShades,
  onOpenExport,
  onSelectPreset,
}: ColorToolbarProps) {
  const colorInputRefs = {
    text: useRef<HTMLInputElement>(null),
    background: useRef<HTMLInputElement>(null),
    primary: useRef<HTMLInputElement>(null),
    secondary: useRef<HTMLInputElement>(null),
    accent: useRef<HTMLInputElement>(null),
  };

  const roles: { role: ColorRole; label: string }[] = [
    { role: "text", label: "Text" },
    { role: "background", label: "Background" },
    { role: "primary", label: "Primary" },
    { role: "secondary", label: "Secondary" },
    { role: "accent", label: "Accent" },
  ];

  const contrastResult = evaluateContrast(palette.text, palette.background);

  return (
    <div className="sticky top-14 z-20 w-full border-b border-border bg-surface/95 backdrop-blur-md shadow-xs">
      {/* Top Row: 5 Core Color Columns */}
      <div className="grid grid-cols-5 divide-x divide-border border-b border-border">
        {roles.map(({ role, label }) => {
          const hex = palette[role];
          const isLocked = !!locks[role];
          const formatted = formatHex(hex);

          return (
            <div
              key={role}
              className="group relative flex flex-col items-center justify-between p-2.5 sm:px-4 sm:py-3 transition-colors hover:bg-chip/40"
            >
              {/* Top: Name & Lock */}
              <div className="flex w-full items-center justify-between">
                <span className="text-[11px] sm:text-xs font-semibold capitalize text-muted">{label}</span>
                <button
                  type="button"
                  onClick={() => onToggleLock(role)}
                  aria-label={isLocked ? `Unlock ${label}` : `Lock ${label}`}
                  title={isLocked ? "Locked from randomizing" : "Click to lock color"}
                  className={`flex size-6 sm:size-7 items-center justify-center rounded-md transition-all ${
                    isLocked
                      ? "bg-accent text-white shadow-xs"
                      : "text-muted hover:text-foreground hover:bg-chip"
                  }`}
                >
                  {isLocked ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Swatch (Click to pick) */}
              <div
                onClick={() => colorInputRefs[role].current?.click()}
                className="my-1.5 sm:my-2 relative flex size-9 sm:size-11 cursor-pointer items-center justify-center rounded-xl border border-black/15 shadow-sm transition-transform hover:scale-105 active:scale-95"
                style={{ backgroundColor: formatted }}
              >
                {/* Native hidden color input */}
                <input
                  ref={colorInputRefs[role]}
                  type="color"
                  value={formatted}
                  onChange={(e) => onColorChange(role, e.target.value)}
                  className="sr-only"
                />
              </div>

              {/* Hex Input */}
              <div className="w-full text-center">
                <input
                  type="text"
                  value={hex.toUpperCase()}
                  onChange={(e) => onColorChange(role, cleanHex(e.target.value, hex))}
                  maxLength={6}
                  className="w-full text-center font-mono text-[11px] sm:text-xs font-bold uppercase tracking-wider text-foreground outline-none hover:bg-chip focus:bg-chip rounded py-0.5"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Row: Actions, Typography, Presets, Viewport & Tabs */}
      <div className="mx-auto flex flex-wrap items-center justify-between gap-2 px-3 py-2 sm:px-6">
        {/* Left: Randomize Spacebar, Dark Invert, Undo/Redo */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Main Spacebar Generator */}
          <button
            type="button"
            onClick={onRandomize}
            className="flex items-center gap-1.5 sm:gap-2 rounded-xl bg-accent px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-bold text-white shadow-xs transition-all hover:opacity-90 active:scale-95"
            title="Press Space anywhere to randomize"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
            <span>Generate</span>
            <span className="hidden sm:inline-block rounded bg-black/20 px-1.5 py-0.5 text-[10px] font-mono">
              Space
            </span>
          </button>

          {/* Light/Dark Invert */}
          <button
            type="button"
            onClick={onInvert}
            className="flex items-center gap-1 rounded-xl border border-border bg-surface px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-chip transition-colors"
            title="Invert palette (switch between light and dark modes)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
            </svg>
            <span className="hidden md:inline">Invert</span>
          </button>

          {/* Contrast Score Pill */}
          <button
            type="button"
            onClick={onOpenContrast}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-2.5 py-1.5 text-xs font-semibold hover:bg-chip transition-colors"
            title="View WCAG contrast compliance breakdown"
          >
            <span
              className={`size-2 rounded-full ${
                contrastResult.score === "AAA"
                  ? "bg-emerald-500"
                  : contrastResult.score === "AA"
                  ? "bg-blue-500"
                  : "bg-amber-500"
              }`}
            />
            <span className="font-mono">{contrastResult.ratio}:1</span>
            <span className="font-bold text-[10px] opacity-80">{contrastResult.score}</span>
          </button>

          {/* Undo / Redo */}
          <div className="hidden sm:flex items-center gap-0.5 border border-border rounded-xl bg-surface p-0.5">
            <button
              type="button"
              disabled={!canUndo}
              onClick={onUndo}
              className="flex size-7 items-center justify-center rounded-lg text-muted hover:text-foreground hover:bg-chip disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="Undo (Ctrl+Z)"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 7v6h6" />
                <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
              </svg>
            </button>
            <button
              type="button"
              disabled={!canRedo}
              onClick={onRedo}
              className="flex size-7 items-center justify-center rounded-lg text-muted hover:text-foreground hover:bg-chip disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="Redo (Ctrl+Y)"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 7v6h-6" />
                <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Center: Template Switcher Tabs */}
        <div className="flex items-center rounded-xl border border-border bg-chip/60 p-1 text-xs font-semibold">
          {[
            { id: "all", label: "All" },
            { id: "landing", label: "Landing" },
            { id: "dashboard", label: "Dashboard" },
            { id: "blog", label: "Blog" },
            { id: "components", label: "UI Kit" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTemplateChange(tab.id as TemplateView)}
              className={`rounded-lg px-2.5 py-1 transition-all ${
                templateView === tab.id
                  ? "bg-surface text-foreground shadow-xs font-bold"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right: Fonts, Presets, Shades, Export, Device View */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Fonts Selector */}
          <div className="relative">
            <select
              value={fontPair.id}
              onChange={(e) => {
                const match = FONT_PAIRS.find((f) => f.id === e.target.value);
                if (match) onFontChange(match);
              }}
              className="rounded-xl border border-border bg-surface px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-chip transition-colors outline-none cursor-pointer"
            >
              {FONT_PAIRS.map((f) => (
                <option key={f.id} value={f.id}>
                  Aa {f.name}
                </option>
              ))}
            </select>
          </div>

          {/* Presets Dropdown */}
          <PresetsDropdown onSelect={onSelectPreset} />

          {/* Shades Modal trigger */}
          <button
            type="button"
            onClick={onOpenShades}
            className="flex items-center gap-1 rounded-xl border border-border bg-surface px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-chip transition-colors"
            title="View 50-950 shades ladder"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="3" y1="15" x2="21" y2="15" />
            </svg>
            <span className="hidden lg:inline">Shades</span>
          </button>

          {/* Export Modal trigger */}
          <button
            type="button"
            onClick={onOpenExport}
            className="flex items-center gap-1 rounded-xl border border-border bg-surface px-2.5 py-1.5 text-xs font-bold text-foreground hover:bg-chip transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            <span>Export</span>
          </button>

          {/* Viewport Width Switcher */}
          <div className="hidden xl:flex items-center border border-border rounded-xl bg-surface p-0.5">
            {[
              {
                id: "desktop",
                icon: (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="3" width="20" height="14" rx="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                  </svg>
                ),
              },
              {
                id: "tablet",
                icon: (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="4" y="2" width="16" height="20" rx="2" />
                    <line x1="12" y1="18" x2="12.01" y2="18" />
                  </svg>
                ),
              },
              {
                id: "mobile",
                icon: (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="5" y="2" width="14" height="20" rx="2" />
                    <line x1="12" y1="18" x2="12.01" y2="18" />
                  </svg>
                ),
              },
            ].map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => onDeviceChange(v.id as DeviceView)}
                className={`flex size-7 items-center justify-center rounded-lg transition-colors ${
                  deviceView === v.id ? "bg-accent text-white shadow-xs" : "text-muted hover:text-foreground"
                }`}
                title={`Switch to ${v.id} viewport`}
              >
                {v.icon}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
