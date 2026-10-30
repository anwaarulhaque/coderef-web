"use client";

import { useEffect, useState } from "react";
import { copyText } from "@/components/quickref/Snippet";
import { api, ApiError, download, requirePro, useAccount } from "@/lib/account/client";
import { FRAMEWORK_EXPORTS, type ExportFormat } from "@/lib/plans";

type Format = Exclude<ExportFormat, "zip">;
type View = { file: string; lines: string[]; totalLines: number; full: boolean };

const ProBadge = () => <span className="rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">Pro</span>;
const btn = "inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium hover:border-accent hover:text-accent disabled:opacity-50";

/** Full file text for Pro users (the export endpoint checks the plan). */
async function fetchFull(id: string, format: Format): Promise<string> {
  const res = await fetch("/api/exports/design/", { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, format }) });
  if (!res.ok) throw new ApiError(res.status, "error", (await res.json().catch(() => null))?.message ?? "Could not load the export");
  return res.text();
}

/**
 * Tabbed preview of the framework exports: everyone sees the first lines (generated on the server, so the full file
 * never reaches the browser), Pro sees the whole file with Copy and Download.
 */
export function FrameworkExports({ id, prefix }: { id: string; prefix: string }) {
  const { me, status } = useAccount();
  const pro = !!me?.user?.pro;
  const [tab, setTab] = useState<Format>("tailwind");
  const [views, setViews] = useState<Partial<Record<string, View>>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const info = FRAMEWORK_EXPORTS.find((f) => f.format === tab)!;
  const key = `${tab}:${pro ? "full" : "preview"}`;
  const view = views[key];

  useEffect(() => {
    if (status === "loading" || views[key]) return;
    let live = true;
    (pro
      ? fetchFull(id, tab).then((text) => {
          const lines = text.trimEnd().split("\n");
          return { file: info.file, lines, totalLines: lines.length, full: true };
        })
      : api<Omit<View, "full">>("GET", `/exports/preview?id=${encodeURIComponent(id)}&format=${tab}`).then((v) => ({ ...v, full: false }))
    )
      .then((v) => live && setViews((all) => ({ ...all, [key]: v })))
      .catch((e) => live && setError(e instanceof ApiError ? e.message : "Could not load the preview."));
    return () => {
      live = false;
    };
  }, [id, tab, pro, key, status, views, info.file]);

  const unlock = () => requirePro(`${info.label} export`);
  const onDownload = async () => {
    if (!(await unlock())) return;
    setBusy("download");
    try {
      await download("/exports/design", { id, format: tab }, `${prefix}-${info.file}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Download failed.");
    } finally {
      setBusy(null);
    }
  };
  const onCopy = async () => {
    if (!(await unlock()) || !view) return;
    setCopied(await copyText(view.lines.join("\n") + "\n"));
    setTimeout(() => setCopied(false), 1500);
  };
  const hidden = view && !view.full ? view.totalLines - view.lines.length : 0;

  return (
    <div className="mb-4 overflow-hidden rounded-lg border border-border" aria-labelledby="fw-title">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-background px-3 py-2">
        <h3 id="fw-title" className="flex items-center gap-2 text-sm font-semibold">
          Framework exports {!pro && <ProBadge />}
        </h3>
        <div role="tablist" aria-label="Export format" className="flex flex-wrap gap-1">
          {FRAMEWORK_EXPORTS.map((f) => (
            <button
              key={f.format}
              role="tab"
              type="button"
              aria-selected={tab === f.format}
              onClick={() => {
                setTab(f.format);
                setError(null);
              }}
              className={`rounded-md px-2.5 py-1 text-xs font-medium ${tab === f.format ? "bg-accent text-surface" : "text-muted hover:bg-chip hover:text-foreground"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
        <p className="min-w-0 text-xs text-muted">
          <span className="font-mono text-foreground">{info.file}</span> · {info.howTo}
        </p>
        <div className="flex gap-2">
          <button type="button" className={btn} disabled={!view} onClick={onCopy}>
            {copied ? "Copied ✓" : "Copy"} {!pro && <ProBadge />}
          </button>
          <button type="button" className={btn} disabled={!view || busy === "download"} onClick={onDownload}>
            {busy === "download" ? "Preparing…" : "Download"} {!pro && <ProBadge />}
          </button>
        </div>
      </div>

      {tab === "figma" && (
        <details className="border-b border-border px-3 py-2 text-sm" open={false}>
          <summary className="cursor-pointer font-medium text-accent">How to import into Figma</summary>
          <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-muted">
            <li>
              <span className="text-foreground">Download</span> <span className="font-mono">figma-tokens.json</span> (button above).
            </li>
            <li>
              In Figma, open <span className="text-foreground">Plugins → Tokens Studio for Figma</span>. It&apos;s free in the Figma Community.
            </li>
            <li>
              In the plugin settings, set the token format to <span className="text-foreground">W3C DTCG</span> (the file uses <span className="font-mono">$value</span>).
            </li>
            <li>
              Use <span className="text-foreground">Load from file</span> and pick the file. You get three sets, <span className="font-mono">core</span>, <span className="font-mono">light</span> and{" "}
              <span className="font-mono">dark</span>, and three themes.
            </li>
            <li>
              Open <span className="text-foreground">Styles &amp; Variables → Export to Figma</span>, choose the themes, and export variables and styles. You get a{" "}
              <span className="text-foreground">Mode</span> collection with Light and Dark modes, a <span className="text-foreground">Core</span> collection (palette, radius, spacing), and text and
              shadow styles.
            </li>
          </ol>
          <p className="mt-2 text-xs text-muted">
            Exporting themes as modes may need a Tokens Studio paid plan. On the free plan, export the <span className="font-mono">light</span> and <span className="font-mono">dark</span> sets one at a
            time. Fonts must be installed in Figma; families the design doesn&apos;t name use Inter.
          </p>
        </details>
      )}

      <div className="relative">
        <pre className={`overflow-auto bg-background px-4 py-3 font-mono text-[12.5px] leading-5 ${view?.full ? "max-h-96" : ""}`} tabIndex={0} aria-label={`${info.label} export${view?.full ? "" : " preview"}`}>
          {error ? <span className="text-red-600 dark:text-red-400">{error}</span> : view ? view.lines.join("\n") : <span className="animate-pulse text-muted">Generating {info.file}…</span>}
        </pre>
        {hidden > 0 && (
          <div className="absolute inset-x-0 bottom-0 flex h-28 flex-col items-center justify-end bg-gradient-to-t from-surface via-surface/90 to-transparent pb-3">
            <p className="mb-2 text-xs text-muted">+ {hidden} more lines, generated from this design&apos;s tokens</p>
            <button type="button" onClick={() => void unlock()} className="rounded-lg bg-accent px-3.5 py-1.5 text-sm font-semibold text-surface hover:opacity-90">
              {me?.user ? "Unlock full file with Pro" : "Sign in to unlock"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
