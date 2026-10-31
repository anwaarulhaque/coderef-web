import type { Metadata } from "next";
import Link from "next/link";
import { PricingPlans } from "@/components/account/PricingPlans";
import { PageHeader } from "@/components/layout/PageHeader";
import { REFUND_DAYS, SUPPORT_EMAIL } from "@/lib/plans";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Pricing — CodeRef Pro",
  description: "CodeRef is free. Pro adds cloud save, share links, and Design System exports for Tailwind, shadcn/ui and Figma.",
  path: "/pricing/",
});

const FAQ: [string, string][] = [
  ["Will the free tools stay free?", "Yes. Every cheat sheet, reference page and tool stays free. Pro adds saving, syncing, sharing and exports on top."],
  ["How do I sign in?", "With your email. We send a 6-digit code that verifies your address; there is no password to remember."],
  ["Can I cancel?", "Anytime, from Manage billing on your account page. You keep Pro until the end of the period you paid for."],
  ["Do you offer refunds?", `Yes: within ${REFUND_DAYS} days of your first purchase, for any reason. See the refund policy.`],
  ["Who processes payments?", "Dodo Payments, our merchant of record. They handle cards, local payment methods, sales tax and VAT, and send your receipts."],
  ["What happens to my saved items if I stop paying?", "Nothing is deleted. You can still open everything; you just can't save more than the free limit until you upgrade again."],
];

export default function PricingPage() {
  return (
    <>
      <PageHeader
        title="Simple pricing"
        crumbs={[{ href: "/", label: "Home" }, { label: "Pricing" }]}
        description="CodeRef is free. Pro is for when you want your work saved, synced and exportable."
      />
      <PricingPlans />
      <section className="mt-16 max-w-3xl" aria-labelledby="pricing-faq">
        <h2 id="pricing-faq" className="mb-4 text-xl font-semibold">
          Questions
        </h2>
        <dl className="divide-y divide-border rounded-xl border border-border bg-surface">
          {FAQ.map(([q, a]) => (
            <div key={q} className="p-4">
              <dt className="font-medium">{q}</dt>
              <dd className="mt-1 text-sm text-muted">{a}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-6 text-sm text-muted">
          Prices in USD; taxes are added at checkout where required. Questions? <a href={`mailto:${SUPPORT_EMAIL}`} className="text-accent hover:underline">{SUPPORT_EMAIL}</a> ·{" "}
          <Link href="/terms/" className="hover:text-foreground">Terms</Link> · <Link href="/privacy/" className="hover:text-foreground">Privacy</Link> ·{" "}
          <Link href="/refund-policy/" className="hover:text-foreground">Refunds</Link>
        </p>
      </section>
    </>
  );
}
