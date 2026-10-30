// Every /api/* request goes to the framework-neutral router in src/server (accounts, billing, saved items, exports).
import type { NextRequest } from "next/server";
import { parseCookies, type Req } from "@/server/http";
import { handle } from "@/server/router";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Bulk collection downloads fetch up to 200 files.
export const maxDuration = 60;

async function serve(request: NextRequest): Promise<Response> {
  const headers: Record<string, string> = {};
  request.headers.forEach((v, k) => (headers[k] = v));
  const req: Req = {
    method: request.method.toUpperCase(),
    path: request.nextUrl.pathname.replace(/^\/api/, "").replace(/\/+$/, "") || "/",
    query: request.nextUrl.searchParams,
    headers,
    cookies: parseCookies(headers.cookie),
    // Raw text: webhook signatures are computed over the exact bytes received.
    body: request.method === "GET" || request.method === "HEAD" ? "" : await request.text(),
    ip: (headers["x-forwarded-for"]?.split(",")[0] ?? headers["x-real-ip"] ?? "unknown").trim(),
  };
  const res = await handle(req);
  const out = new Headers(res.headers);
  for (const c of res.cookies ?? []) out.append("set-cookie", c);
  const body = res.base64 ? Buffer.from(res.body ?? "", "base64") : (res.body ?? "");
  return new Response(body, { status: res.status, headers: out });
}

export { serve as GET, serve as POST, serve as PUT, serve as DELETE };
