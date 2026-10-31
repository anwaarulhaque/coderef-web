import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Cta, ctaPrimary, ctaSecondary, FeatureGrid, Hero, Section, StartMockup, SubNav, WidgetGrid } from "@/components/marketing/Sections";
import { START_SOLUTIONS } from "@/lib/start-marketing";
import { START_WIDGETS } from "@/lib/start-plans";
import { pageMetadata } from "@/lib/seo";
import { START_SUBNAV } from "../../nav";

export const dynamicParams = false;

export function generateStaticParams() {
  return START_SOLUTIONS.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: PageProps<"/start-page/solutions/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const s = START_SOLUTIONS.find((x) => x.slug === slug);
  if (!s) return {};
  return pageMetadata({ title: `CodeRef Start for ${s.title} — ${s.tagline}`, description: s.intro, path: `/start-page/solutions/${s.slug}/` });
}

export default async function SolutionPage({ params }: PageProps<"/start-page/solutions/[slug]">) {
  const { slug } = await params;
  const s = START_SOLUTIONS.find((x) => x.slug === slug);
  if (!s) notFound();
  const team = s.slug !== "developers";
  return (
    <>
      <SubNav items={START_SUBNAV} current="/start-page/solutions/" />
      <p className="text-sm text-muted">
        <Link href="/start-page/solutions/" className="hover:text-foreground">
          Solutions
        </Link>{" "}
        / {s.title}
      </p>
      <Hero
        eyebrow={`CodeRef Start for ${s.title}`}
        title={s.tagline}
        text={s.intro}
        actions={
          <>
            <Link href={team ? "/start-page/teams/" : "/start/"} className={ctaPrimary}>
              {team ? "See team features" : "Start free"}
            </Link>
            <Link href="/pricing/?product=start" className={ctaSecondary}>
              Pricing
            </Link>
          </>
        }
        aside={<StartMockup variant={team ? "team" : "personal"} />}
      />
      <Section id="how" title={`How ${s.title.toLowerCase()} use it`}>
        <FeatureGrid features={s.points} cols={2} />
      </Section>
      <Section id="widgets" title="Widgets that fit">
        <WidgetGrid widgets={START_WIDGETS.filter((w) => s.widgets.includes(w.type))} />
      </Section>
      <Cta title={`Try CodeRef Start for ${s.title.toLowerCase()}`} text="Free for up to 3 pages. Teams from $29 a month.">
        <Link href="/start/" className={ctaPrimary}>
          Create a start page
        </Link>
        <Link href="/start-page/community/" className={ctaSecondary}>
          Browse templates
        </Link>
      </Cta>
    </>
  );
}
