import type { NextConfig } from "next";

// Security headers for every response (previously public/_headers on the static host).
const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Script/style sources are left open on purpose (inline analytics + JSON-LD need a nonce-based policy); these directives are safe now.
  { key: "Content-Security-Policy", value: "base-uri 'self'; object-src 'none'; frame-ancestors 'self'; form-action 'self'" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

// Server build for Vercel: pages are still prerendered at build time (generateStaticParams / force-static);
// only /api/* (accounts, billing, exports) runs on request.
const nextConfig: NextConfig = {
  trailingSlash: true,
  images: { unoptimized: true },
  // Same-origin proxy for browser fetches of CDN data (see cdnFetchPath in src/lib/design-md-shared.ts).
  async rewrites() {
    const cdn = (process.env.NEXT_PUBLIC_CDN_URL || "https://cdn.coderef.xyz").replace(/\/+$/, "");
    return [{ source: "/cdn/:path*", destination: `${cdn}/:path*` }];
  },
  async headers() {
    return [
      { source: "/:path*", headers: SECURITY_HEADERS },
      { source: "/search-index.json", headers: [{ key: "Cache-Control", value: "public, max-age=3600" }] },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
