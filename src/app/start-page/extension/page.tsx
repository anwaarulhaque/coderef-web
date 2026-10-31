import type { Metadata } from "next";
import Link from "next/link";
import { Cta, ctaPrimary, ctaSecondary, Faq, FeatureGrid, Hero, Section, StartMockup, Steps, SubNav } from "@/components/marketing/Sections";
import { FEATURE_GROUPS } from "@/lib/start-marketing";
import { jsonLd, pageMetadata, SITE_URL } from "@/lib/seo";
import { START_SUBNAV } from "../nav";

export const metadata: Metadata = pageMetadata({
  title: "New Tab Start Page Extension for Chrome, Edge & Brave",
  description:
    "Free Chrome new tab extension: your bookmarks, feeds, to-dos and weather in every new tab, plus AI search, a live sky background and one-click tab saving.",
  path: "/start-page/extension/",
});

/** Set NEXT_PUBLIC_START_EXTENSION_URL to the Chrome Web Store listing once it's published. */
const STORE_URL = process.env.NEXT_PUBLIC_START_EXTENSION_URL ?? "";

const PERMISSIONS: [string, string][] = [
  ["Replace the new tab page", "To show your start page when you open a tab."],
  ["Read your bookmarks", "Only when you press Import, to turn them into a page."],
  ["Read open tabs", "Only to save the current tab or all tabs when you ask."],
  ["Read your most visited sites", "To show them as shortcuts under the new tab's search bar. The list stays in your browser."],
  ["Context menus and notifications", "For “Save to CodeRef Start” and the “Saved” confirmation."],
  ["Storage and alarms", "To cache your page for an instant new tab and refresh it every few minutes."],
  ["coderef.xyz", "The only site it talks to. Your token never goes anywhere else."],
];

const FEATURES = FEATURE_GROUPS.find((g) => g.id === "newtab")!.features;

const FAQ: [string, string][] = [
  ["Is the CodeRef Start extension free?", "Yes. The extension and up to 3 start pages are free. Start PRO ($24 a year) adds unlimited pages and every widget; teams are $29 a month."],
  ["Which browsers does it work in?", "Chrome, Microsoft Edge, Brave, Opera, Vivaldi and other Chromium browsers. In Firefox and Safari, set coderef.xyz/start as your home page instead."],
  ["Can I search with ChatGPT, Claude or another AI from the new tab?", "Yes. The search bar's menu has Google, DuckDuckGo and CodeRef plus ChatGPT, Claude, Perplexity, Google AI Mode, Copilot, Grok and more, and you can add any AI or search site whose address takes your question."],
  ["Does the new tab work offline?", "Yes. The extension keeps a copy of your page, so bookmarks, notes, to-dos and the clock appear instantly even without a connection; feeds and weather show their last copy."],
  ["Can I import my bookmarks or my start.me page?", "Yes. Import your Chrome bookmarks from the extension in one click, or upload a bookmarks HTML or start.me export on coderef.xyz/start."],
  ["What data does the extension read?", "Only what a feature needs: the current tab when you save it, your bookmarks when you import them, and your most visited sites for the shortcuts row, which stays in your browser. It talks only to coderef.xyz."],
  ["How do I get Chrome's normal new tab back?", "Turn the extension off or remove it at chrome://extensions, or switch it to open the full web app in its settings."],
];

const BREADCRUMB_LD = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "CodeRef Start", item: `${SITE_URL}/start-page/` },
    { "@type": "ListItem", position: 2, name: "Browser extension", item: `${SITE_URL}/start-page/extension/` },
  ],
};

const APP_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "CodeRef Start for Chrome",
  applicationCategory: "BrowserApplication",
  operatingSystem: "Chrome, Microsoft Edge, Brave",
  url: `${SITE_URL}/start-page/extension/`,
  ...(STORE_URL ? { downloadUrl: STORE_URL, installUrl: STORE_URL } : {}),
  description: "A new tab start page with bookmarks, feeds, to-dos, AI search, a live sky background and one-click saving of pages and tabs.",
  featureList: FEATURES.map((f) => f.title),
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  publisher: { "@type": "Organization", name: "coderef", url: `${SITE_URL}/` },
};

const FAQ_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
};

export default function StartExtension() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(APP_LD)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(FAQ_LD)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(BREADCRUMB_LD)} />
      <SubNav items={START_SUBNAV} current="/start-page/extension/" />
      <Hero
        eyebrow="Browser extension"
        title="Your start page in every new tab"
        text="The free CodeRef Start extension for Chrome, Edge and Brave opens your bookmarks, feeds and to-dos in every new tab, instantly. Search or ask AI from the same box, and save anything you find in one click."
        actions={
          <>
            {STORE_URL ? (
              <a href={STORE_URL} className={ctaPrimary} target="_blank" rel="noopener noreferrer">
                Add to Chrome, it&apos;s free
              </a>
            ) : (
              <span className={`${ctaPrimary} cursor-default opacity-80`}>Chrome Web Store listing coming soon</span>
            )}
            <Link href="/start/connect/" className={ctaSecondary}>
              Connect an installed extension
            </Link>
          </>
        }
        aside={<StartMockup />}
      />
      <Section id="what" title="What it does">
        <FeatureGrid features={FEATURES} cols={4} />
      </Section>
      <Section id="setup" title="Set up in three steps">
        <Steps
          steps={[
            ["Install", "Add CodeRef Start to Chrome, Edge or Brave."],
            ["Connect", "Click the toolbar icon → Connect. Sign in and press Connect this browser."],
            ["Pick your page", "Choose which page opens in new tabs, then import your bookmarks."],
          ]}
        />
      </Section>
      <Section id="permissions" title="Permissions, explained" intro="The extension asks only for what its features need.">
        <dl className="divide-y divide-border rounded-2xl border border-border bg-surface">
          {PERMISSIONS.map(([p, why]) => (
            <div key={p} className="grid gap-1 p-4 sm:grid-cols-[16rem_1fr]">
              <dt className="font-medium">{p}</dt>
              <dd className="text-sm text-muted">{why}</dd>
            </div>
          ))}
        </dl>
      </Section>
      <Section id="other-browsers" title="Firefox and Safari">
        <p className="max-w-2xl text-muted">
          These browsers don&apos;t allow an extension to replace the new tab in the same way. Set <code className="rounded bg-chip px-1">https://coderef.xyz/start/</code> as your home page instead; it opens your last page.
        </p>
      </Section>
      <Section id="faq" title="Questions">
        <Faq items={FAQ} />
      </Section>
      <Cta title="Don't have a start page yet?" text="Create one free, then connect the extension.">
        <Link href="/start/" className={ctaPrimary}>
          Create my start page
        </Link>
      </Cta>
    </>
  );
}
