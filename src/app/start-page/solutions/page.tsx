import type { Metadata } from "next";
import Link from "next/link";
import { Cta, ctaPrimary, Hero, SubNav } from "@/components/marketing/Sections";
import { START_SOLUTIONS } from "@/lib/start-marketing";
import { pageMetadata } from "@/lib/seo";
import { START_SUBNAV } from "../nav";

export const metadata: Metadata = pageMetadata({
  title: "Solutions — CodeRef Start for education, enterprise, developers, agencies and remote teams",
  description: "How schools, companies, developers, agencies and remote teams use CodeRef Start as a start page and lightweight intranet.",
  path: "/start-page/solutions/",
});

export default function StartSolutions() {
  return (
    <>
      <SubNav items={START_SUBNAV} current="/start-page/solutions/" />
      <Hero eyebrow="Solutions" title="One start page, many ways to use it" text="From a class page to a company intranet: see how teams like yours use CodeRef Start." />
      <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {START_SOLUTIONS.map((s) => (
          <Link key={s.slug} href={`/start-page/solutions/${s.slug}/`} className="group rounded-2xl border border-border bg-surface p-6 hover:border-accent">
            <p className="text-xs font-bold tracking-widest text-accent uppercase">{s.title}</p>
            <h2 className="mt-2 text-lg font-semibold group-hover:text-accent">{s.tagline}</h2>
            <p className="mt-2 text-sm text-muted">{s.intro}</p>
            <p className="mt-4 text-sm font-semibold text-accent">Learn more →</p>
          </Link>
        ))}
      </div>
      <Cta title="Not sure where to start?" text="Browse community templates, or start from a blank page.">
        <Link href="/start-page/community/" className={ctaPrimary}>
          Browse templates
        </Link>
      </Cta>
    </>
  );
}
