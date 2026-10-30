"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

/** One part of the day, from `from` to `to` (hours, 24h clock), and the tool that fits it. */
type Moment = { from: number; to: number; title: string; text: string; tool: string; href: string };

const MOMENTS: Moment[] = [
  { from: 6, to: 10, title: "Morning.", text: "Standup in ten minutes. Find the command you always forget.", tool: "Quick Reference", href: "/quick-reference/" },
  { from: 10, to: 13.5, title: "Noon.", text: "Wiring up an API. Send the request, then make sense of the response.", tool: "REST API Client", href: "/rest-api-client/" },
  { from: 13.5, to: 17, title: "Afternoon.", text: "That one validation rule. Build the regex and watch every match light up.", tool: "Regex Tester", href: "/regex-tester/" },
  { from: 17, to: 20.5, title: "Evening.", text: "Time to merge. Practise the rebase before you run it for real.", tool: "Git Playground", href: "/git-branching/" },
  { from: 20.5, to: 24, title: "Night.", text: "Side-project hours. Pick a dark design system and let your agent build it.", tool: "Dark DESIGN.md files", href: "/design-md/?theme=dark" },
];

const START = 6;
const END = 24;

// Sky gradient (top, bottom) at fixed hours; colors in between are blended.
const SKY: [number, string, string][] = [
  [6, "#2b2f55", "#d98f7b"],
  [7.5, "#f2a97e", "#fde3c4"],
  [10, "#6cb4f5", "#d5ebff"],
  [13, "#4a9ef0", "#cfe6ff"],
  [16, "#6aa3e6", "#f1d8b6"],
  [18.5, "#e07a55", "#f9bf8a"],
  [20, "#3b2f63", "#7a4b6e"],
  [21.5, "#161d36", "#3b3a55"],
  [24, "#0b1022", "#1f2340"],
];

// Hill colors by day and by night (back, middle, front).
const HILLS_DAY = ["#a9c7dc", "#6f9bba", "#3d6b8c"];
const HILLS_NIGHT = ["#313757", "#1f253e", "#0f1324"];

// Hill heights (0–1) at every hour from midnight to midnight. Decorative shapes, not statistics.
const HEIGHTS = [
  [0.48, 0.47, 0.44, 0.44, 0.45, 0.47, 0.5, 0.54, 0.58, 0.6, 0.62, 0.63, 0.65, 0.67, 0.66, 0.64, 0.62, 0.6, 0.58, 0.57, 0.56, 0.55, 0.54, 0.53, 0.53],
  [0.23, 0.22, 0.2, 0.17, 0.15, 0.15, 0.2, 0.25, 0.32, 0.41, 0.48, 0.55, 0.52, 0.45, 0.4, 0.31, 0.36, 0.43, 0.48, 0.52, 0.45, 0.38, 0.33, 0.29, 0.29],
  [0.1, 0.06, 0.03, 0.02, 0.02, 0.03, 0.1, 0.18, 0.33, 0.44, 0.5, 0.61, 0.53, 0.39, 0.22, 0.17, 0.24, 0.42, 0.6, 0.55, 0.43, 0.32, 0.24, 0.19, 0.19],
];

const W = 1000;
const H = 400;
/** Where an hour sits across the stage: 6 AM at the left edge (0), midnight at the right edge (1). */
const across = (hour: number) => (hour - START) / (END - START);
const point = (heights: number[], hour: number) => [across(hour) * W, H - heights[hour] * H * 0.9] as const;
const HOURS = Array.from({ length: END - START + 1 }, (_, i) => START + i);

