import Link from "next/link";
import type { ReactNode } from "react";
import { absoluteUrl, jsonLd } from "@/lib/seo";

export type Crumb = { href?: string; label: string };

/** The one page header used everywhere, so every page lines up the same way. */
export function PageHeader({
  title,
  description,
  crumbs,
  actions,
  accent,
  level = 1,
  children,
}: {
  title: ReactNode;
  /** Heading level of the title; 2 when something above it is the page's h1. */
  level?: 1 | 2;
  description?: ReactNode;
  crumbs?: Crumb[];
  actions?: ReactNode;
  /** Colored dot before the title (cheat-sheet color). */
  accent?: string;
  children?: ReactNode;
}) {
  // Breadcrumbs as structured data (Google shows them in results). Unlinked middle crumbs like
  // "Tools" are labels, not pages, so they're left out; the last crumb is the current page.
  const ldItems = (crumbs ?? []).filter((c, i, all) => c.href || i === all.length - 1);
  const breadcrumbLd =
    ldItems.length > 1
      ? {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: ldItems.map((c, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: c.label,
            ...(c.href ? { item: absoluteUrl(c.href) } : {}),
          })),
        }
      : null;

  const Heading = level === 1 ? "h1" : "h2";

  return (
    <header className="mb-8">
      {breadcrumbLd && <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(breadcrumbLd)} />}
      {crumbs && crumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="no-print mb-3 text-sm text-muted">
          <ol className="flex flex-wrap items-center gap-1.5">
            {crumbs.map((c, i) => (
              <li key={i} className="flex items-center gap-1.5">
                {i > 0 && <span aria-hidden>/</span>}
                {c.href ? (
                  <Link href={c.href} className="hover:text-foreground">
                    {c.label}
                  </Link>
                ) : (
                  <span className="text-foreground" aria-current="page">
                    {c.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <Heading className="flex flex-wrap items-center gap-3 text-3xl font-semibold tracking-tight">
            {accent && <span className="inline-block size-3 shrink-0 rounded-full" style={{ backgroundColor: accent }} aria-hidden />}
            {title}
          </Heading>
          {description && <div className="mt-2 max-w-3xl text-muted">{description}</div>}
          {children}
        </div>
        {actions && <div className="no-print flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </div>
    </header>
  );
}

/** Standard secondary button for PageHeader actions. */
export const headerButton = "inline-flex items-center rounded-lg border border-border bg-surface px-3.5 py-2 text-sm font-medium hover:border-accent hover:text-accent";
export const headerButtonPrimary = "inline-flex items-center rounded-lg bg-accent px-3.5 py-2 text-sm font-medium text-surface hover:opacity-90";
