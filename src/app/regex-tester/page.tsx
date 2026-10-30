import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { PageHeader, headerButton } from "@/components/layout/PageHeader";
import { RegexTester } from "@/components/regex/RegexTester";

export const metadata: Metadata = pageMetadata({
  title: "Regex Tester",
  description: "Build, test and debug JavaScript regular expressions with live match highlighting, explanations, substitution and code generation.",
  path: "/regex-tester/",
});

export default function RegexTesterPage() {
  return (
    <>
      <PageHeader
        title="Regex Tester"
        crumbs={[{ href: "/", label: "Home" }, { label: "Tools" }, { label: "Regex Tester" }]}
        description="Write a pattern, paste some text and see every match, group and explanation update as you type. Everything runs in your browser — the share link carries the whole session."
        actions={
          <Link href="/quick-reference/regex/" className={headerButton}>
            Regex quick reference
          </Link>
        }
      />
      <RegexTester />
    </>
  );
}
