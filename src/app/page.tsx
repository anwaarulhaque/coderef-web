import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { SheetBrowser } from "@/components/SheetBrowser";
import { getFeatureSummaries } from "@/lib/compat";
import { getEmmetIndex } from "@/lib/emmet-index";
import { getQuickRefSearchRows } from "@/lib/quickref";
import { getSheetSummaries } from "@/lib/sheets";
import Link from "next/link";
import { PageHeader, headerButton, headerButtonPrimary } from "@/components/layout/PageHeader";
import { ToolsBanner } from "@/components/home/ToolsBanner";
import type { SheetSummary } from "@/lib/types";

export const metadata: Metadata = pageMetadata({
  title: "coderef — Developer Cheat Sheets & Quick Reference",
  description:
    "Free developer cheat sheets for 300 languages and tools, copy-paste quick references, browser support tables and interactive tools — every entry linked to the official docs.",
  path: "/",
});

export default function Home() {
  // Interactive tools have their own routes but are listed alongside the sheets.
  const tools: SheetSummary[] = [
    {
      slug: "colors",
      title: "Realtime Colors Studio",
      category: "Tools",
      description: "Live color palette generator, WCAG contrast checker, and instant UI previewer on authentic templates.",
      color: "#433bff",
      itemCount: 0,
    },
    {
      slug: "abbreviations",
      title: "HTML & CSS Abbreviations",
      category: "Tools",
      description: "Type ul>li*3 or d:f and get full HTML/CSS — live playground plus every built-in abbreviation.",
      color: "#78b13f",
      itemCount: getEmmetIndex().length,
    },
    {
      slug: "json-formatter",
      title: "JSON Formatter",
      category: "Tools",
      description: "Format, validate, repair, minify, convert (YAML/XML/CSV/TypeScript), compare and query JSON.",
      color: "#f59e0b",
      itemCount: 0,
    },
    {
      slug: "quick-reference",
      title: "Quick Reference",
      category: "Tools",
      description: "Copy-paste snippets by task for 24 languages and tools, including VS Code shortcuts — searchable across all.",
      color: "#0ea5e9",
      itemCount: getQuickRefSearchRows().length,
    },
    {
      slug: "markdown",
      title: "Markdown",
      category: "Tools",
      description: "Markdown editor with live preview and export, plus a cheat sheet of basic and extended syntax.",
      color: "#083fa1",
      itemCount: 0,
    },
    {
      slug: "regex-tester",
      title: "Regex Tester",
      category: "Tools",
      description: "Test JavaScript regular expressions with live highlighting, explanations and code generation.",
      color: "#8b5cf6",
      itemCount: 0,
    },
    {
      slug: "git-branching",
      title: "Git Branching",
      category: "Tools",
      description: "Learn Git visually: run commands and watch an animated commit graph, with guided levels.",
      color: "#f05032",
      itemCount: 0,
    },
    {
      slug: "browser-support",
      title: "Browser Support",
      category: "Web",
      description: "Can you use it? Support tables, Baseline status and usage examples for web platform features.",
      color: "#0ea5e9",
      itemCount: getFeatureSummaries().length,
    },
  ];
  const sheets = [...getSheetSummaries(), ...tools].sort((a, b) => a.title.localeCompare(b.title));

  return (
    <>
      <PageHeader
        title="Developer cheat sheets"
        description="Every method, function and command on one page, each linked to its official documentation — plus quick references, visual guides and interactive tools."
        actions={
          <>
            <Link href="/quick-reference/" className={headerButtonPrimary}>
              Quick Reference
            </Link>
            <Link href="/#directory" className={headerButton}>
              A–Z directory
            </Link>
          </>
        }
      />
      <ToolsBanner />
      <SheetBrowser sheets={sheets} />
    </>
  );
}
