import type { Metadata } from "next";
import { DownloadsPage } from "@/components/account/dashboard/DownloadsPage";
import { getCollections } from "@/lib/design-md";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMetadata({ title: "Downloads · Account", description: "Design System packages, framework exports and collection downloads.", path: "/account/downloads/" }),
  robots: { index: false, follow: true },
};

export default async function Page() {
  const collections = (await getCollections()).map(({ id, label, count }) => ({ id, label, count }));
  return <DownloadsPage collections={collections} />;
}
