"use client";

import React, { useState } from "react";
import type { ColorPalette, ColorRole } from "@/lib/colors/types";
import { formatHex, generateShades } from "@/lib/colors/color-utils";

interface ShadesModalProps {
  palette: ColorPalette;
  isOpen: boolean;
  onClose: () => void;
}

export function ShadesModal({ palette, isOpen, onClose }: ShadesModalProps) {
  const [selectedRole, setSelectedRole] = useState<ColorRole>("primary");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentColor = palette[selectedRole];
  const shades = generateShades(currentColor);

  const handleCopy = (hex: string, key: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const roles: { role: ColorRole; label: string }[] = [
    { role: "primary", label: "Primary" },
    { role: "secondary", label: "Secondary" },
    { role: "accent", label: "Accent" },
    { role: "background", label: "Background" },
    { role: "text", label: "Text" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-2xl rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h3 className="text-xl font-bold tracking-tight">11-Step Shade Generator</h3>
            <p className="mt-1 text-xs text-muted">
              Tailwind-compatible 50–950 tint and shade ladder for your color system
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

        {/* Color Role Tabs */}
        <div className="mt-5 flex flex-wrap gap-2">
          {roles.map((r) => {
            const active = selectedRole === r.role;
            const colorHex = formatHex(palette[r.role]);
            return (
              <button
                key={r.role}
                type="button"
                onClick={() => setSelectedRole(r.role)}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  active ? "bg-foreground text-background shadow-xs" : "bg-chip text-muted hover:text-foreground"
                }`}
              >
                <span className="size-3 rounded-full border border-black/20" style={{ backgroundColor: colorHex }} />
                <span>{r.label}</span>
              </button>
            );
          })}
        </div>

        {/* Shades List */}
        <div className="mt-6 space-y-1.5">
          {Object.entries(shades).map(([step, hex]) => {
            const isBase = step === "500";
            const isCopied = copiedKey === step;
            return (
              <div
                key={step}
                onClick={() => handleCopy(hex, step)}
                className="group flex cursor-pointer items-center justify-between rounded-xl px-4 py-2.5 transition-all hover:scale-[1.01] hover:shadow-xs"
                style={{
                  backgroundColor: hex,
                  color: parseInt(step) >= 500 ? "#ffffff" : "#090d16",
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="w-10 font-bold font-mono text-sm">{step}</span>
                  {isBase && (
                    <span className="rounded bg-black/25 dark:bg-white/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                      Base Color
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs uppercase font-semibold">{hex}</span>
                  <span className="text-xs opacity-0 transition-opacity group-hover:opacity-100 font-semibold">
                    {isCopied ? "✓ Copied!" : "Click to copy"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 border-t border-border pt-4 flex items-center justify-between text-xs text-muted">
          <span>Click any shade to copy the HEX code to your clipboard</span>
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
