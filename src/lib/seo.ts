// SEO helpers: absolute URLs, per-page metadata (canonical, Open Graph, Twitter) and JSON-LD.
import type { Metadata } from "next";

/**
 * The public address of the site, used for canonical URLs, the sitemap and social cards.
 * Set NEXT_PUBLIC_SITE_URL (e.g. https://coderef.dev) in the build environment.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://coderef.xyz").replace(/\/+$/, "");
export const SITE_NAME = "coderef";
export const SITE_TAGLINE = "Developer cheat sheets, quick references and interactive tools";

export const absoluteUrl = (path: string) => `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;

/** Metadata for one page: title, description, canonical URL and social cards. */
export function pageMetadata({ title, description, path, type = "website" }: { title: string; description: string; path: string; type?: "website" | "article" }): Metadata {
  const url = absoluteUrl(path);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type, url, title, description, siteName: SITE_NAME, images: [{ url: "/og.png", width: 1200, height: 630, alt: `${SITE_NAME} — ${SITE_TAGLINE}` }] },
    twitter: { card: "summary_large_image", title, description, images: ["/og.png"] },
  };
}

/** Serializes structured data safely for a <script type="application/ld+json">. */
export const jsonLd = (data: unknown) => ({ __html: JSON.stringify(data).replace(/</g, "\\u003c") });
