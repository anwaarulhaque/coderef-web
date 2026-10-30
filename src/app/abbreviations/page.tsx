import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { EmmetGuide } from "@/components/emmet/EmmetGuide";
import { EmmetTool } from "@/components/emmet/EmmetTool";
import { PageHeader } from "@/components/layout/PageHeader";
import { getEmmetIndex } from "@/lib/emmet-index";

export const metadata: Metadata = pageMetadata({
  title: "HTML & CSS Abbreviations",
  description: "Write HTML and CSS faster with abbreviations: a live playground, every built-in abbreviation with its expansion, and the syntax.",
  path: "/abbreviations/",
});

export default function AbbreviationsPage() {
  const entries = getEmmetIndex();
  return (
    <>
      <PageHeader
        title="HTML & CSS Abbreviations"
        crumbs={[{ href: "/", label: "Home" }, { label: "Tools" }, { label: "HTML & CSS Abbreviations" }]}
        description={`Write HTML and CSS at the speed of thought: type a short abbreviation, get full markup. Try abbreviations live below and browse all ${entries.length} built-in abbreviations with their real expansions.`}
      />
      <EmmetGuide />
      <EmmetTool entries={entries} />
      <p className="mt-8 text-xs text-muted">
        Expansions are produced by the official{" "}
        <a href="https://github.com/emmetio/emmet" target="_blank" rel="noopener noreferrer" className="underline">
          emmet
        </a>{" "}
        engine (MIT), the same one used by VS Code.
      </p>
    </>
  );
}
