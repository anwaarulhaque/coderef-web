import Link from "next/link";
import { BrandMark } from "@/components/layout/BrandMark";
import { StartMockup } from "@/components/marketing/Sections";
import { ExtensionInstallButton } from "@/components/marketing/ExtensionInstallButton";
import { START_WIDGETS } from "@/lib/start-plans";

const ABOUT: [string, string][] = [
  ["Every new tab, instantly", "The Chrome extension opens your page in every new tab, even offline, with search and a command menu."],
  [`${START_WIDGETS.length} widgets`, "Bookmarks, speed dial, RSS, weather, notes, to-dos, Kanban, calendars, GitHub and your CodeRef cheat sheets."],
  ["Save in one click", "Save a page, every open tab or a right-clicked link. Import your browser or start.me bookmarks."],
  ["Built for teams", "Shared, branded team pages with roles, announcements and link analytics, rolled out by policy."],
];

/** Home-page introduction to CodeRef Start, the separate start-page product. */
export function StartBanner() {
  return (
    <section aria-labelledby="start-banner" className="mb-10 overflow-hidden rounded-3xl border border-accent/25 bg-gradient-to-br from-accent/10 via-surface to-surface">
      <div className="grid items-center gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div>
          <div className="flex items-center gap-3">
            <BrandMark size={40} gradientId="cr-mark-home" />
            <div>
              <p className="text-sm font-bold tracking-tight">CodeRef Start</p>
              <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">New product</span>
            </div>
          </div>
          <h2 id="start-banner" className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
            Your start page, in every new tab
          </h2>
          <p className="mt-2 text-muted">
            CodeRef Start puts the sites, feeds, notes and to-dos you use every day on one page, and opens it in every new tab. Use it on your own or
            share pages with your team. Free for 3 pages, PRO $24 a year, Team $29 a month.
          </p>
          <ul className="mt-4 flex flex-wrap gap-1.5 text-xs">
            {["Chrome new tab", "Save all tabs", "Import bookmarks", "Team pages", "Template gallery"].map((t) => (
              <li key={t} className="rounded-full border border-border bg-surface px-2.5 py-1">
                {t}
              </li>
            ))}
          </ul>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/start/" className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-surface hover:opacity-90">
              Create my start page
            </Link>
            <Link href="/start-page/" className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold hover:border-accent hover:text-accent">
              About CodeRef Start
            </Link>
            <Link href="/pricing/?product=start" className="rounded-lg px-4 py-2 text-sm font-semibold text-muted hover:text-accent">
              Pricing →
            </Link>
          </div>
        </div>
        <StartMockup />
      </div>
      <div className="flex flex-col gap-4 border-t border-accent/15 bg-surface/60 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex items-start gap-3">
          <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-xl border border-border bg-surface">
            <svg viewBox="0 0 24 24" className="size-5 text-accent" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M19.4 13.6a2.4 2.4 0 1 0 0-3.2V6a1 1 0 0 0-1-1h-4.4a2.4 2.4 0 1 0-3.2 0H6.4a1 1 0 0 0-1 1v4.4a2.4 2.4 0 1 1 0 3.2V18a1 1 0 0 0 1 1h4.4a2.4 2.4 0 1 1 3.2 0h4.4a1 1 0 0 0 1-1z" />
            </svg>
          </span>
          <div>
            <h3 className="text-sm font-semibold">CodeRef Start extension for Chrome, Edge &amp; Brave</h3>
            <p className="mt-0.5 text-sm text-muted">
              Free. Opens your start page in every new tab, works offline, and saves pages or all open tabs in one click.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <ExtensionInstallButton className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-surface hover:opacity-90" />
          <Link
            href="/start-page/extension/"
            className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold hover:border-accent hover:text-accent"
          >
            About the extension
          </Link>
        </div>
      </div>
      <ul className="grid gap-px border-t border-accent/15 bg-accent/10 sm:grid-cols-2 lg:grid-cols-4">
        {ABOUT.map(([title, text]) => (
          <li key={title} className="bg-surface/80 p-5">
            <h3 className="text-sm font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-muted">{text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
