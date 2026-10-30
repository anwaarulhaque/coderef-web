import Link from "next/link";
import type { ReactNode } from "react";
import { TryItEditor } from "@/components/tryit/TryItEditor";
import { absoluteUrl, jsonLd } from "@/lib/seo";
import { MODES, type EditorMode } from "@/lib/tryit/modes";

const kbd = "rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[12px]";

type Faq = [question: string, answer: string];

const COMMON_FAQ: Faq[] = [
  ["Is my code sent to a server?", "No. Your code runs in your browser, inside a sandboxed frame, and is saved only in this browser's local storage. Share links keep the code in the part of the URL after #, which browsers don't send to servers."],
  ["Why doesn't localStorage or document.cookie work in the result?", "The result runs in a sandbox with its own origin, so it can't touch this site's storage. That keeps shared links safe to open; use variables instead while you experiment."],
];

/** One page of the Compilers menu: the editor full-width, then a short guide and FAQ at reading width. */
export function EditorPage({
  mode,
  title,
  name,
  intro,
  steps,
  faq = [],
  features,
}: {
  mode: EditorMode;
  /** The h1 in the toolbar. */
  title: string;
  /** Name for structured data. */
  name: string;
  intro: { heading: string; body: ReactNode };
  /** Four "How to use" cards. */
  steps: [heading: string, body: ReactNode][];
  faq?: Faq[];
  features: string[];
}) {
  const path = MODES[mode].path;
  const allFaq = [...faq, ...COMMON_FAQ];
  const ld = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name,
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Any (web browser)",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      featureList: features,
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: allFaq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
        { "@type": "ListItem", position: 2, name: title, item: absoluteUrl(path) },
      ],
    },
  ];

  return (
    <>
      {ld.map((data, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={jsonLd(data)} />
      ))}
      {/* Full-page tool; the title sits in its toolbar. */}
      <TryItEditor
        mode={mode}
        heading={
          <div className="mr-2 flex items-baseline gap-2">
            <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
            <nav aria-label="Breadcrumb" className="hidden text-xs text-muted xl:block">
              <Link href="/" className="hover:text-foreground">Home</Link> / Compilers
            </nav>
          </div>
        }
      />

      <div className="mx-auto max-w-7xl px-4 pb-4">
        <section className="mt-10">
          <h2 className="text-2xl font-semibold tracking-tight">{intro.heading}</h2>
          <div className="mt-2 max-w-3xl text-muted">{intro.body}</div>
        </section>

        <details open className="group mt-8 rounded-xl border border-border bg-surface">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-3">
            <span className="font-semibold">How to use</span>
            <span className="text-sm text-muted group-open:hidden">Show guide ▾</span>
            <span className="hidden text-sm text-muted group-open:inline">Hide guide ▴</span>
          </summary>
          <div className="grid gap-6 border-t border-border px-5 py-5 md:grid-cols-2 xl:grid-cols-4">
            {steps.map(([heading, body], i) => (
              <div key={heading}>
                <h3 className="mb-2 text-sm font-semibold">
                  {i + 1}. {heading}
                </h3>
                <div className="text-sm text-muted">{body}</div>
              </div>
            ))}
          </div>
        </details>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold tracking-tight">More compilers</h2>
          <p className="mt-2 text-muted">
            <Link href="/html-editor/" className="text-accent hover:underline">HTML Editor</Link> ·{" "}
            <Link href="/css-editor/" className="text-accent hover:underline">CSS Editor</Link> ·{" "}
            <Link href="/javascript-compiler/" className="text-accent hover:underline">JavaScript Compiler</Link> ·{" "}
            <Link href="/try-it/" className="text-accent hover:underline">HTML, CSS &amp; JS Playground</Link> ·{" "}
            <Link href="/rest-api-client/" className="text-accent hover:underline">REST API Client</Link>
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold tracking-tight">FAQ</h2>
          <div className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
            {allFaq.map(([q, a]) => (
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

/** Shared "how to use" pieces. */
export const RUN_STEP: [string, ReactNode] = [
  "Run it",
  <>
    Press <strong>Run ❯</strong> or <kbd className={kbd}>Ctrl/⌘</kbd>+<kbd className={kbd}>Enter</kbd>. Turn on <strong>Auto-run</strong> to update as
    you type.
  </>,
];

export const KEEP_STEP: [string, ReactNode] = [
  "Keep it",
  <>
    Your code autosaves in this browser. <strong>Share</strong> copies a link that opens it; <strong>Download</strong> saves one{" "}
    <code className={kbd}>index.html</code> file. Drag the divider to resize, or <strong>Stack</strong> the panes.
  </>,
];

export const EMMET_STEP: [string, ReactNode] = [
  "Type faster",
  <>
    Emmet: <code className={kbd}>ul&gt;li*3</code> + <kbd className={kbd}>Tab</kbd> writes a list; <code className={kbd}>m10</code> +{" "}
    <kbd className={kbd}>Tab</kbd> in CSS writes <code className={kbd}>margin: 10px;</code>. See the{" "}
    <Link href="/abbreviations/" className="text-accent hover:underline">abbreviation list</Link>.
  </>,
];
