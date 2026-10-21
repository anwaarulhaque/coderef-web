"use client";

import React, { useState } from "react";

export function ComponentsTemplate() {
  const [toggleOn, setToggleOn] = useState(true);
  const [checkedBox, setCheckedBox] = useState(true);
  const [sliderVal, setSliderVal] = useState(65);

  return (
    <div
      className="w-full p-6 sm:p-12 transition-colors duration-300"
      style={{ backgroundColor: "var(--rt-background)", color: "var(--rt-text)" }}
    >
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="border-b pb-6" style={{ borderColor: "color-mix(in srgb, var(--rt-text) 12%, transparent)" }}>
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--rt-accent)" }}>
            UI Component Library
          </span>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight">Design System &amp; Elements Showcase</h2>
          <p className="mt-1 text-sm opacity-70">
            Verify button hierarchy, interactive form inputs, badges, and modals across your active color scheme.
          </p>
        </div>

        {/* 1. BUTTONS SECTION */}
        <div className="mt-10">
          <h3 className="text-base font-bold">1. Buttons &amp; Action Triggers</h3>
          <p className="text-xs opacity-60">Solid, outline, ghost, icon, and state variations</p>

          <div
            className="mt-4 rounded-2xl p-6 shadow-xs space-y-6"
            style={{
              backgroundColor: "var(--rt-background)",
              border: "1px solid color-mix(in srgb, var(--rt-text) 14%, transparent)",
            }}
          >
            {/* Color variants */}
            <div>
              <div className="text-xs font-semibold opacity-60 mb-3">Color Variants</div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="rounded-xl px-5 py-2.5 text-sm font-semibold shadow-xs transition-all hover:opacity-90 active:scale-95"
                  style={{ backgroundColor: "var(--rt-primary)", color: "var(--rt-background)" }}
                >
                  Primary Solid
                </button>
                <button
                  type="button"
                  className="rounded-xl px-5 py-2.5 text-sm font-semibold transition-all hover:opacity-85 active:scale-95"
                  style={{ backgroundColor: "var(--rt-secondary)", color: "var(--rt-text)" }}
                >
                  Secondary Solid
                </button>
                <button
                  type="button"
                  className="rounded-xl px-5 py-2.5 text-sm font-semibold shadow-xs transition-all hover:opacity-90 active:scale-95"
                  style={{ backgroundColor: "var(--rt-accent)", color: "var(--rt-background)" }}
                >
                  Accent Solid
                </button>
                <button
                  type="button"
                  className="rounded-xl px-5 py-2.5 text-sm font-semibold transition-all hover:opacity-85 border active:scale-95"
                  style={{
                    borderColor: "var(--rt-primary)",
                    color: "var(--rt-primary)",
                    backgroundColor: "transparent",
                  }}
                >
                  Outline Primary
                </button>
                <button
                  type="button"
                  className="rounded-xl px-5 py-2.5 text-sm font-semibold transition-all hover:bg-black/5 dark:hover:bg-white/5 active:scale-95"
                  style={{ color: "var(--rt-text)" }}
                >
                  Ghost Button
                </button>
                <button
                  type="button"
                  disabled
                  className="rounded-xl px-5 py-2.5 text-sm font-semibold opacity-40 cursor-not-allowed border"
                  style={{
                    borderColor: "color-mix(in srgb, var(--rt-text) 20%, transparent)",
                    color: "var(--rt-text)",
                  }}
                >
                  Disabled
                </button>
              </div>
            </div>

            {/* Sizes & States */}
            <div>
              <div className="text-xs font-semibold opacity-60 mb-3">Sizes &amp; Loading States</div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold"
                  style={{ backgroundColor: "var(--rt-primary)", color: "var(--rt-background)" }}
                >
                  Small
                </button>
                <button
                  type="button"
                  className="rounded-xl px-4 py-2 text-sm font-semibold"
                  style={{ backgroundColor: "var(--rt-primary)", color: "var(--rt-background)" }}
                >
                  Medium / Regular
                </button>
                <button
                  type="button"
                  className="rounded-xl px-6 py-3 text-base font-semibold"
                  style={{ backgroundColor: "var(--rt-primary)", color: "var(--rt-background)" }}
                >
                  Large Button
                </button>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold opacity-85"
                  style={{ backgroundColor: "var(--rt-primary)", color: "var(--rt-background)" }}
                >
                  <svg className="animate-spin size-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Processing...</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 2. FORM INPUTS & CONTROLS */}
        <div className="mt-10">
          <h3 className="text-base font-bold">2. Form Inputs &amp; Controls</h3>
          <p className="text-xs opacity-60">Fields, dropdowns, checkboxes, switches and sliders</p>

          <div
            className="mt-4 rounded-2xl p-6 shadow-xs grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            style={{
              backgroundColor: "var(--rt-background)",
              border: "1px solid color-mix(in srgb, var(--rt-text) 14%, transparent)",
            }}
          >
            {/* Text Input */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 opacity-80">Text Field</label>
              <input
                type="text"
                defaultValue="Sarah Connor"
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                style={{
                  backgroundColor: "var(--rt-secondary)",
                  color: "var(--rt-text)",
                  border: "1px solid color-mix(in srgb, var(--rt-text) 18%, transparent)",
                }}
              />
            </div>

            {/* Input with icon */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 opacity-80">Search with Icon</label>
              <div className="relative">
                <svg
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 opacity-50"
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
                  placeholder="Filter repositories..."
                  className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none transition-all"
                  style={{
                    backgroundColor: "var(--rt-secondary)",
                    color: "var(--rt-text)",
                    border: "1px solid color-mix(in srgb, var(--rt-text) 18%, transparent)",
                  }}
                />
              </div>
            </div>

            {/* Select dropdown */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 opacity-80">Select Menu</label>
              <select
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all cursor-pointer"
                style={{
                  backgroundColor: "var(--rt-secondary)",
                  color: "var(--rt-text)",
                  border: "1px solid color-mix(in srgb, var(--rt-text) 18%, transparent)",
                }}
              >
                <option>Production Environment (us-east)</option>
                <option>Staging Environment (eu-central)</option>
                <option>Local Development (localhost:3000)</option>
              </select>
            </div>

            {/* Checkbox & Radio */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold mb-1 opacity-80">Checkboxes</label>
              <label className="flex items-center gap-2.5 text-xs font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={checkedBox}
                  onChange={(e) => setCheckedBox(e.target.checked)}
                  className="size-4 rounded accent-current cursor-pointer"
                  style={{ accentColor: "var(--rt-primary)" }}
                />
                <span>Enable automatic backups</span>
              </label>
              <label className="flex items-center gap-2.5 text-xs font-medium opacity-65 cursor-pointer">
                <input
                  type="checkbox"
                  disabled
                  className="size-4 rounded cursor-not-allowed"
                />
                <span>Send weekly metrics report</span>
              </label>
            </div>

            {/* Switch / Toggle */}
            <div>
              <label className="block text-xs font-semibold mb-2 opacity-80">Toggle Switch</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setToggleOn(!toggleOn)}
                  className="relative h-6 w-11 rounded-full transition-colors cursor-pointer"
                  style={{
                    backgroundColor: toggleOn ? "var(--rt-primary)" : "var(--rt-secondary)",
                  }}
                >
                  <span
                    className={`block size-5 rounded-full transition-transform shadow-xs ${
                      toggleOn ? "translate-x-5" : "translate-x-1"
                    }`}
                    style={{ backgroundColor: "var(--rt-background)" }}
                  />
                </button>
                <span className="text-xs font-medium">
                  {toggleOn ? "Notifications Active" : "Muted"}
                </span>
              </div>
            </div>

            {/* Slider */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1 opacity-80">
                <span>Volume Threshold</span>
                <span>{sliderVal}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={sliderVal}
                onChange={(e) => setSliderVal(Number(e.target.value))}
                className="w-full cursor-pointer"
                style={{ accentColor: "var(--rt-primary)" }}
              />
            </div>
          </div>
        </div>

        {/* 3. BADGES & NOTIFICATIONS */}
        <div className="mt-10">
          <h3 className="text-base font-bold">3. Badges, Tags &amp; Status Indicators</h3>
          <p className="text-xs opacity-60">Chips, labels, and pill badges</p>

          <div
            className="mt-4 rounded-2xl p-6 shadow-xs space-y-4"
            style={{
              backgroundColor: "var(--rt-background)",
              border: "1px solid color-mix(in srgb, var(--rt-text) 14%, transparent)",
            }}
          >
            <div className="flex flex-wrap items-center gap-2.5">
              <span
                className="rounded-full px-3 py-1 text-xs font-bold"
                style={{ backgroundColor: "var(--rt-primary)", color: "var(--rt-background)" }}
              >
                Primary Pill
              </span>
              <span
                className="rounded-full px-3 py-1 text-xs font-bold"
                style={{ backgroundColor: "var(--rt-secondary)", color: "var(--rt-primary)" }}
              >
                Secondary Pill
              </span>
              <span
                className="rounded-full px-3 py-1 text-xs font-bold"
                style={{ backgroundColor: "var(--rt-accent)", color: "var(--rt-background)" }}
              >
                Accent Pill
              </span>
              <span
                className="rounded-full px-3 py-1 text-xs font-bold border"
                style={{
                  borderColor: "var(--rt-primary)",
                  color: "var(--rt-primary)",
                }}
              >
                Outline Badge
              </span>
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
                style={{ backgroundColor: "var(--rt-secondary)", color: "var(--rt-text)" }}
              >
                <span className="size-2 rounded-full" style={{ backgroundColor: "var(--rt-accent)" }} />
                <span>Live Status</span>
              </span>
            </div>

            {/* Alert banner */}
            <div
              className="flex items-center justify-between rounded-xl p-4 text-xs sm:text-sm font-medium"
              style={{
                backgroundColor: "var(--rt-secondary)",
                border: "1px solid color-mix(in srgb, var(--rt-accent) 25%, transparent)",
              }}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">✨</span>
                <span>
                  <strong>New Feature:</strong> Palette synchronization is now available for Figma tokens.
                </span>
              </div>
              <button
                type="button"
                className="rounded-lg px-2.5 py-1 text-xs font-bold underline"
                style={{ color: "var(--rt-primary)" }}
              >
                Read Docs
              </button>
            </div>
          </div>
        </div>

        {/* 4. MODAL & DIALOG MOCKUP */}
        <div className="mt-10">
          <h3 className="text-base font-bold">4. Modal Dialog Component Mockup</h3>
          <p className="text-xs opacity-60">High-contrast surface, backdrop shadow, and action buttons</p>

          <div
            className="mt-4 rounded-2xl p-6 sm:p-10 flex justify-center shadow-xs"
            style={{
              backgroundColor: "color-mix(in srgb, var(--rt-text) 5%, var(--rt-background))",
              border: "1px solid color-mix(in srgb, var(--rt-text) 14%, transparent)",
            }}
          >
            {/* Modal Card */}
            <div
              className="w-full max-w-md rounded-2xl p-6 shadow-2xl relative"
              style={{
                backgroundColor: "var(--rt-background)",
                border: "1px solid color-mix(in srgb, var(--rt-text) 16%, transparent)",
              }}
            >
              <div className="flex items-start justify-between">
                <div
                  className="flex size-10 items-center justify-center rounded-xl font-bold"
                  style={{ backgroundColor: "var(--rt-secondary)", color: "var(--rt-primary)" }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <button type="button" className="opacity-50 hover:opacity-100 p-1">
                  ✕
                </button>
              </div>

              <h4 className="mt-4 text-lg font-bold">Confirm Database Migration</h4>
              <p className="mt-1.5 text-xs opacity-70 leading-relaxed">
                You are about to deploy schema v4.2 to production. This migration will apply 3 new tables and rebuild customer search indexes.
              </p>

              <div
                className="mt-4 rounded-xl p-3 text-xs"
                style={{
                  backgroundColor: "var(--rt-secondary)",
                  color: "var(--rt-text)",
                }}
              >
                Estimated downtime: <strong style={{ color: "var(--rt-accent)" }}>Under 1.2 seconds</strong>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  className="rounded-xl px-4 py-2 text-xs font-semibold transition-all hover:opacity-85"
                  style={{
                    backgroundColor: "var(--rt-secondary)",
                    color: "var(--rt-text)",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="rounded-xl px-4 py-2 text-xs font-semibold shadow-xs transition-all hover:opacity-90 active:scale-95"
                  style={{
                    backgroundColor: "var(--rt-primary)",
                    color: "var(--rt-background)",
                  }}
                >
                  Confirm &amp; Execute
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
