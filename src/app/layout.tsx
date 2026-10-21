import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { MainContainer } from "@/components/layout/MainContainer";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { TopLoader } from "@/components/layout/TopLoader";
import { SITE_NAME, SITE_TAGLINE, SITE_URL, jsonLd } from "@/lib/seo";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "coderef — Developer Cheat Sheets & Quick Reference",
    template: "%s · coderef",
  },
  description:
    "Free developer cheat sheets, copy-paste quick references, browser support tables and interactive tools (regex tester, Markdown editor, Git playground) — every entry linked to the official docs.",
  applicationName: SITE_NAME,
  keywords: ["cheat sheet", "quick reference", "programming", "JavaScript", "Python", "CSS", "Git", "regex", "Markdown", "browser support", "VS Code shortcuts"],
  alternates: { canonical: SITE_URL + "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    url: SITE_URL + "/",
    title: "coderef — Developer Cheat Sheets & Quick Reference",
    description: "Cheat sheets, quick references and interactive tools for developers.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: `${SITE_NAME} — ${SITE_TAGLINE}` }],
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
  robots: { index: true, follow: true },
  // Google Search Console "HTML tag" verification, if configured.
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION } : undefined,
  // Logo files live in public/ (generated from Geist Mono: "code" ink + "ref" blue).
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#161920" },
  ],
};

// Site-wide structured data: the website and its publisher.
const SITE_JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebSite", "@id": SITE_URL + "/#website", url: SITE_URL + "/", name: SITE_NAME, description: SITE_TAGLINE, inLanguage: "en" },
    { "@type": "Organization", "@id": SITE_URL + "/#org", name: SITE_NAME, url: SITE_URL + "/", logo: SITE_URL + "/icon-512.png" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(SITE_JSON_LD)} />
        <TopLoader />
        <SiteHeader />
        <MainContainer>{children}</MainContainer>
        <SiteFooter />
        {/* Microsoft Clarity analytics. */}
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`(function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "yxm1xaxanm");`}
        </Script>
        {/* Google Analytics (gtag.js). */}
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-Z5FSV5E15Q" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-Z5FSV5E15Q');`}
        </Script>
      </body>
    </html>
  );
}
