import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { notFound } from "next/navigation";
import { SheetView } from "@/components/SheetView";
import { VisualSheetView } from "@/components/VisualSheetView";
import { PageHeader, headerButton } from "@/components/layout/PageHeader";
import { getAllSheets, getSheet } from "@/lib/sheets";

// Only pre-built params exist (static export); anything else renders the 404 page.
export const dynamicParams = false;

export function generateStaticParams() {
  return getAllSheets().map((sheet) => ({ slug: sheet.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const sheet = getSheet(slug);
  if (!sheet) return {};
  return pageMetadata({
    title: sheet.kind === "links" ? `${sheet.title} — Reference Links & Cheat Sheets` : `${sheet.title} Cheat Sheet`,
    description: sheet.description,
    path: `/${sheet.slug}/`,
    type: "article",
  });
}

export default async function SheetPage({ params }: PageProps<"/[slug]">) {
  const { slug } = await params;
  const sheet = getSheet(slug);
  if (!sheet) notFound();

  return (
    <>
      <PageHeader
        title={sheet.title}
        accent={sheet.color}
        description={sheet.description}
        crumbs={[{ href: "/", label: "Cheat Sheets" }, { label: sheet.category }, { label: sheet.title }]}
        actions={
          sheet.reference && (
            <a href={sheet.reference} target="_blank" rel="noopener noreferrer" className={headerButton}>
              Official reference ↗
            </a>
          )
        }
      />
      {sheet.kind === "visual" ? <VisualSheetView sheet={sheet} /> : <SheetView sheet={sheet} />}
    </>
  );
}
