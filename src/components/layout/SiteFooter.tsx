import Link from "next/link";

type FooterLink = { href: string; label: string; external?: boolean };

const COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: "Cheat Sheets",
    links: [
      { href: "/", label: "All cheat sheets" },
      { href: "/#directory", label: "A–Z directory" },
      { href: "/quick-reference/", label: "Quick Reference" },
      { href: "/javascript/", label: "JavaScript" },
      { href: "/python/", label: "Python" },
      { href: "/sql/", label: "SQL" },
    ],
  },
  {
    title: "Learn",
    links: [
      { href: "/css-grid/", label: "CSS Grid" },
      { href: "/flexbox/", label: "Flexbox" },
      { href: "/git-branching/", label: "Git Branching" },
      { href: "/quick-reference/vscode/", label: "VS Code Shortcuts" },
      { href: "/quick-reference/git/", label: "Git commands" },
    ],
  },
  {
    title: "Tools",
    links: [
      { href: "/realtime-colors/", label: "Realtime Colors" },
      { href: "/json-formatter/", label: "JSON Formatter" },
      { href: "/markdown/", label: "Markdown Editor" },
      { href: "/regex-tester/", label: "Regex Tester" },
      { href: "/abbreviations/", label: "HTML & CSS Abbreviations" },
      { href: "/browser-support/", label: "Browser Support" },
      { href: "/browser-support/compare/", label: "Compare Browsers" },
    ],
  },
  {
    title: "Official docs",
    links: [
      { href: "https://developer.mozilla.org/", label: "MDN Web Docs", external: true },
      { href: "https://docs.python.org/3/", label: "Python docs", external: true },
      { href: "https://git-scm.com/docs", label: "Git reference", external: true },
      { href: "https://web.dev/baseline", label: "Baseline", external: true },
      { href: "https://code.visualstudio.com/docs", label: "VS Code docs", external: true },
    ],
  },
  {
    title: "CodeRef Pro",
    links: [
      { href: "/pricing/", label: "Pricing" },
      { href: "/account/", label: "Your account" },
      { href: "/terms/", label: "Terms of service" },
      { href: "/privacy/", label: "Privacy policy" },
      { href: "/refund-policy/", label: "Refund policy" },
      { href: "/cancellation-policy/", label: "Cancellation policy" },
      { href: "/cookie-policy/", label: "Cookie policy" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="no-print mt-16 border-t border-border bg-surface">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-[minmax(0,1.3fr)_repeat(5,minmax(0,1fr))]">
        <div>
          <Link href="/" className="font-mono text-xl font-semibold tracking-tight">
            code<span className="text-accent">ref</span>
          </Link>
          <p className="mt-3 max-w-xs text-sm text-muted">
            Developer cheat sheets, quick references and interactive tools — every entry linked to the official
            documentation.
          </p>
          <p className="mt-4 text-sm text-muted">
            Press <kbd className="rounded border border-border bg-background px-1.5 font-mono text-[12px]">Ctrl K</kbd> to search
            everything.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">{col.title}</h2>
            <ul className="mt-3 space-y-2">
              {col.links.map((l) => (
                <li key={l.href}>
                  {l.external ? (
                    <a href={l.href} target="_blank" rel="noopener noreferrer" className="text-sm hover:text-accent">
                      {l.label} ↗
                    </a>
                  ) : (
                    <Link href={l.href} className="text-sm hover:text-accent">
                      {l.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <p>© {new Date().getFullYear()} coderef. Free developer reference.</p>
            <span>·</span>
            <Link href="/sitemap/" className="hover:text-foreground underline">
              Sitemap
            </Link>
            <span>·</span>
            <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer" className="hover:text-foreground underline">
              XML Sitemap
            </a>
          </div>
          <p>
            Browser data from{" "}
            <a href="https://github.com/web-platform-dx/web-features" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
              web-features
            </a>{" "}
            &amp;{" "}
            <a href="https://github.com/mdn/browser-compat-data" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
              MDN
            </a>
            . Trademarks belong to their owners.
          </p>
        </div>
      </div>
    </footer>
  );
}
