"use client";

import Link from "next/link";
import React, { useRef, useState, useEffect, useCallback } from "react";

interface ToolBannerCard {
  id: string;
  href: string;
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  badgeColor: string;
  accentColor: string;
  gradient: string;
  tags: string[];
  ctaText: string;
  previewWidget: React.ReactNode;
}

const FEATURED_TOOLS: ToolBannerCard[] = [
  {
    id: "colors",
    href: "/colors/",
    title: "Realtime Colors Studio",
    subtitle: "Live Palette Generator & UI Previewer",
    description:
      "Press Space to generate harmonized palettes. Preview in real time on authentic Landing Page, SaaS Dashboard, Blog, and UI Kit templates with WCAG contrast audits and 1-click Tailwind export.",
    badge: "✨ NEW STUDIO",
    badgeColor: "bg-blue-600 text-white",
    accentColor: "#433bff",
    gradient: "from-blue-600/15 via-indigo-600/10 to-transparent",
    tags: ["Spacebar Randomizer", "4 Live Templates", "WCAG AAA Audit", "Tailwind & CSS Export"],
    ctaText: "Launch Realtime Colors",
    previewWidget: (
      <div className="rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-3 space-y-2.5">
        <div className="flex items-center justify-between text-[11px] font-semibold text-muted">
          <span>Active Harmony: Triadic</span>
          <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">18.2:1 AAA</span>
        </div>
        {/* 5 Color Swatches */}
        <div className="grid grid-cols-5 gap-1.5 h-9">
          {[
            { name: "Text", color: "#050315" },
            { name: "Bg", color: "#fbfbfe" },
            { name: "Primary", color: "#2f27ce" },
            { name: "Secondary", color: "#dedcff" },
            { name: "Accent", color: "#433bff" },
          ].map((c) => (
            <div
              key={c.name}
              className="flex flex-col items-center justify-center rounded-lg border border-black/15 shadow-2xs"
              style={{ backgroundColor: c.color }}
            >
              <span
                className="text-[9px] font-bold"
                style={{ color: c.name === "Text" || c.name === "Primary" || c.name === "Accent" ? "#fff" : "#000" }}
              >
                {c.name}
              </span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between text-[10px] text-muted font-mono">
          <span>Press Space to randomize</span>
          <span>50-950 Shades</span>
        </div>
      </div>
    ),
  },
  {
    id: "json-formatter",
    href: "/json-formatter/",
    title: "JSON Formatter & Converter",
    subtitle: "Format, Validate, Repair & Convert",
    description:
      "Fix malformed JSON with automatic bracket/trailing-comma repair. Convert JSON to TypeScript interfaces, YAML, XML, or CSV. Compare side-by-side diffs and run JMESPath queries.",
    badge: "⚡ ESSENTIAL TOOL",
    badgeColor: "bg-amber-600 text-white",
    accentColor: "#f59e0b",
    gradient: "from-amber-600/15 via-orange-600/10 to-transparent",
    tags: ["Auto-Repair Broken JSON", "YAML / XML / CSV", "TypeScript Interfaces", "Side-by-Side Diff"],
    ctaText: "Open JSON Formatter",
    previewWidget: (
      <div className="rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-3 font-mono text-[11px] leading-relaxed">
        <div className="flex items-center justify-between text-[10px] text-muted mb-1 pb-1 border-b border-border/50">
          <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓ Valid JSON</span>
          <span className="text-amber-600 dark:text-amber-400">TypeScript Ready</span>
        </div>
        <div>{"{"}</div>
        <div className="pl-3">
          <span className="text-purple-600 dark:text-purple-400">&quot;service&quot;</span>: <span className="text-green-600 dark:text-green-400">&quot;coderef&quot;</span>,
        </div>
        <div className="pl-3">
          <span className="text-purple-600 dark:text-purple-400">&quot;tools&quot;</span>: [<span className="text-blue-600 dark:text-blue-400">&quot;formatter&quot;</span>, <span className="text-blue-600 dark:text-blue-400">&quot;colors&quot;</span>],
        </div>
        <div className="pl-3">
          <span className="text-purple-600 dark:text-purple-400">&quot;autoRepair&quot;</span>: <span className="text-orange-600 dark:text-orange-400">true</span>
        </div>
        <div>{"}"}</div>
      </div>
    ),
  },
  {
    id: "try-it",
    href: "/try-it/",
    title: "HTML, CSS & JS Playground",
    subtitle: "All-in-One Live Web Sandbox",
    description:
      "Write HTML, style with CSS, and run JavaScript side-by-side with instant live browser rendering. Includes Emmet abbreviation expansion, console output logs, and shareable links.",
    badge: "🚀 WEB SANDBOX",
    badgeColor: "bg-emerald-600 text-white",
    accentColor: "#10b981",
    gradient: "from-emerald-600/15 via-teal-600/10 to-transparent",
    tags: ["Live Browser Result", "Emmet Abbreviation", "Console Logs", "Flexbox & Grid Presets"],
    ctaText: "Open Playground",
    previewWidget: (
      <div className="rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-3 text-[11px] space-y-2">
        <div className="flex items-center gap-2 border-b border-border/50 pb-1.5 text-[10px] font-bold">
          <span className="text-accent">HTML</span>
          <span className="text-muted">CSS</span>
          <span className="text-muted">JS</span>
          <span className="ml-auto text-emerald-600 dark:text-emerald-400 font-semibold">● Live Output</span>
        </div>
        <div className="font-mono text-muted text-[10px] space-y-0.5">
          <div>&lt;<span className="text-blue-600 dark:text-blue-400">button</span> class=<span className="text-green-600">&quot;btn-primary&quot;</span>&gt;</div>
          <div className="pl-3">Click Me</div>
          <div>&lt;/<span className="text-blue-600 dark:text-blue-400">button</span>&gt;</div>
        </div>
        <div className="pt-1 flex items-center gap-2">
          <button type="button" className="rounded-md bg-accent px-2.5 py-1 text-[10px] font-bold text-white shadow-2xs">
            Rendered Button
          </button>
          <span className="text-[10px] text-muted font-mono">0 errors</span>
        </div>
      </div>
    ),
  },
  {
    id: "markdown",
    href: "/markdown/",
    title: "Markdown Editor & Cheat Sheet",
    subtitle: "Synchronized Live Preview & Tables",
    description:
      "Full-featured Markdown authoring tool with synchronized scrolling, interactive visual Table Builder, HTML to Markdown converter, GFM task lists, and export to styled HTML or PDF.",
    badge: "📝 WRITING & DOCS",
    badgeColor: "bg-blue-700 text-white",
    accentColor: "#2563eb",
    gradient: "from-blue-700/15 via-indigo-600/10 to-transparent",
    tags: ["Synchronized Scroll", "Table Builder", "HTML → Markdown", "Export to PDF/HTML"],
    ctaText: "Open Markdown Editor",
    previewWidget: (
      <div className="rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-3 text-[11px] space-y-2">
        <div className="flex items-center justify-between text-[10px] text-muted pb-1 border-b border-border/50">
          <span className="font-mono"># Editor</span>
          <span className="font-semibold text-accent">Preview</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div className="font-mono text-muted space-y-0.5 border-r border-border/40 pr-2">
            <div># Title</div>
            <div>- [x] Tested</div>
            <div>| Col 1 | Col 2 |</div>
          </div>
          <div className="space-y-0.5">
            <div className="font-bold text-xs text-foreground">Title</div>
            <div className="text-muted">☑ Tested</div>
            <div className="text-[9px] text-accent font-semibold">Table Rendered</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "regex-tester",
    href: "/regex-tester/",
    title: "Regex Tester & Explainer",
    subtitle: "Pattern Highlighter & Code Generator",
    description:
      "Interactive JavaScript regular expression tester with live match highlights, capture group color coding, plain-English pattern explanations, and multi-language code generation.",
    badge: "🔍 PATTERN ENGINE",
    badgeColor: "bg-purple-600 text-white",
    accentColor: "#9333ea",
    gradient: "from-purple-600/15 via-fuchsia-600/10 to-transparent",
    tags: ["Visual Group Highlight", "Plain-English Explanation", "Code Snippet Gen", "Flags & Quantifiers"],
    ctaText: "Open Regex Tester",
    previewWidget: (
      <div className="rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-3 text-[11px] font-mono space-y-2">
        <div className="flex items-center justify-between text-[10px] text-muted pb-1 border-b border-border/50">
          <span>Pattern: /([a-z]+)@([a-z.]+)/gi</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-bold">2 Matches</span>
        </div>
        <div className="text-[10px] text-foreground bg-surface p-1.5 rounded border border-border/60">
          hello@<span className="bg-amber-400/30 text-amber-900 dark:text-amber-200 px-1 rounded">coderef.xyz</span>
        </div>
        <div className="text-[9px] text-muted">Group 1: &quot;hello&quot; · Group 2: &quot;coderef.xyz&quot;</div>
      </div>
    ),
  },
  {
    id: "rest-api-client",
    href: "/rest-api-client/",
    title: "REST API Client",
    subtitle: "Send HTTP Requests Like Postman",
    description:
      "Compose GET, POST, PUT, DELETE requests directly in your browser. Configure headers, auth tokens, and body payloads, and inspect formatted JSON responses.",
    badge: "🌐 HTTP STUDIO",
    badgeColor: "bg-cyan-600 text-white",
    accentColor: "#0891b2",
    gradient: "from-cyan-600/15 via-teal-600/10 to-transparent",
    tags: ["Zero Install", "Bearer Token Auth", "Headers & Query Params", "Response Timing"],
    ctaText: "Open API Client",
    previewWidget: (
      <div className="rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-3 text-[11px] space-y-2">
        <div className="flex items-center gap-1.5 text-[10px]">
          <span className="rounded bg-emerald-600/20 px-1.5 py-0.5 font-bold text-emerald-600 dark:text-emerald-400">GET</span>
          <span className="font-mono text-muted truncate">https://api.github.com/zen</span>
        </div>
        <div className="rounded border border-border/50 bg-surface p-2 text-[10px] font-mono text-foreground flex items-center justify-between">
          <span>Status: 200 OK</span>
          <span className="text-muted">42 ms</span>
        </div>
        <div className="text-[9px] text-muted">Headers (12) · JSON Response Parsed</div>
      </div>
    ),
  },
];

export function ToolsBanner() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const checkScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);

    // Calculate approximate active index based on scroll position
    const cardWidth = 380;
    const index = Math.min(
      FEATURED_TOOLS.length - 1,
      Math.max(0, Math.round(scrollLeft / cardWidth))
    );
    setCurrentIndex(index);
  }, []);

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [checkScroll]);

  // Smooth scroll to a specific card index
  const scrollToIndex = useCallback((index: number) => {
    if (!scrollRef.current) return;
    const cards = scrollRef.current.children;
    if (cards[index]) {
      (cards[index] as HTMLElement).scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "start",
      });
    }
  }, []);

  // Manual scroll helper
  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const { clientWidth } = scrollRef.current;
    const scrollAmount = direction === "left" ? -clientWidth * 0.75 : clientWidth * 0.75;
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  // AUTO-SCROLL ENGINE
  useEffect(() => {
    if (!isAutoPlaying || isHovered) return;

    const interval = setInterval(() => {
      if (!scrollRef.current) return;
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;

      // If at or near the end, loop back smoothly to start
      if (scrollLeft + clientWidth >= scrollWidth - 25) {
        scrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        // Step forward by 1 card distance (~380px)
        scrollRef.current.scrollBy({ left: 380, behavior: "smooth" });
      }
    }, 3800);

    return () => clearInterval(interval);
  }, [isAutoPlaying, isHovered]);

  return (
    <section
      className="mb-10 w-full"
      aria-label="Featured interactive tools"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={() => setIsHovered(false)}
    >
      {/* Header with Title and Scroll Controls */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-2 rounded-full bg-accent animate-pulse" />
            <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
              Featured Interactive Developer Tools
            </h2>
            {isAutoPlaying && !isHovered && (
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-accent/10 text-accent px-2 py-0.5 text-[10px] font-bold">
                <span className="size-1.5 rounded-full bg-accent animate-ping" />
                Auto-scrolling
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted">
            Auto-scrolling interactive utilities, real-time generators, and compilers (hover to pause)
          </p>
        </div>

        {/* Scroll & Auto-Play Controls */}
        <div className="flex items-center gap-2">
          {/* Play / Pause Toggle Button */}
          <button
            type="button"
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            aria-label={isAutoPlaying ? "Pause auto-scroll" : "Resume auto-scroll"}
            title={isAutoPlaying ? "Pause auto-scroll" : "Resume auto-scroll"}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-semibold text-muted hover:text-foreground hover:bg-chip transition-colors shadow-2xs"
          >
            {isAutoPlaying ? (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
                <span className="hidden sm:inline">Pause</span>
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                <span className="hidden sm:inline">Auto-scroll</span>
              </>
            )}
          </button>

          {/* Left / Right Arrow Buttons */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              aria-label="Scroll tools left"
              className="flex size-8 items-center justify-center rounded-lg border border-border bg-surface text-muted hover:text-foreground hover:bg-chip disabled:opacity-30 disabled:pointer-events-none transition-colors shadow-2xs"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              aria-label="Scroll tools right"
              className="flex size-8 items-center justify-center rounded-lg border border-border bg-surface text-muted hover:text-foreground hover:bg-chip disabled:opacity-30 disabled:pointer-events-none transition-colors shadow-2xs"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Auto-Scrollable Carousel Container */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-3 pt-1 scrollbar-none"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {FEATURED_TOOLS.map((tool, idx) => (
          <div
            key={tool.id}
            className={`group relative flex w-[310px] sm:w-[360px] md:w-[390px] shrink-0 snap-start flex-col justify-between rounded-2xl border bg-surface p-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${
              currentIndex === idx ? "border-accent/40 ring-1 ring-accent/20" : "border-border"
            }`}
          >
            {/* Top gradient highlight banner */}
            <div
              className={`absolute inset-x-0 top-0 h-28 rounded-t-2xl bg-gradient-to-b ${tool.gradient} opacity-50 pointer-events-none transition-opacity group-hover:opacity-80`}
            />

            <div className="relative z-10">
              {/* Badge & Subtitle */}
              <div className="flex items-center justify-between">
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${tool.badgeColor}`}>
                  {tool.badge}
                </span>
                <span className="text-[11px] font-mono text-muted">coderef.xyz{tool.href}</span>
              </div>

              {/* Title & Subtitle */}
              <h3 className="mt-3 text-lg font-bold tracking-tight text-foreground group-hover:text-accent transition-colors">
                {tool.title}
              </h3>
              <p className="text-xs font-semibold text-accent mt-0.5">{tool.subtitle}</p>

              {/* Description */}
              <p className="mt-2 text-xs text-muted leading-relaxed line-clamp-3">
                {tool.description}
              </p>

              {/* Preview Widget */}
              <div className="mt-4">{tool.previewWidget}</div>

              {/* Feature Tags */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {tool.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md bg-chip px-2 py-0.5 text-[10px] font-medium text-muted"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom CTA Button */}
            <div className="relative z-10 mt-5 pt-3 border-t border-border/60">
              <Link
                href={tool.href}
                className="flex items-center justify-between rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:opacity-95 active:scale-[0.98]"
                style={{ backgroundColor: tool.accentColor }}
              >
                <span>{tool.ctaText}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Pagination Indicator Dots */}
      <div className="mt-2 flex items-center justify-center gap-1.5">
        {FEATURED_TOOLS.map((tool, idx) => (
          <button
            key={tool.id}
            type="button"
            onClick={() => scrollToIndex(idx)}
            aria-label={`Jump to ${tool.title}`}
            className={`h-2 rounded-full transition-all duration-300 ${
              currentIndex === idx
                ? "w-7 bg-accent shadow-2xs"
                : "w-2 bg-border hover:bg-muted"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
