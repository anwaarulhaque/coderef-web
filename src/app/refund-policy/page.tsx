import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/layout/LegalPage";
import { REFUND_DAYS, SUPPORT_EMAIL } from "@/lib/plans";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({ title: "Refund policy", description: `CodeRef Pro refunds: ${REFUND_DAYS} days, no questions asked.`, path: "/refund-policy/" });

export default function Page() {
  return (
    <LegalPage title="Refund policy" updated="October 31, 2026">
      <p>CodeRef Pro is not available to buy yet; paid plans are coming soon and everything on the free plan works today. This policy applies to paid plans from the day they open.</p>

      <h2>{REFUND_DAYS}-day refunds</h2>
      <p>If CodeRef Pro isn&apos;t for you, ask for a refund within {REFUND_DAYS} days of your first payment (monthly, yearly or lifetime) and you&apos;ll get the full amount back. No questions asked.</p>

      <h2>Renewals</h2>
      <p>Renewal payments aren&apos;t refunded by default, but if a renewal surprised you, write to us within {REFUND_DAYS} days and we&apos;ll sort it out. To stop future renewals, cancel from <Link href="/account/subscription/">Account &rarr; Subscription</Link>; Pro stays active until the end of the period you paid for. See the <Link href="/cancellation-policy/">cancellation policy</Link>.</p>

      <h2>Plan changes</h2>
      <p>Switching between monthly and yearly is prorated by Dodo Payments at the time of the change, so you only pay for what you use. A proration charge isn&apos;t a new first payment, but if it was a mistake, write to us within {REFUND_DAYS} days.</p>

      <h2>Lifetime</h2>
      <p>A refunded lifetime purchase ends lifetime Pro on your account. Lifetime is offered in limited numbers; a refunded spot may be offered to someone else.</p>

      <h2>How to ask</h2>
      <p>The quickest way is <strong>Request refund</strong> next to the payment in <Link href="/account/subscription/">Account &rarr; Subscription &rarr; Billing history</Link>. It sends your request to <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> and emails you a confirmation. You can also write to <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> directly from the address on your account, with the payment ID from your billing history. We reply within a few business days.</p>

      <h2>How you&apos;re paid back</h2>
      <p>Refunds are issued by Dodo Payments to your original payment method, usually within 5&ndash;10 business days, though your bank can take longer to show it. We&apos;ll email you when the refund is processed. Taxes charged on the payment are refunded with it.</p>

      <h2>Failed or duplicate charges</h2>
      <p>If you were charged twice, or charged but didn&apos;t get Pro, tell us right away and we&apos;ll fix it or refund you in full, even outside the {REFUND_DAYS} days.</p>

      <h2>Chargebacks</h2>
      <p>Please contact us before disputing a charge with your bank, as we can usually refund faster. Accounts with an unresolved chargeback may be suspended while it&apos;s reviewed.</p>
    </LegalPage>
  );
}
