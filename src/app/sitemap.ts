import type { MetadataRoute } from "next";
import { getCompatFeatures } from "@/lib/compat";
import { getCollections, getDesigns } from "@/lib/design-md";
import { getQuickRefs } from "@/lib/quickref";
import { absoluteUrl } from "@/lib/seo";
import { getAllSheets } from "@/lib/sheets";

// Rendered once at build time into out/sitemap.xml.
export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [collections, designs, sheets, quickRefs] = await Promise.all([getCollections(), getDesigns(), getAllSheets(), getQuickRefs()]);
  const now = new Date();
  const entry = (path: string, priority: number, changeFrequency: "weekly" | "monthly" = "monthly") => ({
    url: absoluteUrl(path),
    lastModified: now,
    changeFrequency,
    priority,
  });
  return [
    entry("/", 1, "weekly"),
    entry("/quick-reference/", 0.9, "weekly"),
    entry("/browser-support/", 0.9, "weekly"),
    entry("/browser-support/compare/", 0.7),
    entry("/realtime-colors/", 0.9),
    entry("/sitemap/", 0.7),
    entry("/pricing/", 0.7),
    entry("/about/", 0.4),
    entry("/copyright/", 0.3),
    entry("/terms/", 0.3),
    entry("/privacy/", 0.3),
    entry("/refund-policy/", 0.3),
    entry("/cancellation-policy/", 0.3),
    entry("/cookie-policy/", 0.3),
    entry("/json-formatter/", 0.9),
    entry("/try-it/", 0.9),
    entry("/html-editor/", 0.9),
    entry("/css-editor/", 0.9),
    entry("/javascript-compiler/", 0.9),
    entry("/rest-api-client/", 0.9),
    entry("/markdown/", 0.8),
    entry("/regex-tester/", 0.8),
    entry("/git-branching/", 0.8),
    entry("/abbreviations/", 0.7),
    entry("/design-md/", 0.9, "weekly"),
    entry("/backgrounds/", 0.8),
    ...collections.map((c) => entry(`/design-md/${c.id}/`, 0.7, "weekly")),
    // External designs are link-outs (noindex), so they stay out of the sitemap.
    ...designs.filter((d) => !d.external).map((d) => entry(`/design-md/${d.id}/`, 0.6)),
    // Full cheat sheets rank above the short reference-link pages.
    ...sheets.map((s) => entry(`/${s.slug}/`, s.kind === "links" ? 0.4 : 0.8)),
    ...quickRefs.map((t) => entry(`/quick-reference/${t.slug}/`, 0.8)),
    ...getCompatFeatures().map((f) => entry(`/browser-support/${f.id}/`, 0.5)),
  ];
}
