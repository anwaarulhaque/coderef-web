import type { Metadata } from "next";
import Link from "next/link";
import { Cta, ctaPrimary, ctaSecondary, Faq, FeatureGrid, Hero, Section, Split, StartMockup, Steps, SubNav, WidgetGrid } from "@/components/marketing/Sections";
import { StartPricingTeaser } from "@/components/marketing/StartPricingTeaser";
import { START_FAQ } from "@/lib/start-marketing";
import { START_WIDGETS } from "@/lib/start-plans";
import { jsonLd, pageMetadata, SITE_URL } from "@/lib/seo";
import { START_SUBNAV } from "./nav";

export const metadata: Metadata = pageMetadata({
  title: "CodeRef Start — your personal start page and new tab",
  description: "Bookmarks, RSS feeds, notes, to-dos, weather and 25 widgets on one start page that opens in every new tab. Free for 3 pages; PRO is $24 a year; teams $29 a month.",
  path: "/start-page/",
});

const LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "CodeRef Start",
  applicationCategory: "ProductivityApplication",
  operatingSystem: "Web, Chrome, Edge, Brave",
  url: `${SITE_URL}/start-page/`,
  offers: [
    { "@type": "Offer", name: "Free", price: "0", priceCurrency: "USD" },
    { "@type": "Offer", name: "Start PRO", price: "24", priceCurrency: "USD" },
    { "@type": "Offer", name: "Start Team", price: "29", priceCurrency: "USD" },
  ],
};

export default function StartOverview() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(LD)} />
      <SubNav items={START_SUBNAV} current="/start-page/" />
      <Hero
        eyebrow="CodeRef Start · New"
        title={
          <>
            Your whole web, <span className="text-accent">one start page.</span>
          </>
        }
        text="Bookmarks, news, notes, to-dos, calendars and the tools you use every day, on a page that opens in every new tab. Personal, or shared with your whole team."
        actions={
          <>
            <Link href="/start/" className={ctaPrimary}>
              Start free
            </Link>
            <Link href="/start-page/extension/" className={ctaSecondary}>
              Get the Chrome extension
            </Link>
          </>
        }
        aside={<StartMockup />}
      />
      <p className="mt-6 text-sm text-muted">Free for up to 3 pages · No credit card · Imports your browser and start.me bookmarks</p>

      <Section id="why" eyebrow="Why a start page" title="Stop hunting for tabs and links" intro="Your start page is the first thing you see, so the things you need are always one click away.">
        <FeatureGrid
          features={[
            { title: "Everything in one place", text: "Links, feeds, notes and tools side by side, instead of scattered across bookmarks bars and chats." },
            { title: "In every new tab", text: "The extension shows your page each time you open a tab, instantly, even offline." },
            { title: "Save as you browse", text: "Save the current tab, every tab or a right-clicked link to any list in one click." },
            { title: "Pages for every context", text: "Work, home, research, a client: switch with a click or the number keys." },
            { title: "Share it", text: "Send a link, publish a template, or give your team a shared, branded page." },
            { title: "Made for developers too", text: "CodeRef cheat sheets, GitHub activity and dev news are built in." },
          ]}
        />
      </Section>

      <Section id="widgets" eyebrow={`${START_WIDGETS.length} widgets`} title="Much more than bookmarks" intro="Mix and match widgets on each page. Free covers the essentials; PRO and Team add the rest.">
        <WidgetGrid widgets={START_WIDGETS.slice(0, 12)} />
        <p className="mt-4 text-sm">
          <Link href="/start-page/features/#widgets" className="font-semibold text-accent">
            See all {START_WIDGETS.length} widgets →
          </Link>
        </p>
      </Section>

      <Section id="personal-teams" title="For you, and for your team">
        <Split
          title="Personal start pages"
          text="Build pages your way, then let the new tab do the work."
          points={["Drag-and-drop layout with 1–5 columns", "Themes, photos and animated backgrounds", "Inbox for links saved from the extension", "Import and export anytime"]}
          visual={<StartMockup />}
        />
        <Split
          flip
          title="Team start pages"
          text="Give everyone the same apps, links and news, with your branding."
          points={["A shared workspace at /start/t/your-team", "Owner, admin, editor and viewer roles", "Announcements, directory and company-apps widgets", "Link analytics without tracking people"]}
          visual={<StartMockup variant="team" />}
        />
        <p className="text-sm">
          <Link href="/start-page/teams/" className="font-semibold text-accent">
            CodeRef Start for teams →
          </Link>
        </p>
      </Section>

      <Section id="how" eyebrow="Get started in a minute" title="Three steps to a better new tab">
        <Steps
          steps={[
            ["Sign up free", "Sign in with your email. You'll get a ready-made first page to customise."],
            ["Import your bookmarks", "One click in the extension, or upload a file from any browser or start.me."],
            ["Make it your new tab", "Install the extension, connect it, and every new tab opens your page."],
          ]}
        />
      </Section>

      <Section id="pricing" eyebrow="Pricing" title="Simple plans">
        <StartPricingTeaser />
      </Section>

      <Section id="faq" title="Questions">
        <Faq items={START_FAQ} />
      </Section>

      <Cta title="Make every new tab useful" text="Create your start page in under a minute. It's free for up to 3 pages.">
        <Link href="/start/" className={ctaPrimary}>
          Create my start page
        </Link>
        <Link href="/start-page/community/" className={ctaSecondary}>
          Browse templates
        </Link>
      </Cta>
    </>
  );
}
