import type { Metadata } from "next";
import Link from "next/link";
import { DesignBrowser } from "@/components/designmd/DesignBrowser";
import { LibraryFootnote } from "@/components/designmd/LibraryFootnote";
import { PageHeader, headerButtonPrimary } from "@/components/layout/PageHeader";
import { Snippet } from "@/components/quickref/Snippet";
import { designFileHref, getCollections, getDesigns, getTopRank, previewColors, toIndexEntry } from "@/lib/design-md";
import { SITE_URL, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "DESIGN.md Library — Design Systems for AI Coding Agents",
  description:
    "1,000+ ready-to-use DESIGN.md design systems for Claude Code, Cursor and other AI coding agents. Search by style, color and font, copy one into your project, and get on-brand UI.",
  path: "/design-md/",
});

export default async function DesignMdPage() {
  const [designs, collections] = await Promise.all([getDesigns(), getCollections()]);
  // Rendered into the HTML so the page is useful (and indexable) before the search index loads.
  const featured = designs
    .filter((d) => getTopRank(d.id) !== undefined)
    .sort((a, b) => getTopRank(a.id)! - getTopRank(b.id)!)
    .map(toIndexEntry);
  const samplesFor = (collection: string) =>
    designs
      .filter((d) => d.collection === collection && d.colors.length >= 3)
      .sort((a, b) => b.words - a.words)
      .slice(0, 4);

  return (
    <>
      <PageHeader
        title="DESIGN.md Library"
        crumbs={[{ href: "/", label: "Home" }, { label: "DESIGN.md Library" }]}
        description={
          <>
            {designs.length.toLocaleString("en")} design systems written for AI coding agents. Drop a <code className="rounded bg-chip px-1.5 py-0.5 font-mono text-[0.9em]">DESIGN.md</code> into your
            project and Claude Code, Cursor or Copilot builds UI that matches it: colors, type, spacing, components and the rules between them.
          </>
        }
        actions={
          <>
            <a href="#how-to-use" className={headerButtonPrimary}>
              How to use
            </a>
          </>
        }
      >
        <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-2 text-sm">
          {[
            [designs.length.toLocaleString("en"), "design systems"],
            [collections.length, "collections"],
            ["Free", "copy, download or curl"],
          ].map(([value, label]) => (
            <div key={label} className="flex items-baseline gap-1.5">
              <dt className="text-xl font-semibold">{value}</dt>
              <dd className="text-muted">{label}</dd>
            </div>
          ))}
        </dl>
      </PageHeader>

      <section aria-labelledby="collections" className="mb-10">
        <h2 id="collections" className="sr-only">
          Collections
        </h2>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((c) => (
            <li key={c.id}>
              <Link href={`/design-md/${c.id}/`} className="group flex h-full items-center gap-4 rounded-xl border border-border bg-surface p-4 transition-shadow hover:shadow-md">
                <div className="grid shrink-0 grid-cols-2 gap-1" aria-hidden>
                  {samplesFor(c.id).map((d) => {
                    const { bg, accent } = previewColors(d.colors, d.theme);
                    return (
                      <span key={d.id} className="flex size-6 items-center justify-center rounded-md border border-border" style={{ backgroundColor: bg }}>
                        <span className="size-2.5 rounded-full" style={{ backgroundColor: accent }} />
                      </span>
                    );
                  })}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold group-hover:text-accent">
                    {c.label} <span className="font-normal text-muted">· {c.count}</span>
                  </p>
                  <p className="text-sm text-muted">{c.description}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <DesignBrowser collections={collections} initial={featured} />

      <section id="how-to-use" className="mt-16 scroll-mt-20 grid grid-cols-1 gap-6 rounded-xl border border-border bg-surface p-6 md:grid-cols-3 md:p-8">
        <div>
          <h2 className="text-xl font-semibold">How to use a DESIGN.md</h2>
          <p className="mt-2 text-sm text-muted">
            A DESIGN.md is a plain Markdown file that describes a visual system in words and tokens. AI coding agents read it as context, the same way they read a README.
          </p>
        </div>
        <ol className="space-y-4 text-sm md:col-span-2">
          <li>
            <p className="font-medium">1. Pick a design and put its file in your project root</p>
            <div className="mt-2">
              <Snippet code={`curl -o DESIGN.md ${new URL(designFileHref("web/linear.app"), SITE_URL).href}`} />
            </div>
          </li>
          <li>
            <p className="font-medium">2. Tell your agent to follow it</p>
            <div className="mt-2">
              <Snippet code="Build the landing page. Follow DESIGN.md for every color, font, spacing and component decision." />
            </div>
          </li>
          <li>
            <p className="font-medium">3. Make it yours</p>
            <p className="mt-1 text-muted">
              Change the palette, fonts and wording to describe your own brand.
            </p>
          </li>
        </ol>
      </section>

      <LibraryFootnote />
    </>
  );
}
