"use client";

import { type ReactNode, useRef, useState } from "react";
import { ShotImage } from "./ShotImage";

type Props = { name: string; src: string; height: number; siteUrl?: string; fallback: ReactNode };

/** The live site's full-page screenshot in a browser frame, with a full-screen viewer; `fallback` if it fails to load. */
export function ShotPreview({ name, src, height, siteUrl, fallback }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [failed, setFailed] = useState(false);
  const host = siteUrl ? new URL(siteUrl).host.replace(/^www\./, "") : undefined;
  const img = (className: string) => (
    <ShotImage src={src} alt={`${name} website, full page`} width={1440} height={height} decoding="async" className={className} onFail={() => setFailed(true)} />
  );

  if (failed) return fallback;
  return (
    <div className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex items-center gap-3 border-b border-border px-3 py-2">
        <span className="flex gap-1.5" aria-hidden>
          <span className="size-2.5 rounded-full bg-[#ff5f57]" />
          <span className="size-2.5 rounded-full bg-[#febc2e]" />
          <span className="size-2.5 rounded-full bg-[#28c840]" />
        </span>
        <span className="min-w-0 flex-1 truncate rounded-md bg-chip px-3 py-1 text-center font-mono text-xs text-muted">{host ?? name}</span>
        {siteUrl && (
          <a href={siteUrl} target="_blank" rel="noopener noreferrer nofollow" className="shrink-0 text-xs text-muted hover:text-accent">
            Visit ↗
          </a>
        )}
      </div>

      <div className="group relative">
        <button type="button" onClick={() => dialog.current?.showModal()} className="block max-h-[70vh] w-full cursor-zoom-in overflow-y-auto bg-chip" aria-label={`View ${name} full page`}>
          {img("block h-auto w-full")}
        </button>
        <span className="pointer-events-none absolute top-3 right-5 inline-flex items-center gap-1.5 rounded-full bg-black/75 px-3 py-1.5 text-xs font-medium text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
          </svg>
          View full
        </span>
      </div>

      <dialog
        ref={dialog}
        onClick={(e) => e.target === e.currentTarget && dialog.current?.close()}
        className="m-0 h-dvh max-h-none w-dvw max-w-none bg-black/90 p-0 backdrop:bg-black/60"
        aria-label={`${name} full page`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 bg-black/80 px-4 py-2.5 text-sm text-white backdrop-blur">
          <span className="truncate font-medium">{host ?? name}</span>
          <span className="flex shrink-0 items-center gap-4">
            {siteUrl && (
              <a href={siteUrl} target="_blank" rel="noopener noreferrer nofollow" className="text-white/70 hover:text-white">
                Visit site ↗
              </a>
            )}
            <button type="button" onClick={() => dialog.current?.close()} className="rounded-md px-2 py-1 text-white/70 hover:bg-white/10 hover:text-white" aria-label="Close">
              ✕
            </button>
          </span>
        </div>
        <div className="mx-auto w-full max-w-[1440px]">{img("block h-auto w-full")}</div>
      </dialog>
    </div>
  );
}
