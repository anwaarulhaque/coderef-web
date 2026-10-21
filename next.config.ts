import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fully static build: `next build` emits plain HTML/CSS/JS into ./out.
  // Build-only: in `next dev`, export mode throws on any URL missing from generateStaticParams()
  // instead of showing the 404 page.
  output: process.env.NODE_ENV === "production" ? "export" : undefined,
  trailingSlash: true,
  images: { unoptimized: true },
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
