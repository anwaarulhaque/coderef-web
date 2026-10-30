import Link from "next/link";
import type React from "react";

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
    href: "/realtime-colors/",
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
  {
    id: "backgrounds",
    href: "/backgrounds/",
    title: "Animated Backgrounds",
    subtitle: "Copy-Paste Hero Effects",
    description:
      "Original animated backgrounds for your hero, footer or any section. Pick colors and speed, preview live, then copy plain HTML + JS or a prompt for your AI agent.",
    badge: "✨ NEW EFFECTS",
    badgeColor: "bg-fuchsia-600 text-white",
    accentColor: "#c026d3",
    gradient: "from-fuchsia-600/15 via-violet-600/10 to-transparent",
    tags: ["Zero Dependencies", "Reduced-Motion Aware", "Custom Colors", "AI Prompt"],
    ctaText: "Browse Backgrounds",
    previewWidget: (
      <div className="relative h-20 overflow-hidden rounded-xl border border-black/10 dark:border-white/10 bg-[#0b0b1a]">
        <div className="absolute -left-6 -top-8 size-28 rounded-full bg-fuchsia-500/60 blur-2xl" />
        <div className="absolute -right-4 top-2 size-24 rounded-full bg-indigo-500/60 blur-2xl" />
        <div className="absolute bottom-[-30px] left-1/3 size-24 rounded-full bg-cyan-400/50 blur-2xl" />
        <span className="absolute bottom-2 left-3 text-[10px] font-semibold text-white/80">Aurora</span>
      </div>
    ),
  },
  {
    id: "git-branching",
    href: "/git-branching/",
    title: "Git Branching",
    subtitle: "Learn Git by Playing",
    description: "Animated levels for branching, merging, rebasing and remotes. Type real git commands and watch the commit graph change.",
    badge: "🌿 GAME",
    badgeColor: "bg-emerald-600 text-white",
    accentColor: "#059669",
    gradient: "from-emerald-600/15 via-teal-600/10 to-transparent",
    tags: ["Interactive Levels", "Rebase & Cherry-pick", "Remotes"],
    ctaText: "Start Playing",
    previewWidget: (
      <div className="rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-3 font-mono text-[10px] text-muted space-y-1">
        <div><span className="text-emerald-600 dark:text-emerald-400">$</span> git checkout -b feature</div>
        <div><span className="text-emerald-600 dark:text-emerald-400">$</span> git commit</div>
        <div><span className="text-emerald-600 dark:text-emerald-400">$</span> git rebase main</div>
      </div>
    ),
  },
];

/** Home-page tools, laid out like the design-system cards: a preview on top, a short pitch below. */
export function ToolsBanner() {
  return (
    <section className="mb-10 w-full" aria-labelledby="featured-tools-heading">
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <span className="flex size-2 rounded-full bg-accent" />
          <h2 id="featured-tools-heading" className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
            Featured Interactive Developer Tools
          </h2>
        </div>
        <p className="mt-0.5 text-xs text-muted">Interactive utilities, real-time generators and compilers that run in your browser.</p>
      </div>

      <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {FEATURED_TOOLS.map((tool) => (
          <li key={tool.id}>
            <Link
              href={tool.href}
              className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface transition-shadow hover:shadow-md"
            >
              <div className={`relative flex aspect-[2/1] flex-col justify-between border-b border-border bg-gradient-to-b p-3 sm:aspect-[4/3] sm:p-4 ${tool.gradient}`}>
                <span className={`self-start rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider sm:text-[10px] ${tool.badgeColor}`}>
                  {tool.badge}
                </span>
                {/* Previews are dense; on phones the card keeps just the badge and color. */}
                <div className="hidden sm:block">{tool.previewWidget}</div>
              </div>
              <div className="flex flex-1 flex-col p-3 sm:p-4">
                <h3 className="font-semibold leading-snug group-hover:text-accent">{tool.title}</h3>
                <p className="mt-0.5 text-xs font-medium" style={{ color: tool.accentColor }}>
                  {tool.subtitle}
                </p>
                <p className="mt-1.5 line-clamp-2 flex-1 text-sm text-muted">{tool.description}</p>
                <p className="mt-3 text-xs font-semibold text-foreground group-hover:text-accent">{tool.ctaText} →</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
