import type { Metadata } from "next";
import Link from "next/link";
import { JsonFormatter } from "@/components/json/JsonFormatter";
import { headerButton } from "@/components/layout/PageHeader";
import { absoluteUrl, jsonLd, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "JSON Formatter, Validator & Converter — Beautify, Minify, Repair",
  description:
    "Free online JSON formatter and validator: beautify, minify, repair broken JSON, view as a tree, convert to YAML, XML, CSV and TypeScript, compare two JSON files and run JSONPath queries. Runs in your browser.",
  path: "/json-formatter/",
});

const kbd = "rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[12px]";

const TYPES = [
  ["String", '"hello", "line\\nbreak", "\\u00e9"', "Double quotes only; escape \\\" \\\\ \\n \\t \\uXXXX"],
  ["Number", "42, -3.14, 6.02e23", "No leading zeros, no hex, no NaN/Infinity"],
  ["Boolean", "true, false", "Lowercase"],
  ["Null", "null", "Lowercase; there is no undefined"],
  ["Object", '{ "name": "Ada", "age": 36 }', "Keys must be double-quoted strings"],
  ["Array", '[1, "two", { "three": 3 }]', "Items can be any type, separated by commas"],
];

const ERRORS = [
  ["Trailing comma", '{ "a": 1, }', '{ "a": 1 }'],
  ["Single quotes", "{ 'a': 'b' }", '{ "a": "b" }'],
  ["Unquoted key", "{ a: 1 }", '{ "a": 1 }'],
  ["Comments", '{ "a": 1 // note }', '{ "a": 1 }'],
  ["Python / JS literals", '{ "ok": True, "x": undefined }', '{ "ok": true, "x": null }'],
  ["Missing comma", '{ "a": 1 "b": 2 }', '{ "a": 1, "b": 2 }'],
  ["Raw line break in a string", '"line one\n line two"', '"line one\\nline two"'],
  ["Leading zero", '{ "zip": 02134 }', '{ "zip": "02134" }'],
];

const FAQ = [
  ["Is my JSON sent to a server?", "No. Formatting, validation, conversion and comparison all run in your browser. Your input is only saved in this browser's local storage so it's still there when you come back; loading from a URL fetches that URL directly from your browser."],
  ["What does Repair fix?", "Comments, trailing commas, single-quoted strings, unquoted keys, smart quotes, Python-style True/False/None, and missing commas between lines. Always check the repaired result."],
  ["How big a file can it handle?", "Several megabytes comfortably; files up to 50 MB can be opened. Very large documents are faster in Code view than Tree view."],
  ["What JSONPath syntax is supported?", "Root $, child .key and ['key'], indexes [0] and [-1], wildcards [*] and .*, recursive descent ..key, slices [0:3], unions [0,2], and filters like [?(@.price < 10)], [?(@.tag)] and [?(@.name =~ /^A/i)]."],
  ["Can I convert JSON to CSV?", "Yes — arrays of objects become rows; nested objects are flattened into dot.path columns, and arrays of values are joined with semicolons."],
];

const BREADCRUMB_LD = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
    { "@type": "ListItem", position: 2, name: "JSON Formatter", item: absoluteUrl("/json-formatter/") },
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
  name: "JSON Formatter & Validator",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Any (web browser)",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  featureList: ["Format and beautify JSON", "Validate with line and column errors", "Minify", "Repair broken JSON", "Tree viewer", "Convert to YAML, XML, CSV, TypeScript, JSON Schema", "Compare two JSON documents", "JSONPath queries"],
};

