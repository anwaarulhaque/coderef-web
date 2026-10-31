"use client";

// Media and team widgets: embed, image, custom HTML (sandboxed), announcement and team directory.
import { useState } from "react";
import { Icon, input } from "../ui";
import { cfg, dat, uid, type WidgetModule, type WidgetProps } from "./types";

const https = (u: string) => /^https:\/\/[^\s"'<>]+$/i.test(u);

function Embed({ widget }: WidgetProps) {
  const url = cfg(widget, "url", "");
  const height = cfg(widget, "height", 320);
  if (!https(url)) return <p className="text-sm text-muted">Set an https:// address in settings. Some sites don&apos;t allow embedding.</p>;
  // No same-origin: the embedded page can't read CodeRef cookies or this page.
  return <iframe src={url} title={widget.title || "Embedded page"} className="w-full rounded-lg border border-border bg-white" style={{ height }} sandbox="allow-scripts allow-popups allow-forms allow-presentation" loading="lazy" referrerPolicy="no-referrer" />;
}

function ImageWidget({ widget, onOpen }: WidgetProps) {
  const src = cfg(widget, "src", "");
  const href = cfg(widget, "href", "");
  if (!https(src)) return <p className="text-sm text-muted">Set an https:// image address in settings.</p>;
  // eslint-disable-next-line @next/next/no-img-element
  const img = <img src={src} alt={cfg(widget, "alt", "")} className="w-full rounded-lg object-cover" loading="lazy" referrerPolicy="no-referrer" />;
  return https(href) ? (
    <a href={href} target="_blank" rel="noopener noreferrer" onClick={() => onOpen(href)}>
      {img}
    </a>
  ) : (
    img
  );
}

function Html({ widget }: WidgetProps) {
  const code = cfg(widget, "html", "");
  const height = cfg(widget, "height", 240);
  if (!code) return <p className="text-sm text-muted">Add HTML, CSS and JavaScript in settings. It runs in a sandbox with no access to your account.</p>;
  const doc = `<!doctype html><html><head><meta charset="utf-8"><meta name="color-scheme" content="light dark"><style>body{margin:0;font:14px system-ui,sans-serif}</style></head><body>${code}</body></html>`;
  return <iframe srcDoc={doc} title={widget.title || "Custom HTML"} sandbox="allow-scripts" className="w-full rounded-lg border-0" style={{ height }} />;
}

function Announcement({ widget }: WidgetProps) {
  const tone = cfg(widget, "tone", "info");
  const tones: Record<string, string> = { info: "border-accent/40 bg-accent/10", success: "border-green-500/40 bg-green-500/10", warning: "border-amber-500/40 bg-amber-500/10", urgent: "border-red-500/40 bg-red-500/10" };
  const text = cfg(widget, "text", "");
  const link = cfg(widget, "link", "");
  return (
    <div className={`rounded-lg border p-3 text-sm ${tones[tone] ?? tones.info}`}>
      <p className="whitespace-pre-line">{text || "Write your announcement in settings."}</p>
      {https(link) && (
        <a href={link} target="_blank" rel="noopener noreferrer" className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-accent">
          Read more <Icon name="external" size={11} />
        </a>
      )}
    </div>
  );
}

type Person = { id: string; name: string; role: string; email: string; link: string };

function Directory({ widget, canEdit, update }: WidgetProps) {
  const people = dat<Person[]>(widget, "people", []);
  const [q, setQ] = useState("");
  const [draft, setDraft] = useState({ name: "", role: "", email: "", link: "" });
  const save = (next: Person[]) => update({ data: { ...widget.data, people: next } });
  const shown = q ? people.filter((p) => `${p.name} ${p.role} ${p.email}`.toLowerCase().includes(q.toLowerCase())) : people;
  return (
    <div>
      {people.length > 6 && <input className={`${input} mb-2`} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find someone" aria-label="Search the directory" />}
      <ul className="divide-y divide-border text-sm">
        {shown.map((p) => (
          <li key={p.id} className="group flex items-center gap-2 py-1.5">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-accent/15 text-xs font-bold text-accent">{p.name.slice(0, 1).toUpperCase()}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{p.name}</span>
              <span className="block truncate text-xs text-muted">{p.role}</span>
            </span>
            {p.email && (
              <a href={`mailto:${p.email}`} className="text-xs text-accent">
                Email
              </a>
            )}
            {https(p.link) && (
              <a href={p.link} target="_blank" rel="noopener noreferrer" className="text-xs text-accent">
                Profile
              </a>
            )}
            {canEdit && (
              <button type="button" onClick={() => save(people.filter((x) => x.id !== p.id))} aria-label={`Remove ${p.name}`} className="text-muted opacity-0 group-hover:opacity-100 hover:text-red-500">
                <Icon name="close" size={12} />
              </button>
            )}
          </li>
        ))}
      </ul>
      {canEdit && (
        <form
          className="mt-2 grid grid-cols-2 gap-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            if (!draft.name.trim()) return;
            save([...people, { id: uid(), ...draft, name: draft.name.trim() }]);
            setDraft({ name: "", role: "", email: "", link: "" });
          }}
        >
          <input className={input} placeholder="Name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} aria-label="Name" />
          <input className={input} placeholder="Role" value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })} aria-label="Role" />
          <input className={input} placeholder="Email" type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} aria-label="Email" />
          <input className={input} placeholder="https://profile" value={draft.link} onChange={(e) => setDraft({ ...draft, link: e.target.value })} aria-label="Profile link" />
          <button type="submit" className="col-span-2 text-left text-xs font-semibold text-accent">
            + Add person
          </button>
        </form>
      )}
    </div>
  );
}

export const MEDIA_WIDGETS: Record<string, WidgetModule> = {
  embed: {
    View: Embed,
    defaults: { config: { height: 320 } },
    settings: [
      { key: "url", label: "Page address", kind: "url", placeholder: "https://…" },
      { key: "height", label: "Height (px)", kind: "number", min: 120, max: 1200 },
    ],
  },
  image: {
    View: ImageWidget,
    settings: [
      { key: "src", label: "Image address", kind: "url", placeholder: "https://…/logo.png" },
      { key: "alt", label: "Description (for screen readers)", kind: "text" },
      { key: "href", label: "Link when clicked", kind: "url" },
    ],
  },
  html: {
    View: Html,
    defaults: { config: { height: 240 } },
    settings: [
      { key: "html", label: "HTML, CSS and JavaScript", kind: "textarea", placeholder: "<style>h1{color:tomato}</style>\n<h1>Hello</h1>", help: "Runs in a sandboxed frame without access to your account or this page." },
      { key: "height", label: "Height (px)", kind: "number", min: 60, max: 1200 },
    ],
  },
  announcement: {
    View: Announcement,
    settings: [
      { key: "text", label: "Announcement", kind: "textarea" },
      { key: "link", label: "Link", kind: "url" },
      { key: "tone", label: "Style", kind: "select", options: [{ value: "info", label: "Info" }, { value: "success", label: "Good news" }, { value: "warning", label: "Heads-up" }, { value: "urgent", label: "Urgent" }] },
    ],
  },
  directory: { View: Directory, defaults: { data: { people: [] } } },
};
