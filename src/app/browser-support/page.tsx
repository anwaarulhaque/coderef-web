import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { FeatureIndex } from "@/components/compat/FeatureIndex";
import { HowToUseGuide } from "@/components/compat/HowToUseGuide";
import { PageHeader, headerButtonPrimary } from "@/components/layout/PageHeader";
import { getFeatureSummaries } from "@/lib/compat";

export const metadata: Metadata = pageMetadata({
  title: "Browser Support",
  description: "Can you use it? Browser support tables, Baseline status and usage examples for 1,200+ web platform features.",
  path: "/browser-support/",
});

export default function BrowserSupportPage() {
  const features = getFeatureSummaries();
  return (
    <>
      <PageHeader
        title="Browser Support"
        crumbs={[{ href: "/", label: "Home" }, { label: "Browser Support" }]}
        description={`Can you use it yet? Support tables for ${features.length.toLocaleString("en")} HTML, CSS, JavaScript and Web API features across Chrome, Edge, Firefox and Safari on desktop and mobile — with Baseline status and examples of how to use each one.`}
        actions={
          <Link href="/browser-support/compare/" className={headerButtonPrimary}>
            Compare browsers →
          </Link>
        }
      />
      <HowToUseGuide />
      <FeatureIndex features={features} />
      <p className="mt-8 text-xs text-muted">
        Data:{" "}
        <a href="https://github.com/web-platform-dx/web-features" className="underline" target="_blank" rel="noopener noreferrer">
          web-features
        </a>{" "}
        (Baseline, W3C WebDX Community Group) and{" "}
        <a href="https://github.com/mdn/browser-compat-data" className="underline" target="_blank" rel="noopener noreferrer">
          MDN browser-compat-data
        </a>
        , updated when the site is built.
      </p>
    </>
  );
}
