import type { Metadata } from "next";
import Link from "next/link";
import { Cta, ctaPrimary, ctaSecondary, FeatureGrid, Hero, Section, StartMockup, Steps, SubNav } from "@/components/marketing/Sections";
import { FEATURE_GROUPS } from "@/lib/start-marketing";
import { pageMetadata } from "@/lib/seo";
import { START_SUBNAV } from "../nav";

export const metadata: Metadata = pageMetadata({
  title: "CodeRef Start new tab extension for Chrome, Edge and Brave",
  description: "Open your CodeRef start page in every new tab. Save pages and all tabs, right-click to save links, import bookmarks, search them from the address bar.",
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

export default function StartExtension() {
  return (
    <>
      <SubNav items={START_SUBNAV} current="/start-page/extension/" />
      <Hero
        eyebrow="Browser extension"
        title="Your start page in every new tab"
        text="The CodeRef Start extension for Chrome, Edge and Brave opens your page in every new tab, instantly, and saves anything you find in one click."
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
        <FeatureGrid features={FEATURE_GROUPS.find((g) => g.id === "newtab")!.features} cols={4} />
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
      <Cta title="Don't have a start page yet?" text="Create one free, then connect the extension.">
        <Link href="/start/" className={ctaPrimary}>
          Create my start page
        </Link>
      </Cta>
    </>
  );
}
