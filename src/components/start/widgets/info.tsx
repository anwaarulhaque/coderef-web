"use client";

// Information widgets: RSS, news mix, weather, currency & crypto, quote of the day, ICS calendar and GitHub activity.
import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/account/client";
import { favicon } from "@/lib/start/client";
import { Icon, input } from "../ui";
import { cfg, type WidgetModule, type WidgetProps } from "./types";

type FeedItem = { title: string; url: string; date: string | null; summary: string };

/** Loads JSON for a widget; `key` changes refetch. Errors become a message instead of breaking the page. */
function useData<T>(key: string | null, load: () => Promise<T>) {
  const [state, setState] = useState<{ key: string | null; data: T | null; error: string | null }>({ key: null, data: null, error: null });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!key) return;
    let live = true;
    load()
      .then((data) => live && setState({ key, data, error: null }))
      .catch((e) => live && setState({ key, data: null, error: e instanceof ApiError ? e.message : "Couldn't load this right now." }));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` captures everything `load` depends on
  }, [key, tick]);
  const loading = !!key && state.key !== key && !state.error;
  return { data: state.key === key ? state.data : null, error: state.error, loading, reload: () => setTick((t) => t + 1) };
}

const ago = (iso: string | null) => {
  if (!iso) return "";
  const s = (Date.now() - Date.parse(iso)) / 1000;
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))}m`;
  if (s < 86400) return `${Math.round(s / 3600)}h`;
  return `${Math.round(s / 86400)}d`;
};

const Status = ({ loading, error, reload }: { loading: boolean; error: string | null; reload: () => void }) =>
  loading ? (
    <div className="space-y-2" aria-busy>
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-4 animate-pulse rounded bg-chip" />
      ))}
    </div>
  ) : error ? (
    <p className="text-sm text-muted">
      {error}{" "}
      <button type="button" onClick={reload} className="text-accent">
        Retry
      </button>
    </p>
  ) : null;

function FeedList({ items, summaries, onOpen, source }: { items: (FeedItem & { source?: string })[]; summaries: boolean; onOpen: (u: string) => void; source?: boolean }) {
  return (
    <ul className="space-y-1.5">
      {items.map((it, i) => (
        <li key={it.url + i} className="text-sm">
          <a href={it.url || undefined} target="_blank" rel="noopener noreferrer" onClick={() => onOpen(it.url)} className="flex gap-2 hover:text-accent">
            {source && it.url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={favicon(it.url)} alt="" width={14} height={14} className="mt-0.5 size-3.5" loading="lazy" />
            )}
            <span className="flex-1">{it.title}</span>
            <span className="shrink-0 text-xs text-muted">{ago(it.date)}</span>
          </a>
          {summaries && it.summary && <p className="mt-0.5 line-clamp-2 text-xs text-muted">{it.summary}</p>}
        </li>
      ))}
    </ul>
  );
}

const getFeed = (url: string) => api<{ title: string; items: FeedItem[] }>("GET", `/start/feed?url=${encodeURIComponent(url)}`);

function Rss({ widget, onOpen }: WidgetProps) {
  const url = cfg(widget, "url", "");
  const count = cfg(widget, "count", 8);
  const { data, error, loading, reload } = useData(url || null, () => getFeed(url));
  if (!url) return <p className="text-sm text-muted">Add a feed address in this widget&apos;s settings.</p>;
  return data ? <FeedList items={data.items.slice(0, count)} summaries={cfg(widget, "summaries", false)} onOpen={onOpen} /> : <Status loading={loading} error={error} reload={reload} />;
}

function MultiRss({ widget, onOpen }: WidgetProps) {
  const urls = cfg(widget, "urls", "")
    .split("\n")
    .map((u) => u.trim())
    .filter(Boolean)
    .slice(0, 10);
  const count = cfg(widget, "count", 12);
  const { data, error, loading, reload } = useData(urls.length ? urls.join("|") : null, async () => {
    const feeds = await Promise.allSettled(urls.map(getFeed));
    const items = feeds.flatMap((f) => (f.status === "fulfilled" ? f.value.items : []));
    if (!items.length) throw new ApiError(502, "fetch_failed", "None of these feeds could be loaded.");
    return items.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
  });
  if (!urls.length) return <p className="text-sm text-muted">Add feed addresses (one per line) in this widget&apos;s settings.</p>;
  return data ? <FeedList items={data.slice(0, count)} summaries={false} onOpen={onOpen} source /> : <Status loading={loading} error={error} reload={reload} />;
}

