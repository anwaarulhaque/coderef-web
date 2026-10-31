import type { Metadata } from "next";
import Link from "next/link";
import { Cta, ctaPrimary, ctaSecondary, FeatureGrid, Hero, Section, SubNav, WidgetGrid } from "@/components/marketing/Sections";
import { FEATURE_GROUPS } from "@/lib/start-marketing";
import { START_WIDGETS } from "@/lib/start-plans";
import { pageMetadata } from "@/lib/seo";
import { START_SUBNAV } from "../nav";

export const metadata: Metadata = pageMetadata({
  title: "Features — CodeRef Start",
  description: `Every CodeRef Start feature: ${START_WIDGETS.length} widgets, the new-tab extension, inbox, themes, sharing, templates, import/export, teams, security and analytics.`,
  path: "/start-page/features/",
});

export default function StartFeatures() {
  return (
    <>
      <SubNav items={START_SUBNAV} current="/start-page/features/" />
      <Hero
        eyebrow="Features"
        title="Everything a start page should do"
        text="Pages, widgets, a new-tab extension, sharing and team tools, without the clutter. Items marked PRO, Team or Enterprise are part of those plans."
        actions={
          <Link href="/start/" className={ctaPrimary}>
            Try it free
          </Link>
        }
      />
      <nav aria-label="Feature groups" className="mt-6 flex flex-wrap gap-2">
        {FEATURE_GROUPS.map((g) => (
          <a key={g.id} href={`#${g.id}`} className="rounded-full border border-border bg-surface px-3 py-1 text-sm hover:border-accent hover:text-accent">
            {g.title}
          </a>
        ))}
      </nav>
      {FEATURE_GROUPS.map((g) => (
        <Section key={g.id} id={g.id} title={g.title} intro={g.intro}>
          {g.id === "widgets" ? <WidgetGrid /> : <FeatureGrid features={g.features} />}
        </Section>
      ))}
      <Cta title="Try every feature" text="Start free. Upgrade to PRO for $24 a year when you want unlimited pages and every widget.">
        <Link href="/start/" className={ctaPrimary}>
          Create my start page
        </Link>
        <Link href="/pricing/?product=start" className={ctaSecondary}>
          Compare plans
        </Link>
      </Cta>
    </>
  );
}
