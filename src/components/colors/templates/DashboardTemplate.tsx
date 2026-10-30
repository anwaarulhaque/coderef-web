"use client";

import React, { useState } from "react";

export function DashboardTemplate() {
  const [activeTab, setActiveTab] = useState<"overview" | "analytics" | "reports">("overview");

  return (
    <div
      className="flex min-h-[700px] w-full flex-col lg:flex-row transition-colors duration-300"
      style={{ backgroundColor: "var(--rt-background)", color: "var(--rt-text)" }}
    >
      {/* Sidebar */}
      <aside
        className="w-full shrink-0 border-b lg:w-64 lg:border-r lg:border-b-0 p-5 flex flex-col justify-between"
        style={{
          backgroundColor: "color-mix(in srgb, var(--rt-secondary) 15%, var(--rt-background))",
          borderColor: "color-mix(in srgb, var(--rt-text) 12%, transparent)",
        }}
      >
        <div>
          {/* Logo / Brand */}
          <div className="flex items-center gap-3 px-2 py-1">
            <div
              className="flex size-9 items-center justify-center rounded-xl font-bold shadow-xs"
              style={{ backgroundColor: "var(--rt-primary)", color: "var(--rt-background)" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight">Acme Analytics</div>
              <div className="text-[11px] opacity-60">Production v3.4</div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="mt-7 space-y-1 text-sm font-medium">
            {[
              {
                id: "overview",
                label: "Dashboard",
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="9" rx="1" />
                    <rect x="14" y="3" width="7" height="5" rx="1" />
                    <rect x="14" y="12" width="7" height="9" rx="1" />
                    <rect x="3" y="16" width="7" height="5" rx="1" />
                  </svg>
                ),
              },
              {
                id: "analytics",
                label: "Performance",
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                ),
              },
              {
                id: "customers",
                label: "Audience & Leads",
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                ),
              },
              {
                id: "reports",
                label: "Financial Reports",
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                ),
              },
              {
                id: "settings",
                label: "System Settings",
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                ),
              },
            ].map((item) => {
              const active = item.id === activeTab;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id as typeof activeTab)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition-all"
                  style={{
                    backgroundColor: active ? "var(--rt-primary)" : "transparent",
                    color: active ? "var(--rt-background)" : "var(--rt-text)",
                    fontWeight: active ? 600 : 500,
                  }}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Usage Box */}
        <div
          className="mt-8 rounded-xl p-4 shadow-xs"
          style={{
            backgroundColor: "var(--rt-background)",
            border: "1px solid color-mix(in srgb, var(--rt-text) 12%, transparent)",
          }}
        >
          <div className="flex items-center justify-between text-xs font-semibold">
            <span>Storage Allocation</span>
            <span style={{ color: "var(--rt-accent)" }}>84%</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: "var(--rt-secondary)" }}>
            <div className="h-full rounded-full transition-all" style={{ width: "84%", backgroundColor: "var(--rt-primary)" }} />
          </div>
          <div className="mt-2 text-[11px] opacity-60">84.2 GB of 100 GB used</div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 overflow-x-hidden p-6 lg:p-8">
        {/* Top Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Executive Dashboard</h2>
            <p className="mt-0.5 text-xs sm:text-sm opacity-70">
              Real-time platform metrics updated 2 minutes ago
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold transition-all hover:opacity-85"
              style={{
                backgroundColor: "var(--rt-secondary)",
                color: "var(--rt-text)",
                border: "1px solid color-mix(in srgb, var(--rt-text) 12%, transparent)",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
              </svg>
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold shadow-xs transition-all hover:opacity-90 active:scale-95"
              style={{
                backgroundColor: "var(--rt-primary)",
                color: "var(--rt-background)",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Create Campaign</span>
            </button>
          </div>
        </div>

        {/* 4 Stats Cards */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Total Revenue", val: "$124,592.00", change: "+16.8%", trend: "up", sub: "vs last month" },
            { label: "Active Subscribers", val: "14,820", change: "+8.4%", trend: "up", sub: "1,240 new users" },
            { label: "Conversion Rate", val: "4.72%", change: "+0.8%", trend: "up", sub: "industry avg 2.8%" },
            { label: "Avg Session Duration", val: "4m 38s", change: "-1.2%", trend: "down", sub: "bounce rate 21%" },
          ].map((st, i) => (
            <div
              key={i}
              className="rounded-2xl p-5 shadow-xs transition-all hover:shadow-md"
              style={{
                backgroundColor: "var(--rt-background)",
                border: "1px solid color-mix(in srgb, var(--rt-text) 14%, transparent)",
              }}
            >
              <div className="text-xs font-medium opacity-70">{st.label}</div>
              <div className="mt-2 text-2xl font-extrabold tracking-tight" style={{ color: i === 0 ? "var(--rt-primary)" : "var(--rt-text)" }}>
                {st.val}
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs">
                <span
                  className="rounded-md px-1.5 py-0.5 font-bold"
                  style={{
                    backgroundColor: "var(--rt-secondary)",
                    color: "var(--rt-accent)",
                  }}
                >
                  {st.change}
                </span>
                <span className="opacity-60">{st.sub}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Interactive Chart Section */}
        <div
          className="mt-6 rounded-2xl p-6 shadow-xs"
          style={{
            backgroundColor: "var(--rt-background)",
            border: "1px solid color-mix(in srgb, var(--rt-text) 14%, transparent)",
          }}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-bold">Revenue Velocity &amp; Traffic Volume</h3>
              <p className="text-xs opacity-60">Consolidated analytics across web and mobile platforms</p>
            </div>
            <div className="flex items-center gap-1 rounded-xl p-1 text-xs font-semibold" style={{ backgroundColor: "var(--rt-secondary)" }}>
              {["7 Days", "30 Days", "90 Days", "Yearly"].map((p, idx) => (
                <button
                  key={p}
                  type="button"
                  className="rounded-lg px-3 py-1 transition-colors"
                  style={{
                    backgroundColor: idx === 1 ? "var(--rt-primary)" : "transparent",
                    color: idx === 1 ? "var(--rt-background)" : "var(--rt-text)",
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Visual Area Chart */}
          <div className="mt-6 h-64 w-full">
            <svg viewBox="0 0 600 200" className="h-full w-full overflow-visible" preserveAspectRatio="none">
              <defs>
                <linearGradient id="dashboardAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--rt-primary)" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="var(--rt-primary)" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="dashboardAccentGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--rt-accent)" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="var(--rt-accent)" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid lines */}
              <line x1="0" y1="40" x2="600" y2="40" stroke="currentColor" strokeOpacity="0.08" strokeDasharray="3 3" />
              <line x1="0" y1="90" x2="600" y2="90" stroke="currentColor" strokeOpacity="0.08" strokeDasharray="3 3" />
              <line x1="0" y1="140" x2="600" y2="140" stroke="currentColor" strokeOpacity="0.08" strokeDasharray="3 3" />
              <line x1="0" y1="190" x2="600" y2="190" stroke="currentColor" strokeOpacity="0.12" />

              {/* Area 2: Secondary / Accent */}
              <path
                d="M 0 170 Q 100 150 200 130 T 400 90 T 600 50 L 600 190 L 0 190 Z"
                fill="url(#dashboardAccentGrad)"
              />
              <path
                d="M 0 170 Q 100 150 200 130 T 400 90 T 600 50"
                fill="none"
                stroke="var(--rt-accent)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Area 1: Primary Wave */}
              <path
                d="M 0 140 Q 100 90 200 110 T 400 60 T 600 25 L 600 190 L 0 190 Z"
                fill="url(#dashboardAreaGrad)"
              />
              <path
                d="M 0 140 Q 100 90 200 110 T 400 60 T 600 25"
                fill="none"
                stroke="var(--rt-primary)"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Highlight Peak Dot */}
              <circle cx="400" cy="60" r="5" fill="var(--rt-background)" stroke="var(--rt-primary)" strokeWidth="3" />
              <circle cx="600" cy="25" r="5" fill="var(--rt-background)" stroke="var(--rt-accent)" strokeWidth="3" />
            </svg>
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] opacity-60">
            <span>Oct 1</span>
            <span>Oct 7</span>
            <span>Oct 14</span>
            <span>Oct 21</span>
            <span>Oct 28</span>
            <span>Today</span>
          </div>
        </div>

        {/* Bottom Split: Recent Transactions + Activity Widget */}
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Recent Orders Table (2 cols) */}
          <div
            className="lg:col-span-2 rounded-2xl p-6 shadow-xs overflow-hidden"
            style={{
              backgroundColor: "var(--rt-background)",
              border: "1px solid color-mix(in srgb, var(--rt-text) 14%, transparent)",
            }}
          >
            <div className="flex items-center justify-between pb-4">
              <h3 className="text-base font-bold">Recent Customer Transactions</h3>
              <button type="button" className="text-xs font-semibold hover:underline" style={{ color: "var(--rt-accent)" }}>
                View All →
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b opacity-60" style={{ borderColor: "color-mix(in srgb, var(--rt-text) 10%, transparent)" }}>
                    <th className="pb-3 font-semibold">Customer</th>
                    <th className="pb-3 font-semibold">Tier</th>
                    <th className="pb-3 font-semibold">Amount</th>
                    <th className="pb-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "color-mix(in srgb, var(--rt-text) 8%, transparent)" }}>
                  {[
                    { name: "Sophia Martinez", email: "sophia@example.com", plan: "Enterprise", amt: "$1,200.00", status: "Paid", badge: "accent" },
                    { name: "Marcus Chen", email: "marcus@chenlabs.io", plan: "Pro Dev", amt: "$199.00", status: "Paid", badge: "accent" },
                    { name: "Hannah Abbott", email: "hannah@design.co", plan: "Pro Dev", amt: "$199.00", status: "Processing", badge: "sec" },
                    { name: "Lucas Vance", email: "lucas@vance.net", plan: "Starter", amt: "$49.00", status: "Paid", badge: "accent" },
                  ].map((row, idx) => (
                    <tr key={idx} className="group hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      <td className="py-3">
                        <div className="font-semibold">{row.name}</div>
                        <div className="opacity-60 text-[11px]">{row.email}</div>
                      </td>
                      <td className="py-3 opacity-80">{row.plan}</td>
                      <td className="py-3 font-bold">{row.amt}</td>
                      <td className="py-3">
                        <span
                          className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                          style={{
                            backgroundColor: row.badge === "accent" ? "var(--rt-secondary)" : "color-mix(in srgb, var(--rt-text) 10%, transparent)",
                            color: row.badge === "accent" ? "var(--rt-primary)" : "var(--rt-text)",
                          }}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Activity / Notification Feed (1 col) */}
          <div
            className="rounded-2xl p-6 shadow-xs flex flex-col justify-between"
            style={{
              backgroundColor: "var(--rt-background)",
              border: "1px solid color-mix(in srgb, var(--rt-text) 14%, transparent)",
            }}
          >
            <div>
              <h3 className="text-base font-bold">System Alerts</h3>
              <p className="text-xs opacity-60">Automated event stream</p>

              <div className="mt-5 space-y-4 text-xs">
                {[
                  { title: "Design token bundle published", time: "12m ago", dot: "primary" },
                  { title: "WCAG contrast verified for V2 release", time: "45m ago", dot: "accent" },
                  { title: "New API client connected", time: "2h ago", dot: "secondary" },
                  { title: "Database backup completed successfully", time: "5h ago", dot: "primary" },
                ].map((act, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span
                      className="mt-1 size-2 rounded-full shrink-0"
                      style={{
                        backgroundColor:
                          act.dot === "primary"
                            ? "var(--rt-primary)"
                            : act.dot === "accent"
                            ? "var(--rt-accent)"
                            : "var(--rt-secondary)",
                      }}
                    />
                    <div>
                      <div className="font-medium">{act.title}</div>
                      <div className="text-[11px] opacity-60">{act.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="mt-6 rounded-xl p-3.5 text-xs text-center"
              style={{
                backgroundColor: "var(--rt-secondary)",
                color: "var(--rt-text)",
              }}
            >
              Need higher rate limits?{" "}
              <button type="button" className="font-bold underline" style={{ color: "var(--rt-primary)" }}>
                Upgrade cluster
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
