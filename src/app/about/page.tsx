import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/layout/LegalPage";
import { SUPPORT_EMAIL } from "@/lib/plans";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({ title: "About CodeRef", description: "What CodeRef is, who makes it, what is free and what CodeRef Pro adds.", path: "/about/" });

export default function Page() {
  return (
    <LegalPage title="About CodeRef" updated="October 31, 2026">
      <p>
        CodeRef (coderef.xyz) is a set of developer cheat sheets, quick references and interactive tools. Every entry links to the official documentation so you can check the source.
      </p>

      <h2>Our mission</h2>
      <p>
        Developers look things up all day. We want the answer to be one search away, short enough to scan, and backed by a link to the official source. No long articles to scroll through and no sign-up to read anything.
      </p>

      <h2>How we make it</h2>
      <ul>
        <li>Each cheat sheet is organised by task, with short examples you can copy.</li>
        <li>Every page links to the official documentation, so you can confirm details and go deeper.</li>
        <li>Press Ctrl K anywhere on the site to search all sheets, references and tools.</li>
        <li>Pages are reviewed before publishing, and we fix mistakes when readers report them.</li>
      </ul>

      <h2>Privacy and trust</h2>
      <ul>
        <li>Most tools run in your browser. What you type into them stays on your device unless you choose to save it to your account.</li>
        <li>We don&apos;t show ads or sell data. We use basic analytics to see which pages are useful; see the <Link href="/cookie-policy/">cookie policy</Link>.</li>
        <li>Payments are handled by Dodo Payments, our merchant of record. CodeRef never sees your card details.</li>
      </ul>

      <h2>What&apos;s free</h2>
      <ul>
        <li>Cheat sheets and quick references for languages, frameworks and tools.</li>
        <li>Browser support data and comparisons.</li>
        <li>In-browser tools: JSON formatter, regex tester, Markdown, HTML and CSS editors, JavaScript runner, REST client, Git branching levels and more.</li>
      </ul>

      <h2>What CodeRef Pro adds</h2>
      <p>
        Pro is the paid part. It adds cloud save, share links and Design System exports. You pay for those features, not for access to the references. Details and prices are on the <Link href="/pricing/">pricing page</Link>.
      </p>

      <h2>Where the content comes from</h2>
      <ul>
        <li>The cheat sheets, quick references, explanations and examples are written and curated by the CodeRef team, with AI-assisted tools, and reviewed before publishing.</li>
        <li>Browser compatibility data comes from open compatibility datasets.</li>
        <li>The DESIGN.md design library mixes files written by the CodeRef team with files created by third parties under their own licences. Third-party files without an open licence are linked, not hosted.</li>
      </ul>
      <p>
        The full statement, including how to report a problem, is on the <Link href="/copyright/">content &amp; copyright</Link> page.
      </p>

      <h2>How we use AI</h2>
      <p>
        We use AI-assisted tools to help draft cheat sheets, examples and descriptions. A person on the team reviews and edits the result before it is published, and we link to the official documentation so readers can check it. AI can still get details wrong, so if you spot an error, please tell us.
      </p>

      <h2>Support</h2>
      <ul>
        <li>Everyone, free or Pro, can reach us at <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. A person reads and answers it.</li>
        <li>Billing questions: use Manage billing on your <Link href="/account/subscription/">account</Link> page, or write to us. Refunds follow the <Link href="/refund-policy/">refund policy</Link>.</li>
        <li>Found a mistake, a broken link or a missing topic? Email us and we will fix or add it.</li>
      </ul>

      <h2>Who it&apos;s for</h2>
      <p>
        Students learning a language, developers switching stacks, and working engineers who just need to recall a command or a syntax detail. If you can describe what you need in a few words, you should find it here.
      </p>

      <h2>Contact</h2>
      <p>
        Questions, corrections or business enquiries: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. Related pages: <Link href="/terms/">terms</Link>, <Link href="/privacy/">privacy</Link>, <Link href="/refund-policy/">refunds</Link>.
      </p>
    </LegalPage>
  );
}