/** A smooth closed hill through the hourly points of the day (Catmull-Rom as cubic Béziers). */
function hillPath(heights: number[]): string {
  const pts = HOURS.map((h) => point(heights, h));
  let d = `M0,${H} L${pts[0][0]},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [p0, p1, p2, p3] = [pts[Math.max(i - 1, 0)], pts[i], pts[i + 1], pts[Math.min(i + 2, pts.length - 1)]];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return `${d} L${W},${H} Z`;
}

const PATHS = HEIGHTS.map(hillPath);

const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

function mix(a: string, b: string, t: number): string {
  const ch = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  return `rgb(${[0, 1, 2].map((i) => Math.round(ch(a, i) + (ch(b, i) - ch(a, i)) * t)).join(",")})`;
}

function skyAt(hour: number): [string, string] {
  const i = Math.max(0, SKY.findIndex(([h]) => h > hour) - 1);
  const [h0, top0, bot0] = SKY[i];
  const [h1, top1, bot1] = SKY[Math.min(i + 1, SKY.length - 1)];
  const t = h1 === h0 ? 0 : clamp((hour - h0) / (h1 - h0));
  return [mix(top0, top1, t), mix(bot0, bot1, t)];
}

/** Height of the front hill at an hour, as a share of the hills' height (for the marker pin). */
function frontHeight(hour: number): number {
  const i = Math.min(Math.max(Math.floor(hour), START), END - 1);
  const [, y0] = point(HEIGHTS[2], i);
  const [, y1] = point(HEIGHTS[2], i + 1);
  return 1 - (y0 + (y1 - y0) * (hour - i)) / H;
}

const formatHour = (hour: number) => {
  const h = Math.floor(hour) % 24;
  const m = Math.floor((hour % 1) * 4) * 15;
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};

// Fixed pseudo-random star positions, so the server and client render the same sky.
const STARS = Array.from({ length: 48 }, (_, i) => ({
  left: (i * 37.7) % 100,
  top: (i * 23.3) % 55,
  size: i % 7 === 0 ? 2.5 : 1.5,
}));

const LABELS = [6, 9, 12, 15, 18, 21, 24];

/**
 * A developer's day as one scroll: the stage stays pinned while the page scrolls through it, and the time runs
 * from 6 AM to midnight — sky, sun, moon, stars and hills follow the clock, and each part of the day points to
 * the coderef tool that fits it.
 */
export function DeveloperDay() {
  const ref = useRef<HTMLElement>(null);
  const [hour, setHour] = useState(START);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const el = ref.current;
      if (!el) return;
      const { top, height } = el.getBoundingClientRect();
      const travel = height - window.innerHeight;
      setHour(START + (END - START - 0.01) * clamp(travel > 0 ? -top / travel : 0));
    };
    const onScroll = () => {
      frame ||= requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const [skyTop, skyBottom] = skyAt(hour);
  const daylight = smooth(5.5, 8, hour) * (1 - smooth(18, 20.5, hour));
  const night = smooth(19.5, 21.5, hour);
  const sunT = clamp((hour - 6) / 13);
  const moment = MOMENTS.find((m) => hour >= m.from && hour < m.to) ?? MOMENTS[MOMENTS.length - 1];
  const pin = frontHeight(hour);

  return (
    // Full-bleed: breaks out of the page's max-width container to the whole viewport width.
    <section ref={ref} aria-label="A developer's day with coderef" className="relative left-1/2 mb-12 h-[320vh] w-screen -translate-x-1/2">
      <div
        className="sticky top-14 h-[calc(100svh-3.5rem)] min-h-[30rem] overflow-hidden text-white"
        style={{ background: `linear-gradient(to bottom, ${skyTop}, ${skyBottom})` }}
      >
        <div aria-hidden className="absolute inset-0" style={{ opacity: night }}>
          {STARS.map((s, i) => (
            <span key={i} className="absolute rounded-full bg-white/80" style={{ left: `${s.left}%`, top: `${s.top}%`, width: s.size, height: s.size }} />
          ))}
        </div>
        <span
          aria-hidden
          className="absolute size-16 -translate-x-1/2 rounded-full bg-[#ffd98a] shadow-[0_0_60px_20px_rgba(255,200,110,0.45)] md:size-20"
          style={{ left: `${8 + 84 * sunT}%`, top: `${62 - 46 * Math.sin(Math.PI * sunT)}%`, opacity: daylight }}
        />
        <span
          aria-hidden
          className="absolute right-[12%] top-[14%] size-12 rounded-full bg-[#eef1ff] md:size-14"
          style={{ opacity: night, boxShadow: "inset -10px -4px 0 0 #c9cfe8, 0 0 40px 8px rgba(220,225,255,0.3)" }}
        />

        <div className="relative z-10 mx-auto max-w-3xl px-5 pt-8 text-center md:pt-12">
          <p className="font-mono text-5xl font-semibold tabular-nums tracking-tight drop-shadow md:text-7xl">{formatHour(hour)}</p>
          <div className="relative mx-auto mt-5 min-h-28 max-w-xl">
            {MOMENTS.map((m) => {
              const on = m === moment;
              return (
                <div
                  key={m.title}
                  inert={!on}
                  className={`absolute inset-x-0 top-0 rounded-xl bg-black/25 px-5 py-4 backdrop-blur-sm transition-all duration-500 ${on ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}
                >
                  <p className="text-base md:text-lg">
                    <b>{m.title}</b> {m.text}
                  </p>
                  <Link href={m.href} className="mt-2 inline-block text-sm font-semibold underline decoration-white/50 underline-offset-4 hover:decoration-white">
                    Open {m.tool} →
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 h-[42%]">
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden className="absolute inset-0 size-full">
            {PATHS.map((d, i) => (
              <path key={i} d={d} fill={mix(HILLS_NIGHT[i], HILLS_DAY[i], daylight)} />
            ))}
          </svg>
          {/* Kept a hair inside the edges so the pin is never cut off at 6 AM or midnight. */}
          <div aria-hidden className="absolute bottom-0" style={{ left: `${clamp(across(hour), 0.01, 0.99) * 100}%`, height: `${pin * 100}%` }}>
            <span className="absolute bottom-0 left-0 h-full w-px bg-white/60" />
            <span className="absolute -top-1.5 -left-1.5 size-3 rounded-full bg-white shadow" />
            <span className={`absolute -top-9 whitespace-nowrap rounded-full bg-black/45 px-3 py-1 text-xs font-medium backdrop-blur-sm ${hour > 19 ? "right-2" : "left-2"}`}>
              {formatHour(hour).replace(/:\d\d/, "")} · {moment.tool}
            </span>
          </div>
          {/* The first and last labels align inward so they stay fully visible at the edges. */}
          <div aria-hidden className="absolute inset-x-3 bottom-3 text-[10px] font-medium whitespace-nowrap text-white/80 drop-shadow sm:text-xs">
            {LABELS.map((h, i) => (
              <span
                key={h}
                className={`absolute ${i === 0 ? "" : i === LABELS.length - 1 ? "-translate-x-full" : "-translate-x-1/2"}`}
                style={{ left: `${across(h) * 100}%` }}
              >
                {h % 12 || 12} {h % 24 < 12 ? "AM" : "PM"}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
