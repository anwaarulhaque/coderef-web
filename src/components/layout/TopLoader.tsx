"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

const START_EVENT = "coderef:toploader-start";
const MAX_DURATION_MS = 8_000;

/** Path + query of a URL, ignoring the hash: decides whether a navigation re-renders a route */
function routeKey(url: URL) {
  return url.pathname.replace(/\/$/, "") + url.search;
}

/** True when `href` points to a different same-origin route than the current page */
function isRouteChange(href: string) {
  try {
    const target = new URL(href, window.location.href);
    return target.origin === window.location.origin && routeKey(target) !== routeKey(new URL(window.location.href));
  } catch {
    return false;
  }
}

/** Start the bar for a programmatic navigation (router.push) */
export function startTopLoader(href?: string) {
  if (!href || isRouteChange(href)) {
    window.dispatchEvent(new Event(START_EVENT));
  }
}

function TopLoaderBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const trickle = useRef<ReturnType<typeof setInterval>>(undefined);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const active = useRef(false);
  const committedKey = useRef("");

  const clearTimers = () => {
    clearInterval(trickle.current);
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const finish = () => {
    if (!active.current) return;
    active.current = false;
    clearTimers();
    setProgress(1);
    timers.current.push(
      setTimeout(() => setVisible(false), 250),
      setTimeout(() => setProgress(0), 500),
    );
  };

  const start = () => {
    clearTimers();
    active.current = true;
    setVisible(true);
    setProgress(0.12);

    // Dynamic easing: smoothly increments towards ~92% with micro-steps
    trickle.current = setInterval(() => {
      setProgress((p) => {
        if (p < 0.3) return p + 0.15;
        if (p < 0.6) return p + 0.08;
        if (p < 0.85) return p + 0.03;
        if (p < 0.94) return p + 0.008;
        return p;
      });
    }, 180);

    timers.current.push(setTimeout(finish, MAX_DURATION_MS));
  };

  // Initial page load sweep. Its end timer is owned by this effect: the listener effect's cleanup clears
  // `timers`, and if this one lived there too the bar would freeze part-way (React re-runs effects on mount
  // in development, and on any remount).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the sweep plays once, after mount
    start();
    const done = setTimeout(finish, 300);
    return () => {
      clearTimeout(done);
      finish();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for link clicks, back/forward buttons, and menu clicks
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as Element | null)?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;
      if (isRouteChange(anchor.href)) start();
    };

    const onPopState = () => {
      if (routeKey(new URL(window.location.href)) !== committedKey.current) start();
    };

    document.addEventListener("click", onClick, { capture: true });
    window.addEventListener(START_EVENT, start);
    window.addEventListener("popstate", onPopState);

    return () => {
      document.removeEventListener("click", onClick, { capture: true });
      window.removeEventListener(START_EVENT, start);
      window.removeEventListener("popstate", onPopState);
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When route finishes committing, finish loader
  useEffect(() => {
    const first = !committedKey.current;
    committedKey.current = routeKey(new URL(window.location.href));
    if (!first) finish(); // on first render, let the load sweep play out

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  return (
    <>
      {/* Top Laser Progress Bar with Animated Shimmer Gradient */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 z-[120] h-[3.5px] transition-opacity duration-300 overflow-hidden"
        style={{ opacity: visible ? 1 : 0 }}
      >
        <div
          className="relative h-full origin-left transition-transform duration-250 ease-out"
          style={{
            transform: `scaleX(${progress})`,
            background: "linear-gradient(90deg, #2563eb, #6366f1, #8b5cf6, #ec4899, #3b82f6)",
            backgroundSize: "250% 100%",
            boxShadow: "0 0 14px rgba(99, 102, 241, 0.75), 0 0 6px rgba(236, 72, 153, 0.55)",
          }}
        >
          {/* Glowing spark / peg on the leading edge */}
          <div className="absolute right-0 top-0 h-full w-28 -translate-y-0.5 rotate-3 bg-gradient-to-r from-transparent to-white/80 shadow-[0_0_12px_#ffffff]" />
        </div>
      </div>

      {/* Floating Animated Pill Indicator in Top-Right Corner */}
      {visible && (
        <div
          aria-hidden
          className="pointer-events-none fixed top-3 right-3 sm:right-6 z-[121] flex items-center gap-2 rounded-full border border-border/80 bg-surface/95 px-3 py-1 shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-200"
        >
          <svg className="size-3.5 animate-spin text-accent" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="text-[11px] font-bold text-foreground tracking-tight">Loading…</span>
        </div>
      )}
    </>
  );
}

/** Animated progress bar along the top of viewport during page load and client-side navigations */
export function TopLoader() {
  return (
    <Suspense fallback={null}>
      <TopLoaderBar />
    </Suspense>
  );
}
