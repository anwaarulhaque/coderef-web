"use client";

// Link widgets: bookmarks (list or icon grid), speed dial, company apps, search and CodeRef cheat sheets.
import { useState } from "react";
import { favicon, hostOf } from "@/lib/start/client";
import { SEARCH_ENGINES, type StartLink } from "@/lib/start-plans";
import { Icon, input } from "../ui";
import { cfg, dat, type WidgetModule, type WidgetProps } from "./types";

/** Lets a link be dragged into another widget or the address bar. */
const dragLink = (l: StartLink) => (e: React.DragEvent) => {
  e.dataTransfer.setData("text/uri-list", l.url);
  e.dataTransfer.setData("application/x-start-link", JSON.stringify(l));
};

function AddLink({ onAdd }: { onAdd: (l: StartLink) => void }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  if (!open)
    return (
      <button type="button" onClick={() => setOpen(true)} className="mt-1 flex items-center gap-1 text-xs text-muted hover:text-accent">
        <Icon name="plus" size={12} /> Add link
      </button>
    );
  return (
    <form
      className="mt-2 grid gap-1.5"
      onSubmit={(e) => {
        e.preventDefault();
        const full = /^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`;
        try {
          new URL(full);
        } catch {
          return;
        }
        onAdd({ url: full, title: title.trim() || hostOf(full) });
        setUrl("");
        setTitle("");
        setOpen(false);
      }}
    >
      <input autoFocus className={input} placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} aria-label="Link address" required />
      <input className={input} placeholder="Name (optional)" value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Link name" />
      <div className="flex gap-2 text-xs">
        <button type="submit" className="font-semibold text-accent">
          Add
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-muted">
          Cancel
        </button>
      </div>
    </form>
  );
}

/** Drop a link from another widget or the inbox (or a URL dragged from the browser) onto a link widget. */
function useLinkDrop(links: StartLink[], save: (links: StartLink[]) => void, canEdit: boolean) {
  const [over, setOver] = useState(false);
  if (!canEdit) return { over: false, props: {} };
  return {
    over,
    props: {
      onDragOver: (e: React.DragEvent) => {
        if (e.dataTransfer.types.includes("application/x-start-link") || e.dataTransfer.types.includes("text/uri-list")) {
          e.preventDefault();
          setOver(true);
        }
      },
      onDragLeave: () => setOver(false),
      onDrop: (e: React.DragEvent) => {
        setOver(false);
        const raw = e.dataTransfer.getData("application/x-start-link");
        const url = e.dataTransfer.getData("text/uri-list").split("\n")[0]?.trim();
        const l: StartLink | null = raw ? JSON.parse(raw) : url && /^https?:/.test(url) ? { url, title: hostOf(url) } : null;
        if (!l || links.some((x) => x.url === l.url)) return;
        e.preventDefault();
        e.stopPropagation();
        save([...links, l]);
      },
    },
  };
}

function Bookmarks({ widget, editing, canEdit, update, onOpen }: WidgetProps) {
  const links = dat<StartLink[]>(widget, "links", []);
  const view = cfg(widget, "view", "list");
  const newTab = cfg(widget, "newTab", false);
  const save = (next: StartLink[]) => update({ data: { ...widget.data, links: next } });
  const drop = useLinkDrop(links, save, canEdit);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const move = (to: number) => {
    if (dragFrom === null || dragFrom === to) return;
    const next = [...links];
    const [l] = next.splice(dragFrom, 1);
    next.splice(to, 0, l);
    save(next);
    setDragFrom(null);
  };
  const target = newTab ? { target: "_blank", rel: "noopener noreferrer" } : { rel: "noreferrer" };
  return (
    <div {...drop.props} className={`rounded-lg ${drop.over ? "bg-accent/10 ring-2 ring-accent/40" : ""}`}>
      {!links.length && <p className="py-1 text-sm text-muted">{canEdit ? "No links yet. Add one, or drop a link here." : "No links."}</p>}
      {view === "grid" ? (
        <ul className="grid grid-cols-4 gap-2">
          {links.map((l, i) => (
            <li key={l.url + i} className="group relative">
              <a href={l.url} {...target} onClick={() => onOpen(l.url)} draggable onDragStart={dragLink(l)} title={l.title} className="flex flex-col items-center gap-1 rounded-lg p-1.5 text-center hover:bg-chip">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={favicon(l.url)} alt="" width={28} height={28} className="size-7 rounded" loading="lazy" />
                <span className="line-clamp-1 w-full text-[11px]">{l.title}</span>
              </a>
              {editing && (
                <button type="button" onClick={() => save(links.filter((_, j) => j !== i))} aria-label={`Remove ${l.title}`} className="absolute -top-1 -right-1 hidden rounded-full bg-surface p-0.5 text-muted shadow group-hover:block hover:text-red-500">
                  <Icon name="close" size={12} />
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <ul className="space-y-0.5">
          {links.map((l, i) => (
            <li
              key={l.url + i}
              className="group flex items-center gap-2 rounded-md px-1 hover:bg-chip"
              draggable={editing}
              onDragStart={(e) => {
                if (!editing) return;
                e.stopPropagation();
                setDragFrom(i);
              }}
              onDragOver={(e) => editing && dragFrom !== null && e.preventDefault()}
              onDrop={(e) => {
                if (dragFrom === null) return;
                e.preventDefault();
                e.stopPropagation();
                move(i);
              }}
            >
              {editing && <Icon name="grip" size={12} className="cursor-grab text-muted" />}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={favicon(l.url)} alt="" width={16} height={16} className="size-4 rounded-sm" loading="lazy" />
              <a href={l.url} {...target} onClick={() => onOpen(l.url)} draggable={!editing} onDragStart={dragLink(l)} className="min-w-0 flex-1 truncate py-1 text-sm hover:text-accent" title={l.url}>
                {l.title}
              </a>
              {editing && (
                <button type="button" onClick={() => save(links.filter((_, j) => j !== i))} aria-label={`Remove ${l.title}`} className="text-muted opacity-0 group-hover:opacity-100 hover:text-red-500">
                  <Icon name="close" size={12} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {canEdit && <AddLink onAdd={(l) => save([...links, l])} />}
    </div>
  );
}

function SpeedDial({ widget, editing, canEdit, update, onOpen }: WidgetProps) {
  const links = dat<StartLink[]>(widget, "links", []);
  const save = (next: StartLink[]) => update({ data: { ...widget.data, links: next } });
  const drop = useLinkDrop(links, save, canEdit);
  return (
    <div {...drop.props} className={drop.over ? "rounded-lg ring-2 ring-accent/40" : ""}>
      <ul className="grid grid-cols-3 gap-2">
        {links.map((l, i) => (
          <li key={l.url + i} className="group relative">
            <a href={l.url} onClick={() => onOpen(l.url)} rel="noreferrer" className="flex aspect-[4/3] flex-col items-center justify-center gap-1.5 rounded-xl border border-border bg-background p-2 text-center shadow-xs transition hover:-translate-y-0.5 hover:border-accent hover:shadow-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={favicon(l.url)} alt="" width={32} height={32} className="size-8" loading="lazy" />
              <span className="line-clamp-1 w-full text-xs font-medium">{l.title}</span>
            </a>
            {editing && (
              <button type="button" onClick={() => save(links.filter((_, j) => j !== i))} aria-label={`Remove ${l.title}`} className="absolute top-1 right-1 rounded-full bg-surface p-0.5 text-muted shadow hover:text-red-500">
                <Icon name="close" size={12} />
              </button>
            )}
          </li>
        ))}
      </ul>
      {canEdit && <AddLink onAdd={(l) => save([...links, l])} />}
    </div>
  );
}

function Apps(props: WidgetProps) {
  // Same data as speed dial, styled as a branded app launcher for team pages.
  return (
    <div className="[&_a]:aspect-square [&_a]:rounded-2xl">
      <SpeedDial {...props} />
    </div>
  );
}

function Search({ widget }: WidgetProps) {
  const engineId = cfg(widget, "engine", "google");
  const custom = cfg(widget, "customUrl", "");
  const [engine, setEngine] = useState(engineId);
  const [q, setQ] = useState("");
  const template = engine === "custom" && custom.includes("{q}") ? custom : (SEARCH_ENGINES.find((e) => e.id === engine) ?? SEARCH_ENGINES[0]).url;
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        if (q.trim()) window.location.assign(template.replace("{q}", encodeURIComponent(q.trim())));
      }}
      className="flex gap-1.5"
    >
      <select value={engine} onChange={(e) => setEngine(e.target.value)} aria-label="Search engine" className="rounded-lg border border-border bg-background px-2 text-xs">
        {SEARCH_ENGINES.map((e) => (
          <option key={e.id} value={e.id}>
            {e.label}
          </option>
        ))}
        {custom.includes("{q}") && <option value="custom">{cfg(widget, "customLabel", "Custom")}</option>}
      </select>
      <input data-start-search className={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…  ( / )" aria-label="Search the web" />
    </form>
  );
}

const SHEETS: StartLink[] = [
  { title: "JavaScript", url: "/javascript/" },
  { title: "Python", url: "/python/" },
  { title: "CSS", url: "/css/" },
  { title: "Git", url: "/git/" },
  { title: "Regex", url: "/regex/" },
  { title: "Docker", url: "/docker/" },
  { title: "SQL", url: "/sql/" },
  { title: "HTML", url: "/html/" },
  { title: "Vim", url: "/vim/" },
  { title: "JSON formatter", url: "/json-formatter/" },
  { title: "Regex tester", url: "/regex-tester/" },
  { title: "REST API client", url: "/rest-api-client/" },
];

function CheatSheets({ widget, onOpen }: WidgetProps) {
  const custom = cfg(widget, "paths", "")
    .split("\n")
    .map((p) => p.trim())
    .filter((p) => /^\/[\w/-]*$/.test(p));
  const items = custom.length ? custom.map((p) => ({ url: p.endsWith("/") ? p : `${p}/`, title: p.replace(/^\/|\/$/g, "").replace(/-/g, " ") || "Home" })) : SHEETS;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((s) => (
        <li key={s.url}>
          <a href={s.url} onClick={() => onOpen(s.url)} className="inline-block rounded-full border border-border bg-chip px-2.5 py-1 text-xs font-medium capitalize hover:border-accent hover:text-accent">
            {s.title}
          </a>
        </li>
      ))}
    </ul>
  );
}

export const LINK_WIDGETS: Record<string, WidgetModule> = {
  bookmarks: {
    View: Bookmarks,
    defaults: { data: { links: [] }, config: { view: "list" } },
    settings: [
      { key: "view", label: "Layout", kind: "select", options: [{ value: "list", label: "List" }, { value: "grid", label: "Icon grid" }] },
      { key: "newTab", label: "Open links in a new tab", kind: "toggle" },
    ],
  },
  speeddial: { View: SpeedDial, defaults: { data: { links: [] } } },
  apps: { View: Apps, defaults: { data: { links: [] } } },
  search: {
    View: Search,
    defaults: { config: { engine: "google" } },
    settings: [
      { key: "engine", label: "Default engine", kind: "select", options: SEARCH_ENGINES.map((e) => ({ value: e.id, label: e.label })) },
      { key: "customUrl", label: "Custom search URL", kind: "url", placeholder: "https://intranet.example.com/search?q={q}", help: "Use {q} where the search words go." },
      { key: "customLabel", label: "Custom engine name", kind: "text", placeholder: "Intranet" },
    ],
  },
  cheatsheets: {
    View: CheatSheets,
    settings: [{ key: "paths", label: "CodeRef pages, one per line", kind: "textarea", placeholder: "/javascript/\n/git/\n/regex-tester/", help: "Leave empty for the most popular cheat sheets and tools." }],
  },
};
