import type { Metadata } from "next";
import { StartApp } from "@/components/start/StartApp";

// The CodeRef Start app. One prerendered shell (/start/); every other /start/… path renders the same shell on request,
// and StartApp routes on the client (pages, connect, teams, public pages). Personal pages aren't for search engines.
export const metadata: Metadata = {
  title: "CodeRef Start",
  description: "Your start page: bookmarks, feeds, notes and to-dos in every new tab.",
  robots: { index: false, follow: false },
};

export function generateStaticParams() {
  return [{ slug: [] }];
}

export default function StartPage() {
  return <StartApp />;
}