export default function JsonFormatterPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(APP_LD)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(FAQ_LD)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(BREADCRUMB_LD)} />
      {/* Full-page tool, like a desktop app; the title sits in its toolbar. */}
      <JsonFormatter
        heading={
          <div className="mr-2 flex items-baseline gap-2">
            <h1 className="text-lg font-semibold tracking-tight">JSON Formatter</h1>
            <nav aria-label="Breadcrumb" className="hidden text-xs text-muted xl:block">
              <Link href="/" className="hover:text-foreground">Home</Link> / Tools
            </nav>
          </div>
        }
      />

      {/* Reading content below the tool, at normal page width. */}
      <div className="mx-auto max-w-7xl px-4 pb-4">
        <section className="mt-10">
          <h2 className="text-2xl font-semibold tracking-tight">Free online JSON formatter, validator &amp; converter</h2>
          <p className="mt-2 max-w-3xl text-muted">
            Format, validate, repair and minify JSON — then explore it as a tree, convert it to YAML, XML, CSV or TypeScript, compare two
            documents or query it with JSONPath. Everything runs in your browser; nothing is uploaded.
          </p>
          <p className="mt-3">
            <a href="#json-cheat-sheet" className={headerButton}>
              JSON cheat sheet ↓
            </a>
          </p>
        </section>

        <details className="group mt-10 rounded-xl border border-border bg-surface">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-3">
            <span className="font-semibold">How to use the JSON Formatter</span>
            <span className="text-sm text-muted group-open:hidden">Show guide ▾</span>
            <span className="hidden text-sm text-muted group-open:inline">Hide guide ▴</span>
          </summary>
          <div className="grid gap-6 border-t border-border px-5 py-5 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <h3 className="mb-2 text-sm font-semibold">1. Get JSON in</h3>
              <p className="text-sm text-muted">
                Paste or type into the input, drag a file onto it, use <strong>Open file</strong>, or <strong>Load URL</strong>. It&apos;s validated as you type — errors are underlined with their line and column.
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold">2. Format &amp; fix</h3>
              <p className="text-sm text-muted">
                <strong>Format</strong> (or <kbd className={kbd}>Ctrl</kbd>+<kbd className={kbd}>Enter</kbd>) beautifies with your chosen indent; <strong>Minify</strong> compacts; <strong>Sort keys</strong> orders keys A→Z; <strong>Repair</strong> fixes common mistakes.
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold">3. Explore &amp; transform</h3>
              <p className="text-sm text-muted">
                Switch the output to <strong>Tree</strong> to browse — click a key to copy its path. Use <strong>Convert</strong> for YAML, XML, CSV, TypeScript or JSON Schema, <strong>Compare</strong> to diff two documents, or <strong>JSONPath Query</strong> to pull out values.
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold">4. Take it with you</h3>
              <p className="text-sm text-muted">
                <strong>Copy</strong> or <strong>Download</strong> any result, or send it back to the input. Inside the editors: <kbd className={kbd}>Ctrl</kbd>+<kbd className={kbd}>F</kbd> searches, gutter arrows fold blocks. Your input autosaves in this browser.
              </p>
            </div>
          </div>
        </details>

        <section id="json-cheat-sheet" className="mt-10 scroll-mt-20">
          <h2 className="text-2xl font-semibold tracking-tight">JSON cheat sheet</h2>
          <p className="mt-1 text-muted">
            JSON (JavaScript Object Notation, <a className="text-accent hover:underline" href="https://www.rfc-editor.org/rfc/rfc8259" target="_blank" rel="noopener noreferrer">RFC 8259</a>) has six value types and a few strict rules.
          </p>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="overflow-hidden rounded-xl border border-border bg-surface">
              <h3 className="border-b border-border px-4 py-2 font-semibold">Data types</h3>
              <ul className="divide-y divide-border">
                {TYPES.map(([type, example, note]) => (
                  <li key={type} className="grid gap-1 px-4 py-2.5 sm:grid-cols-[6rem_minmax(0,1fr)] sm:gap-3">
                    <span className="text-sm font-medium">{type}</span>
                    <div className="min-w-0">
                      <code className="block break-all font-mono text-[12.5px]">{example}</code>
                      <span className="text-xs text-muted">{note}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="overflow-hidden rounded-xl border border-border bg-surface">
              <h3 className="border-b border-border px-4 py-2 font-semibold">Common errors &amp; fixes</h3>
              <ul className="divide-y divide-border">
                {ERRORS.map(([what, bad, good]) => (
                  <li key={what} className="grid gap-1 px-4 py-2.5 sm:grid-cols-[9rem_minmax(0,1fr)_minmax(0,1fr)] sm:gap-3">
                    <span className="text-sm font-medium">{what}</span>
                    <code className="min-w-0 break-all font-mono text-[12.5px] text-rose-700 dark:text-rose-400">✕ {bad}</code>
                    <code className="min-w-0 break-all font-mono text-[12.5px] text-emerald-700 dark:text-emerald-400">✓ {good}</code>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted">
            More: <Link href="/quick-reference/javascript/#objects" className="text-accent hover:underline">JSON in JavaScript</Link> ·{" "}
            <Link href="/quick-reference/python/#errors-and-files" className="text-accent hover:underline">JSON in Python</Link> ·{" "}
            <Link href="/browser-support/" className="text-accent hover:underline">Browser support</Link>
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold tracking-tight">FAQ</h2>
          <div className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group px-5 py-3">
                <summary className="cursor-pointer list-none font-medium">
                  <span className="mr-2 inline-block text-muted transition-transform group-open:rotate-90">›</span>
                  {q}
                </summary>
                <p className="mt-2 pl-4 text-sm text-muted">{a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
