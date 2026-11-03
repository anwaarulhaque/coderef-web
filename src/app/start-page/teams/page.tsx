import type { Metadata } from "next";
import Link from "next/link";
import { Cta, ctaPrimary, ctaSecondary, Faq, FeatureGrid, Hero, Section, Split, StartMockup, Steps, SubNav } from "@/components/marketing/Sections";
import { FEATURE_GROUPS, START_TEAM_FAQ } from "@/lib/start-marketing";
import { START_ENTERPRISE_FEATURES, START_TEAM_FEATURES } from "@/lib/start-plans";
import { SUPPORT_EMAIL } from "@/lib/plans";
import { pageMetadata } from "@/lib/seo";
import { START_SUBNAV } from "../nav";

export const metadata: Metadata = pageMetadata({
  title: "CodeRef Start for Teams — shared start pages and a lightweight intranet",
  description: "Give your team one branded start page with every app, link and announcement. Roles, invitations, domain sign-up, analytics. $29/month for 10 members.",
  path: "/start-page/teams/",
});

const group = (id: string) => FEATURE_GROUPS.find((g) => g.id === id)!.features;

export default function StartTeams() {
  return (
    <>
      <SubNav items={START_SUBNAV} current="/start-page/teams/" />
      <Hero
        eyebrow="CodeRef Start for Teams"
        title="Everything your team needs, in one place"
        text="A shared, branded start page with the apps, links, news and people your team uses every day. It opens in every new tab, so nobody hunts for a link again."
        actions={
          <>
            <Link href="/pricing/?product=start" className={ctaPrimary}>
              Start a team: $29 / month
            </Link>
            <a href={`mailto:${SUPPORT_EMAIL}?subject=CodeRef%20Start%20Enterprise`} className={ctaSecondary}>
              Talk to us about Enterprise
            </a>
          </>
        }
        aside={<StartMockup variant="team" />}
      />

      <Section id="team-features" eyebrow="Built for sharing" title="One workspace, the right access for everyone">
        <FeatureGrid features={group("teams")} />
      </Section>

      <Section id="intranet" title="A lightweight intranet people actually open">
        <Split
          title="Company apps and news, front and centre"
          text="Replace the intranet nobody visits with the page everybody sees: the new tab."
          points={["Branded app launcher for HR, IT, finance and your own tools", "Internal and industry news from RSS feeds", "Announcement banner and widget for what matters today", "Team directory with roles and contact links"]}
          visual={<StartMockup variant="team" />}
        />
      </Section>

      <Section id="rollout" eyebrow="Rollout" title="Live for the whole team in an afternoon">
        <Steps
          steps={[
            ["Create the team", "Buy Start Team, name your team and pick its address. A starter team page is ready immediately."],
            ["Invite people", "Invite by email, or allow your company domain so colleagues can join themselves."],
            ["Make it the new tab", "Members install the extension; IT can push it and the team page with Chrome policies."],
          ]}
        />
      </Section>

      <Section id="security" title="Security, privacy and analytics">
        <FeatureGrid features={[...group("security"), ...group("analytics")]} />
      </Section>

      <Section id="plans" title="Team and Enterprise">
        <div className="grid gap-4 md:grid-cols-2">
          {[
            { name: "Start Team", price: "$29 / month", list: START_TEAM_FEATURES, cta: <Link href="/pricing/?product=start" className={ctaPrimary}>Choose Team</Link> },
            { name: "Start Enterprise", price: "Custom", list: START_ENTERPRISE_FEATURES, cta: <a href={`mailto:${SUPPORT_EMAIL}?subject=CodeRef%20Start%20Enterprise`} className={ctaSecondary}>Contact sales</a> },
          ].map((p) => (
            <div key={p.name} className="flex flex-col rounded-2xl border border-border bg-surface p-6">
              <p className="text-lg font-semibold">{p.name}</p>
              <p className="mt-1 text-2xl font-bold">{p.price}</p>
              <ul className="mt-4 flex-1 list-disc space-y-1.5 pl-5 text-sm">
                {p.list.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <div className="mt-6">{p.cta}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section id="faq" title="Team questions">
        <Faq items={START_TEAM_FAQ} />
      </Section>

      <Cta title="Give your team a better first tab" text="Set up a team in minutes. Cancel anytime.">
        <Link href="/pricing/?product=start" className={ctaPrimary}>
          See team pricing
        </Link>
        <Link href="/start-page/solutions/enterprise/" className={ctaSecondary}>
          Enterprise intranet
        </Link>
      </Cta>
    </>
  );
}
