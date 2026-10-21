import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { PageHeader, headerButton } from "@/components/layout/PageHeader";
import { GitPlayground } from "@/components/git/GitPlayground";

export const metadata: Metadata = pageMetadata({
  title: "Git Branching",
  description: "Learn Git branching visually: run real git commands and watch an animated commit graph, with guided levels and a sandbox.",
  path: "/git-branching/",
});

export default function GitBranchingPage() {
  return (
    <>
      <PageHeader
        title="Git Branching"
        crumbs={[{ href: "/", label: "Home" }, { label: "Learn" }, { label: "Git Branching" }]}
        description="Learn Git by watching it work. Type real commands — commit, branch, merge, rebase, cherry-pick — and see the commit graph animate. Work through the levels, or experiment in the sandbox."
        actions={
          <Link href="/quick-reference/git/" className={headerButton}>
            Git quick reference
          </Link>
        }
      />
      <GitPlayground />
    </>
  );
}
