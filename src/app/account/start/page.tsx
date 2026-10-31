import type { Metadata } from "next";
import { StartAccountPage } from "@/components/account/dashboard/StartAccountPage";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMetadata({ title: "CodeRef Start · Account", description: "Your CodeRef Start plan, teams and connected browsers.", path: "/account/start/" }),
  robots: { index: false, follow: true },
};

export default function Page() {
  return <StartAccountPage />;
}
