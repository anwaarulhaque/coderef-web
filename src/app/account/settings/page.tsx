import type { Metadata } from "next";
import { SettingsPage } from "@/components/account/dashboard/SettingsPage";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMetadata({ title: "Settings · Account", description: "Your CodeRef profile, sign-in and account deletion.", path: "/account/settings/" }),
  robots: { index: false, follow: true },
};

export default function Page() {
  return <SettingsPage />;
}