const WEATHER: Record<number, [string, string]> = {
  0: ["☀️", "Clear"], 1: ["🌤️", "Mostly clear"], 2: ["⛅", "Partly cloudy"], 3: ["☁️", "Cloudy"], 45: ["🌫️", "Fog"], 48: ["🌫️", "Fog"],
  51: ["🌦️", "Drizzle"], 53: ["🌦️", "Drizzle"], 55: ["🌦️", "Drizzle"], 61: ["🌧️", "Rain"], 63: ["🌧️", "Rain"], 65: ["🌧️", "Heavy rain"],
  71: ["🌨️", "Snow"], 73: ["🌨️", "Snow"], 75: ["❄️", "Heavy snow"], 80: ["🌦️", "Showers"], 81: ["🌧️", "Showers"], 82: ["⛈️", "Storms"],
  95: ["⛈️", "Thunderstorm"], 96: ["⛈️", "Thunderstorm"], 99: ["⛈️", "Thunderstorm"],
};
type Forecast = { current: { temperature_2m: number; weather_code: number; wind_speed_10m: number }; daily: { time: string[]; weather_code: number[]; temperature_2m_max: number[]; temperature_2m_min: number[] } };

function Weather({ widget, canEdit, update }: WidgetProps) {
  const place = cfg<{ name: string; lat: number; lon: number } | null>(widget, "place", null);
  const fahrenheit = cfg(widget, "units", "c") === "f";
  const [q, setQ] = useState("");
  const [results, setResults] = useState<{ name: string; lat: number; lon: number }[]>([]);
  const { data, error, loading, reload } = useData(place ? `${place.lat},${place.lon}` : null, () => api<Forecast>("GET", `/start/weather?lat=${place!.lat}&lon=${place!.lon}`));
  const t = (c: number) => `${Math.round(fahrenheit ? c * 1.8 + 32 : c)}°`;
  if (!place)
    return canEdit ? (
      <div>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setResults((await api<{ places: typeof results }>("GET", `/start/geocode?q=${encodeURIComponent(q)}`).catch(() => ({ places: [] }))).places);
          }}
        >
          <input className={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find your city" aria-label="City" />
        </form>
        <ul className="mt-1.5 space-y-0.5">
          {results.map((r) => (
            <li key={`${r.lat},${r.lon}`}>
              <button type="button" onClick={() => update({ config: { ...widget.config, place: r } })} className="text-left text-sm hover:text-accent">
                {r.name}
              </button>
            </li>
          ))}
        </ul>
      </div>
    ) : (
      <p className="text-sm text-muted">No city set.</p>
    );
  if (!data) return <Status loading={loading} error={error} reload={reload} />;
  const [emoji, label] = WEATHER[data.current.weather_code] ?? ["🌡️", ""];
  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="text-4xl" aria-hidden>
          {emoji}
        </span>
        <div>
          <p className="text-3xl font-semibold tabular-nums">{t(data.current.temperature_2m)}</p>
          <p className="text-xs text-muted">
            {label} · {place.name.split(",")[0]}
          </p>
        </div>
      </div>
      <ul className="mt-3 grid grid-cols-5 gap-1 text-center text-xs">
        {data.daily.time.slice(1, 6).map((d, i) => (
          <li key={d} className="rounded-md bg-chip py-1.5">
            <p className="text-muted">{new Date(d).toLocaleDateString(undefined, { weekday: "short" })}</p>
            <p aria-hidden>{(WEATHER[data.daily.weather_code[i + 1]] ?? ["🌡️"])[0]}</p>
            <p className="tabular-nums">
              {t(data.daily.temperature_2m_max[i + 1])}
              <span className="text-muted"> {t(data.daily.temperature_2m_min[i + 1])}</span>
            </p>
          </li>
        ))}
      </ul>
      {canEdit && (
        <button type="button" onClick={() => update({ config: { ...widget.config, place: null } })} className="mt-2 text-xs text-muted hover:text-accent">
          Change city
        </button>
      )}
    </div>
  );
}

