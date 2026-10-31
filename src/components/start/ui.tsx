"use client";

// Small building blocks for the CodeRef Start app: icons, buttons, inputs and a modal on the native <dialog>.
import { useEffect, useRef, type ReactNode } from "react";

export const btn = "inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50";
export const btnPrimary = "inline-flex items-center justify-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-surface hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50";
export const btnGhost = "inline-flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-muted hover:bg-chip hover:text-foreground disabled:opacity-50";
export const input = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20";
export const label = "mb-1 block text-xs font-semibold text-muted";

const PATHS: Record<string, string> = {
  plus: "M12 5v14M5 12h14",
  edit: "M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4",
  trash: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",
  gear: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z",
  chevron: "M6 9l6 6 6-6",
  close: "M6 6l12 12M18 6L6 18",
  inbox: "M22 12h-6l-2 3h-4l-2-3H2M5.5 5h13L22 12v7H2v-7z",
  palette: "M12 3a9 9 0 1 0 0 18c1 0 1.5-.8 1.5-1.5 0-.4-.2-.8-.4-1-.3-.3-.4-.6-.4-1 0-.8.7-1.5 1.5-1.5H16a5 5 0 0 0 5-5c0-4.4-4-8-9-8zM7.5 12a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM10.5 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM15.5 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
  share: "M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v13",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3",
  grip: "M9 5h.01M9 12h.01M9 19h.01M15 5h.01M15 12h.01M15 19h.01",
  lock: "M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4",
  check: "M5 12l5 5L20 7",
  menu: "M4 6h16M4 12h16M4 18h16",
  users: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8",
  external: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3",
  copy: "M9 9h11v11H9zM5 15H4V4h11v1",
  puzzle: "M10 3a2 2 0 1 1 4 0v2h4v4h2a2 2 0 1 1 0 4h-2v6h-5v-2a2 2 0 1 0-4 0v2H4v-5h2a2 2 0 1 0 0-4H4V5h6z",
  refresh: "M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5",
  play: "M7 4l13 8-13 8z",
  pause: "M7 4h4v16H7zM13 4h4v16h-4z",
};

export function Icon({ name, size = 16, className = "" }: { name: keyof typeof PATHS | string; size?: number; className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" width={size} height={size} className={`shrink-0 ${className}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={PATHS[name] ?? PATHS.plus} />
    </svg>
  );
}

/** Modal on the native <dialog>: focus trap, Escape and backdrop click come from the browser. */
export function Modal({ open, onClose, title, children, wide = false }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className={`m-auto w-[calc(100%-2rem)] ${wide ? "max-w-3xl" : "max-w-lg"} rounded-2xl border border-border bg-surface p-0 text-foreground shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-sm`}
    >
      {open && (
        <div className="max-h-[85vh] overflow-y-auto p-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button type="button" onClick={onClose} className={btnGhost} aria-label="Close">
              <Icon name="close" />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}

export function TierBadge({ tier }: { tier: "pro" | "team" }) {
  return <span className="rounded-full bg-accent/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">{tier === "pro" ? "PRO" : "Team"}</span>;
}

export const Empty = ({ children }: { children: ReactNode }) => <p className="py-2 text-sm text-muted">{children}</p>;
