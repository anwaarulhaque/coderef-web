import { buildSearchIndex } from "@/lib/search-index";

// Rendered once at build time into out/search-index.json.
export const dynamic = "force-static";

export async function GET() {
  return Response.json(await buildSearchIndex());
}
