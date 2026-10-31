// Server-side fetches for CodeRef Start widgets that browsers can't make directly (CORS): RSS/Atom feeds, ICS
// calendars, weather and exchange rates. Feeds and calendars are user-supplied URLs, so private and local addresses are
// refused (SSRF), responses are size-capped, and results are cached in memory for a few minutes.
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { HttpError } from "./http.ts";

const MAX_BYTES = 1_500_000;
const TIMEOUT_MS = 7000;
const cache = new Map<string, { at: number; value: unknown }>();

async function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return hit.value as T;
  const value = await load();
  if (cache.size > 500) cache.delete(cache.keys().next().value as string);
  cache.set(key, { at: Date.now(), value });
  return value;
}

/** True for loopback, private, link-local, CGNAT and other non-public ranges (IPv4 and IPv6). */
export function isPrivateAddress(ip: string): boolean {
  if (isIP(ip) === 4) {
    const [a, b] = ip.split(".").map(Number);
    return a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 198 && (b === 18 || b === 19)) || a >= 224;
  }
  const v = ip.toLowerCase();
  if (v.startsWith("::ffff:")) return isPrivateAddress(v.slice(7));
  return v === "::" || v === "::1" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe8") || v.startsWith("fe9") || v.startsWith("fea") || v.startsWith("feb") || v.startsWith("ff");
}

export function publicUrl(raw: unknown): URL {
  let u: URL;
  try {
    u = new URL(String(raw ?? "").trim());
  } catch {
    throw new HttpError(400, "Enter a full http(s) address", "invalid_url");
  }
  if (!/^https?:$/.test(u.protocol) || u.username || u.password) throw new HttpError(400, "Enter a full http(s) address", "invalid_url");
  if (u.port && !["80", "443", "8080", "8443"].includes(u.port)) throw new HttpError(400, "That port isn't allowed", "invalid_url");
  return u;
}

async function assertPublicHost(u: URL) {
  const host = u.hostname.replace(/^\[|\]$/g, "");
  if (/^(localhost|.*\.local|.*\.internal)$/i.test(host)) throw new HttpError(400, "That address isn't reachable", "invalid_url");
  const addrs = isIP(host) ? [{ address: host }] : await lookup(host, { all: true }).catch(() => []);
  if (!addrs.length) throw new HttpError(400, "That address doesn't resolve", "invalid_url");
  if (addrs.some((a) => isPrivateAddress(a.address))) throw new HttpError(400, "That address isn't reachable", "invalid_url");
}

/** GET a public URL as text, following up to 3 redirects (each re-checked), with a size cap and timeout. */
async function fetchText(raw: unknown, accept: string): Promise<string> {
  let u = publicUrl(raw);
  for (let hop = 0; hop < 4; hop++) {
    await assertPublicHost(u);
    const res = await fetch(u, { redirect: "manual", signal: AbortSignal.timeout(TIMEOUT_MS), headers: { accept, "user-agent": "CodeRefStart/1.0 (+https://coderef.xyz/start-page/)" } }).catch(() => {
      throw new HttpError(502, "Couldn't reach that address", "fetch_failed");
    });
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      u = publicUrl(new URL(res.headers.get("location")!, u).toString());
      continue;
    }
    if (!res.ok) throw new HttpError(502, `That address answered ${res.status}`, "fetch_failed");
    if (Number(res.headers.get("content-length") ?? 0) > MAX_BYTES) throw new HttpError(413, "That file is too large", "too_large");
    const text = await res.text();
    if (text.length > MAX_BYTES) throw new HttpError(413, "That file is too large", "too_large");
    return text;
  }
  throw new HttpError(502, "Too many redirects", "fetch_failed");
}

const decode = (s: string) =>
  s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, "&");
const stripTags = (s: string) => decode(decode(s).replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
const tag = (xml: string, name: string) => xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "i"))?.[1] ?? "";

export type FeedItem = { title: string; url: string; date: string | null; summary: string };

