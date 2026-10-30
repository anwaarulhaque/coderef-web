"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { copyText } from "@/components/quickref/Snippet";
import { BACKGROUNDS, type BackgroundEffect, type BackgroundOptions, agentPrompt, previewDocument } from "@/lib/backgrounds";

/** The effect running in a sandboxed frame; mounted only once it scrolls near the viewport. */
function Preview({ effect, options, title }: { effect: BackgroundEffect; options: BackgroundOptions; title: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setSeen(true), { rootMargin: "200px" });
    if (box.current) io.observe(box.current);
    return () => io.disconnect();
  }, []);
  const doc = useMemo(() => previewDocument(effect.code(options)), [effect, options]);
  return (
    <div ref={box} className="absolute inset-0" style={{ background: options.background }}>
      {seen && <iframe title={title} srcDoc={doc} sandbox="allow-scripts" className="pointer-events-none size-full border-0" />}
    </div>
  );
}

function CopyButton({ text, label, primary }: { text: string; label: string; primary?: boolean }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        if (await copyText(text)) {
          setDone(true);
          setTimeout(() => setDone(false), 1400);
        }
      }}
      className={
        primary
          ? "rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-surface hover:opacity-90"
          : "rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium hover:border-accent hover:text-accent"
      }
    >
      {done ? "Copied ✓" : label}
    </button>
  );
}

/** Color, speed, live preview and copy actions for one effect. */
function Customizer({ effect, onClose }: { effect: BackgroundEffect; onClose: () => void }) {
  const [options, setOptions] = useState<BackgroundOptions>(effect.defaults);
  const code = useMemo(() => effect.code(options), [effect, options]);
  const setColor = (i: number, value: string) => setOptions((o) => ({ ...o, colors: o.colors.map((c, j) => (j === i ? value : c)) as BackgroundOptions["colors"] }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">{effect.name}</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted">{effect.description}</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-md px-2 py-1 text-muted hover:bg-chip hover:text-foreground" aria-label="Close">
          ✕
        </button>
      </div>

      <div className="relative aspect-[16/7] min-h-48 overflow-hidden rounded-xl border border-border">
        <Preview effect={effect} options={options} title={`${effect.name} preview`} />
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center text-white">
          <p className="text-2xl font-semibold tracking-tight drop-shadow sm:text-4xl">Your headline here</p>
          <p className="mt-2 text-sm opacity-80 drop-shadow">The background runs behind your content.</p>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        {options.colors.map((c, i) => (
          <label key={i} className="flex flex-col gap-1 text-xs text-muted">
            Color {i + 1}
            <input type="color" value={c} onChange={(e) => setColor(i, e.target.value)} className="h-9 w-14 cursor-pointer rounded border border-border bg-surface" />
          </label>
        ))}
        <label className="flex flex-col gap-1 text-xs text-muted">
          Background
          <input type="color" value={options.background} onChange={(e) => setOptions((o) => ({ ...o, background: e.target.value }))} className="h-9 w-14 cursor-pointer rounded border border-border bg-surface" />
        </label>
        <label className="flex min-w-40 flex-1 flex-col gap-1 text-xs text-muted">
          Speed · {options.speed.toFixed(2)}×
          <input
            type="range"
            min={0.25}
            max={2}
            step={0.25}
            value={options.speed}
            onChange={(e) => setOptions((o) => ({ ...o, speed: Number(e.target.value) }))}
            className="accent-accent"
          />
        </label>
        <button type="button" onClick={() => setOptions(effect.defaults)} className="rounded-lg px-3 py-2 text-sm text-muted hover:text-foreground">
          Reset
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <CopyButton text={code} label="Copy HTML + JS" primary />
        <CopyButton text={agentPrompt(effect, options)} label="Copy prompt for your AI agent" />
      </div>

      <details className="rounded-xl border border-border bg-surface">
        <summary className="cursor-pointer px-4 py-2.5 text-sm text-muted hover:text-foreground">View the code ({effect.kind}, no dependencies)</summary>
        <pre className="max-h-80 overflow-auto border-t border-border px-4 py-3 font-mono text-[12px] leading-5">{code}</pre>
      </details>
    </div>
  );
}

export function BackgroundGallery() {
  const [open, setOpen] = useState<BackgroundEffect | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);

  return (
    <>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {BACKGROUNDS.map((e) => (
          <li key={e.id}>
            <button
              type="button"
              onClick={() => setOpen(e)}
              className="group flex h-full w-full flex-col overflow-hidden rounded-xl border border-border bg-surface text-left transition-shadow hover:shadow-md"
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden border-b border-border">
                <Preview effect={e} options={e.defaults} title={`${e.name} preview`} />
                <span className="absolute top-3 left-3 z-10 rounded-full bg-black/45 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur">{e.kind}</span>
              </div>
              <div className="flex flex-1 flex-col p-4">
                <h3 className="font-semibold group-hover:text-accent">{e.name}</h3>
                <p className="mt-1 line-clamp-2 flex-1 text-sm text-muted">{e.description}</p>
                <p className="mt-3 text-xs font-semibold group-hover:text-accent">Customize & copy →</p>
              </div>
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialog}
        onClose={() => setOpen(null)}
        onClick={(ev) => ev.target === ev.currentTarget && setOpen(null)}
        className="m-auto w-[min(960px,calc(100vw-2rem))] max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl border border-border bg-background p-5 text-foreground shadow-2xl backdrop:bg-black/60 sm:p-6"
        aria-label={open ? `${open.name} background` : undefined}
      >
        {open && <Customizer key={open.id} effect={open} onClose={() => setOpen(null)} />}
      </dialog>
    </>
  );
}
