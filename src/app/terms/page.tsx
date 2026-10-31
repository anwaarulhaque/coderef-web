import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/layout/LegalPage";
import { REFUND_DAYS, SUPPORT_EMAIL } from "@/lib/plans";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({ title: "Terms of service", description: "The terms for using CodeRef and CodeRef Pro.", path: "/terms/" });

export default function Page() {
  return (
    <LegalPage title="Terms of service" updated="October 31, 2026">
      <p>These terms cover your use of CodeRef (coderef.xyz), including free accounts and the paid CodeRef Pro plans. By creating an account or buying Pro you agree to them. If you don&apos;t agree, please don&apos;t use the service.</p>
      <h2>Who can use CodeRef</h2>
      <p>You must be at least 16 years old, or have the permission of a parent or guardian, and be able to enter a binding agreement. If you use CodeRef for a company, you confirm you can accept these terms on its behalf.</p>
      <h2>Accounts</h2>
      <p>You sign in with your email address and a one-time code we send to it. Keep access to that inbox: it is how you prove the account is yours. One person per account. You are responsible for what happens under your account, so tell us at once if you think someone else has access to it.</p>
      <h2>Free and Pro</h2>
      <p>The cheat sheets, references and tools are free. CodeRef Pro adds cloud save, share links, and Design System exports, as described on the <Link href="/pricing/">pricing page</Link>. We may improve or change features; we won&apos;t remove a paid feature during a period you have already paid for without a pro-rated refund.</p>
      <h2>Payments</h2>
      <p>Paid plans are coming soon; until they open, CodeRef is free to use. Payments are processed by Dodo Payments, our merchant of record, which also handles taxes and receipts. Subscriptions renew automatically until you cancel from <Link href="/account/subscription/">Account &rarr; Subscription</Link>; you keep Pro until the end of the paid period (see the <Link href="/cancellation-policy/">cancellation policy</Link>). The lifetime plan is a one-time payment for Pro for as long as CodeRef operates. See the <Link href="/refund-policy/">refund policy</Link> ({REFUND_DAYS}-day refunds on first purchases).</p>
      <h2>Your content</h2>
      <p>What you save (palettes, requests, documents) stays yours. We store it only to provide the service. If you create a share link, anyone with the link can view that item until you turn sharing off. Don&apos;t save secrets you wouldn&apos;t want in a shared link, such as API keys in a request you plan to share.</p>
      <h2>Acceptable use</h2>
      <ul>
        <li>No abuse: automated scraping of the API, attempts to bypass limits or payments, or attacks on the service.</li>
        <li>No unlawful content in saved or shared items.</li>
        <li>The DESIGN.md library has two kinds of files: ones written by the CodeRef team, and ones created by third parties under their own licences (listed in the library&apos;s licence notice). Exports are provided for your own design work; follow the licence of any third-party file you use.</li>
      </ul>
      <h2>Our content and intellectual property</h2>
      <p>The cheat sheets, references, explanations, examples, design and software of CodeRef belong to us or our licensors and are protected by copyright. You may use them for your own learning and work. You may link to and quote short excerpts with credit, and copy code examples into your projects. You may not copy whole pages, resell our content, or scrape the site in bulk. More detail is on the <Link href="/copyright/">content &amp; copyright</Link> page, including how to report a copyright problem.</p>
      <h2>AI-assisted content</h2>
      <p>Some content is drafted with AI-assisted tools and reviewed by our team before publishing. It may still contain errors or become out of date. It is for general reference and is not professional advice. Check the official documentation before relying on it, especially for security, production or legal matters.</p>
      <h2>Third-party services and links</h2>
      <p>CodeRef links to official documentation and other websites, and uses services such as Dodo Payments for checkout and analytics providers listed in the <Link href="/cookie-policy/">cookie policy</Link>. We don&apos;t control those and aren&apos;t responsible for their content or practices. Names of products and companies belong to their owners and do not imply endorsement.</p>
      <h2>Service availability</h2>
      <p>We work to keep CodeRef available but don&apos;t promise it will be uninterrupted or error free. We may change, pause or retire features, and will give notice where a change materially affects a paid plan.</p>
      <h2>Disclaimer and liability</h2>
      <p>CodeRef is provided &quot;as is&quot; and &quot;as available&quot;, without warranties of any kind to the extent the law allows. Reference content can contain mistakes; always check the official documentation linked from each page. To the extent the law allows, we aren&apos;t liable for indirect or consequential losses, lost profits or lost data, and our total liability is limited to the amount you paid us in the 12 months before the claim. Nothing here limits rights you have under law that cannot be excluded.</p>
      <h2>Your responsibility</h2>
      <p>You agree to compensate us for claims arising from content you save or share that breaks the law or someone&apos;s rights, or from your breach of these terms.</p>
      <h2>Ending your account</h2>
      <p>You can delete your account at any time from the account page; this deletes your saved items and cancels any subscription. We may suspend or close accounts that break these terms, with notice where practical. Sections about intellectual property, disclaimers and liability continue after your account ends.</p>
      <h2>Changes to these terms</h2>
      <p>We may update these terms. The date at the top shows the latest version. For material changes we will give notice on the site or by email. If you keep using CodeRef after a change takes effect, you accept the new terms.</p>
      <h2>Governing law</h2>
      <p>These terms are governed by the laws that apply where CodeRef&apos;s operator is based, and disputes go to the courts there, unless your local consumer law gives you the right to go elsewhere. Please contact us first; most problems can be settled by talking.</p>
      <h2>Cookies and privacy</h2>
      <p>How we handle personal data is in the <Link href="/privacy/">privacy policy</Link>, and the cookies we use are in the <Link href="/cookie-policy/">cookie policy</Link>.</p>
      <h2>Contact</h2>
      <p>Questions about these terms: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.</p>
    </LegalPage>
  );
}
