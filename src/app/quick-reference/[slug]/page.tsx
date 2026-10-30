import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/quickref/PrintButton";
import { QuickRefView } from "@/components/quickref/QuickRefView";
import { PageHeader, headerButton, headerButtonPrimary } from "@/components/layout/PageHeader";
import { getQuickRef, getQuickRefs } from "@/lib/quickref";

// Only pre-built params exist (static export); anything else renders the 404 page.
export const dynamicParams = false;

export async function generateStaticParams() {
  return (await getQuickRefs()).map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: PageProps<"/quick-reference/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const topic = await getQuickRef(slug);
  if (!topic) return {};
  return pageMetadata({
    title: topic.keys ? `${topic.title} — Windows, Linux & macOS` : `${topic.title} Quick Reference — Copy-Paste Snippets`,
    description: topic.description,
    path: `/quick-reference/${topic.slug}/`,
    type: "article",
  });
}

export default async function QuickRefTopicPage({ params }: PageProps<"/quick-reference/[slug]">) {
  const { slug } = await params;
  const topic = await getQuickRef(slug);
  if (!topic) notFound();
  const rows = topic.sections.reduce((n, s) => n + s.rows.length, 0);

  return (
    <>
      <PageHeader
        title={`${topic.title} Quick Reference`}
        accent={topic.color}
        crumbs={[{ href: "/", label: "Home" }, { href: "/quick-reference/", label: "Quick Reference" }, { label: topic.title }]}
        description={topic.description}
        actions={
          <>
            {topic.try && (
              <Link href={topic.try.href} target={topic.try.href.startsWith("http") ? "_blank" : undefined} className={headerButtonPrimary}>
                {topic.try.label} →
              </Link>
            )}
            {topic.docs && (
              <a href={topic.docs} target="_blank" rel="noopener noreferrer" className={headerButton}>
                Official docs ↗
              </a>
            )}
            <PrintButton />
          </>
        }
      >
        {topic.note && <p className="mt-2 max-w-3xl text-sm text-muted">{topic.note}</p>}
        <p className="mt-2 text-xs text-muted">
          {topic.sections.length} sections · {rows} {topic.keys ? "shortcuts" : "snippets"} · updated{" "}
          {new Date(`${topic.updated}T00:00:00Z`).toLocaleDateString("en", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" })}
        </p>
      </PageHeader>
      <QuickRefView topic={topic} />
    </>
  );
}
