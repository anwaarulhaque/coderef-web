import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/layout/LegalPage";
import { REFUND_DAYS, SUPPORT_EMAIL } from "@/lib/plans";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({ title: "Cancellation policy", description: "How to cancel CodeRef Pro, what happens to your access, and how plan changes work.", path: "/cancellation-policy/" });

export default function Page() {
  return (
    <LegalPage title="Cancellation policy" updated="October 31, 2026">
      <p>
        CodeRef Pro is not available to buy yet; paid plans are coming soon and everything on the free plan works today. This policy applies to paid plans from the day they open.
      </p>

      <h2>Cancel any time</h2>
      <p>
        You can cancel a monthly or yearly subscription whenever you like, with no fee and no reason needed. Sign in, open <Link href="/account/subscription/">Account &rarr; Subscription</Link> and choose <em>Cancel subscription</em>. You don&apos;t need to contact us, and you can do it all on coderef.xyz.
      </p>

      <h2>What happens when you cancel</h2>
      <ul>
        <li>Your subscription stops renewing. You won&apos;t be charged again.</li>
        <li>Pro stays active until the end of the period you have already paid for. After that your account returns to the free plan.</li>
        <li>Your saved items and favourites are kept. If you&apos;re over the free-plan save limit, nothing is deleted; you just can&apos;t add more until you&apos;re under it or upgrade again.</li>
        <li>Changed your mind before the period ends? Choose <em>Resume subscription</em> on the same page and it renews as normal.</li>
        <li>A confirmation email is sent from noreply@mail.coderef.xyz.</li>
      </ul>

      <h2>Changing plans</h2>
      <p>You can switch between monthly and yearly from the Subscription page. Dodo Payments prorates the change: an upgrade charges the difference for the rest of the period, and a downgrade credits it. The new price applies from your next renewal.</p>

      <h2>Lifetime</h2>
      <p>The lifetime plan is a single payment, not a subscription, so there is nothing to cancel and it never renews. If you have a subscription and buy lifetime, cancel the subscription so it doesn&apos;t renew. See the <Link href="/refund-policy/">refund policy</Link> for the {REFUND_DAYS}-day refund.</p>

      <h2>Failed payments</h2>
      <p>If a renewal payment fails we email you and Dodo retries it. Update your card from the Subscription page to keep Pro. If payment still fails the subscription ends, Pro stops after a short grace period of up to 3 days, and your account returns to the free plan.</p>

      <h2>Cancellation and refunds</h2>
      <p>Cancelling stops future charges; it doesn&apos;t refund the current period automatically. A full refund is available within {REFUND_DAYS} days of your first payment under the <Link href="/refund-policy/">refund policy</Link>.</p>

      <h2>Deleting your account</h2>
      <p>Deleting your account from <Link href="/account/settings/">Settings</Link> cancels any active subscription and permanently deletes your saved items. It does not refund the current period.</p>

      <h2>Our right to cancel</h2>
      <p>We may end an account that breaks the <Link href="/terms/">terms of service</Link>. If we end a paid account for any other reason, we&apos;ll refund the unused part of the period.</p>

      <h2>Questions</h2>
      <p>Can&apos;t cancel, or something looks wrong? Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> from the address on your account.</p>
    </LegalPage>
  );
}
