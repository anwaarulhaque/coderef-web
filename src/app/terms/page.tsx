import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/layout/LegalPage";
import { REFUND_DAYS, SUPPORT_EMAIL } from "@/lib/plans";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({ title: "Terms of service", description: "The terms for using CodeRef and CodeRef Pro.", path: "/terms/" });

export default function Page() {
  return (
    <LegalPage title="Terms of service" updated="October 31, 2026">
      <p>These terms cover your use of CodeRef (coderef.xyz), including free accounts and the paid CodeRef Pro plans. By creating an account or buying Pro you agree to them.</p>
      <h2>Accounts</h2>
      <p>You sign in with your email address and a one-time code we send to it. Keep access to that inbox: it is how you prove the account is yours. One person per account.</p>
      <h2>Free and Pro</h2>
      <p>The cheat sheets, references and tools are free. CodeRef Pro adds cloud save, share links, Design System exports and bulk downloads, as described on the <Link href="/pricing/">pricing page</Link>. We may improve or change features; we won&apos;t remove a paid feature during a period you have already paid for without a pro-rated refund.</p>
      <h2>Payments</h2>
      <p>Paid plans are coming soon; until they open, CodeRef is free to use. Payments are processed by Dodo Payments, our merchant of record, which also handles taxes and receipts. Subscriptions renew automatically until you cancel from <Link href="/account/subscription/">Account &rarr; Subscription</Link>; you keep Pro until the end of the paid period (see the <Link href="/cancellation-policy/">cancellation policy</Link>). The lifetime plan is a one-time payment for Pro for as long as CodeRef operates. See the <Link href="/refund-policy/">refund policy</Link> ({REFUND_DAYS}-day refunds on first purchases).</p>
      <h2>Your content</h2>
      <p>What you save (palettes, requests, documents) stays yours. We store it only to provide the service. If you create a share link, anyone with the link can view that item until you turn sharing off. Don&apos;t save secrets you wouldn&apos;t want in a shared link, such as API keys in a request you plan to share.</p>
      <h2>Acceptable use</h2>
      <ul>
        <li>No abuse: automated scraping of the API, attempts to bypass limits or payments, or attacks on the service.</li>
        <li>No unlawful content in saved or shared items.</li>
        <li>DESIGN.md files in the library come from third parties under their own licences (listed in the library&apos;s licence notice). Exports are provided for your own design work; follow those licences.</li>
      </ul>
      <h2>Disclaimer and liability</h2>
      <p>CodeRef is provided &quot;as is&quot;. Reference content can contain mistakes; always check the official documentation linked from each page. To the extent the law allows, our total liability is limited to the amount you paid us in the 12 months before the claim.</p>
      <h2>Ending your account</h2>
      <p>You can delete your account at any time from the account page; this deletes your saved items and cancels any subscription. We may suspend accounts that break these terms.</p>
      <h2>Cookies and privacy</h2>
      <p>How we handle personal data is in the <Link href="/privacy/">privacy policy</Link>, and the cookies we use are in the <Link href="/cookie-policy/">cookie policy</Link>.</p>
      <h2>Contact</h2>
      <p>Questions about these terms: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.</p>
    </LegalPage>
  );
}
