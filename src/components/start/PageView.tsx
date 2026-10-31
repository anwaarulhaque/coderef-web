"use client";

// One start page in the app: tabs for every page, the toolbar, and the widget board. Changes show at once and are
// saved in the background (debounced per widget); the last version is cached so the next new tab paints instantly.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, useAccount } from "@/lib/account/client";
import { cache, startApi, trackClick, type StartPage, type StartWidget } from "@/lib/start/client";
import type { StartTier } from "@/lib/start-plans";
import { Board, PageShell } from "./Board";
import { AddWidgetDialog, ImportExportDialog, InboxDrawer, ShareDialog, ThemeDialog } from "./Panels";
import { btn, btnGhost, btnPrimary, Icon, input, Modal } from "./ui";
import { WIDGETS } from "./widgets/registry";
import type { WidgetPatch } from "./widgets/types";
import { BrandMark } from "@/components/layout/BrandMark";

type Toast = { text: string; upgrade?: boolean } | null;

export function StartLogo({ href = "/start/" }: { href?: string }) {
  return (
    <Link href={href} className="flex shrink-0 items-center gap-2 font-mono text-base font-semibold tracking-tight" aria-label="CodeRef Start">
      <BrandMark size={24} gradientId="cr-mark-start" />
      <span>
        code<span className="text-accent">ref</span> <span className="font-sans text-sm font-semibold text-muted">start</span>
      </span>
    </Link>
  );
}

function PageTabs({ pages, current, onNew }: { pages: StartPage[]; current: string; onNew: () => void }) {
  const personal = pages.filter((p) => !p.teamId);
  const teams = [...new Set(pages.filter((p) => p.teamId).map((p) => p.teamName ?? "Team"))];
  const tab = (p: StartPage, i: number) => (
    <Link
      key={p.id}
      href={`/start/${p.id}/`}
      title={i < 9 ? `${p.title} (${i + 1})` : p.title}
      className={`shrink-0 rounded-lg px-2.5 py-1 text-sm whitespace-nowrap ${p.id === current ? "bg-surface font-semibold shadow-sm" : "text-muted hover:bg-surface/70 hover:text-foreground"}`}
    >
      {p.icon && <span className="mr-1">{p.icon}</span>}
      {p.title}
    </Link>
  );
  return (
    <nav aria-label="Your start pages" className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto rounded-xl bg-chip/70 p-1 backdrop-blur [scrollbar-width:none]">
      {personal.map(tab)}
      <button type="button" onClick={onNew} className="shrink-0 rounded-lg px-2 py-1 text-muted hover:bg-surface hover:text-accent" aria-label="New page" title="New page">
        <Icon name="plus" size={14} />
      </button>
      {teams.map((t) => (
        <span key={t} className="flex items-center gap-1">
          <span className="ml-2 shrink-0 text-[11px] font-semibold tracking-wide text-muted uppercase">{t}</span>
          {pages.filter((p) => p.teamId && (p.teamName ?? "Team") === t).map((p, i) => tab(p, personal.length + i))}
        </span>
      ))}
    </nav>
  );
}

