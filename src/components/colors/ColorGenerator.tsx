"use client";

import React, { useCallback, useEffect, useState } from "react";
import type {
  ColorLocks,
  ColorPalette,
  ColorRole,
  DeviceView,
  FontPair,
  TemplateView,
} from "@/lib/colors/types";
import { DEFAULT_PALETTE } from "@/lib/colors/presets";
import { DEFAULT_FONT_PAIR, getFontPairById } from "@/lib/colors/fonts";
import {
  buildPaletteQuery,
  cleanHex,
  formatHex,
  generateHarmoniousPalette,
  invertPalette,
  parsePaletteFromSearch,
} from "@/lib/colors/color-utils";
import { FloatingColorDock } from "./FloatingColorDock";
import { ContrastModal } from "./ContrastModal";
import { ShadesModal } from "./ShadesModal";
import { ExportModal } from "./ExportModal";
import { LandingPageTemplate } from "./templates/LandingPageTemplate";
import { DashboardTemplate } from "./templates/DashboardTemplate";
import { BlogTemplate } from "./templates/BlogTemplate";
import { ComponentsTemplate } from "./templates/ComponentsTemplate";

export function ColorGenerator() {
  const [palette, setPalette] = useState<ColorPalette>(DEFAULT_PALETTE);
  const [locks, setLocks] = useState<ColorLocks>({});
  const [fontPair, setFontPair] = useState<FontPair>(DEFAULT_FONT_PAIR);
  const [templateView, setTemplateView] = useState<TemplateView>("all");
  const [deviceView, setDeviceView] = useState<DeviceView>("desktop");

  // History for Undo/Redo
  const [history, setHistory] = useState<ColorPalette[]>([DEFAULT_PALETTE]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Modals
  const [contrastOpen, setContrastOpen] = useState(false);
  const [shadesOpen, setShadesOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  // Initialize from URL search query on mount
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- one-time restore from URL */
    if (typeof window === "undefined") return;
    const { colors, fonts } = parsePaletteFromSearch(window.location.search);
    if (colors) {
      setPalette(colors);
      setHistory([colors]);
      setHistoryIndex(0);
    }
    if (fonts) {
      setFontPair(getFontPairById(fonts));
    }
  }, []);

  // Sync to URL when palette or font changes
  const updateUrl = useCallback((newPalette: ColorPalette, newFont: FontPair) => {
    if (typeof window === "undefined") return;
    const query = buildPaletteQuery(newPalette, newFont.id);
    const newUrl = `${window.location.pathname}${query}`;
    window.history.replaceState(null, "", newUrl);
  }, []);

  // Update palette with history tracking
  const pushPalette = useCallback(
    (newPalette: ColorPalette) => {
      setPalette(newPalette);
      setHistory((prev) => {
        const next = prev.slice(0, historyIndex + 1);
        return [...next, newPalette];
      });
      setHistoryIndex((prev) => prev + 1);
      updateUrl(newPalette, fontPair);
    },
    [historyIndex, fontPair, updateUrl],
  );

  const handleColorChange = (role: ColorRole, hex: string) => {
    const updated = { ...palette, [role]: cleanHex(hex, palette[role]) };
    pushPalette(updated);
  };

  const handleToggleLock = (role: ColorRole) => {
    setLocks((prev) => ({ ...prev, [role]: !prev[role] }));
  };

  const handleRandomize = useCallback(() => {
    const next = generateHarmoniousPalette(palette, locks);
    pushPalette(next);
  }, [palette, locks, pushPalette]);

  const handleInvert = useCallback(() => {
    const inverted = invertPalette(palette);
    pushPalette(inverted);
  }, [palette, pushPalette]);

  const handleFontChange = (font: FontPair) => {
    setFontPair(font);
    updateUrl(palette, font);
  };

  const handleSelectPreset = (presetPalette: ColorPalette) => {
    pushPalette(presetPalette);
  };

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const targetIndex = historyIndex - 1;
      const targetPalette = history[targetIndex];
      setPalette(targetPalette);
      setHistoryIndex(targetIndex);
      updateUrl(targetPalette, fontPair);
    }
  }, [historyIndex, history, fontPair, updateUrl]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const targetIndex = historyIndex + 1;
      const targetPalette = history[targetIndex];
      setPalette(targetPalette);
      setHistoryIndex(targetIndex);
      updateUrl(targetPalette, fontPair);
    }
  }, [historyIndex, history, fontPair, updateUrl]);

  // Global Keyboard shortcuts: Spacebar to randomize, Ctrl+Z to undo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);

      if (isInput) return;

      // Spacebar
      if (e.code === "Space") {
        e.preventDefault();
        handleRandomize();
      }

      // Undo (Ctrl+Z or Cmd+Z)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }

      // Redo (Ctrl+Y or Ctrl+Shift+Z)
      if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "z")
      ) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleRandomize, handleUndo, handleRedo]);

  // CSS variables applied to the live preview container
  const containerStyle: React.CSSProperties = {
    // @ts-expect-error custom CSS properties
    "--rt-text": formatHex(palette.text),
    "--rt-background": formatHex(palette.background),
    "--rt-primary": formatHex(palette.primary),
    "--rt-secondary": formatHex(palette.secondary),
    "--rt-accent": formatHex(palette.accent),
    "--rt-font-heading": fontPair.heading,
    "--rt-font-body": fontPair.body,
    fontFamily: fontPair.body,
  };

  return (
    <div className="relative w-full">
      {/* Dynamic Google Fonts tag */}
      {fontPair.googleFonts && (
        <link
          rel="stylesheet"
          href={`https://fonts.googleapis.com/css2?family=${fontPair.googleFonts}&display=swap`}
        />
      )}

      {/* Main Preview Canvas Area with bottom padding to stay clear of Floating Footer Dock */}
      <div className="w-full min-h-screen bg-chip/30 pt-4 pb-48 sm:pb-56 transition-colors">
        <div
          className={`mx-auto transition-all duration-300 ${
            deviceView === "mobile"
              ? "max-w-[400px] rounded-3xl border-8 border-border shadow-2xl overflow-hidden"
              : deviceView === "tablet"
              ? "max-w-[800px] rounded-2xl border-4 border-border shadow-2xl overflow-hidden"
              : "w-full shadow-xs"
          }`}
        >
          {/* Live Preview Container with Scoped Custom Properties */}
          <div style={containerStyle} className="w-full">
            {/* View: All Templates */}
            {templateView === "all" && (
              <div className="space-y-12">
                <div>
                  <div className="bg-chip/80 border-y border-border px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-muted flex items-center justify-between">
                    <span>1. Landing Page Template</span>
                    <span className="text-[11px] font-normal opacity-70">Marketing &amp; Product Hero</span>
                  </div>
                  <LandingPageTemplate />
                </div>

                <div>
                  <div className="bg-chip/80 border-y border-border px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-muted flex items-center justify-between">
                    <span>2. SaaS Dashboard &amp; Analytics Template</span>
                    <span className="text-[11px] font-normal opacity-70">App Shell &amp; Data Visualizations</span>
                  </div>
                  <DashboardTemplate />
                </div>

                <div>
                  <div className="bg-chip/80 border-y border-border px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-muted flex items-center justify-between">
                    <span>3. Blog &amp; Article Template</span>
                    <span className="text-[11px] font-normal opacity-70">Editorial Typography &amp; Storytelling</span>
                  </div>
                  <BlogTemplate />
                </div>

                <div>
                  <div className="bg-chip/80 border-y border-border px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-muted flex items-center justify-between">
                    <span>4. UI Components &amp; Design System Showcase</span>
                    <span className="text-[11px] font-normal opacity-70">Interactive Elements &amp; Dialogs</span>
                  </div>
                  <ComponentsTemplate />
                </div>
              </div>
            )}

            {/* Individual Template Views */}
            {templateView === "landing" && <LandingPageTemplate />}
            {templateView === "dashboard" && <DashboardTemplate />}
            {templateView === "blog" && <BlogTemplate />}
            {templateView === "components" && <ComponentsTemplate />}
          </div>
        </div>
      </div>

      {/* FLOATING FOOTER DOCK (Fixed Overlay sticking in footer, non-scrollable) */}
      <FloatingColorDock
        palette={palette}
        locks={locks}
        fontPair={fontPair}
        templateView={templateView}
        deviceView={deviceView}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onColorChange={handleColorChange}
        onToggleLock={handleToggleLock}
        onRandomize={handleRandomize}
        onInvert={handleInvert}
        onFontChange={handleFontChange}
        onTemplateChange={setTemplateView}
        onDeviceChange={setDeviceView}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onOpenContrast={() => setContrastOpen(true)}
        onOpenShades={() => setShadesOpen(true)}
        onOpenExport={() => setExportOpen(true)}
        onSelectPreset={handleSelectPreset}
      />

      {/* Modals */}
      <ContrastModal
        palette={palette}
        isOpen={contrastOpen}
        onClose={() => setContrastOpen(false)}
      />

      <ShadesModal
        palette={palette}
        isOpen={shadesOpen}
        onClose={() => setShadesOpen(false)}
      />

      <ExportModal
        palette={palette}
        fontPair={fontPair}
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
      />
    </div>
  );
}
