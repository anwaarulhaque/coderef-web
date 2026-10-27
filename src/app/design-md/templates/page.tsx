import type { Metadata } from "next";
import Link from "next/link";
import { LibraryFootnote } from "@/components/designmd/LibraryFootnote";
import { CopyTextButton, DownloadTextButton } from "@/components/designmd/Palette";
import { PageHeader, headerButton, headerButtonPrimary } from "@/components/layout/PageHeader";
import { getDesigns, getTemplates } from "@/lib/design-md";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "DESIGN.md Templates — Blank Design System Files for AI Agents",
  description: "Blank DESIGN.md templates in every structure used by 1,000+ real design systems. Copy one, fill in your brand, and give your AI coding agent a design system to follow.",
  path: "/design-md/templates/",
});

// What each structure is good for, keyed by its most telling section.
function purposeOf(sections: string[]): string {
  const has = (s: string) => sections.some((x) => x.toLowerCase().includes(s));
  if (has("ascii") || has("box drawing")) return "Terminal and command-line apps.";
  if (has("governance") || has("voice")) return "Company design systems, including motion, voice and governance.";
  if (has("known gaps") || has("iteration")) return "Compact and practical, with an iteration guide and known gaps.";
  if (has("agent prompt")) return "The classic structure: atmosphere, palette roles, components and an agent prompt guide.";
  return "A minimal token-first structure.";
}

export default function DesignTemplatesPage() {
  const templates = getTemplates();
  const total = getDesigns().length;
  return (
    <>
      <PageHeader
        title="DESIGN.md Templates"
        crumbs={[{ href: "/", label: "Home" }, { href: "/design-md/", label: "DESIGN.md Library" }, { label: "Templates" }]}
        description={`${templates.length} blank templates, one for each structure used across the ${total.toLocaleString("en")} design systems in the library. Pick the one that fits, replace the {{placeholders}}, and save it as DESIGN.md in your project root.`}
        actions={
          <Link href="/design-md/" className={headerButton}>
            Browse finished designs
          </Link>
        }
      />

      <div className="space-y-6">
        {templates.map((t, i) => (
          <section key={t.id} id={t.id} className="scroll-mt-20 rounded-xl border border-border bg-surface">
            <div className="flex flex-col gap-4 border-b border-border p-5 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold">
                  Template {String.fromCharCode(65 + i)} <span className="font-normal text-muted">· {t.sections.length} sections · based on {t.count.toLocaleString("en")} designs</span>
                </h2>
                <p className="mt-1 text-sm text-muted">{purposeOf(t.sections)}</p>
                <ol className="mt-3 flex flex-wrap gap-1.5 text-xs">
                  {t.sections.map((s, n) => (
                    <li key={s} className="rounded-full bg-chip px-2.5 py-1">
                      {n + 1}. {s}
                    </li>
                  ))}
                </ol>
              </div>
              <div className="flex shrink-0 gap-2">
                <CopyTextButton text={t.markdown} label="Copy" className={headerButtonPrimary} />
                <DownloadTextButton text={t.markdown} filename="DESIGN.md" label="Download" className={headerButton} />
              </div>
            </div>
            <details>
              <summary className="cursor-pointer px-5 py-3 text-sm text-muted hover:text-foreground">Preview the template</summary>
              <pre className="max-h-[32rem] overflow-auto border-t border-border px-5 py-4 font-mono text-[12.5px] leading-5">{t.markdown}</pre>
            </details>
          </section>
        ))}
      </div>

      <LibraryFootnote />
    </>
  );
}
