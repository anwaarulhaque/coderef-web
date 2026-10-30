import type { Metadata } from "next";
import Link from "next/link";
import { absoluteUrl } from "@/lib/seo";
import { ClientRedirect } from "./ClientRedirect";

// Old address of Realtime Colors. Static export has no server redirects, so the
// browser forwards here, keeping ?colors=…&fonts=… from previously shared links.
export const metadata: Metadata = {
  title: "Realtime Colors has moved",
  alternates: { canonical: absoluteUrl("/realtime-colors/") },
  robots: { index: false, follow: true },
};

export default function ColorsRedirectPage() {
  return (
    <>
      <ClientRedirect to="/realtime-colors/" />
      <noscript>
        <meta httpEquiv="refresh" content="0; url=/realtime-colors/" />
      </noscript>
      <p className="mx-auto max-w-7xl px-4 py-12 text-sm text-muted">
        Realtime Colors has moved to{" "}
        <Link href="/realtime-colors/" className="underline hover:text-foreground">
          /realtime-colors/
        </Link>
        .
      </p>
    </>
  );
}
