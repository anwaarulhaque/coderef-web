import type { Metadata } from "next";
import Link from "next/link";
import { Cta, ctaPrimary, ctaSecondary, FeatureGrid, Hero, Section, SubNav } from "@/components/marketing/Sections";
import { Gallery } from "@/components/start/Gallery";
import { SUPPORT_EMAIL } from "@/lib/plans";
import { pageMetadata } from "@/lib/seo";
import { START_SUBNAV } from "../nav";

export const metadata: Metadata = pageMetadata({
  title: "Community & template gallery — CodeRef Start",
  description: "Start pages shared by the CodeRef community: developer dashboards, class pages, team intranets and more. Preview any template and copy it in one click.",
  path: "/start-page/community/",
});

const CHANGELOG: [string, string][] = [
  ["November 2026", "CodeRef Start launches: 25 widgets, teams, the template gallery and the Chrome extension with inbox, sessions and address-bar search."],
];

export default function StartCommunity() {
  return (
    <>
      <SubNav items={START_SUBNAV} current="/start-page/community/" />
      <Hero eyebrow="Community" title="Start from someone else's great page" text="Templates published by CodeRef Start users. Preview one, copy it to your account, and make it yours." />
      <section className="mt-8">
        <Gallery />
      </section>
      <Section id="share" title="Share your own">
        <FeatureGrid
          features={[
            { title: "Publish a template", text: "Open a page, press Share, choose a category and publish it to the gallery. You can remove it any time." },
            { title: "Share a link", text: "Make a page public and send the link. Viewers can copy it to their own account." },
            { title: "Keep private things private", text: "Team directories never appear on public pages. Remove personal notes before publishing." },
          ]}
        />
      </Section>
      <Section id="changelog" title="What's new">
        <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
          {CHANGELOG.map(([when, what]) => (
            <li key={when} className="grid gap-1 p-4 sm:grid-cols-[10rem_1fr]">
              <span className="text-sm font-semibold">{when}</span>
              <span className="text-sm text-muted">{what}</span>
            </li>
          ))}
        </ul>
      </Section>
      <Cta title="Ideas or feedback?" text="Tell us which widgets and templates you'd like next.">
        <a href={`mailto:${SUPPORT_EMAIL}?subject=CodeRef%20Start%20feedback`} className={ctaPrimary}>
          Send feedback
        </a>
        <Link href="/start/" className={ctaSecondary}>
          Open CodeRef Start
        </Link>
      </Cta>
    </>
  );
}
