import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DesignBrowser } from "@/components/designmd/DesignBrowser";
import { LibraryFootnote } from "@/components/designmd/LibraryFootnote";
import { PageHeader } from "@/components/layout/PageHeader";
import { getCollection, getCollections, getDesigns, toIndexEntry } from "@/lib/design-md";
import { pageMetadata } from "@/lib/seo";

// Only pre-built params exist (static export); anything else renders the 404 page.
export const dynamicParams = false;

export function generateStaticParams() {
  return getCollections().map((c) => ({ collection: c.id }));
}

export async function generateMetadata({ params }: PageProps<"/design-md/[collection]">): Promise<Metadata> {
  const { collection } = await params;
  const c = getCollection(collection);
  if (!c) return {};
  return pageMetadata({
    title: `${c.label} DESIGN.md Design Systems (${c.count})`,
    description: `${c.description} ${c.count} DESIGN.md files for AI coding agents — search by color, theme and font, then copy one into your project.`,
    path: `/design-md/${c.id}/`,
  });
}

export default async function DesignCollectionPage({ params }: PageProps<"/design-md/[collection]">) {
  const { collection } = await params;
  const c = getCollection(collection);
  if (!c) notFound();
  const items = getDesigns()
    .filter((d) => d.collection === c.id)
    .map(toIndexEntry);

  return (
    <>
      <PageHeader
        title={`${c.label} design systems`}
        crumbs={[{ href: "/", label: "Home" }, { href: "/design-md/", label: "DESIGN.md Library" }, { label: c.label }]}
        description={`${c.description} ${c.count} DESIGN.md files, ready to drop into your project.`}
      />
      <DesignBrowser collections={getCollections()} items={items} fixedCollection={c.id} />
      <LibraryFootnote />
    </>
  );
}
