import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { getLicensesMarkdown, renderDesign } from "@/lib/design-md";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "DESIGN.md Library — Licenses",
    description: "Open-source licenses for the DESIGN.md library.",
    path: "/design-md/licenses/",
  }),
  robots: { index: false },
};

export default function DesignLicensesPage() {
  const { html } = renderDesign(getLicensesMarkdown().replace(/^# .*\n/, ""));
  return (
    <>
      <PageHeader title="Licenses" crumbs={[{ href: "/", label: "Home" }, { href: "/design-md/", label: "DESIGN.md Library" }, { label: "Licenses" }]} />
      <article className="md-preview rounded-xl border border-border bg-surface p-5 text-sm md:p-8" dangerouslySetInnerHTML={{ __html: html }} />
    </>
  );
}
