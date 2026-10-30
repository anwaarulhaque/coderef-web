import type { Metadata } from "next";
import Link from "next/link";
import { BackgroundGallery } from "@/components/backgrounds/BackgroundGallery";
import { PageHeader, headerButton } from "@/components/layout/PageHeader";
import { BACKGROUNDS } from "@/lib/backgrounds";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Animated Backgrounds — Copy-Paste Hero Effects",
  description: `${BACKGROUNDS.length} original animated backgrounds for your hero, footer or any section. Pick colors and speed, preview live, then copy plain HTML + JS or a ready prompt for Claude Code, Cursor or Codex.`,
  path: "/backgrounds/",
});

export default function BackgroundsPage() {
  return (
    <>
      <PageHeader
        title="Animated Backgrounds"
        crumbs={[{ href: "/", label: "Home" }, { href: "/design-md/", label: "Design Systems" }, { label: "Animated Backgrounds" }]}
        description="Put one behind your hero, your footer or any section. Pick an effect, set its colors and speed, then copy the code — or a prompt that tells your AI coding assistant where it goes."
        actions={
          <Link href="/design-md/" className={headerButton}>
            Match a brand&apos;s colors →
          </Link>
        }
      >
        <ul className="mt-4 flex flex-wrap gap-2 text-xs text-muted">
          {["No dependencies", "Plain HTML + JS", "Respects reduced motion", "Pauses off screen", "Free"].map((f) => (
            <li key={f} className="rounded-full border border-border bg-surface px-2.5 py-1">
              {f}
            </li>
          ))}
        </ul>
      </PageHeader>

      <BackgroundGallery />

      <section className="mt-12 grid grid-cols-1 gap-6 rounded-xl border border-border bg-surface p-6 md:grid-cols-3">
        <div>
          <h2 className="font-semibold">1. Place it</h2>
          <p className="mt-1 text-sm text-muted">Paste the snippet inside the section and give the section <code className="font-mono">position: relative</code>. The background fills it and sits behind.</p>
        </div>
        <div>
          <h2 className="font-semibold">2. Keep content on top</h2>
          <p className="mt-1 text-sm text-muted">Give your content <code className="font-mono">position: relative; z-index: 1</code>. Check text contrast on the brightest part of the effect.</p>
        </div>
        <div>
          <h2 className="font-semibold">3. Or let your agent do it</h2>
          <p className="mt-1 text-sm text-muted">Use &ldquo;Copy prompt for your AI agent&rdquo; and paste it into Claude Code, Cursor or Codex — it includes the code and where it goes.</p>
        </div>
      </section>
    </>
  );
}