function Ticker({ widget }: WidgetProps) {
  const base = cfg(widget, "base", "USD").toUpperCase();
  const symbols = cfg(widget, "symbols", "EUR,GBP,JPY,INR");
  const coins = cfg(widget, "coins", "bitcoin,ethereum");
  type Rates = { base: string; rates: Record<string, number>; crypto: Record<string, Record<string, number>> };
  const { data, error, loading, reload } = useData(`${base}|${symbols}|${coins}`, () => api<Rates>("GET", `/start/rates?base=${base}&symbols=${encodeURIComponent(symbols)}&coins=${encodeURIComponent(coins)}`));
  if (!data) return <Status loading={loading} error={error} reload={reload} />;
  const b = base.toLowerCase();
  return (
    <ul className="divide-y divide-border text-sm">
      {Object.entries(data.rates).map(([k, v]) => (
        <li key={k} className="flex justify-between py-1">
          <span>
            1 {base} → {k}
          </span>
          <span className="font-mono tabular-nums">{v.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
        </li>
      ))}
      {Object.entries(data.crypto).map(([k, v]) => {
        const change = v[`${b}_24h_change`];
        return (
          <li key={k} className="flex justify-between py-1">
            <span className="capitalize">{k}</span>
            <span className="font-mono tabular-nums">
              {v[b]?.toLocaleString(undefined, { maximumFractionDigits: 2 })} {base}
              {Number.isFinite(change) && <span className={`ml-1.5 text-xs ${change >= 0 ? "text-green-600" : "text-red-500"}`}>{change >= 0 ? "▲" : "▼"} {Math.abs(change).toFixed(1)}%</span>}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

const QUOTES: [string, string][] = [
  ["Simplicity is prerequisite for reliability.", "Edsger W. Dijkstra"],
  ["Programs must be written for people to read, and only incidentally for machines to execute.", "Harold Abelson"],
  ["The best way to predict the future is to invent it.", "Alan Kay"],
  ["Make it work, make it right, make it fast.", "Kent Beck"],
  ["First, solve the problem. Then, write the code.", "John Johnson"],
  ["Well begun is half done.", "Aristotle"],
  ["It always seems impossible until it's done.", "Nelson Mandela"],
  ["Done is better than perfect.", "Sheryl Sandberg"],
  ["The secret of getting ahead is getting started.", "Mark Twain"],
  ["Talk is cheap. Show me the code.", "Linus Torvalds"],
  ["Any fool can write code that a computer can understand. Good programmers write code that humans can understand.", "Martin Fowler"],
  ["Focus is saying no to a thousand good ideas.", "Steve Jobs"],
  ["What we know is a drop, what we don't know is an ocean.", "Isaac Newton"],
  ["Quality is not an act, it is a habit.", "Aristotle"],
  ["Small daily improvements are the key to staggering long-term results.", "Robin Sharma"],
  ["The only way to go fast is to go well.", "Robert C. Martin"],
];

function Quote() {
  const [i, setI] = useState<number | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the day's quote depends on the visitor's clock
    setI(Math.floor(Date.now() / 86400_000) % QUOTES.length);
  }, []);
  if (i === null) return <div className="h-16" />;
  const [text, who] = QUOTES[i];
  return (
    <figure>
      <blockquote className="text-base leading-snug font-medium">“{text}”</blockquote>
      <figcaption className="mt-1.5 flex items-center justify-between text-xs text-muted">
        — {who}
        <button type="button" onClick={() => setI((i + 1) % QUOTES.length)} aria-label="Next quote" className="hover:text-accent">
          <Icon name="refresh" size={12} />
        </button>
      </figcaption>
    </figure>
  );
}

function Ics({ widget }: WidgetProps) {
  const url = cfg(widget, "url", "");
  type Ev = { title: string; start: string; allDay: boolean; location: string };
  const { data, error, loading, reload } = useData(url || null, () => api<{ events: Ev[] }>("GET", `/start/calendar?url=${encodeURIComponent(url)}`));
  if (!url) return <p className="text-sm text-muted">Paste your calendar&apos;s secret ICS address in this widget&apos;s settings (Google Calendar: Settings → Integrate calendar; Outlook: Shared calendars → Publish).</p>;
  if (!data) return <Status loading={loading} error={error} reload={reload} />;
  if (!data.events.length) return <p className="text-sm text-muted">Nothing coming up.</p>;
  const dayOf = (iso: string) => new Date(iso).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
  const events = data.events.slice(0, cfg(widget, "count", 8));
  return (
    <ul className="space-y-1 text-sm">
      {events.map((e, i) => {
        const d = new Date(e.start);
        const day = dayOf(e.start);
        const head = i === 0 || dayOf(events[i - 1].start) !== day;
        return (
          <li key={i}>
            {head && <p className="mt-1.5 text-xs font-semibold text-muted">{day}</p>}
            <p className="flex gap-2">
              <span className="w-12 shrink-0 text-xs tabular-nums text-muted">{e.allDay ? "all day" : d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</span>
              <span className="flex-1">{e.title}</span>
            </p>
          </li>
        );
      })}
    </ul>
  );
}

type GhEvent = { id: string; type: string; repo: { name: string }; created_at: string; payload: { action?: string; ref_type?: string; commits?: unknown[]; pull_request?: { title: string; html_url: string }; issue?: { title: string; html_url: string } } };

function Github({ widget, onOpen }: WidgetProps) {
  const target = cfg(widget, "target", "").trim().replace(/^https:\/\/github\.com\//, "");
  const valid = /^[\w.-]+(\/[\w.-]+)?$/.test(target);
  const { data, error, loading, reload } = useData(valid ? target : null, async () => {
    const res = await fetch(`https://api.github.com/${target.includes("/") ? "repos" : "users"}/${target}/events/public?per_page=15`, { headers: { accept: "application/vnd.github+json" } });
    if (!res.ok) throw new ApiError(res.status, "github", res.status === 404 ? "No such GitHub user or repository." : "GitHub is rate-limiting requests. Try again soon.");
    return (await res.json()) as GhEvent[];
  });
  if (!valid) return <p className="text-sm text-muted">Set a GitHub user (octocat) or repository (vercel/next.js) in settings.</p>;
  if (!data) return <Status loading={loading} error={error} reload={reload} />;
  const describe = (e: GhEvent) => {
    const p = e.payload;
    switch (e.type) {
      case "PushEvent":
        return `pushed ${p.commits?.length ?? ""} commit${p.commits?.length === 1 ? "" : "s"}`;
      case "PullRequestEvent":
        return `${p.action} PR: ${p.pull_request?.title}`;
      case "IssuesEvent":
        return `${p.action} issue: ${p.issue?.title}`;
      case "WatchEvent":
        return "starred";
      case "CreateEvent":
        return `created ${p.ref_type}`;
      case "ReleaseEvent":
        return "published a release";
      case "ForkEvent":
        return "forked";
      default:
        return e.type.replace(/Event$/, "");
    }
  };
  return (
    <ul className="space-y-1.5 text-sm">
      {data.slice(0, cfg(widget, "count", 8)).map((e) => {
        const href = e.payload.pull_request?.html_url ?? e.payload.issue?.html_url ?? `https://github.com/${e.repo.name}`;
        return (
          <li key={e.id}>
            <a href={href} target="_blank" rel="noopener noreferrer" onClick={() => onOpen(href)} className="block hover:text-accent">
              <span className="line-clamp-1">{describe(e)}</span>
              <span className="text-xs text-muted">
                {e.repo.name} · {ago(e.created_at)}
              </span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}

export const INFO_WIDGETS: Record<string, WidgetModule> = {
  rss: {
    View: Rss,
    defaults: { config: { count: 8 } },
    settings: [
      { key: "url", label: "Feed address (RSS or Atom)", kind: "url", placeholder: "https://hnrss.org/frontpage" },
      { key: "count", label: "Headlines", kind: "number", min: 1, max: 30 },
      { key: "summaries", label: "Show summaries", kind: "toggle" },
    ],
  },
  multirss: {
    View: MultiRss,
    defaults: { config: { count: 12 } },
    settings: [
      { key: "urls", label: "Feed addresses, one per line", kind: "textarea", placeholder: "https://hnrss.org/frontpage\nhttps://www.theverge.com/rss/index.xml" },
      { key: "count", label: "Headlines", kind: "number", min: 1, max: 50 },
    ],
  },
  weather: { View: Weather, settings: [{ key: "units", label: "Units", kind: "select", options: [{ value: "c", label: "Celsius" }, { value: "f", label: "Fahrenheit" }] }] },
  ticker: {
    View: Ticker,
    defaults: { config: { base: "USD", symbols: "EUR,GBP,JPY,INR", coins: "bitcoin,ethereum" } },
    settings: [
      { key: "base", label: "Base currency", kind: "text", placeholder: "USD" },
      { key: "symbols", label: "Currencies (comma separated)", kind: "text", placeholder: "EUR,GBP,JPY" },
      { key: "coins", label: "Crypto (CoinGecko ids, comma separated)", kind: "text", placeholder: "bitcoin,ethereum,solana" },
    ],
  },
  quote: { View: Quote },
  ics: {
    View: Ics,
    settings: [
      { key: "url", label: "Calendar ICS address", kind: "url", placeholder: "https://calendar.google.com/calendar/ical/…/basic.ics" },
      { key: "count", label: "Events", kind: "number", min: 1, max: 25 },
    ],
  },
  github: {
    View: Github,
    settings: [
      { key: "target", label: "GitHub user or owner/repo", kind: "text", placeholder: "vercel/next.js" },
      { key: "count", label: "Items", kind: "number", min: 1, max: 15 },
    ],
  },
};

