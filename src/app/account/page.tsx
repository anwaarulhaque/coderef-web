import type { Metadata } from "next";
import { Overview } from "@/components/account/dashboard/Overview";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMetadata({ title: "Your account", description: "Your CodeRef plan, saved work, downloads and purchases.", path: "/account/" }),
  robots: { index: false, follow: true },
};

export default function Page() {
  return <Overview />;
}
