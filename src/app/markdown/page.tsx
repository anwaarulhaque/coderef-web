import type { Metadata } from "next";
import Link from "next/link";
import { MarkdownTool } from "@/components/markdown/MarkdownTool";
import { CheatSheetViewer } from "@/components/markdown/CheatSheetViewer";
import { headerButton } from "@/components/layout/PageHeader";
import { getMarkdownCheatSheet } from "@/lib/markdown/cheatsheet";
import { absoluteUrl, jsonLd, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Markdown Editor, Live Preview & Cheat Sheet — Write, Convert & Export",
  description:
    "Free online full-page Markdown editor with real-time preview: formatting toolbar, synchronized scrolling, interactive table builder, HTML to Markdown converter, export to .md or styled .html, and complete syntax cheat sheet. Runs locally in your browser.",
  path: "/markdown/",
});

const kbd = "rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[12px]";

const FAQ = [
  [
    "Is my Markdown sent to a server?",
    "No. The editor, live preview rendering, syntax validation, and exports run entirely in your web browser. Your text is saved in this browser's local storage so your work is restored when you return.",
  ],
  [
    "What Markdown flavors are supported?",
    "The editor supports CommonMark and GitHub Flavored Markdown (GFM), including tables, task lists (- [x]), strikethrough (~~text~~), highlights (==text==), footnotes ([^1]), sub/superscripts (H~2~O, X^2^), emoji shortcodes, and definition lists.",
  ],
  [
    "Can I convert HTML to Markdown?",
    "Yes — switch to the 'HTML → Markdown' tool tab in the top navigation, paste your raw HTML, and click Convert. You can then copy it or insert it directly into the Markdown Editor.",
  ],
  [
    "How does the Table Builder work?",
    "Switch to the 'Table Builder' tool tab to configure rows, columns, and text alignment visually. Type directly into the interactive grid and click 'Insert into Editor' to drop in properly formatted Markdown pipes.",
  ],
  [
    "How do I export to HTML or PDF?",
    "Use the File menu or toolbar to download as .md or a styled standalone .html file. You can also click 'Print / PDF' (or press Ctrl+P) to generate a clean PDF document without any editor chrome.",
  ],
  [
    "Is raw HTML safe in the preview?",
    "Yes. Raw HTML is allowed for advanced styling, but all preview output is automatically sanitized using DOMPurify before rendering, stripping any malicious scripts or attributes.",
  ],
];

const BREADCRUMB_LD = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
    { "@type": "ListItem", position: 2, name: "Markdown Editor", item: absoluteUrl("/markdown/") },
  ],
};

const FAQ_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
};

const APP_LD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Markdown Editor & Cheat Sheet",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Any (web browser)",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  featureList: [
    "Write Markdown with real-time live preview",
    "Synchronized proportional scrolling",
    "Full formatting toolbar and keyboard shortcuts",
    "Interactive Markdown Table Builder",
    "HTML to Markdown converter",
    "Export to .md and self-contained styled .html",
    "Print to PDF",
    "DOMPurify HTML sanitization",
    "Complete syntax cheat sheet with interactive examples",
  ],
};

