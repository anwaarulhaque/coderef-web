"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { NAV, type NavGroup } from "@/lib/site";

const normalize = (p: string) => p.replace(/\/?$/, "/");

function isActive(pathname: string, href: string) {
  const path = normalize(pathname);
  const target = normalize(href.split("#")[0]);
  return target === "/" ? path === "/" : path.startsWith(target);
}

function isGroupActive(pathname: string, g: NavGroup): boolean {
  if (g.href) return isActive(pathname, g.href);
  if (g.sections) {
    return g.sections.some((sec) => sec.items.some((i) => i.href !== "/" && isActive(pathname, i.href)));
  }
  if (g.items) {
    return g.items.some((i) => i.href !== "/" && isActive(pathname, i.href));
  }
  return false;
}

function Logo() {
  return (
    <Link href="/" className="shrink-0 font-mono text-lg font-semibold tracking-tight" aria-label="coderef home">
      code<span className="text-accent">ref</span>
    </Link>
  );
}

/** Rich Mega Menu or Dropdown */
function NavDropdown({ group, pathname }: { group: NavGroup; pathname: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const openedByHover = useRef(false);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const active = isGroupActive(pathname, group);

  return (
    <div
      ref={ref}
      className="relative"
      onMouseLeave={() => {
        openedByHover.current = false;
        setOpen(false);
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => {
          if (openedByHover.current) openedByHover.current = false;
          else setOpen((o) => !o);
        }}
        onMouseEnter={() => {
          if (!open) openedByHover.current = true;
          setOpen(true);
        }}
        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${
          active ? "bg-chip font-semibold text-foreground" : "text-muted hover:bg-chip hover:text-foreground"
        }`}
      >
        <span>{group.label}</span>
        {group.badge && (
          <span className="rounded-full bg-accent px-1.5 py-0.2 text-[10px] font-bold text-white">
            {group.badge}
          </span>
        )}
        <svg
          aria-hidden
          width="10"
          height="10"
          viewBox="0 0 10 10"
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <path d="M2 3.5 5 6.5 8 3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-40 pt-2 animate-in fade-in zoom-in-95 duration-100">
          {/* Case 1: Mega Menu with Sections */}
          {group.sections ? (
            <div
              className={`rounded-2xl border border-border bg-surface/98 p-5 shadow-2xl backdrop-blur-xl ${
                group.featured ? "w-[820px] lg:w-[890px]" : "w-[760px] lg:w-[820px]"
              }`}
            >
              <div className="grid gap-6" style={{ gridTemplateColumns: group.featured ? "260px 1fr 1fr" : "repeat(3, 1fr)" }}>
                {/* Optional Left Featured Card */}
                {group.featured && (
                  <div className="flex flex-col justify-between rounded-xl border border-accent/25 bg-gradient-to-b from-accent/10 via-surface to-surface p-4 shadow-xs">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                          {group.featured.badge ?? "Featured"}
                        </span>
                        {/* 5 mini color dots */}
                        <div className="flex -space-x-1">
                          {["#050315", "#fbfbfe", "#2f27ce", "#dedcff", "#433bff"].map((c, i) => (
                            <span key={i} className="size-3 rounded-full border border-black/20" style={{ backgroundColor: c }} />
                          ))}
                        </div>
                      </div>

                      <h4 className="mt-3 font-bold text-base text-foreground tracking-tight">
                        {group.featured.title}
                      </h4>
                      <p className="mt-0.5 text-xs font-semibold text-accent">
                        {group.featured.tagline}
                      </p>
                      <p className="mt-2 text-xs text-muted leading-relaxed">
                        {group.featured.description}
                      </p>
                    </div>

                    <Link
                      href={group.featured.href}
                      onClick={() => setOpen(false)}
                      className="mt-4 flex items-center justify-center gap-1.5 rounded-lg bg-accent py-2 text-xs font-bold text-white shadow-xs hover:opacity-90 transition-all"
                    >
                      <span>Launch Studio</span>
                      <span>→</span>
                    </Link>
                  </div>
                )}

                {/* Columns for Sections */}
                {group.sections.map((section) => (
                  <div key={section.title} className="space-y-1">
                    <div className="border-b border-border/80 pb-1.5 mb-2 px-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
                        {section.title}
                      </span>
                    </div>

                    {section.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        aria-current={isActive(pathname, item.href) && !item.href.includes("#") ? "page" : undefined}
                        className="group block rounded-lg px-2.5 py-1.5 hover:bg-chip aria-[current=page]:bg-accent/10 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-foreground group-hover:text-accent transition-colors">
                            {item.label}
                          </span>
                          {item.badge && (
                            <span className="rounded bg-accent/15 px-1.5 py-0.2 text-[9px] font-bold text-accent">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted line-clamp-1 leading-snug mt-0.5">
                          {item.description}
                        </p>
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Case 2: Standard Dropdown for simple item lists */
            <div className="w-80 rounded-xl border border-border bg-surface p-2 shadow-xl">
              {group.items?.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={isActive(pathname, item.href) && !item.href.includes("#") ? "page" : undefined}
                  className="block rounded-lg px-3 py-2 hover:bg-chip aria-[current=page]:bg-accent/10 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{item.label}</span>
                    {item.badge && (
                      <span className="rounded bg-accent/15 px-1.5 py-0.2 text-[10px] font-bold text-accent">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className="block text-xs text-muted mt-0.5">{item.description}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close the mobile menu after navigating.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- close menu on route change */
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header className="no-print sticky top-0 z-30 border-b border-border bg-surface/90 backdrop-blur supports-[backdrop-filter]:bg-surface/75">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
        <Logo />

        {/* Desktop Main Navigation */}
        <nav aria-label="Main" className="hidden flex-1 items-center gap-1 lg:flex">
          {NAV.map((g) => {
            // Highlighted Featured Pill (e.g. Realtime Colors direct button)
            if (g.highlight && g.href) {
              return (
                <Link
                  key={g.label}
                  href={g.href}
                  className="flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-bold text-accent hover:bg-accent/20 transition-all shadow-xs"
                >
                  <span className="size-2 rounded-full bg-accent animate-pulse" />
                  <span>{g.label}</span>
                  {g.badge && (
                    <span className="rounded bg-accent px-1.5 py-0.2 text-[9px] font-bold text-white">
                      {g.badge}
                    </span>
                  )}
                </Link>
              );
            }

            // Group with Sections or Items (Mega Menu or Dropdown)
            if (g.sections || g.items) {
              return <NavDropdown key={g.label} group={g} pathname={pathname} />;
            }

            // Standalone Link
            return (
              <Link
                key={g.label}
                href={g.href!}
                aria-current={isGroupActive(pathname, g) ? "page" : undefined}
                className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                  isGroupActive(pathname, g)
                    ? "bg-chip font-semibold text-foreground"
                    : "text-muted hover:bg-chip hover:text-foreground"
                }`}
              >
                {g.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Section: Global Search & Mobile Hamburger */}
        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <GlobalSearch />
          <button
            type="button"
            className="flex size-9 items-center justify-center rounded-lg border border-border lg:hidden"
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen((o) => !o)}
          >
            <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {mobileOpen ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <nav
          id="mobile-menu"
          aria-label="Mobile Navigation"
          className="max-h-[calc(100vh-3.5rem)] overflow-y-auto border-t border-border px-4 py-4 lg:hidden bg-surface"
        >
          {NAV.map((g) => {
            if (g.sections) {
              return (
                <div key={g.label} className="border-b border-border/60 py-3 last:border-b-0">
                  <p className="px-2 font-bold text-xs uppercase tracking-wide text-muted">{g.label}</p>
                  {g.sections.map((sec) => (
                    <div key={sec.title} className="mt-2 pl-2">
                      <p className="text-[11px] font-semibold text-accent">{sec.title}</p>
                      <div className="mt-1 space-y-0.5">
                        {sec.items.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="block rounded-lg px-2 py-1.5 text-xs text-foreground hover:bg-chip"
                          >
                            <span className="font-medium">{item.label}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              );
            }

            if (g.items) {
              return (
                <div key={g.label} className="border-b border-border/60 py-3 last:border-b-0">
                  <p className="px-2 font-bold text-xs uppercase tracking-wide text-muted">{g.label}</p>
                  <div className="mt-1 space-y-0.5 pl-2">
                    {g.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="block rounded-lg px-2 py-1.5 text-xs text-foreground hover:bg-chip"
                      >
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            }

            return (
              <div key={g.label} className="border-b border-border/60 py-2.5 last:border-b-0">
                <Link
                  href={g.href!}
                  className={`flex items-center justify-between rounded-lg px-2 py-1.5 text-xs font-bold ${
                    g.highlight ? "text-accent bg-accent/10" : "text-foreground hover:bg-chip"
                  }`}
                >
                  <span>{g.label}</span>
                  {g.badge && (
                    <span className="rounded bg-accent px-1.5 py-0.2 text-[9px] font-bold text-white">
                      {g.badge}
                    </span>
                  )}
                </Link>
              </div>
            );
          })}
        </nav>
      )}
    </header>
  );
}
