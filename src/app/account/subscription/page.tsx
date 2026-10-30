import type { Metadata } from "next";
import { SubscriptionPage } from "@/components/account/dashboard/SubscriptionPage";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMetadata({ title: "Subscription · Account", description: "Your CodeRef plan: status, renewal, upgrades and cancellation.", path: "/account/subscription/" }),
  robots: { index: false, follow: true },
};

export default function Page() {
  return <SubscriptionPage />;
}
