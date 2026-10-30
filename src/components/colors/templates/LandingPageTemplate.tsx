"use client";

import React from "react";

export function LandingPageTemplate() {
  return (
    <div className="w-full transition-colors duration-300" style={{ backgroundColor: "var(--rt-background)", color: "var(--rt-text)" }}>
      {/* Navigation */}
      <header className="border-b px-6 py-4 md:px-12" style={{ borderColor: "color-mix(in srgb, var(--rt-text) 12%, transparent)" }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex size-9 items-center justify-center rounded-xl font-bold shadow-sm"
              style={{ backgroundColor: "var(--rt-primary)", color: "var(--rt-background)" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight">RefDesign</span>
          </div>

          <nav className="hidden items-center gap-8 text-sm font-medium md:flex opacity-90">
            <a href="#features" className="hover:opacity-100 transition-opacity">Product</a>
            <a href="#features" className="hover:opacity-100 transition-opacity">Features</a>
            <a href="#pricing" className="hover:opacity-100 transition-opacity">Pricing</a>
            <a href="#testimonials" className="hover:opacity-100 transition-opacity">Showcase</a>
            <a href="#faq" className="hover:opacity-100 transition-opacity">Docs</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg px-4 py-2 text-sm font-semibold transition-all hover:opacity-85"
              style={{
                backgroundColor: "var(--rt-secondary)",
                color: "var(--rt-text)",
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              className="rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition-all hover:opacity-90 active:scale-95"
              style={{
                backgroundColor: "var(--rt-primary)",
                color: "var(--rt-background)",
              }}
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-6 py-16 md:px-12 md:py-24 text-center">
        <div className="mx-auto max-w-4xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold shadow-xs mb-8"
            style={{
              backgroundColor: "var(--rt-secondary)",
              color: "var(--rt-text)",
              border: "1px solid color-mix(in srgb, var(--rt-text) 15%, transparent)"
            }}
          >
            <span className="size-2 rounded-full animate-pulse" style={{ backgroundColor: "var(--rt-accent)" }} />
            <span>Introducing Realtime Colors 2.0</span>
            <span className="opacity-70">→</span>
          </div>

          <h1
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.12]"
            style={{ color: "var(--rt-text)", fontFamily: "var(--rt-font-heading)" }}
          >
            Build stunning digital products with{" "}
            <span
              className="underline decoration-wavy decoration-2 underline-offset-8"
              style={{ color: "var(--rt-primary)", textDecorationColor: "var(--rt-accent)" }}
            >
              realtime harmony
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg opacity-80 leading-relaxed">
            Preview, test, and validate color palettes directly on real-world dashboards, web apps, and articles.
            Guaranteed WCAG accessible contrast and instant CSS &amp; Tailwind export.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              className="flex items-center gap-2 rounded-xl px-6 py-3.5 text-base font-semibold shadow-md transition-all hover:opacity-90 hover:shadow-lg active:scale-95"
              style={{
                backgroundColor: "var(--rt-primary)",
                color: "var(--rt-background)",
              }}
            >
              <span>Start Free Trial</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
            <button
              type="button"
              className="flex items-center gap-2 rounded-xl px-6 py-3.5 text-base font-semibold transition-all hover:opacity-85"
              style={{
                backgroundColor: "var(--rt-secondary)",
                color: "var(--rt-text)",
                border: "1px solid color-mix(in srgb, var(--rt-text) 18%, transparent)",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              <span>Watch 2-Min Demo</span>
            </button>
          </div>

          {/* Social Proof */}
          <div className="mt-12 flex flex-col items-center justify-center gap-3">
            <div className="flex -space-x-2">
              {["#2563eb", "#7c3aed", "#059669", "#ea580c"].map((color, i) => (
                <div
                  key={i}
                  className="flex size-9 items-center justify-center rounded-full border-2 font-bold text-xs text-white"
                  style={{
                    backgroundColor: i === 0 ? "var(--rt-primary)" : i === 1 ? "var(--rt-accent)" : color,
                    borderColor: "var(--rt-background)",
                  }}
                >
                  {["JD", "SK", "MR", "TL"][i]}
                </div>
              ))}
            </div>
            <div className="text-xs sm:text-sm opacity-75">
              Loved by <span className="font-semibold opacity-100">45,000+</span> developers and product designers
            </div>
          </div>
        </div>

        {/* Hero Interactive App Card Mockup */}
        <div className="mx-auto mt-14 max-w-5xl rounded-2xl p-4 sm:p-6 shadow-2xl transition-all"
          style={{
            backgroundColor: "color-mix(in srgb, var(--rt-secondary) 30%, var(--rt-background))",
            border: "1px solid color-mix(in srgb, var(--rt-text) 16%, transparent)"
          }}
        >
          <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: "color-mix(in srgb, var(--rt-text) 10%, transparent)" }}>
            <div className="flex items-center gap-2">
              <span className="size-3 rounded-full opacity-60" style={{ backgroundColor: "var(--rt-accent)" }} />
              <span className="size-3 rounded-full opacity-60" style={{ backgroundColor: "var(--rt-primary)" }} />
              <span className="size-3 rounded-full opacity-60" style={{ backgroundColor: "var(--rt-secondary)" }} />
              <span className="ml-2 text-xs font-mono opacity-60">app.coderef.io/studio</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-md px-2.5 py-1 text-xs font-semibold" style={{ backgroundColor: "var(--rt-secondary)", color: "var(--rt-text)" }}>
                Live Sync: ON
              </span>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3 text-left">
            <div className="rounded-xl p-5 shadow-xs" style={{ backgroundColor: "var(--rt-background)", border: "1px solid color-mix(in srgb, var(--rt-text) 10%, transparent)" }}>
              <div className="text-xs font-medium opacity-70">Design System Health</div>
              <div className="mt-2 text-2xl font-bold" style={{ color: "var(--rt-primary)" }}>99.8%</div>
              <div className="mt-1 flex items-center gap-1.5 text-xs" style={{ color: "var(--rt-accent)" }}>
                <span>↑ 14.2%</span>
                <span className="opacity-70">vs last release</span>
              </div>
            </div>

            <div className="rounded-xl p-5 shadow-xs" style={{ backgroundColor: "var(--rt-background)", border: "1px solid color-mix(in srgb, var(--rt-text) 10%, transparent)" }}>
              <div className="text-xs font-medium opacity-70">Accessibility Score</div>
              <div className="mt-2 text-2xl font-bold" style={{ color: "var(--rt-accent)" }}>AAA Rated</div>
              <div className="mt-1 text-xs opacity-70">WCAG 2.1 compliance</div>
            </div>

            <div className="rounded-xl p-5 shadow-xs" style={{ backgroundColor: "var(--rt-background)", border: "1px solid color-mix(in srgb, var(--rt-text) 10%, transparent)" }}>
              <div className="text-xs font-medium opacity-70">Palette Sync Time</div>
              <div className="mt-2 text-2xl font-bold" style={{ color: "var(--rt-text)" }}>0.04 ms</div>
              <div className="mt-1 text-xs opacity-70">Instant DOM update</div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="px-6 py-20 md:px-12 border-t" style={{ borderColor: "color-mix(in srgb, var(--rt-text) 10%, transparent)" }}>
        <div className="mx-auto max-w-6xl">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--rt-accent)" }}>
              Engineered For Speed
            </h2>
            <h3 className="mt-3 text-3xl font-bold tracking-tight">Everything required for pristine design handoffs</h3>
            <p className="mt-3 text-sm sm:text-base opacity-75">
              Eliminate color guesswork. See your theme dynamically applied to authentic web components.
            </p>
          </div>

          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Real-time CSS Variables",
                desc: "Every edit dynamically synchronizes to CSS custom properties in real-time, giving instant feedback.",
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                ),
              },
              {
                title: "WCAG Contrast Checker",
                desc: "Integrated algorithms calculate exact luminance and verify AA and AAA compliance for text and UI elements.",
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                ),
              },
              {
                title: "One-Click Tailwind & SCSS",
                desc: "Export tailored config snippets directly into your Tailwind, SCSS, or standard CSS codebase seamlessly.",
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
                  </svg>
                ),
              },
              {
                title: "Harmonious Palette Generator",
                desc: "Press Space to cycle through curated harmonies: complementary, analog, split, and triadic schemes.",
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="4" />
                  </svg>
                ),
              },
              {
                title: "50-900 Color Shades",
                desc: "Generate complete 11-step tint and shade ladders for your primary, secondary, and accent colors.",
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="3" width="20" height="18" rx="2" />
                    <line x1="2" y1="9" x2="22" y2="9" />
                    <line x1="2" y1="15" x2="22" y2="15" />
                  </svg>
                ),
              },
              {
                title: "Shareable Permalink URLs",
                desc: "Share your exact palette and typography setup with teammates via URL parameters with zero backend required.",
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                ),
              },
            ].map((f, i) => (
              <div
                key={i}
                className="group rounded-2xl p-6 transition-all hover:-translate-y-1 hover:shadow-lg"
                style={{
                  backgroundColor: "var(--rt-background)",
                  border: "1px solid color-mix(in srgb, var(--rt-text) 14%, transparent)",
                }}
              >
                <div
                  className="flex size-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
                  style={{
                    backgroundColor: "var(--rt-secondary)",
                    color: "var(--rt-primary)",
                  }}
                >
                  {f.icon}
                </div>
                <h4 className="mt-5 text-lg font-bold">{f.title}</h4>
                <p className="mt-2 text-sm opacity-75 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="px-6 py-20 md:px-12 border-t" style={{ borderColor: "color-mix(in srgb, var(--rt-text) 10%, transparent)" }}>
        <div className="mx-auto max-w-6xl">
          <div className="text-center max-w-xl mx-auto">
            <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--rt-accent)" }}>
              Transparent Pricing
            </h2>
            <h3 className="mt-3 text-3xl font-bold tracking-tight">Flexible plans for creators of all sizes</h3>
            <p className="mt-2 text-sm opacity-75">Start free today. Upgrade when you need team collaboration.</p>
          </div>

          <div className="mt-14 grid gap-8 lg:grid-cols-3 items-stretch">
            {/* Starter */}
            <div
              className="flex flex-col justify-between rounded-2xl p-8"
              style={{
                backgroundColor: "var(--rt-background)",
                border: "1px solid color-mix(in srgb, var(--rt-text) 14%, transparent)",
              }}
            >
              <div>
                <span className="text-sm font-semibold opacity-75">Starter</span>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold">$0</span>
                  <span className="text-sm opacity-60">/forever</span>
                </div>
                <p className="mt-3 text-xs opacity-75">Ideal for hobbyists and individual developers starting out.</p>

                <ul className="mt-6 space-y-3 text-sm opacity-90">
                  {["Unlimited palette generations", "CSS & Tailwind export", "Standard contrast checker", "Community support"].map((item, i) => (
                    <li key={i} className="flex items-center gap-2.5">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ color: "var(--rt-accent)" }}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                className="mt-8 w-full rounded-xl py-3 text-sm font-semibold transition-all hover:opacity-85"
                style={{
                  backgroundColor: "var(--rt-secondary)",
                  color: "var(--rt-text)",
                }}
              >
                Get Started
              </button>
            </div>

            {/* Pro - Featured */}
            <div
              className="relative flex flex-col justify-between rounded-2xl p-8 shadow-xl"
              style={{
                backgroundColor: "var(--rt-background)",
                border: "2px solid var(--rt-primary)",
              }}
            >
              <div
                className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-bold tracking-wide uppercase shadow-sm"
                style={{
                  backgroundColor: "var(--rt-primary)",
                  color: "var(--rt-background)",
                }}
              >
                Most Popular
              </div>

              <div>
                <span className="text-sm font-semibold opacity-75">Pro Developer</span>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold" style={{ color: "var(--rt-primary)" }}>$19</span>
                  <span className="text-sm opacity-60">/month</span>
                </div>
                <p className="mt-3 text-xs opacity-75">For power creators and professional UI engineers building products.</p>

                <ul className="mt-6 space-y-3 text-sm opacity-90">
                  {[
                    "Everything in Starter",
                    "Custom 11-step shade generators",
                    "Automated WCAG compliance audit",
                    "Figma & Tokens Studio sync",
                    "Priority email assistance",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2.5">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ color: "var(--rt-primary)" }}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                className="mt-8 w-full rounded-xl py-3 text-sm font-semibold shadow-md transition-all hover:opacity-90 active:scale-95"
                style={{
                  backgroundColor: "var(--rt-primary)",
                  color: "var(--rt-background)",
                }}
              >
                Start 14-Day Free Trial
              </button>
            </div>

            {/* Team / Enterprise */}
            <div
              className="flex flex-col justify-between rounded-2xl p-8"
              style={{
                backgroundColor: "var(--rt-background)",
                border: "1px solid color-mix(in srgb, var(--rt-text) 14%, transparent)",
              }}
            >
              <div>
                <span className="text-sm font-semibold opacity-75">Enterprise</span>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold">$79</span>
                  <span className="text-sm opacity-60">/month</span>
                </div>
                <p className="mt-3 text-xs opacity-75">Full organization palette management and design system controls.</p>

                <ul className="mt-6 space-y-3 text-sm opacity-90">
                  {[
                    "Unlimited team members",
                    "Brand guidelines enforce rules",
                    "SSO & SAML integration",
                    "Dedicated design technologist",
                    "99.99% uptime SLA",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2.5">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ color: "var(--rt-accent)" }}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                className="mt-8 w-full rounded-xl py-3 text-sm font-semibold transition-all hover:opacity-85"
                style={{
                  backgroundColor: "var(--rt-secondary)",
                  color: "var(--rt-text)",
                }}
              >
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* High-impact Call to Action */}
      <section className="px-6 py-16 md:px-12">
        <div
          className="mx-auto max-w-5xl rounded-3xl p-8 sm:p-14 text-center shadow-2xl"
          style={{
            backgroundColor: "var(--rt-primary)",
            color: "var(--rt-background)",
          }}
        >
          <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Elevate your design tokens in seconds
          </h3>
          <p className="mx-auto mt-4 max-w-xl text-base opacity-90 leading-relaxed">
            Stop switching between color pickers and Figma. Build accessible, modern palettes right inside your browser.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              className="rounded-xl px-7 py-3.5 text-base font-bold shadow-md transition-all hover:opacity-90 active:scale-95"
              style={{
                backgroundColor: "var(--rt-background)",
                color: "var(--rt-primary)",
              }}
            >
              Get Started for Free
            </button>
            <button
              type="button"
              className="rounded-xl px-7 py-3.5 text-base font-bold transition-all hover:opacity-85 border border-current"
              style={{
                color: "var(--rt-background)",
              }}
            >
              View Documentation
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-6 py-10 md:px-12 text-sm opacity-75" style={{ borderColor: "color-mix(in srgb, var(--rt-text) 12%, transparent)" }}>
        <div className="mx-auto flex max-w-6xl flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold">
            <span className="size-2 rounded-full" style={{ backgroundColor: "var(--rt-primary)" }} />
            <span>RefDesign Studio</span>
          </div>
          <div className="flex gap-6 text-xs">
            <a href="#features" className="hover:opacity-100">Privacy</a>
            <a href="#features" className="hover:opacity-100">Terms</a>
            <a href="#features" className="hover:opacity-100">Changelog</a>
            <a href="#features" className="hover:opacity-100">GitHub</a>
          </div>
          <p className="text-xs">© 2026 Coderef Realtime Colors. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
