import type { Metadata } from "next";
import Link from "next/link";
import { ColorGenerator } from "@/components/colors/ColorGenerator";
import { absoluteUrl, jsonLd, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Realtime Colors — Live Color Palette Generator & Template Previewer",
  description:
    "Generate harmonious color palettes and visualize them in real time on modern landing pages, SaaS dashboards, blogs, and UI components. Check WCAG contrast compliance, explore 50-950 shades, and export directly to CSS variables, Tailwind, SCSS, or shareable URLs.",
  path: "/colors/",
});

const FAQ = [
  [
    "How does the Realtime Colors generator work?",
    "Press the Spacebar or click Generate to cycle through harmonized color palettes generated via color theory (complementary, triadic, and analogous harmonies). Any color you lock with the padlock icon stays fixed while the remaining unlocked colors adjust automatically to maintain harmony and contrast.",
  ],
  [
    "What templates can I preview my colors on?",
    "You can preview your active theme on a complete Marketing Landing Page (with Hero, Feature cards, Pricing table, and CTA banner), an Executive SaaS Dashboard (with KPI metrics, interactive SVG area charts, and transactions table), an Editorial Tech Blog (with typography, blockquotes, code blocks, and newsletter box), and a full UI Component library.",
  ],
  [
    "How is WCAG contrast calculated?",
    "The contrast checker uses the official WCAG 2.1 relative luminance formula to calculate the exact contrast ratio between background and foreground elements. Ratios of 4.5:1 pass AA for regular text, while 7:1 passes AAA enhanced criteria. Ratios of 3:1 pass for large headings and active UI components.",
  ],
  [
    "Can I export the colors to Tailwind CSS or CSS Custom Properties?",
    "Yes. Click the Export button in the top toolbar to copy CSS variables (:root { --text: ...; --background: ...; --primary: ...; --secondary: ...; --accent: ... }), Tailwind configuration snippet, SCSS variables, or raw JSON with one click.",
  ],
  [
    "Can I share my custom palette with others?",
    "Yes. As you tweak colors and typography, the URL updates with a permalink query string (e.g. ?colors=050315-fbfbfe-2f27ce-dedcff-433bff&fonts=Inter-Inter). Anyone opening that link will see your exact palette and font configuration immediately without needing an account.",
  ],
];

const BREADCRUMB_LD = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
    { "@type": "ListItem", position: 2, name: "Tools", item: absoluteUrl("/#tools") },
    { "@type": "ListItem", position: 3, name: "Realtime Colors", item: absoluteUrl("/colors/") },
  ],
};

const FAQ_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map(([q, a]) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
};

const APP_LD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Realtime Colors — Color Palette Generator & Previewer",
  applicationCategory: "DesignApplication",
  operatingSystem: "Any (web browser)",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  featureList: [
    "Interactive color palette generator with keyboard Spacebar trigger",
    "Lock individual colors while randomizing others",
    "Live preview on Landing Page, SaaS Dashboard, Blog, and UI Kit templates",
    "Instant Light/Dark mode invert tool",
    "WCAG 2.1 contrast checker for AA and AAA compliance",
    "11-step tint and shade ladder generator (50 to 950)",
    "Export to CSS Variables, Tailwind CSS, SCSS, JSON, and permalinks",
    "Google Fonts pairing selector (Inter, Jakarta, Poppins, Outfit, Space Grotesk, JetBrains Mono)",
    "Desktop, tablet, and mobile viewport responsive previews",
  ],
};

const kbd = "rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[12px]";

