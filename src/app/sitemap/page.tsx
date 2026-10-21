import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { getCompatFeatures } from "@/lib/compat";
import { getQuickRefs } from "@/lib/quickref";
import { getAllSheets } from "@/lib/sheets";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "HTML Sitemap — All Developer Tools, Cheat Sheets & Quick References · coderef",
  description:
    "Complete overview of all developer cheat sheets, interactive compilers, color generators, quick references, and web platform compatibility guides on coderef.",
  path: "/sitemap/",
});

export default function SitemapPage() {
  const allSheets = getAllSheets().sort((a, b) => a.title.localeCompare(b.title));
  const quickRefs = getQuickRefs().sort((a, b) => a.title.localeCompare(b.title));
  const compatFeatures = getCompatFeatures().slice(0, 48); // Top features

  const tools = [
    { href: "/colors/", title: "Realtime Colors Studio", desc: "Live color palette generator, WCAG contrast audits, and instant template previewer" },
    { href: "/json-formatter/", title: "JSON Formatter", desc: "Format, validate, repair, convert (YAML/XML/CSV/TypeScript) and compare JSON" },
    { href: "/try-it/", title: "HTML, CSS & JS Playground", desc: "All-in-one web editor with live rendering and console output" },
    { href: "/markdown/", title: "Markdown Editor & Cheat Sheet", desc: "Live preview, interactive table builder, and syntax cheat sheet" },
    { href: "/regex-tester/", title: "Regex Tester", desc: "JavaScript regular expression tester with highlighting and explanations" },
    { href: "/rest-api-client/", title: "REST API Client", desc: "In-browser HTTP request client with header inspection and JSON parsing" },
    { href: "/html-editor/", title: "HTML Editor", desc: "Live rendered HTML sandbox with instant preview" },
    { href: "/css-editor/", title: "CSS Editor", desc: "Live CSS playground with flexbox and grid layout presets" },
    { href: "/javascript-compiler/", title: "JavaScript Compiler", desc: "Run JavaScript code and read visual console logs" },
    { href: "/abbreviations/", title: "HTML & CSS Abbreviations", desc: "Emmet syntax generator for rapid HTML authoring" },
    { href: "/git-branching/", title: "Git Branching", desc: "Animated interactive levels for learning Git branching and rebasing" },
    { href: "/browser-support/", title: "Browser Support", desc: "Baseline status & compatibility data for 1,200+ web features" },
    { href: "/browser-support/compare/", title: "Compare Browsers", desc: "Side-by-side comparison of Chrome, Safari, and Firefox support" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader
        title="Sitemap"
        description="Comprehensive directory of all developer cheat sheets, quick references, interactive tools, and web standards."
        actions={
          <a
            href="/sitemap.xml"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-4 py-2 text-xs font-semibold hover:bg-chip transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <span>Raw XML Sitemap</span>
          </a>
        }
      />

      {/* 1. Interactive Developer Tools */}
      <section className="mt-10">
        <h2 className="text-xl font-bold tracking-tight border-b border-border pb-3 flex items-center justify-between">
          <span>Interactive Developer Tools &amp; Compilers</span>
          <span className="text-xs font-normal text-muted">{tools.length} Tools</span>
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="group rounded-xl border border-border bg-surface p-4 hover:border-accent/40 hover:bg-chip/40 transition-all shadow-2xs"
            >
              <h3 className="font-bold text-sm text-foreground group-hover:text-accent transition-colors">
                {t.title}
              </h3>
              <p className="mt-1 text-xs text-muted leading-relaxed">{t.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* 2. Quick References */}
      <section className="mt-12">
        <h2 className="text-xl font-bold tracking-tight border-b border-border pb-3 flex items-center justify-between">
          <span>Quick Reference Guides</span>
          <span className="text-xs font-normal text-muted">{quickRefs.length} Guides</span>
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {quickRefs.map((q) => (
            <Link
              key={q.slug}
              href={`/quick-reference/${q.slug}/`}
              className="rounded-lg border border-border bg-surface p-3 text-xs font-semibold hover:border-accent hover:text-accent transition-colors"
            >
              {q.title}
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Developer Cheat Sheets */}
      <section className="mt-12">
        <h2 className="text-xl font-bold tracking-tight border-b border-border pb-3 flex items-center justify-between">
          <span>Language &amp; Framework Cheat Sheets</span>
          <span className="text-xs font-normal text-muted">{allSheets.length} Sheets</span>
        </h2>
        <div className="mt-4 grid gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 text-xs">
          {allSheets.map((s) => (
            <Link
              key={s.slug}
              href={`/${s.slug}/`}
              className="rounded-lg border border-border/70 bg-surface px-3 py-2 text-muted hover:text-foreground hover:bg-chip transition-colors truncate"
              title={s.title}
            >
              {s.title}
            </Link>
          ))}
        </div>
      </section>

      {/* 4. Browser Support */}
      <section className="mt-12">
        <h2 className="text-xl font-bold tracking-tight border-b border-border pb-3 flex items-center justify-between">
          <span>Popular Browser Support Tables</span>
          <Link href="/browser-support/" className="text-xs text-accent hover:underline font-normal">
            View All 1,200+ Features →
          </Link>
        </h2>
        <div className="mt-4 grid gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 text-xs">
          {compatFeatures.map((f) => (
            <Link
              key={f.id}
              href={`/browser-support/${f.id}/`}
              className="rounded-lg border border-border/70 bg-surface px-3 py-2 text-muted hover:text-foreground hover:bg-chip transition-colors truncate"
              title={f.name}
            >
              {f.name}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
