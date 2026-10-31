import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/layout/LegalPage";
import { SUPPORT_EMAIL } from "@/lib/plans";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({ title: "Privacy policy", description: "What CodeRef collects, why, and who processes it.", path: "/privacy/" });

export default function Page() {
  return (
    <LegalPage title="Privacy policy" updated="October 31, 2026">
      <p>CodeRef collects as little as it can. Most tools run entirely in your browser and never send what you type to us.</p>
      <h2>In short</h2>
      <ul>
        <li>We collect your email and what you choose to save. We don&apos;t see your card details.</li>
        <li>We use analytics to see which pages are useful. No ads, no selling data, no marketing email.</li>
        <li>You can delete your account and all its data at any time.</li>
        <li>Questions: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.</li>
      </ul>
      <h2>Who we are</h2>
      <p>CodeRef (coderef.xyz) is the service provider and the party responsible for the personal data described here. Contact us at <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. More about the site is on the <Link href="/about/">About</Link> page.</p>
      <h2>What we collect</h2>
      <ul>
        <li><strong>Account:</strong> your email address, when you created the account and last signed in.</li>
        <li><strong>Saved items:</strong> the palettes, requests, documents and favourites you choose to save.</li>
        <li><strong>Billing status:</strong> your plan, its status and renewal date, and the customer and subscription IDs from our payment provider. Payment records (amounts, dates, payment IDs) are kept so we can show your billing history and invoices. We never see or store card details.</li>
        <li><strong>Emails we send you:</strong> sign-in codes and, once you have a paid plan, messages about your subscription (renewals, cancellations, failed payments, refunds). We don&apos;t send marketing email.</li>
        <li><strong>Security logs:</strong> IP addresses are used briefly to rate-limit sign-in codes and prevent abuse.</li>
        <li><strong>Analytics:</strong> Google Analytics and Microsoft Clarity measure how pages are used (pages viewed, clicks, device type). They set their own cookies.</li>
      </ul>
      <h2>Cookies</h2>
      <p>Signing in sets one cookie, <code>cr_session</code>, that keeps you signed in for 30 days. It is HttpOnly (scripts can&apos;t read it) and used for nothing else. Tools also remember your last work in your browser&apos;s local storage, which never leaves your device unless you save to your account. Analytics services set their own cookies. The full list, with durations and how to control them, is in the <Link href="/cookie-policy/">cookie policy</Link>.</p>
      <h2>Who processes data for us</h2>
      <ul>
        <li>Vercel: hosting.</li>
        <li>Neon: the database that stores accounts and saved items.</li>
        <li>Amazon Web Services (SES): sends sign-in codes and account emails, from noreply@mail.coderef.xyz.</li>
        <li>Dodo Payments: payments, taxes and receipts, as merchant of record.</li>
        <li>Google Analytics and Microsoft Clarity: usage analytics.</li>
      </ul>
      <h2>Why we use your data</h2>
      <ul>
        <li>To provide the service you asked for: your account, saved items, sign-in and billing.</li>
        <li>To keep CodeRef secure and prevent abuse, which is in our legitimate interest.</li>
        <li>To understand which pages are useful, through analytics (see the cookie policy).</li>
        <li>To meet legal obligations such as tax records. We never sell your data or use it for advertising.</li>
      </ul>
      <h2>When we share data</h2>
      <p>We share data only with the providers listed above, and only what each needs to do its job. We may also disclose information if the law requires it, to enforce our <Link href="/terms/">terms</Link>, or to protect the security of CodeRef and its users. If CodeRef is ever sold or merged, account data may move to the new owner, and we will tell you first.</p>
      <h2>Information you share publicly</h2>
      <p>Saved items are private unless you turn on a share link. Anyone with the link can view that item until you turn sharing off, so don&apos;t put secrets in items you share.</p>
      <h2>Third-party links</h2>
      <p>Pages link to official documentation and other sites. Their privacy practices are theirs, not ours, so check their policies.</p>
      <h2>Where data is stored</h2>
      <p>Our providers run in several countries, including the United States, so your data can be processed outside your own. We rely on each provider&apos;s standard contractual and security commitments for those transfers.</p>
      <h2>Your choices and rights</h2>
      <p>You can delete your account and everything saved in it at any time from <Link href="/account/settings/">Settings</Link>; this also cancels any subscription (see the <Link href="/cancellation-policy/">cancellation policy</Link>). Turning off a share link makes it stop working immediately. Depending on where you live you may also have the right to access, correct, export or erase your data and to object to some processing. To use any of these, or for any privacy question, email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. We reply within 30 days. We won&apos;t treat you differently for using these rights. If you are in the EU, UK or a similar region and aren&apos;t happy with our answer, you can also complain to your local data protection authority.</p>
      <h2>Security</h2>
      <p>Connections use HTTPS, sign-in codes and sessions are stored only as one-way hashes, and saved items are accessible only from your account or a share link you turn on. No system is perfectly secure, so keep access to your email inbox safe.</p>
      <h2>Children</h2>
      <p>CodeRef is for developers and isn&apos;t directed at children under 16. If you believe a child has created an account, email us and we&apos;ll delete it.</p>
      <h2>Retention</h2>
      <p>Account data is kept until you delete your account. Billing records are kept by Dodo Payments as tax law requires. Expired sessions and sign-in codes are removed automatically. Rate-limit counters are deleted or overwritten within hours. Deleted accounts are removed from our database immediately.</p>
      <h2>Changes</h2>
      <p>If we change this policy in a way that matters we&apos;ll update the date above and, for material changes, tell signed-in users by email.</p>
    </LegalPage>
  );
}