export default function RealtimeColorsPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(APP_LD)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(FAQ_LD)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(BREADCRUMB_LD)} />

      {/* Full-width interactive tool container */}
      <ColorGenerator />

      {/* Guide, documentation, and SEO content */}
      <div className="mx-auto max-w-7xl px-4 py-12">
        <section>
          <div className="flex items-center gap-2 text-xs text-muted mb-2">
            <Link href="/" className="hover:text-foreground">
              Home
            </Link>
            <span>/</span>
            <Link href="/colors/" className="hover:text-foreground">
              Tools
            </Link>
            <span>/</span>
            <span>Realtime Colors</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Realtime Color Palette Generator &amp; Live UI Previewer
          </h2>
          <p className="mt-3 max-w-3xl text-sm sm:text-base text-muted leading-relaxed">
            Stop visualizing colors in isolated color chips. Realtime Colors applies your palette directly
            onto authentic web applications, landing pages, dashboards, and editorial articles in real-time.
            Test contrast, adjust typography, inspect 50–950 tints, and export ready-to-use tokens into your Tailwind or CSS codebase.
          </p>
        </section>

        {/* How to use */}
        <details className="group mt-10 rounded-2xl border border-border bg-surface shadow-xs">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-6 py-4">
            <span className="font-bold text-base">How to use Realtime Colors</span>
            <span className="text-xs text-muted group-open:hidden">Show guide ▾</span>
            <span className="hidden text-xs text-muted group-open:inline">Hide guide ▴</span>
          </summary>
          <div className="grid gap-6 border-t border-border px-6 py-6 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <h3 className="mb-2 text-sm font-bold">1. Generate &amp; Lock</h3>
              <p className="text-xs sm:text-sm text-muted leading-relaxed">
                Press the <kbd className={kbd}>Space</kbd> key anywhere on the page to randomize unlocked colors.
                Click the padlock icon on any color you love to lock it in place while the rest of the palette harmonizes around it.
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-bold">2. Live Template Previews</h3>
              <p className="text-xs sm:text-sm text-muted leading-relaxed">
                Switch between <strong>All</strong>, <strong>Landing Page</strong>, <strong>Dashboard</strong>,{" "}
                <strong>Blog</strong>, and <strong>UI Kit</strong> templates. Test your design across Desktop, Tablet, and Mobile viewport frames.
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-bold">3. Check WCAG Contrast</h3>
              <p className="text-xs sm:text-sm text-muted leading-relaxed">
                Click the <strong>Contrast Badge</strong> to inspect relative luminance and verify whether your background,
                text, primary, and secondary combinations pass AA and AAA accessibility standards.
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-bold">4. Export &amp; Share</h3>
              <p className="text-xs sm:text-sm text-muted leading-relaxed">
                Click <strong>Export</strong> to copy standard CSS variables, Tailwind configuration snippets, or SCSS.
                Use the shareable link in the address bar to send your live theme directly to coworkers or clients.
              </p>
            </div>
          </div>
        </details>

        {/* Principles of Harmonious Color Systems */}
        <section className="mt-12 rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-xs">
          <h3 className="text-xl font-bold tracking-tight">The 60-30-10 Rule in Modern User Interfaces</h3>
          <p className="mt-2 text-sm text-muted leading-relaxed">
            A balanced color system relies on proportional visual weight to maintain visual calm and strong hierarchy:
          </p>

          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            <div className="rounded-xl border border-border p-4 bg-chip/30">
              <div className="text-2xl font-black text-accent">60%</div>
              <h4 className="mt-1 text-sm font-bold">Canvas &amp; Background</h4>
              <p className="mt-1 text-xs text-muted leading-relaxed">
                The dominant foundational color. Typically an ultra-clean neutral off-white or deep slate that gives content breathing room without overwhelming the viewer.
              </p>
            </div>

            <div className="rounded-xl border border-border p-4 bg-chip/30">
              <div className="text-2xl font-black text-accent">30%</div>
              <h4 className="mt-1 text-sm font-bold">Structural Secondary</h4>
              <p className="mt-1 text-xs text-muted leading-relaxed">
                Soft tints and supporting tones used for cards, sidebars, borders, table stripes, and secondary action buttons that define UI architecture.
              </p>
            </div>

            <div className="rounded-xl border border-border p-4 bg-chip/30">
              <div className="text-2xl font-black text-accent">10%</div>
              <h4 className="mt-1 text-sm font-bold">Primary &amp; Accent Pop</h4>
              <p className="mt-1 text-xs text-muted leading-relaxed">
                High-energy focal points reserved strictly for primary calls-to-action, notification badges, active states, and critical interaction targets.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mt-12">
          <h3 className="text-xl font-bold tracking-tight">Frequently Asked Questions</h3>
          <div className="mt-4 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group px-6 py-4">
                <summary className="cursor-pointer list-none font-semibold text-foreground flex items-center justify-between">
                  <span>{q}</span>
                  <span className="text-muted transition-transform group-open:rotate-180">▾</span>
                </summary>
                <p className="mt-3 text-sm text-muted leading-relaxed pr-6">{a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Related Tools */}
        <footer className="mt-12 border-t border-border pt-6 text-xs text-muted flex flex-wrap gap-4">
          <span>Related tools on coderef:</span>
          <Link href="/css-editor/" className="underline hover:text-foreground">
            CSS Editor &amp; Playground
          </Link>
          <span>·</span>
          <Link href="/html-editor/" className="underline hover:text-foreground">
            HTML Editor
          </Link>
          <span>·</span>
          <Link href="/css-grid/" className="underline hover:text-foreground">
            CSS Grid Cheat Sheet
          </Link>
          <span>·</span>
          <Link href="/flexbox/" className="underline hover:text-foreground">
            Flexbox Cheat Sheet
          </Link>
        </footer>
      </div>
    </>
  );
}
