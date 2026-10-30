import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { BrowserCompare } from "@/components/compat/BrowserCompare";
import { PageHeader } from "@/components/layout/PageHeader";
import { getFeatureSummaries, getReleases } from "@/lib/compat";

export const metadata: Metadata = pageMetadata({
  title: "Compare browsers",
  description: "Compare web platform feature support between any two browsers or browser versions.",
  path: "/browser-support/compare/",
});

export default function ComparePage() {
  return (
    <>
      <PageHeader
        title="Compare browsers"
        crumbs={[{ href: "/", label: "Home" }, { href: "/browser-support/", label: "Browser Support" }, { label: "Compare" }]}
        description="Pick two browsers — or two versions of the same browser — to see which features one supports and the other doesn’t. Comparing a browser with an older version of itself shows everything it added in between."
      />
      <BrowserCompare features={getFeatureSummaries()} releases={getReleases()} />
    </>
  );
}