/** Parses RSS 2.0, RSS 1.0 and Atom without a dependency: titles, links, dates and a short plain-text summary. */
export function parseFeed(xml: string): { title: string; items: FeedItem[] } {
  const atom = /<feed[\s>]/i.test(xml);
  const blocks = xml.match(atom ? /<entry[\s>][\s\S]*?<\/entry>/gi : /<item[\s>][\s\S]*?<\/item>/gi) ?? [];
  const items = blocks.slice(0, 50).map((b) => {
    const link = atom ? (b.match(/<link[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)/i)?.[1] ?? b.match(/<link[^>]*href=["']([^"']+)/i)?.[1] ?? "") : stripTags(tag(b, "link")) || (b.match(/<guid[^>]*>(https?:[^<]+)<\/guid>/i)?.[1] ?? "");
    const date = stripTags(tag(b, atom ? "updated" : "pubDate") || tag(b, "published") || tag(b, "dc:date")) || null;
    return {
      title: stripTags(tag(b, "title")).slice(0, 300) || "Untitled",
      url: /^https?:\/\//i.test(link.trim()) ? decode(link.trim()) : "",
      date: date && !Number.isNaN(Date.parse(date)) ? new Date(date).toISOString() : null,
      summary: stripTags(tag(b, atom ? "summary" : "description") || tag(b, "content")).slice(0, 280),
    };
  });
  const firstItem = xml.search(atom ? /<entry[\s>]/i : /<item[\s>]/i);
  const head = xml.slice(0, firstItem > 0 ? firstItem : 4000);
  return { title: stripTags(tag(head, "title")).slice(0, 200), items };
}

export const getFeed = (url: unknown) => {
  const u = publicUrl(url).toString();
  return cached(`feed:${u}`, 10 * 60_000, async () => parseFeed(await fetchText(u, "application/rss+xml, application/atom+xml, application/xml, text/xml")));
};

export type CalendarEvent = { title: string; start: string; allDay: boolean; location: string };

/** The next upcoming events of an ICS calendar (single events; recurring ones show their first occurrence). */
export function parseIcs(text: string, now = Date.now()): CalendarEvent[] {
  const unfolded = text.replace(/\r?\n[ \t]/g, "");
  const events: CalendarEvent[] = [];
  for (const block of unfolded.split("BEGIN:VEVENT").slice(1)) {
    const body = block.split("END:VEVENT")[0];
    const field = (name: string) => body.match(new RegExp(`^${name}(?:;[^:\\r\\n]*)?:(.*)$`, "m"))?.[1]?.trim() ?? "";
    const raw = field("DTSTART");
    const m = raw.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/);
    if (!m) continue;
    const allDay = !m[4];
    const start = allDay ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : m[7] ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6])) : new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
    if (start.getTime() < now - 86400_000) continue;
    events.push({ title: field("SUMMARY").replace(/\\([,;\\])/g, "$1").replace(/\\n/gi, " ").slice(0, 200) || "Busy", start: start.toISOString(), allDay, location: field("LOCATION").replace(/\\([,;\\])/g, "$1").slice(0, 200) });
  }
  return events.sort((a, b) => a.start.localeCompare(b.start)).slice(0, 25);
}

export const getCalendar = (url: unknown) => {
  // webcal:// is how calendar apps hand out ICS links.
  const u = publicUrl(String(url ?? "").replace(/^webcal:/i, "https:")).toString();
  return cached(`ics:${u}`, 15 * 60_000, async () => ({ events: parseIcs(await fetchText(u, "text/calendar")) }));
};

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS), headers: { accept: "application/json" } }).catch(() => null);
  if (!res?.ok) throw new HttpError(502, "The data service is unavailable. Try again later.", "fetch_failed");
  return (await res.json()) as T;
}

const num = (v: string | null, min: number, max: number) => {
  const n = Number(v);
  if (!v || !Number.isFinite(n) || n < min || n > max) throw new HttpError(400, "Invalid coordinates", "invalid_location");
  return Math.round(n * 100) / 100;
};

/** Open-Meteo: free, no key. Coordinates are rounded so nearby users share the cache. */
export function getWeather(lat: string | null, lon: string | null) {
  const la = num(lat, -90, 90);
  const lo = num(lon, -180, 180);
  return cached(`wx:${la},${lo}`, 20 * 60_000, () =>
    getJson(`https://api.open-meteo.com/v1/forecast?latitude=${la}&longitude=${lo}&current=temperature_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=6`),
  );
}

export function geocode(q: string | null) {
  const name = (q ?? "").trim().slice(0, 80);
  if (name.length < 2) throw new HttpError(400, "Type a city name", "invalid_location");
  return cached(`geo:${name.toLowerCase()}`, 24 * 3600_000, async () => {
    const r = await getJson<{ results?: { name: string; country?: string; admin1?: string; latitude: number; longitude: number }[] }>(`https://geocoding-api.open-meteo.com/v1/search?count=5&language=en&name=${encodeURIComponent(name)}`);
    return { places: (r.results ?? []).map((p) => ({ name: [p.name, p.admin1, p.country].filter(Boolean).join(", "), lat: p.latitude, lon: p.longitude })) };
  });
}

const CODE = /^[A-Z]{3}$/;
const COIN = /^[a-z0-9-]{2,40}$/;

/** Exchange rates (Frankfurter, ECB data) and crypto prices (CoinGecko), both free and keyless. */
export function getRates(base: string | null, symbols: string | null, coins: string | null) {
  const b = (base ?? "USD").toUpperCase();
  const to = (symbols ?? "").toUpperCase().split(",").filter((c) => CODE.test(c) && c !== b).slice(0, 10);
  const cs = (coins ?? "").toLowerCase().split(",").filter((c) => COIN.test(c)).slice(0, 10);
  if (!CODE.test(b)) throw new HttpError(400, "Unknown currency", "invalid_currency");
  return cached(`rates:${b}:${to.join()}:${cs.join()}`, 10 * 60_000, async () => {
    const [fx, crypto] = await Promise.all([
      to.length ? getJson<{ rates: Record<string, number> }>(`https://api.frankfurter.app/latest?from=${b}&to=${to.join(",")}`).catch(() => ({ rates: {} })) : { rates: {} },
      cs.length ? getJson<Record<string, Record<string, number>>>(`https://api.coingecko.com/api/v3/simple/price?ids=${cs.join(",")}&vs_currencies=${b.toLowerCase()}&include_24hr_change=true`).catch(() => ({})) : {},
    ]);
    return { base: b, rates: fx.rates, crypto };
  });
}
