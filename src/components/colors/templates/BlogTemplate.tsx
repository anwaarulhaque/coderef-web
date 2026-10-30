"use client";

import React from "react";

export function BlogTemplate() {
  return (
    <div
      className="w-full transition-colors duration-300"
      style={{ backgroundColor: "var(--rt-background)", color: "var(--rt-text)" }}
    >
      {/* Blog Navbar / Header */}
      <header className="border-b px-6 py-4 md:px-12" style={{ borderColor: "color-mix(in srgb, var(--rt-text) 12%, transparent)" }}>
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="size-3 rounded-full" style={{ backgroundColor: "var(--rt-accent)" }} />
            <span className="font-mono text-sm font-bold tracking-tight">THE CODEREF JOURNAL</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="opacity-70 hover:opacity-100 cursor-pointer">All Stories</span>
            <span className="opacity-70 hover:opacity-100 cursor-pointer">Engineering</span>
            <span className="opacity-70 hover:opacity-100 cursor-pointer">Design Systems</span>
            <button
              type="button"
              className="rounded-lg px-3 py-1.5 font-bold transition-all hover:opacity-90"
              style={{ backgroundColor: "var(--rt-primary)", color: "var(--rt-background)" }}
            >
              Subscribe
            </button>
          </div>
        </div>
      </header>

      {/* Main Article Container */}
      <article className="mx-auto max-w-3xl px-6 py-14 sm:py-20">
        {/* Article Meta */}
        <div className="flex flex-wrap items-center gap-3">
          <span
            className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider"
            style={{
              backgroundColor: "var(--rt-secondary)",
              color: "var(--rt-primary)",
            }}
          >
            Design Systems
          </span>
          <span className="text-xs opacity-60">·</span>
          <span className="text-xs opacity-60">Published October 19, 2026</span>
          <span className="text-xs opacity-60">·</span>
          <span className="text-xs font-medium" style={{ color: "var(--rt-accent)" }}>
            6 min read
          </span>
        </div>

        {/* Title */}
        <h1
          className="mt-6 text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-[1.15]"
          style={{ fontFamily: "var(--rt-font-heading)" }}
        >
          Architecting Accessible Color Palettes for High-Velocity Product Teams
        </h1>

        {/* Author row */}
        <div className="mt-8 flex items-center justify-between border-y py-4" style={{ borderColor: "color-mix(in srgb, var(--rt-text) 12%, transparent)" }}>
          <div className="flex items-center gap-3">
            <div
              className="flex size-11 items-center justify-center rounded-full font-bold text-sm"
              style={{ backgroundColor: "var(--rt-primary)", color: "var(--rt-background)" }}
            >
              ER
            </div>
            <div>
              <div className="text-sm font-bold">Elena Rostova</div>
              <div className="text-xs opacity-60">Staff Design Systems Engineer</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {["Twitter", "LinkedIn", "Copy"].map((platform) => (
              <button
                key={platform}
                type="button"
                className="rounded-lg px-2.5 py-1 text-xs font-medium transition-all hover:opacity-85"
                style={{
                  backgroundColor: "var(--rt-secondary)",
                  color: "var(--rt-text)",
                }}
              >
                {platform}
              </button>
            ))}
          </div>
        </div>

        {/* Featured Card / Graphic Banner */}
        <div
          className="mt-10 overflow-hidden rounded-2xl p-8 sm:p-12 shadow-lg relative"
          style={{
            backgroundColor: "color-mix(in srgb, var(--rt-secondary) 40%, var(--rt-background))",
            border: "1px solid color-mix(in srgb, var(--rt-text) 14%, transparent)",
          }}
        >
          <div className="max-w-md">
            <span className="text-xs font-bold tracking-widest uppercase opacity-70">Case Study</span>
            <h3 className="mt-2 text-2xl font-black" style={{ color: "var(--rt-primary)" }}>
              The 60-30-10 Rule in Practice
            </h3>
            <p className="mt-2 text-xs sm:text-sm opacity-80 leading-relaxed">
              Why 60% background, 30% structural secondary, and 10% high-energy accent delivers effortless visual hierarchy.
            </p>
          </div>

          {/* Decorative graphic bars */}
          <div className="mt-6 flex h-4 w-full overflow-hidden rounded-full shadow-inner">
            <div className="h-full" style={{ width: "60%", backgroundColor: "var(--rt-background)" }} />
            <div className="h-full" style={{ width: "30%", backgroundColor: "var(--rt-secondary)" }} />
            <div className="h-full" style={{ width: "10%", backgroundColor: "var(--rt-accent)" }} />
          </div>
          <div className="mt-2 flex justify-between text-[11px] font-mono opacity-65">
            <span>60% Canvas</span>
            <span>30% Secondary Elements</span>
            <span>10% Accent Callouts</span>
          </div>
        </div>

        {/* Article Body */}
        <div className="mt-10 space-y-6 text-base sm:text-lg leading-relaxed opacity-90">
          <p className="text-lg sm:text-xl font-medium leading-relaxed" style={{ color: "var(--rt-text)" }}>
            Choosing colors for a digital application is rarely just an aesthetic choice. In enterprise software,
            color carries critical semantic weight: it guides attention, communicates status, and determines whether an interface is
            usable by individuals with diverse visual abilities.
          </p>

          <h2 className="text-2xl font-bold tracking-tight pt-4" style={{ color: "var(--rt-text)" }}>
            1. Why Off-the-Shelf Palettes Fail in Production
          </h2>

          <p>
            Most color palettes curated on standard graphic design showcases look breathtaking on static posters.
            However, when dropped into a complex UI containing nested tables, multi-state buttons, and interactive modals,
            contrast begins to degrade immediately.
          </p>

          {/* Styled Blockquote */}
          <blockquote
            className="my-6 rounded-xl p-5 pl-6 italic shadow-xs"
            style={{
              backgroundColor: "var(--rt-secondary)",
              borderLeft: "4px solid var(--rt-accent)",
              color: "var(--rt-text)",
            }}
          >
            &ldquo;Accessibility is not a constraint on creativity; it is the ultimate foundation of durable, inclusive design systems.&rdquo;
          </blockquote>

          <h2 className="text-2xl font-bold tracking-tight pt-4" style={{ color: "var(--rt-text)" }}>
            2. Tokenizing With CSS Custom Properties
          </h2>

          <p>
            Modern applications solve this by standardizing on semantic CSS custom properties rather than hardcoded hex values.
            Here is the canonical structure we implement in high-scale design engines:
          </p>

          {/* Code block */}
          <div
            className="my-6 overflow-x-auto rounded-xl p-5 font-mono text-xs sm:text-sm leading-relaxed"
            style={{
              backgroundColor: "color-mix(in srgb, var(--rt-text) 6%, var(--rt-background))",
              border: "1px solid color-mix(in srgb, var(--rt-text) 14%, transparent)",
            }}
          >
            <div className="opacity-50 font-bold mb-2">{"// Semantic Token Mapping"}</div>
            <div><span style={{ color: "var(--rt-accent)" }}>:root</span> {"{"}</div>
            <div className="pl-4">--bg-canvas: <span style={{ color: "var(--rt-primary)" }}>var(--rt-background)</span>;</div>
            <div className="pl-4">--text-primary: <span style={{ color: "var(--rt-primary)" }}>var(--rt-text)</span>;</div>
            <div className="pl-4">--brand-primary: <span style={{ color: "var(--rt-primary)" }}>var(--rt-primary)</span>;</div>
            <div className="pl-4">--surface-muted: <span style={{ color: "var(--rt-primary)" }}>var(--rt-secondary)</span>;</div>
            <div className="pl-4">--brand-accent: <span style={{ color: "var(--rt-primary)" }}>var(--rt-accent)</span>;</div>
            <div>{"}"}</div>
          </div>

          {/* Tip Callout Box */}
          <div
            className="my-6 flex items-start gap-3.5 rounded-xl p-5 shadow-xs"
            style={{
              backgroundColor: "var(--rt-secondary)",
              border: "1px solid color-mix(in srgb, var(--rt-accent) 30%, transparent)",
            }}
          >
            <span className="text-xl">💡</span>
            <div className="text-sm">
              <strong className="block font-bold mb-0.5" style={{ color: "var(--rt-primary)" }}>
                Key Takeaway
              </strong>
              Always measure contrast against the immediate parent background container rather than the global page body.
            </div>
          </div>
        </div>

        {/* Author Bio Box */}
        <div
          className="mt-14 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-5 shadow-xs"
          style={{
            backgroundColor: "var(--rt-secondary)",
            border: "1px solid color-mix(in srgb, var(--rt-text) 12%, transparent)",
          }}
        >
          <div
            className="flex size-14 shrink-0 items-center justify-center rounded-full font-bold text-lg"
            style={{ backgroundColor: "var(--rt-primary)", color: "var(--rt-background)" }}
          >
            ER
          </div>
          <div className="text-center sm:text-left flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h4 className="text-base font-bold">Elena Rostova</h4>
                <p className="text-xs opacity-60">Design Systems Lead &amp; Frontend Architect</p>
              </div>
              <button
                type="button"
                className="rounded-lg px-4 py-1.5 text-xs font-semibold shadow-xs transition-all hover:opacity-90"
                style={{ backgroundColor: "var(--rt-primary)", color: "var(--rt-background)" }}
              >
                Follow Author
              </button>
            </div>
            <p className="mt-3 text-xs sm:text-sm opacity-80 leading-relaxed">
              Elena writes about CSS architectures, WCAG standards, and scaling design systems across cross-functional engineering teams.
            </p>
          </div>
        </div>

        {/* Newsletter Subscription Box */}
        <div
          className="mt-12 rounded-2xl p-8 sm:p-10 text-center shadow-lg"
          style={{
            backgroundColor: "var(--rt-background)",
            border: "2px solid var(--rt-primary)",
          }}
        >
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--rt-accent)" }}>
            Never Miss An Issue
          </span>
          <h3 className="mt-2 text-2xl font-bold">Subscribe to The Coderef Journal</h3>
          <p className="mx-auto mt-2 max-w-md text-xs sm:text-sm opacity-75">
            Join 38,000+ engineers receiving our weekly breakdown on web standards, color harmony, and UI performance.
          </p>

          <form onSubmit={(e) => e.preventDefault()} className="mx-auto mt-6 flex max-w-md flex-col sm:flex-row gap-2">
            <input
              type="email"
              placeholder="Enter your work email..."
              className="flex-1 rounded-xl px-4 py-3 text-sm outline-none transition-all"
              style={{
                backgroundColor: "var(--rt-secondary)",
                color: "var(--rt-text)",
                border: "1px solid color-mix(in srgb, var(--rt-text) 18%, transparent)",
              }}
            />
            <button
              type="submit"
              className="rounded-xl px-6 py-3 text-sm font-semibold shadow-sm transition-all hover:opacity-90 active:scale-95 shrink-0"
              style={{
                backgroundColor: "var(--rt-primary)",
                color: "var(--rt-background)",
              }}
            >
              Join Free
            </button>
          </form>
        </div>

        {/* Related Articles */}
        <div className="mt-16 pt-10 border-t" style={{ borderColor: "color-mix(in srgb, var(--rt-text) 12%, transparent)" }}>
          <h4 className="text-base font-bold">Related Articles</h4>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {[
              {
                title: "Dark Mode Engineering: Handling Luma Inversions Without Broken Contrast",
                tag: "Frontend",
                time: "4 min read",
              },
              {
                title: "Mathematical Foundations of Perceptually Uniform Color Spaces (OKLCH)",
                tag: "Color Theory",
                time: "8 min read",
              },
            ].map((art, i) => (
              <div
                key={i}
                className="group rounded-xl p-5 transition-all hover:shadow-md cursor-pointer"
                style={{
                  backgroundColor: "var(--rt-secondary)",
                  border: "1px solid color-mix(in srgb, var(--rt-text) 10%, transparent)",
                }}
              >
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold" style={{ color: "var(--rt-accent)" }}>{art.tag}</span>
                  <span className="opacity-50">·</span>
                  <span className="opacity-60">{art.time}</span>
                </div>
                <h5 className="mt-2 text-sm font-bold leading-snug group-hover:underline">
                  {art.title}
                </h5>
              </div>
            ))}
          </div>
        </div>
      </article>
    </div>
  );
}
