"use client";

// Dialogs and drawers of a start page: add widget, theme, share / publish as template, inbox and import / export.
import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError } from "@/lib/account/client";
import { BACKGROUNDS } from "@/lib/backgrounds";
import { BACKGROUND_PRESETS, hostOf, pageToBookmarksHtml, pageToMarkdown, PHOTO_PRESETS, startApi, type InboxItem, type StartPage } from "@/lib/start/client";
import { canUseWidget, START_WIDGETS, TEMPLATE_CATEGORIES, type StartTheme, type StartTier, type WidgetCategory } from "@/lib/start-plans";
import { btn, btnGhost, btnPrimary, Icon, input, label, Modal, TierBadge } from "./ui";

const errorText = (e: unknown, fallback: string) => (e instanceof ApiError ? e.message : fallback);

export function AddWidgetDialog({ open, onClose, tier, onAdd }: { open: boolean; onClose: () => void; tier: StartTier; onAdd: (type: string) => Promise<void> }) {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cats: WidgetCategory[] = ["Links", "Productivity", "News & info", "Media", "Developer", "Team"];
  const shown = START_WIDGETS.filter((w) => !q || `${w.label} ${w.description}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <Modal open={open} onClose={onClose} title="Add a widget" wide>
      <input autoFocus className={`${input} mb-4`} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search widgets" aria-label="Search widgets" />
      {error && (
        <p role="alert" className="mb-3 rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-sm">
          {error}{" "}
          <Link href="/pricing/?product=start" className="font-semibold text-accent">
            See plans
          </Link>
        </p>
      )}
      {cats.map((c) => {
        const list = shown.filter((w) => w.category === c);
        if (!list.length) return null;
        return (
          <section key={c} className="mb-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{c}</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {list.map((w) => {
                const allowed = canUseWidget(tier, w.type);
                return (
                  <button
                    key={w.type}
                    type="button"
                    disabled={!!busy}
                    onClick={async () => {
                      setBusy(w.type);
                      setError(null);
                      try {
                        await onAdd(w.type);
                        onClose();
                      } catch (e) {
                        setError(errorText(e, "Couldn't add that widget."));
                      } finally {
                        setBusy(null);
                      }
                    }}
                    className={`rounded-xl border border-border p-3 text-left hover:border-accent ${allowed ? "" : "opacity-75"}`}
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      {w.label}
                      {w.tier !== "free" && <TierBadge tier={w.tier} />}
                      {!allowed && <Icon name="lock" size={12} className="text-muted" />}
                      {busy === w.type && <span className="text-xs font-normal text-muted">Adding…</span>}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted">{w.description}</span>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </Modal>
  );
}

export function ThemeDialog({ open, onClose, theme, tier, onSave }: { open: boolean; onClose: () => void; theme: StartTheme; tier: StartTier; onSave: (t: StartTheme) => Promise<void> }) {
  const [t, setT] = useState<StartTheme>(theme);
  const [error, setError] = useState<string | null>(null);
  const pro = tier !== "free";
  const swatch = (selected: boolean) => `h-12 rounded-lg border ${selected ? "ring-2 ring-accent ring-offset-2 ring-offset-surface" : "border-border"}`;
  return (
    <Modal open={open} onClose={onClose} title="Page style" wide>
      <div className="grid gap-5">
        <section>
          <h3 className={label}>Colours and gradients</h3>
          <div className="grid grid-cols-5 gap-2">
            {BACKGROUND_PRESETS.map((b) => (
              <button key={b.label} type="button" title={b.label} aria-label={b.label} onClick={() => setT({ ...t, background: b.value, backgroundImage: undefined })} className={swatch(!t.backgroundImage && (t.background ?? "") === b.value)} style={{ background: b.value || "var(--background)" }} />
            ))}
          </div>
        </section>
        <section>
          <h3 className={label}>Photos</h3>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {PHOTO_PRESETS.map((p) => (
              <button key={p} type="button" aria-label="Photo background" onClick={() => setT({ ...t, backgroundImage: p, background: undefined })} className={swatch(t.backgroundImage === p)} style={{ backgroundImage: `url("${p.replace("w=2400", "w=300")}")`, backgroundSize: "cover" }} />
            ))}
          </div>
          <label className="mt-2 block">
            <span className={label}>Your own image address {!pro && <TierBadge tier="pro" />}</span>
            <input className={input} disabled={!pro} placeholder="https://…/photo.jpg" value={t.backgroundImage && !PHOTO_PRESETS.includes(t.backgroundImage) ? t.backgroundImage : ""} onChange={(e) => setT({ ...t, backgroundImage: e.target.value || undefined, background: undefined })} />
          </label>
        </section>
        <section>
          <h3 className={label}>Animated (from CodeRef animated backgrounds)</h3>
          <div className="flex flex-wrap gap-1.5">
            {BACKGROUNDS.slice(0, 10).map((b) => (
              <button key={b.id} type="button" onClick={() => setT({ ...t, background: `anim:${b.id}`, backgroundImage: undefined })} className={`rounded-full border px-2.5 py-1 text-xs ${t.background === `anim:${b.id}` ? "border-accent text-accent" : "border-border"}`}>
                {b.name}
              </button>
            ))}
          </div>
        </section>
        <div className="grid gap-3 sm:grid-cols-4">
          <label>
            <span className={label}>Columns</span>
            <select className={input} value={t.columns ?? 4} onChange={(e) => setT({ ...t, columns: Number(e.target.value) })}>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </label>
          <label>
            <span className={label}>Spacing</span>
            <select className={input} value={t.density ?? "comfortable"} onChange={(e) => setT({ ...t, density: e.target.value as StartTheme["density"] })}>
              <option value="comfortable">Comfortable</option>
              <option value="compact">Compact</option>
            </select>
          </label>
          <label>
            <span className={label}>Font</span>
            <select className={input} value={t.font ?? "sans"} onChange={(e) => setT({ ...t, font: e.target.value as StartTheme["font"] })}>
              <option value="sans">Sans</option>
              <option value="mono">Mono</option>
              <option value="serif">Serif</option>
            </select>
          </label>
          <label>
            <span className={label}>Light / dark</span>
            <select className={input} value={t.scheme ?? "auto"} onChange={(e) => setT({ ...t, scheme: e.target.value as StartTheme["scheme"] })}>
              <option value="auto">Follow system</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
        </div>
        <label>
          <span className={label}>Custom CSS {!pro && <TierBadge tier="pro" />}</span>
          <textarea className={`${input} font-mono text-xs`} rows={4} disabled={!pro} placeholder=".start-widget { border-radius: 0; }" value={t.customCss ?? ""} onChange={(e) => setT({ ...t, customCss: e.target.value })} />
          <span className="mt-1 block text-xs text-muted">Applies only to this page. Remote resources (url(), @import) aren&apos;t allowed.</span>
        </label>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" className={btn} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={btnPrimary}
            onClick={async () => {
              try {
                await onSave(t);
                onClose();
              } catch (e) {
                setError(errorText(e, "Couldn't save the style."));
              }
            }}
          >
            Save style
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function ShareDialog({ open, onClose, page, tier, onChange }: { open: boolean; onClose: () => void; page: StartPage; tier: StartTier; onChange: (p: StartPage) => void }) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [category, setCategory] = useState<string>(page.templateCategory ?? "Personal");
  const [description, setDescription] = useState("");
  const url = page.shareId ? `${window.location.origin}/start/p/${page.shareId}/` : "";
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(errorText(e, "Something went wrong."));
    } finally {
      setBusy(false);
    }
  };
  const isPublic = page.visibility === "public";
  return (
    <Modal open={open} onClose={onClose} title="Share this page">
      <div className="grid gap-4 text-sm">
        <p className="text-muted">{page.teamId ? `Everyone on ${page.teamName ?? "the team"} can already see this page.` : "Only you can see this page until you share it."} A public link lets anyone view it (read-only) and copy it to their own account.</p>
        <label className="flex items-center gap-2 font-medium">
          <input type="checkbox" className="accent-[var(--accent)]" checked={isPublic} disabled={busy} onChange={(e) => run(async () => onChange(await startApi.share(page.id, { visibility: e.target.checked ? "public" : "private" })))} />
          Anyone with the link can view
        </label>
        {isPublic && url && (
          <div className="flex gap-2">
            <input readOnly className={input} value={url} aria-label="Share link" onFocus={(e) => e.target.select()} />
            <button
              type="button"
              className={btn}
              onClick={async () => {
                await navigator.clipboard.writeText(url);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
            >
              <Icon name={copied ? "check" : "copy"} size={14} /> {copied ? "Copied" : "Copy"}
            </button>
          </div>
        )}
        {isPublic && (
          <div className="rounded-xl border border-border p-3">
            <p className="mb-2 font-medium">
              Password {tier === "free" && <TierBadge tier="pro" />} <span className="font-normal text-muted">{page.protected ? "· on" : "· off"}</span>
            </p>
            <div className="flex gap-2">
              <input type="password" className={input} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={page.protected ? "New password" : "Set a password"} disabled={tier === "free"} aria-label="Page password" />
              <button type="button" className={btn} disabled={busy || password.length < 4} onClick={() => run(async () => (onChange(await startApi.share(page.id, { visibility: "public", password })), setPassword("")))}>
                Set
              </button>
              {page.protected && (
                <button type="button" className={btn} disabled={busy} onClick={() => run(async () => onChange(await startApi.share(page.id, { visibility: "public", password: null })))}>
                  Remove
                </button>
              )}
            </div>
          </div>
        )}
        {!page.teamId && (
          <div className="rounded-xl border border-border p-3">
            <p className="font-medium">Template gallery</p>
            <p className="mb-2 text-muted">{page.isTemplate ? "This page is listed in the community gallery." : "List this page in the community gallery so others can start from it."}</p>
            {!page.isTemplate && (
              <div className="mb-2 grid gap-2 sm:grid-cols-2">
                <select className={input} value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
                  {TEMPLATE_CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                <input className={input} maxLength={280} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="One line about this page" aria-label="Description" />
              </div>
            )}
            <button
              type="button"
              className={page.isTemplate ? btn : btnPrimary}
              disabled={busy}
              onClick={() =>
                run(async () => {
                  const r = await startApi.publishTemplate(page.id, page.isTemplate ? { publish: false } : { publish: true, category, description });
                  onChange({ ...page, isTemplate: !page.isTemplate, templateCategory: category, visibility: page.isTemplate ? page.visibility : "public", shareId: r.shareId ?? page.shareId, protected: page.isTemplate ? page.protected : false });
                })
              }
            >
              {page.isTemplate ? "Remove from gallery" : "Publish to gallery"}
            </button>
          </div>
        )}
        {error && <p className="text-red-600 dark:text-red-400">{error}</p>}
      </div>
    </Modal>
  );
}

export function InboxDrawer({ open, onClose, pageId, canEdit, onFiled }: { open: boolean; onClose: () => void; pageId: string; canEdit: boolean; onFiled: () => void }) {
  const [items, setItems] = useState<InboxItem[] | null>(null);
  const [widgetTitle, setWidgetTitle] = useState("Inbox");
  useEffect(() => {
    if (!open) return;
    startApi
      .inbox()
      .then(setItems)
      .catch(() => setItems([]));
  }, [open]);
  if (!open) return null;
  const remove = async (id: string) => {
    setItems((list) => list?.filter((i) => i.id !== id) ?? null);
    await startApi.deleteInbox(id).catch(() => undefined);
  };
  return (
    <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col border-l border-border bg-surface shadow-2xl" aria-label="Inbox">
      <header className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-semibold">Inbox</h2>
        <button type="button" onClick={onClose} className={btnGhost} aria-label="Close inbox">
          <Icon name="close" />
        </button>
      </header>
      <div className="flex-1 overflow-y-auto p-4">
        <p className="mb-3 text-xs text-muted">Links you save with the CodeRef Start extension land here. Drag one onto a bookmarks widget, or file it below.</p>
        {canEdit && (
          <label className="mb-3 block">
            <span className={label}>File into the list</span>
            <input className={input} value={widgetTitle} onChange={(e) => setWidgetTitle(e.target.value)} />
          </label>
        )}
        {items === null ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : !items.length ? (
          <p className="text-sm text-muted">Your inbox is empty.</p>
        ) : (
          <ul className="space-y-1.5">
            {items.map((it) => (
              <li
                key={it.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("application/x-start-link", JSON.stringify({ title: it.title, url: it.url }));
                  e.dataTransfer.setData("text/uri-list", it.url);
                }}
                onDragEnd={(e) => e.dataTransfer.dropEffect !== "none" && remove(it.id)}
                className="group rounded-lg border border-border p-2 text-sm"
              >
                <a href={it.url} target="_blank" rel="noopener noreferrer" className="line-clamp-1 font-medium hover:text-accent">
                  {it.title}
                </a>
                <p className="text-xs text-muted">{hostOf(it.url)}</p>
                <div className="mt-1 flex gap-3 text-xs">
                  {canEdit && (
                    <button
                      type="button"
                      className="font-semibold text-accent"
                      onClick={async () => {
                        await startApi.moveInbox(it.id, pageId, widgetTitle || "Inbox");
                        setItems((list) => list?.filter((i) => i.id !== it.id) ?? null);
                        onFiled();
                      }}
                    >
                      File on this page
                    </button>
                  )}
                  <button type="button" className="text-muted hover:text-red-500" onClick={() => remove(it.id)}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}

const download = (name: string, text: string, type: string) => {
  const url = URL.createObjectURL(new Blob([text], { type }));
  Object.assign(document.createElement("a"), { href: url, download: name }).click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export function ImportExportDialog({ open, onClose, page, onImported }: { open: boolean; onClose: () => void; page: StartPage; onImported: (id: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const slug = page.title.replace(/[^\w-]+/g, "-").toLowerCase();
  return (
    <Modal open={open} onClose={onClose} title="Import and export">
      <div className="grid gap-5 text-sm">
        <section>
          <h3 className="font-semibold">Import</h3>
          <p className="mb-2 text-muted">A bookmarks file exported from Chrome, Firefox, Safari, Edge or start.me (HTML), or a feed list from a feed reader (OPML). It becomes a new page.</p>
          <input
            type="file"
            accept=".html,.htm,.opml,.xml,text/html,text/xml"
            disabled={busy}
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setBusy(true);
              setMsg(null);
              try {
                const r = await startApi.importFile(await f.text(), f.name.replace(/\.[^.]+$/, "").slice(0, 80) || "Imported");
                setMsg(`Imported ${r.links} items.`);
                onImported(r.page.id);
              } catch (err) {
                setMsg(errorText(err, "Couldn't import that file."));
              } finally {
                setBusy(false);
              }
            }}
            className="block w-full text-sm file:mr-3 file:rounded-lg file:border file:border-border file:bg-chip file:px-3 file:py-1.5 file:text-sm"
          />
          <p className="mt-2 text-xs text-muted">
            Using Chrome? The <Link href="/start-page/extension/" className="text-accent">CodeRef Start extension</Link> imports your bookmarks in one click.
          </p>
        </section>
        <section>
          <h3 className="font-semibold">Export this page</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" className={btn} onClick={() => download(`${slug}.html`, pageToBookmarksHtml(page), "text/html")}>
              Bookmarks file (HTML)
            </button>
            <button type="button" className={btn} onClick={() => download(`${slug}.md`, pageToMarkdown(page), "text/markdown")}>
              Markdown
            </button>
            <button type="button" className={btn} onClick={() => download(`${slug}.json`, JSON.stringify(page, null, 2), "application/json")}>
              JSON
            </button>
            <button
              type="button"
              className={btn}
              onClick={async () => {
                await navigator.clipboard.writeText(pageToMarkdown(page));
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
            >
              {copied ? "Copied" : "Copy as Markdown"}
            </button>
          </div>
        </section>
        {msg && <p role="status">{msg}</p>}
      </div>
    </Modal>
  );
}
