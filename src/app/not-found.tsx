import type { Metadata } from "next";
import Link from "next/link";
import { headerButton, headerButtonPrimary } from "@/components/layout/PageHeader";
import { MissingPath } from "@/components/layout/MissingPath";

export const metadata: Metadata = {
  title: "Page not found",
  description: "The page you're looking for doesn't exist or has moved.",
  robots: { index: false, follow: true },
};

const POPULAR = [
  { href: "/quick-reference/", label: "Quick Reference", description: "Copy-paste snippets by task", color: "#0ea5e9" },
  { href: "/javascript/", label: "JavaScript", description: "Array, String, Object, Promise", color: "#f7df1e" },
  { href: "/python/", label: "Python", description: "Built-ins, types and modules", color: "#3776ab" },
  { href: "/git/", label: "Git", description: "Everyday commands", color: "#f05032" },
  { href: "/json-formatter/", label: "JSON Formatter", description: "Format, validate and convert", color: "#f59e0b" },
  { href: "/regex-tester/", label: "Regex Tester", description: "Live highlighting and explanations", color: "#8b5cf6" },
];

export default function NotFound() {
  return (
    <div className="relative mx-auto flex max-w-3xl flex-col items-center py-10 text-center sm:py-16">
      {/* Soft accent glow behind the number */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-1/2 -z-10 h-64 w-[min(36rem,100%)] -translate-x-1/2 rounded-full bg-accent/15 blur-3xl"
      />

      <p className="font-mono text-sm font-medium tracking-widest text-accent uppercase">Error 404</p>
      <h1 className="mt-3 bg-gradient-to-b from-foreground to-muted bg-clip-text font-mono text-8xl font-bold tracking-tighter text-transparent sm:text-9xl">
        404
      </h1>
      <p className="mt-4 text-2xl font-semibold tracking-tight">This page couldn&apos;t be found</p>
      <p className="mt-2 max-w-md text-muted">
        The link may be broken, or the page may have moved. Try one of the references below or head back home.
      </p>

      {/* Terminal card */}
      <div className="mt-8 w-full overflow-hidden rounded-xl border border-border bg-surface text-left shadow-sm">
        <div className="flex items-center gap-1.5 border-b border-border bg-chip px-4 py-2.5">
          <span className="size-3 rounded-full bg-[#ff5f57]" aria-hidden />
          <span className="size-3 rounded-full bg-[#febc2e]" aria-hidden />
          <span className="size-3 rounded-full bg-[#28c840]" aria-hidden />
          <span className="ml-3 font-mono text-xs text-muted">bash</span>
        </div>
        <pre className="overflow-x-auto px-4 py-4 font-mono text-sm leading-relaxed whitespace-pre-wrap">
          <span className="text-accent">$</span> <span className="text-muted">cd</span> <MissingPath />
          {"\n"}
          <span className="text-[#dc2626] dark:text-[#f87171]">bash: cd: No such file or directory</span>
          {"\n"}
          <span className="text-accent">$</span> <span className="text-muted">cd ~</span>
          <span className="ml-1 inline-block h-4 w-2 translate-y-0.5 animate-pulse bg-foreground" aria-hidden />
        </pre>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className={headerButtonPrimary}>
          Back to home
        </Link>
        <Link href="/#directory" className={headerButton}>
          Browse all cheat sheets
        </Link>
      </div>

      <section className="mt-14 w-full text-left">
        <h2 className="mb-4 text-center text-sm font-medium text-muted">Popular destinations</h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {POPULAR.map((p) => (
            <li key={p.href}>
              <Link
                href={p.href}
                className="group flex h-full items-start gap-3 rounded-xl border border-border bg-surface p-4 transition hover:-translate-y-0.5 hover:border-accent hover:shadow-sm"
              >
                <span className="mt-1.5 size-2.5 shrink-0 rounded-full" style={{ backgroundColor: p.color }} aria-hidden />
                <span className="min-w-0">
                  <span className="block font-medium group-hover:text-accent">{p.label}</span>
                  <span className="block text-sm text-muted">{p.description}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
