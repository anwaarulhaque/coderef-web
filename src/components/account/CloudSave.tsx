"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError, openSignIn, refreshAccount, useAccount, type SavedItem, type Usage } from "@/lib/account/client";
import type { ItemKind } from "@/lib/plans";

type Props<T> = {
  kind: Exclude<ItemKind, "favorite">;
  /** What this tool calls one saved thing ("palette", "request", …). */
  noun: string;
  getData: () => T;
  /** Suggested name for a new save. */
  getTitle?: () => string;
  onLoad: (data: T, title: string) => void;
  className?: string;
};

const fmt = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });

/**
 * "Saved" menu for a tool: save to the account, reopen, update, share (Pro) and delete. Also opens
 * ?item=<id> (own saved item) and ?share=<id> (anyone's shared link) on load.
 */
export function CloudSave<T>({ kind, noun, getData, getTitle, onLoad, className = "" }: Props<T>) {
  const { me, status } = useAccount();
  const user = me?.user;
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<SavedItem[] | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; tone: "ok" | "error"; upgrade?: boolean } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const loadRef = useRef(onLoad);
  useEffect(() => {
    loadRef.current = onLoad;
  });

  const flash = (text: string, tone: "ok" | "error" = "ok", upgrade = false) => {
    setMessage({ text, tone, upgrade });
    if (!upgrade) setTimeout(() => setMessage(null), 2500);
  };

  const fetchList = useCallback(async () => {
    const r = await api<{ items: SavedItem[]; usage: Usage }>("GET", `/items?kind=${kind}`);
    setItems(r.items);
    setUsage(r.usage);
  }, [kind]);

  // Open ?share= or ?item= links once, after the tool has restored its own state.
  useEffect(() => {
    const qs = new URLSearchParams(window.location.search);
    const share = qs.get("share");
    const item = qs.get("item");
    if (!share && !item) return;
    const t = setTimeout(async () => {
      try {
        if (share) {
          const r = await api<{ kind: string; title: string; data: T }>("GET", `/share/${encodeURIComponent(share)}`);
          if (r.kind === kind) {
            loadRef.current(r.data, r.title);
            flash(`Opened shared ${noun} “${r.title}”`);
          }
        } else if (item) {
          const r = await api<{ item: SavedItem<T> }>("GET", `/items/${encodeURIComponent(item)}`);
          if (r.item.kind === kind && r.item.data !== undefined) {
            loadRef.current(r.item.data, r.item.title);
            flash(`Opened “${r.item.title}”`);
          }
        }
      } catch (e) {
        flash(e instanceof ApiError ? e.message : `Could not open that ${noun}`, "error");
      }
    }, 300);
    return () => clearTimeout(t);
  }, [kind, noun]);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e.type === "keydown" ? (e as KeyboardEvent).key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      if (e instanceof ApiError && (e.code === "limit_reached" || e.code === "pro_required")) flash(e.message, "error", true);
      else flash(e instanceof ApiError ? e.message : "Something went wrong", "error");
    } finally {
      setBusy(false);
    }
  };

  const toggle = () => {
    if (!user) {
      openSignIn(`Sign in to save ${noun}s to your account and open them on any device.`);
      return;
    }
    setOpen((o) => !o);
    if (!open) {
      setName(getTitle?.() ?? "");
      void run(fetchList);
    }
  };

  const save = () =>
    run(async () => {
      await api("POST", "/items", { kind, title: name.trim() || getTitle?.() || `Untitled ${noun}`, data: getData() });
      setName("");
      await fetchList();
      void refreshAccount();
      flash(`Saved`);
    });

  const share = (it: SavedItem) =>
    run(async () => {
      if (!user?.pro) {
        flash("Share links are a Pro feature.", "error", true);
        return;
      }
      const r = await api<{ item: SavedItem }>("POST", `/items/${it.id}/share`);
      const url = `${window.location.origin}${window.location.pathname}?share=${r.item.shareId}`;
      await navigator.clipboard?.writeText(url).catch(() => undefined);
      await fetchList();
      flash("Share link copied");
    });

  const btn = "inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-sm font-medium hover:border-accent hover:text-accent disabled:opacity-50";
  const small = "rounded-md px-2 py-1 text-xs text-muted hover:bg-chip hover:text-foreground disabled:opacity-50";

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button type="button" className={btn} aria-haspopup="dialog" aria-expanded={open} onClick={toggle} disabled={status === "loading"}>
        <svg aria-hidden width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17.5 19a4.5 4.5 0 1 0-1.4-8.8A6 6 0 0 0 4.5 12.5 3.5 3.5 0 0 0 6 19z" />
        </svg>
        Saved
      </button>
      {message && !open && (
        <span role="status" className={`absolute right-0 top-full z-30 mt-1 whitespace-nowrap rounded-md px-2 py-1 text-xs shadow ${message.tone === "ok" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}>
          {message.text}
        </span>
      )}
      {open && (
        <div role="dialog" aria-label={`Saved ${noun}s`} className="absolute right-0 z-40 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-border bg-surface p-3 text-sm shadow-xl">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void save();
            }}
          >
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} placeholder={`Name this ${noun}`} aria-label={`${noun} name`} className="min-w-0 flex-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-accent" />
            <button type="submit" disabled={busy} className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-surface hover:opacity-90 disabled:opacity-50">
              Save
            </button>
          </form>
          {message && (
            <p role="status" className={`mt-2 text-xs ${message.tone === "ok" ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
              {message.text}{" "}
              {message.upgrade && (
                <Link href="/pricing/" className="font-semibold text-accent underline">
                  Upgrade to Pro
                </Link>
              )}
            </p>
          )}
          <div className="mt-3 max-h-72 overflow-y-auto">
            {items === null ? (
              <p className="py-3 text-center text-xs text-muted">Loading…</p>
            ) : items.length === 0 ? (
              <p className="py-3 text-center text-xs text-muted">No saved {noun}s yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {items.map((it) => (
                  <li key={it.id} className="flex items-center gap-2 py-1.5">
                    <button
                      type="button"
                      className="min-w-0 flex-1 truncate text-left hover:text-accent"
                      title={`Open “${it.title}”`}
                      onClick={() =>
                        run(async () => {
                          const r = await api<{ item: SavedItem<T> }>("GET", `/items/${it.id}`);
                          loadRef.current(r.item.data as T, r.item.title);
                          setOpen(false);
                          flash(`Opened “${it.title}”`);
                        })
                      }
                    >
                      <span className="font-medium">{it.title}</span>
                      <span className="ml-2 text-xs text-muted">{fmt(it.updatedAt)}</span>
                    </button>
                    <button type="button" className={small} disabled={busy} title="Replace with what's open now" onClick={() => run(async () => { await api("PUT", `/items/${it.id}`, { data: getData() }); await fetchList(); flash("Updated"); })}>
                      Update
                    </button>
                    <button type="button" className={small} disabled={busy} title={it.shareId ? "Copy share link" : "Create a share link (Pro)"} onClick={() => share(it)}>
                      {it.shareId ? "Link" : "Share"}
                    </button>
                    <button type="button" className={`${small} hover:text-red-600`} disabled={busy} aria-label={`Delete ${it.title}`} onClick={() => run(async () => { await api("DELETE", `/items/${it.id}`); await fetchList(); void refreshAccount(); })}>
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {usage && (
            <p className="mt-2 border-t border-border pt-2 text-xs text-muted">
              {usage.saved} of {usage.limit} saved items used.{" "}
              {!user?.pro && (
                <Link href="/pricing/" className="font-medium text-accent hover:underline">
                  Pro saves up to 500 and adds share links
                </Link>
              )}
              {user?.pro && (
                <Link href="/account/" className="hover:text-foreground">
                  Manage all
                </Link>
              )}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
