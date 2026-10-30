// Framework-neutral request/response shapes, so the router is testable without Next.js.

export type Req = {
  method: string;
  /** Path without the /api prefix or trailing slash, e.g. "/items/123". */
  path: string;
  query: URLSearchParams;
  headers: Record<string, string>;
  cookies: Record<string, string>;
  body: string;
  ip: string;
};

export type Res = { status: number; headers?: Record<string, string>; cookies?: string[]; body?: string; base64?: boolean };

export class HttpError extends Error {
  status: number;
  code: string;
  constructor(status: number, message: string, code = "error") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const json = (status: number, data: unknown, extra: Partial<Res> = {}): Res => ({
  status,
  ...extra,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...extra.headers },
  body: JSON.stringify(data),
});

export function readJson<T = Record<string, unknown>>(req: Req): T {
  if (!/^application\/json\b/i.test(req.headers["content-type"] ?? "")) throw new HttpError(415, "Expected a JSON body", "unsupported_media_type");
  try {
    const v = JSON.parse(req.body || "{}");
    if (!v || typeof v !== "object" || Array.isArray(v)) throw new Error();
    return v as T;
  } catch {
    throw new HttpError(400, "Malformed JSON body", "bad_json");
  }
}

export function parseCookies(header: string | undefined, list: string[] = []): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of [...(header ? header.split(";") : []), ...list]) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    const k = part.slice(0, i).trim();
    if (k && !(k in out)) {
      try {
        out[k] = decodeURIComponent(part.slice(i + 1).trim());
      } catch {
        out[k] = part.slice(i + 1).trim();
      }
    }
  }
  return out;
}

export function cookie(name: string, value: string, opts: { maxAge: number; secure: boolean; httpOnly?: boolean }): string {
  return `${name}=${encodeURIComponent(value)}; Path=/;${opts.httpOnly === false ? "" : " HttpOnly;"} SameSite=Lax; Max-Age=${opts.maxAge}${opts.secure ? "; Secure" : ""}`;
}

export const str = (v: unknown, max: number): string | undefined => (typeof v === "string" && v.trim() && v.length <= max ? v.trim() : undefined);
