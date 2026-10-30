"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { copyText } from "@/components/quickref/Snippet";
import { ApiError, download as downloadFromApi, requirePro } from "@/lib/account/client";
import { FrameworkExports } from "./FrameworkExports";
import type { DesignSystemPackage, ThemeName } from "@/lib/design-system";

type Props = { id: string; name: string; summary: string; colors: string[]; fonts: string[]; theme: ThemeName; href: string };
type Status = "idle" | "loading" | "ready" | "error";

const btn = "inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3.5 py-2 text-sm font-medium hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border disabled:hover:text-inherit";
const btnPrimary = "inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-sm font-medium text-surface hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50";

function save(data: BlobPart, type: string, filename: string) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  Object.assign(document.createElement("a"), { href: url, download: filename }).click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const ProBadge = () => <span className="rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">Pro</span>;

/** "Design System" section: light/dark previews, the generated DESIGN.md and downloads, all built in the browser from the source file. */
export function DesignSystemPanel({ id, name, summary, colors, fonts, theme: sourceTheme, href }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [pkg, setPkg] = useState<DesignSystemPackage | null>(null);
  const [theme, setTheme] = useState<ThemeName>(sourceTheme);
  const [showMd, setShowMd] = useState(false);
  const [copied, setCopied] = useState(false);
  const root = useRef<HTMLElement>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const [text, lib] = await Promise.all([fetch(href).then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status))))), import("@/lib/design-system")]);
      setPkg(lib.generatePackage(text, { id, name, summary, colors, fonts, theme: sourceTheme }));
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, [href, id, name, summary, colors, fonts, sourceTheme]);

  // Generate once the section nears the viewport, so pages that are never scrolled to pay nothing.
  useEffect(() => {
    const el = root.current;
    if (!el || status !== "idle") return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (io.disconnect(), void load()), { rootMargin: "300px" });
    io.observe(el);
    return () => io.disconnect();
  }, [status, load]);

  const ready = status === "ready" && !!pkg?.assessment.ok;
  const get = (n: string) => pkg!.files.find((f) => f.name === n)!;
  const prefix = pkg?.system.slug ?? "design";

  const download = async (kind: "md" | "html") => {
    const lib = await import("@/lib/design-system");
    const f = get(kind === "md" ? "DESIGN.md" : `${theme}.html`);
    save(f.content, f.mime, lib.downloadName(pkg!, f.name));
  };
  // Pro downloads are generated on the server, which checks the plan.
  const [proBusy, setProBusy] = useState<string | null>(null);
  const [proError, setProError] = useState<string | null>(null);
  const proDownload = async (format: "zip", label: string) => {
    if (!(await requirePro(label))) return;
    setProBusy(format);
    setProError(null);
    try {
      await downloadFromApi("/exports/design", { id, format }, `${prefix}-${format}`);
    } catch (e) {
      setProError(e instanceof ApiError ? e.message : "Download failed. Please try again.");
    } finally {
      setProBusy(null);
    }
  };
  const openPreview = () => {
    const f = get(`${theme}.html`);
    const url = URL.createObjectURL(new Blob([f.content], { type: f.mime }));
    window.open(url, "_blank", "noopener");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const sys = pkg?.system;
  const derivedTheme = sourceTheme === "dark" ? "Light" : "Dark";

  return (
    <section ref={root} id="design-system" aria-labelledby="design-system-title" className="no-print mb-8 scroll-mt-20 rounded-xl border border-border bg-surface p-4 md:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id="design-system-title" className="text-lg font-semibold">
            Design System <span className="font-normal text-muted">· {name}</span>
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Light and dark previews, tokens and a ready-to-use package, generated from this DESIGN.md. No AI involved: the same file always produces the same output.
          </p>
        </div>
        <div role="tablist" aria-label="Preview theme" className="flex gap-1 rounded-lg border border-border bg-background p-1">
          {(["light", "dark"] as const).map((t) => (
            <button
              key={t}
              role="tab"
              type="button"
              aria-selected={theme === t}
              onClick={() => setTheme(t)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize ${theme === t ? "bg-accent text-surface" : "text-muted hover:text-foreground"}`}
            >
              {t} theme
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button type="button" className={btnPrimary} disabled={!ready} onClick={openPreview}>
          Preview Design System <span aria-hidden>↗</span>
        </button>
        <button type="button" className={btn} disabled={!ready} aria-expanded={showMd} aria-controls="design-system-md" onClick={() => setShowMd((v) => !v)}>
          {showMd ? "Hide DESIGN.md" : "View DESIGN.md"}
        </button>
        <button type="button" className={btn} disabled={!ready} onClick={() => download("md")}>
          Download DESIGN.md
        </button>
        <button type="button" className={btn} disabled={!ready} onClick={() => download("html")}>
          Download HTML <span className="text-muted capitalize">({theme})</span>
        </button>
        <button type="button" className={btn} disabled={!ready || !!proBusy} onClick={() => proDownload("zip", "the complete Design System package")}>
          {proBusy === "zip" ? "Preparing…" : "Download Complete Package"} <ProBadge />
        </button>
      </div>

      {proError && <p role="alert" className="mb-3 text-sm text-red-600 dark:text-red-400">{proError}</p>}

      <div className="overflow-hidden rounded-lg border border-border bg-background" aria-live="polite">
        {ready ? (
          <iframe key={theme} title={`${name} ${theme} theme design system preview`} sandbox="" srcDoc={get(`${theme}.html`).content} loading="lazy" className="block h-[34rem] w-full max-w-full border-0 md:h-[40rem]" />
        ) : (
          <div className="flex h-64 items-center justify-center p-6 text-center text-sm text-muted">
            {status === "error" && (
              <span>
                Could not load the design file.{" "}
                <button type="button" className="text-accent hover:underline" onClick={load}>
                  Try again
                </button>
              </span>
            )}
            {status === "ready" && !pkg?.assessment.ok && <span>This file does not contain enough design information (at least two colours) to generate a package.</span>}
            {(status === "idle" || status === "loading") && <span className="animate-pulse">Generating design system…</span>}
          </div>
        )}
      </div>

      {ready && (
        <div className="mt-4">
          <FrameworkExports id={id} prefix={prefix} />
        </div>
      )}

      {ready && sys && (
        <p className="mt-3 text-xs text-muted">
          Source theme: <span className="font-medium capitalize text-foreground">{sys.sourceTheme}</span>. The {derivedTheme.toLowerCase()} theme is derived from it unless the source defines it. Values the source does not define use CodeRef defaults and are labelled{" "}
          <em>default</em> in the files. The Pro package adds <code>tokens.json</code>, <code>styles.css</code> and every framework export above.
          {sys.warnings.length > 0 && <span> Notes: {sys.warnings.join(" ")}</span>}
        </p>
      )}

      {showMd && ready && (
        <div id="design-system-md" className="mt-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="font-mono text-sm text-muted">{prefix}/DESIGN.md (generated)</p>
            <button
              type="button"
              className={btn}
              onClick={async () => {
                setCopied(await copyText(get("DESIGN.md").content));
                setTimeout(() => setCopied(false), 1600);
              }}
            >
              {copied ? "Copied ✓" : "Copy"}
            </button>
          </div>
          <pre tabIndex={0} className="max-h-[32rem] overflow-auto rounded-lg border border-border bg-background p-4 font-mono text-[12.5px] leading-5 whitespace-pre-wrap break-words">
            {get("DESIGN.md").content}
          </pre>
        </div>
      )}
    </section>
  );
}
