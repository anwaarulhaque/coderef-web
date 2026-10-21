import { buildSearchIndex } from "@/lib/search-index";

// Rendered once at build time into out/search-index.json.
export const dynamic = "force-static";

export function GET() {
  return Response.json(buildSearchIndex());
}