function Menu({ items }: { items: ({ label: string; onClick?: () => void; href?: string; danger?: boolean } | null)[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button type="button" className={btnGhost} onClick={() => setOpen(!open)} aria-expanded={open} aria-label="More">
        <Icon name="menu" />
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-1 w-56 rounded-xl border border-border bg-surface p-1 shadow-xl">
          {items.map((it, i) =>
            !it ? (
              <hr key={i} className="my-1 border-border" />
            ) : it.href ? (
              <Link key={it.label} href={it.href} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-1.5 text-sm hover:bg-chip">
                {it.label}
              </Link>
            ) : (
              <button
                key={it.label}
                type="button"
                onClick={() => {
                  setOpen(false);
                  it.onClick?.();
                }}
                className={`block w-full rounded-lg px-3 py-1.5 text-left text-sm hover:bg-chip ${it.danger ? "text-red-600 dark:text-red-400" : ""}`}
              >
                {it.label}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}

export function PageView({ pageId, pages, setPages, brandColor, banner }: { pageId: string; pages: StartPage[]; setPages: (fn: (p: StartPage[]) => StartPage[]) => void; brandColor?: string | null; banner?: string }) {
  const router = useRouter();
  const tier: StartTier = useAccount().me?.start?.tier ?? "free";
  const [page, setPage] = useState<StartPage | null>(() => cache.get<StartPage>(`page:${pageId}`));
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [dialog, setDialog] = useState<null | "add" | "theme" | "share" | "inbox" | "io" | "new" | "rename">(null);
  const [toast, setToast] = useState<Toast>(null);
  const [title, setTitle] = useState("");
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const pending = useRef(new Map<string, WidgetPatch & { color?: string; collapsed?: boolean }>());

  const say = useCallback((e: unknown, fallback: string) => {
    setToast({ text: e instanceof ApiError ? e.message : fallback, upgrade: e instanceof ApiError && (e.status === 402 || e.code === "start_upgrade_required") });
    setTimeout(() => setToast(null), 6000);
  }, []);

  const load = useCallback(() => {
    startApi
      .page(pageId)
      .then((p) => {
        setPage(p);
        setLoadError(null);
        cache.set(`page:${pageId}`, p);
        cache.set("last", pageId);
      })
      .catch((e) => {
        if (e instanceof ApiError && e.status === 404) cache.del(`page:${pageId}`);
        setLoadError(e instanceof ApiError ? e.message : "Couldn't load this page. You're seeing the last saved copy.");
      });
  }, [pageId]);

  useEffect(load, [load]);
  useEffect(() => {
    if (page) cache.set(`page:${pageId}`, page);
  }, [page, pageId]);

  // Save pending widget edits before leaving.
  useEffect(() => {
    const flush = () => {
      for (const [id, patch] of pending.current) void startApi.updateWidget(id, patch).catch(() => undefined);
      pending.current.clear();
    };
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [pageId]);

  const setWidgets = (fn: (w: StartWidget[]) => StartWidget[]) => setPage((p) => (p ? { ...p, widgets: fn(p.widgets ?? []) } : p));

  const onWidget = (id: string, patch: WidgetPatch & { color?: string; collapsed?: boolean }) => {
    setWidgets((ws) => ws.map((w) => (w.id === id ? { ...w, ...patch } : w)));
    pending.current.set(id, { ...pending.current.get(id), ...patch });
    clearTimeout(timers.current.get(id));
    timers.current.set(
      id,
      setTimeout(() => {
        const body = pending.current.get(id);
        pending.current.delete(id);
        if (body) startApi.updateWidget(id, body).catch((e) => say(e, "Couldn't save that change."));
      }, 600),
    );
  };

  const onLayout = (next: StartWidget[]) => {
    setWidgets(() => next);
    startApi.saveLayout(pageId, next.map((w) => ({ id: w.id, col: w.col, position: w.position }))).catch((e) => say(e, "Couldn't save the new layout."));
  };

  const onDelete = (id: string) => {
    const before = page?.widgets ?? [];
    setWidgets((ws) => ws.filter((w) => w.id !== id));
    startApi.deleteWidget(id).catch((e) => {
      setWidgets(() => before);
      say(e, "Couldn't delete that widget.");
    });
  };

  const addWidget = async (type: string) => {
    const cols = Math.min(5, Math.max(1, page?.theme.columns ?? 4));
    const counts = Array.from({ length: cols }, (_, c) => (page?.widgets ?? []).filter((w) => w.col === c).length);
    const col = counts.indexOf(Math.min(...counts));
    const d = WIDGETS[type]?.defaults ?? {};
    const w = await startApi.addWidget(pageId, { type, col, config: d.config, data: d.data });
    setWidgets((ws) => [...ws, w]);
    setEditing(true);
  };

  const newPage = async (t: string) => {
    try {
      const p = await startApi.createPage({ title: t || "New page", theme: page?.theme ? { ...page.theme, customCss: undefined } : undefined });
      setPages((list) => [...list, p]);
      router.push(`/start/${p.id}/`);
    } catch (e) {
      say(e, "Couldn't create the page.");
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.metaKey || e.ctrlKey || e.altKey || t.closest("input, textarea, select, [contenteditable], dialog")) return;
      if (e.key === "/") {
        const s = document.querySelector<HTMLInputElement>("[data-start-search]");
        if (s) {
          e.preventDefault();
          s.focus();
        }
      } else if (e.key === "e" && page?.canEdit) setEditing((v) => !v);
      else if (/^[1-9]$/.test(e.key)) {
        const target = pages[Number(e.key) - 1];
        if (target) router.push(`/start/${target.id}/`);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [page?.canEdit, pages, router]);

  if (!page)
    return (
      <div className="fixed inset-0 z-40 grid place-items-center bg-background text-sm text-muted">
        {loadError ? (
          <div className="text-center">
            <p>{loadError}</p>
            <Link href="/start/" className="mt-2 inline-block text-accent">
              Go to your pages
            </Link>
          </div>
        ) : (
          "Loading your page…"
        )}
      </div>
    );

  const canEdit = page.canEdit;
  const updatePage = (p: StartPage) => {
    setPage((cur) => (cur ? { ...cur, ...p, widgets: cur.widgets } : cur));
    setPages((list) => list.map((x) => (x.id === p.id ? { ...x, ...p } : x)));
  };

  return (
    <PageShell page={page} brandColor={brandColor}>
      <header className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3">
        <span className="hidden rounded-xl bg-surface/80 px-3 py-1.5 shadow-sm backdrop-blur sm:block">
          <StartLogo />
        </span>
        <PageTabs pages={pages.length ? pages : [page]} current={page.id} onNew={() => (setTitle(""), setDialog("new"))} />
        <div className="flex shrink-0 items-center gap-1 rounded-xl bg-surface/80 p-1 shadow-sm backdrop-blur">
          {canEdit && (
            <>
              <button type="button" onClick={() => setDialog("add")} className={btnPrimary} title="Add a widget">
                <Icon name="plus" size={14} />
                <span className="hidden md:inline">Widget</span>
              </button>
              <button type="button" onClick={() => setEditing(!editing)} className={editing ? `${btn} border-accent text-accent` : btnGhost} aria-pressed={editing} title="Edit layout (e)">
                <Icon name={editing ? "check" : "edit"} size={14} />
                <span className="hidden lg:inline">{editing ? "Done" : "Edit"}</span>
              </button>
              <button type="button" onClick={() => setDialog("theme")} className={btnGhost} title="Page style" aria-label="Page style">
                <Icon name="palette" />
              </button>
            </>
          )}
          <button type="button" onClick={() => setDialog("inbox")} className={btnGhost} title="Inbox" aria-label="Inbox">
            <Icon name="inbox" />
          </button>
          {canEdit && (
            <button type="button" onClick={() => setDialog("share")} className={btnGhost} title="Share" aria-label="Share">
              <Icon name="share" />
            </button>
          )}
          <Menu
            items={[
              canEdit ? { label: "Rename page", onClick: () => (setTitle(page.title), setDialog("rename")) } : null,
              {
                label: "Duplicate page",
                onClick: async () => {
                  try {
                    const p = await startApi.duplicatePage(page.id);
                    setPages((l) => [...l, p]);
                    router.push(`/start/${p.id}/`);
                  } catch (e) {
                    say(e, "Couldn't duplicate the page.");
                  }
                },
              },
              { label: "Import / export", onClick: () => setDialog("io") },
              canEdit
                ? {
                    label: "Delete page",
                    danger: true,
                    onClick: async () => {
                      if (!confirm(`Delete “${page.title}” and all its widgets?`)) return;
                      try {
                        await startApi.deletePage(page.id);
                        cache.del(`page:${page.id}`);
                        setPages((l) => l.filter((p) => p.id !== page.id));
                        router.push("/start/");
                      } catch (e) {
                        say(e, "Couldn't delete the page.");
                      }
                    },
                  }
                : null,
              null,
              { label: "Teams", href: "/start/teams/" },
              { label: "Connect the browser extension", href: "/start/connect/" },
              { label: "Template gallery", href: "/start-page/community/" },
              { label: "Plans and billing", href: "/account/start/" },
              { label: "CodeRef home", href: "/" },
            ]}
          />
        </div>
      </header>

      {banner && <p className="mx-4 mb-3 rounded-lg border border-accent/30 bg-surface/90 px-3 py-2 text-sm whitespace-pre-line shadow-sm">📣 {banner}</p>}
      {loadError && <p className="mx-4 mb-3 rounded-lg border border-border bg-surface/90 px-3 py-2 text-sm">{loadError}</p>}
      {editing && <p className="mx-4 mb-3 rounded-lg bg-accent/10 px-3 py-2 text-sm text-accent">Edit mode: drag widgets by their title bar, use the bin to delete, and drag links to reorder. Press e or Done when finished.</p>}

      <Board
        page={page}
        widgets={page.widgets ?? []}
        editing={editing}
        canEdit={canEdit}
        onWidget={onWidget}
        onDelete={onDelete}
        onLayout={onLayout}
        onOpen={(wid, url) => page.teamId && trackClick(page.id, wid, url)}
        emptyState={
          <div className="mx-auto mt-16 max-w-md rounded-2xl border border-border bg-surface/90 p-8 text-center shadow-sm">
            <h1 className="text-lg font-semibold">This page is empty</h1>
            <p className="mt-1 text-sm text-muted">Add bookmarks, notes, feeds, weather and more.</p>
            {canEdit && (
              <button type="button" onClick={() => setDialog("add")} className={`${btnPrimary} mt-4`}>
                <Icon name="plus" size={14} /> Add a widget
              </button>
            )}
          </div>
        }
      />

      {toast && (
        <div role="status" className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm shadow-xl">
          {toast.text}{" "}
          {toast.upgrade && (
            <Link href="/pricing/?product=start" className="font-semibold text-accent">
              See plans
            </Link>
          )}
        </div>
      )}

      <AddWidgetDialog open={dialog === "add"} onClose={() => setDialog(null)} tier={tier} onAdd={addWidget} />
      {dialog === "theme" && (
        <ThemeDialog
          open
          onClose={() => setDialog(null)}
          theme={page.theme}
          tier={tier}
          onSave={async (theme) => {
            updatePage(await startApi.updatePage(page.id, { theme }));
          }}
        />
      )}
      {dialog === "share" && <ShareDialog open onClose={() => setDialog(null)} page={page} tier={tier} onChange={updatePage} />}
      <InboxDrawer open={dialog === "inbox"} onClose={() => setDialog(null)} pageId={page.id} canEdit={canEdit} onFiled={load} />
      {dialog === "io" && <ImportExportDialog open onClose={() => setDialog(null)} page={page} onImported={(id) => (startApi.pages().then((l) => setPages(() => l)), router.push(`/start/${id}/`))} />}
      <Modal open={dialog === "new" || dialog === "rename"} onClose={() => setDialog(null)} title={dialog === "rename" ? "Rename page" : "New page"}>
        <form
          className="flex gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            const which = dialog;
            setDialog(null);
            if (which === "new") await newPage(title.trim());
            else
              try {
                updatePage(await startApi.updatePage(page.id, { title: title.trim() || page.title }));
              } catch (err) {
                say(err, "Couldn't rename the page.");
              }
          }}
        >
          <input autoFocus className={input} value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} placeholder="Work, Home, Research…" aria-label="Page name" />
          <button type="submit" className={btnPrimary}>
            {dialog === "rename" ? "Save" : "Create"}
          </button>
        </form>
      </Modal>
    </PageShell>
  );
}
