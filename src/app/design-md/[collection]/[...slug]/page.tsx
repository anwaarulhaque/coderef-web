import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DesignSystemPanel } from "@/components/designmd/DesignSystemPanel";
import { FavoriteButton } from "@/components/designmd/FavoriteButton";
import { DesignCard } from "@/components/designmd/DesignCard";
import { type DesignVariant, DesignDocument, FileActions } from "@/components/designmd/DesignDocument";
import { LibraryFootnote } from "@/components/designmd/LibraryFootnote";
import { Palette } from "@/components/designmd/Palette";
import { ShotPreview } from "@/components/designmd/ShotPreview";
import { PageHeader } from "@/components/layout/PageHeader";
import { Snippet } from "@/components/quickref/Snippet";
import {
  cdnFetchPath,
  designFileHref,
  getCollections,
  getDesign,
  getDesigns,
  getRelated,
  getShot,
  getSiteUrl,
  previewColors,
  readableOn,
  readDesignFile,
  renderDesign,
  shotHref,
  splitFrontMatter,
  toIndexEntry,
  variantLabel,
} from "@/lib/design-md";
import { SITE_URL, pageMetadata } from "@/lib/seo";

// Only pre-built params exist; anything else renders the 404 page.
export const dynamicParams = false;

export async function generateStaticParams() {
  return (await getDesigns()).map((d) => {
    const [collection, ...slug] = d.id.split("/");
    return { collection, slug };
  });
}

type Props = PageProps<"/design-md/[collection]/[...slug]">;

async function designFor(params: Props["params"]) {
  const { collection, slug } = await params;
  return getDesign([collection, ...slug.map(decodeURIComponent)].join("/"));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const d = await designFor(params);
  if (!d) return {};
  const meta = pageMetadata({
    title: `${d.name} DESIGN.md — Design System for AI Coding Agents`,
    description: d.summary || `The ${d.name} design system as a DESIGN.md file for Claude Code, Cursor and other AI coding agents.`,
    path: `/design-md/${d.id}/`,
    type: "article",
  });
  // Indexed from another site: keep the original as the page search engines show.
  if (d.external) return { ...meta, robots: { index: false, follow: true } };
  // Share cards show the site itself when it has been captured.
  const shot = getShot(d.id);
  if (!shot) return meta;
  const image = { url: shotHref(d.id, "thumb", shot.v), width: 600, height: 800, alt: `${d.name} website` };
  return { ...meta, openGraph: { ...meta.openGraph, images: [image] }, twitter: { ...meta.twitter, card: "summary_large_image", images: [image.url] } };
}

