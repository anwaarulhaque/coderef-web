import { getDesigns, toIndexEntry } from "@/lib/design-md";

// Rendered once at build time into out/design-md/index.json — the library's search index.
// The browse page fetches it, so search and filters run entirely in the browser; no database.
export const dynamic = "force-static";

export function GET() {
  return Response.json(getDesigns().map(toIndexEntry));
}