export default function MarkdownPage() {
  const entries = getMarkdownCheatSheet();

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(APP_LD)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(FAQ_LD)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(BREADCRUMB_LD)} />

      {/* Full-page tool, like a desktop app; the title sits in its toolbar. */}
      <MarkdownTool
        heading={
          <div className="mr-2 flex items-baseline gap-2">
            <h1 className="text-lg font-semibold tracking-tight">Markdown Editor</h1>
            <nav aria-label="Breadcrumb" className="hidden text-xs text-muted xl:block">
              <Link href="/" className="hover:text-foreground">
                Home
              </Link>{" "}
              / Tools
            </nav>
          </div>
        }
        entries={entries}
      />

      {/* Reading content below the tool, at normal page width. */}
      <div className="mx-auto max-w-7xl px-4 pb-4">
        <section className="mt-10">
          <h2 className="text-2xl font-semibold tracking-tight">Free online Markdown editor, previewer &amp; cheat sheet</h2>
          <p className="mt-2 max-w-3xl text-muted">
            Write Markdown with a live synchronized preview, full formatting toolbar, interactive table builder, HTML-to-Markdown converter,
            and export to .md or standalone styled HTML. Everything runs 100% locally in your browser; nothing is uploaded.
          </p>
          <p className="mt-3">
            <a href="#markdown-cheat-sheet" className={headerButton}>
              Markdown cheat sheet ↓
            </a>
          </p>
        </section>

        {/* How to use */}
        <details className="group mt-10 rounded-xl border border-border bg-surface">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-3">
            <span className="font-semibold">How to use the Markdown Editor</span>
            <span className="text-sm text-muted group-open:hidden">Show guide ▾</span>
            <span className="hidden text-sm text-muted group-open:inline">Hide guide ▴</span>
          </summary>
          <div className="grid gap-6 border-t border-border px-5 py-5 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <h3 className="mb-2 text-sm font-semibold">1. Write &amp; Format</h3>
              <p className="text-sm text-muted leading-relaxed">
                Type in the editor or drag and drop any <code className={kbd}>.md</code> or text file. Use the toolbar or shortcuts:{" "}
                <kbd className={kbd}>Ctrl/⌘+B</kbd> for bold, <kbd className={kbd}>Ctrl/⌘+I</kbd> for italic, <kbd className={kbd}>Ctrl/⌘+K</kbd> for links,{" "}
                and <kbd className={kbd}>Tab</kbd> to indent.
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold">2. Live Preview &amp; Views</h3>
              <p className="text-sm text-muted leading-relaxed">
                Toggle between <strong>Split</strong>, <strong>Edit</strong>, <strong>Preview</strong>, or <strong>HTML</strong> view modes.
                Proportional synchronized scrolling keeps your cursor position and preview aligned. Output is sanitized via DOMPurify.
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold">3. Tools &amp; Converters</h3>
              <p className="text-sm text-muted leading-relaxed">
                Use <strong>Table Builder</strong> to visually configure rows, columns, and alignment. Use <strong>HTML → Markdown</strong> to convert
                web snippets into clean Markdown, or load ready-made templates (README, Changelog, API docs).
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold">4. Save &amp; Export</h3>
              <p className="text-sm text-muted leading-relaxed">
                Your document autosaves in local storage. Use the <strong>File</strong> menu to download <code className={kbd}>.md</code>, export
                a self-contained styled <code className={kbd}>.html</code> page, copy Markdown/HTML to clipboard, or generate a PDF.
              </p>
            </div>
          </div>
        </details>

        {/* Cheat sheet section */}
        <section id="markdown-cheat-sheet" className="mt-10 scroll-mt-20">
          <div className="mb-4">
            <h2 className="text-2xl font-semibold tracking-tight">Markdown cheat sheet</h2>
            <p className="mt-1 text-muted">
              Basic syntax is supported by every Markdown parser; extended syntax works across GitHub, modern documentation tools, and static site generators.
            </p>
          </div>

          <CheatSheetViewer entries={entries} />
        </section>

        {/* FAQ section */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold tracking-tight">Frequently Asked Questions</h2>
          <div className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group px-5 py-3.5">
                <summary className="cursor-pointer list-none font-medium text-foreground">
                  <span className="mr-2 inline-block text-muted transition-transform group-open:rotate-90">›</span>
                  {q}
                </summary>
                <p className="mt-2.5 pl-4 text-sm text-muted leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Reference links */}
        <footer className="mt-10 border-t border-border pt-6 text-xs text-muted">
          References:{" "}
          <a href="https://spec.commonmark.org/" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
            CommonMark specification
          </a>{" "}
          ·{" "}
          <a href="https://github.github.com/gfm/" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
            GitHub Flavored Markdown (GFM)
          </a>{" "}
          ·{" "}
          <a href="https://www.markdownguide.org/" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
            Markdown Guide
          </a>
          . Rendered with markdown-it and sanitized with DOMPurify.
        </footer>
      </div>
    </>
  );
}