export default async function DesignPage({ params }: Props) {
  const d = await designFor(params);
  if (!d) notFound();
  const collections = await getCollections();
  const collection = collections.find((c) => c.id === d.collection)!;
  const { bg, fg, accent } = previewColors(d.colors, d.theme);
  const display = d.fonts[0] ? `"${d.fonts[0]}", var(--font-geist-sans), sans-serif` : undefined;
  const shot = getShot(d.id);
  const siteUrl = getSiteUrl(d.id);

  const ext = d.external;
  const parts = await Promise.all(d.files.map(async (file) => ({ file, ...splitFrontMatter(await readDesignFile(d.id, file)) })));
  const tokens = parts[0]?.frontMatter ?? null;
  const variants: DesignVariant[] = parts.map(({ file, body }, i) => {
    const { html, toc } = renderDesign(body, i === 0 ? "" : `${file.replace(/\W+/g, "-").toLowerCase()}-`);
    return { file, label: variantLabel(file), html, toc };
  });
  const sections = variants[0]?.toc.length ?? 0;
  const rawUrl = ext ? ext.file : new URL(designFileHref(d.id), SITE_URL).href;
  const sourceHost = ext && new URL(ext.url).host;

  // The system applied to a tiny hero: shown when there is no screenshot, or it fails to load.
  const sample = (
    <div className="flex min-h-64 flex-col justify-between overflow-hidden rounded-xl border border-border p-6 md:p-8" style={{ backgroundColor: bg, color: fg }}>
      <div className="flex items-center justify-between text-sm opacity-80">
        <span className="font-semibold" style={{ fontFamily: display }}>
          {d.name}
        </span>
        <span className="hidden gap-5 sm:flex" aria-hidden>
          <span>Product</span>
          <span>Pricing</span>
          <span>Docs</span>
        </span>
      </div>
      <div className="my-8">
        <p className="max-w-lg text-3xl font-semibold leading-tight tracking-tight md:text-4xl" style={{ fontFamily: display }}>
          Build with the {d.name} look.
        </p>
        <p className="mt-3 max-w-md text-sm opacity-75">Palette, type and components from this DESIGN.md, applied to a sample hero.</p>
      </div>
      <div className="flex flex-wrap gap-3" aria-hidden>
        <span className="rounded-lg px-4 py-2 text-sm font-semibold" style={{ backgroundColor: accent, color: readableOn(accent) }}>
          Get started
        </span>
        <span className="rounded-lg border px-4 py-2 text-sm font-semibold" style={{ borderColor: fg, opacity: 0.85 }}>
          Learn more
        </span>
      </div>
    </div>
  );

  return (
    <>
      <PageHeader
        title={d.name}
        accent={accent}
        crumbs={[
          { href: "/", label: "Home" },
          { href: "/design-md/", label: "DESIGN.md Library" },
          { href: `/design-md/${collection.id}/`, label: collection.label },
          { label: d.name },
        ]}
        description={d.summary}
        actions={
          <div className="flex flex-wrap gap-2">
            {ext ? (
              <a href={ext.url} target="_blank" rel="noopener" className="inline-flex items-center rounded-lg bg-accent px-3.5 py-2 text-sm font-medium text-surface hover:opacity-90">
                Open on {sourceHost} ↗
              </a>
            ) : (
              <FileActions id={d.id} file="DESIGN.md" primary />
            )}
            <FavoriteButton id={d.id} name={d.name} />
          </div>
        }
      />

      {/* Showcase: the live site when captured, otherwise the system applied to a tiny hero. */}
      <section aria-label={`${d.name} preview`} className={`mb-8 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] ${shot ? "lg:items-start" : ""}`}>
        {shot ? (
          <ShotPreview name={d.name} src={shotHref(d.id, "full", shot.v)} height={shot.h} siteUrl={siteUrl} fallback={sample} />
        ) : (
          sample
        )}

        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-border bg-surface p-4">
            <h2 className="mb-3 text-sm font-semibold">Palette</h2>
            <Palette colors={d.colors} />
          </div>
          <div className="rounded-xl border border-border bg-surface p-4">
            <h2 className="mb-2 text-sm font-semibold">At a glance</h2>
            <dl className="divide-y divide-border text-sm">
              {[
                siteUrl && {
                  label: "Website",
                  value: (
                    <a href={siteUrl} target="_blank" rel="noopener noreferrer nofollow" className="text-accent hover:underline">
                      {new URL(siteUrl).host.replace(/^www\./, "")} ↗
                    </a>
                  ),
                },
                ext && {
                  label: "Source",
                  value: (
                    <a href={ext.url} target="_blank" rel="noopener" className="text-accent hover:underline">
                      {sourceHost} ↗
                    </a>
                  ),
                },
                { label: "Theme", value: <span className="capitalize">{d.theme}</span> },
                { label: "Typefaces", value: d.fonts.length ? d.fonts.join(", ") : "System" },
                !ext && { label: "Sections", value: sections },
                !!d.tags?.length && { label: "Style", value: d.tags.join(", ") },
                { label: "Length", value: `${d.words.toLocaleString("en")} words` },
                d.files.length > 1 && { label: "Platforms", value: d.files.map(variantLabel).join(", ") },
              ]
                .filter((row) => !!row)
                .map((row) => (
                  <div key={row.label} className="flex items-baseline justify-between gap-4 py-2">
                    <dt className="shrink-0 text-muted">{row.label}</dt>
                    <dd className="min-w-0 text-right font-medium text-foreground">{row.value}</dd>
                  </div>
                ))}
            </dl>
          </div>
        </div>
      </section>

      <section className="no-print mb-8 grid grid-cols-1 gap-3 rounded-xl border border-border bg-surface p-4 md:grid-cols-2">
        <div>
          <p className="mb-1.5 text-sm font-medium">Add it to your project</p>
          <Snippet code={`curl -o DESIGN.md ${rawUrl}`} compact />
        </div>
        <div>
          <p className="mb-1.5 text-sm font-medium">Then prompt your agent</p>
          <Snippet code="Follow DESIGN.md for all UI work: colors, type, spacing and components." compact />
        </div>
      </section>

      {!ext && <DesignSystemPanel id={d.id} name={d.name} summary={d.summary} colors={d.colors} fonts={d.fonts} theme={d.theme} href={cdnFetchPath(`design-md/files/${d.id}/DESIGN.md`)} />}

      {ext ? (
        <p className="mb-8 rounded-xl border border-border bg-surface p-4 text-sm text-muted">
          This style is published by {ext.credit}. coderef lists its name, palette and fonts so you can find it here; the
          full DESIGN.md lives on{" "}
          <a href={ext.url} target="_blank" rel="noopener" className="text-accent hover:underline">
            {sourceHost}
          </a>
          .
        </p>
      ) : (
        <DesignDocument id={d.id} variants={variants} tokens={tokens} />
      )}

      <section className="mt-14" aria-labelledby="related">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 id="related" className="text-xl font-semibold">
            More like {d.name}
          </h2>
          <Link href={`/design-md/${collection.id}/`} className="text-sm text-muted hover:text-accent">
            All {collection.label.toLowerCase()} designs →
          </Link>
        </div>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {getRelated(d).map((r) => (
            <li key={r.id}>
              <DesignCard d={toIndexEntry(r)} collectionLabel={collections.find((c) => c.id === r.collection)?.label} />
            </li>
          ))}
        </ul>
      </section>

      <LibraryFootnote />
    </>
  );
}
