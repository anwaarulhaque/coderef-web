import type { Metadata } from "next";
import { SavedPage } from "@/components/account/dashboard/SavedPage";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMetadata({ title: "Saved work · Account", description: "Everything you've saved in CodeRef's tools, and your favourite designs.", path: "/account/saved/" }),
  robots: { index: false, follow: true },
};

export default function Page() {
  return <SavedPage />;
}
