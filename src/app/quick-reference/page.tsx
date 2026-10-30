import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { QuickRefIndex } from "@/components/quickref/QuickRefIndex";
import { PageHeader } from "@/components/layout/PageHeader";
import { getQuickRefSearchRows, getQuickRefSummaries } from "@/lib/quickref";

export const metadata: Metadata = pageMetadata({
  title: "Quick Reference",
  description: "Copy-paste quick references for Python, JavaScript, SQL, Git, Linux, VS Code shortcuts and more — organised by what you want to do.",
  path: "/quick-reference/",
});

export default async function QuickReferencePage() {
  const [topics, rows] = await Promise.all([getQuickRefSummaries(), getQuickRefSearchRows()]);
  return (
    <>
      <PageHeader
        title="Quick Reference"
        crumbs={[{ href: "/", label: "Home" }, { label: "Quick Reference" }]}
        description={`Look up what you want to do, copy the code. ${topics.length} languages and tools, organised by task — search across all of them at once, or open a topic to browse.`}
      />
      <QuickRefIndex topics={topics} rows={rows} />
    </>
  );
}
