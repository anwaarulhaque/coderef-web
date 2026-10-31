"use client";

// Productivity widgets: notes, to-do, kanban, clock, calendar, countdown, pomodoro and calculator.
import MarkdownIt from "markdown-it";
import { useEffect, useMemo, useState } from "react";
import { calculate } from "@/lib/start/calc";
import { Icon, input } from "../ui";
import { cfg, dat, uid, type WidgetModule, type WidgetProps } from "./types";

// Notes can appear on public pages, so raw HTML is never rendered (the site's own renderer allows it).
const md = new MarkdownIt({ html: false, linkify: true, breaks: true });
const defaultLinkOpen = md.renderer.rules.link_open ?? ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options));
md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  tokens[idx].attrSet("target", "_blank");
  tokens[idx].attrSet("rel", "noopener noreferrer");
  return defaultLinkOpen(tokens, idx, options, env, self);
};

function useNow(ms = 1000) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- first tick after mount avoids a hydration mismatch
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

function Notes({ widget, canEdit, update }: WidgetProps) {
  const text = dat(widget, "text", "");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text);
  const html = useMemo(() => md.render(text), [text]);
  if (editing)
    return (
      <div>
        <textarea autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} rows={8} className={`${input} font-mono text-xs`} aria-label="Note (Markdown)" />
        <div className="mt-1.5 flex gap-3 text-xs">
          <button
            type="button"
            className="font-semibold text-accent"
            onClick={() => {
              update({ data: { ...widget.data, text: draft } });
              setEditing(false);
            }}
          >
            Save
          </button>
          <button type="button" className="text-muted" onClick={() => setEditing(false)}>
            Cancel
          </button>
          <span className="ml-auto text-muted">Markdown</span>
        </div>
      </div>
    );
  return (
    <div
      className="prose-start text-sm [&_a]:text-accent [&_a]:underline [&_code]:rounded [&_code]:bg-chip [&_code]:px-1 [&_h1]:text-base [&_h1]:font-semibold [&_h2]:font-semibold [&_li]:ml-4 [&_ol]:list-decimal [&_p]:my-1.5 [&_ul]:list-disc"
      onDoubleClick={() => {
        if (!canEdit) return;
        setDraft(text);
        setEditing(true);
      }}
    >
      {text ? <div dangerouslySetInnerHTML={{ __html: html }} /> : <p className="text-muted">{canEdit ? "Empty note." : ""}</p>}
      {canEdit && (
        <button
          type="button"
          className="mt-1 text-xs text-muted hover:text-accent"
          onClick={() => {
            setDraft(text);
            setEditing(true);
          }}
        >
          Edit note
        </button>
      )}
    </div>
  );
}

type Todo = { id: string; text: string; done: boolean; due?: string };

function TodoList({ widget, canEdit, update }: WidgetProps) {
  const items = dat<Todo[]>(widget, "items", []);
  const [text, setText] = useState("");
  const save = (next: Todo[]) => update({ data: { ...widget.data, items: next } });
  const sorted = [...items].sort((a, b) => Number(a.done) - Number(b.done));
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div>
      <ul className="space-y-1">
        {sorted.map((t) => (
          <li key={t.id} className="group flex items-start gap-2 text-sm">
            <input type="checkbox" checked={t.done} disabled={!canEdit} onChange={() => save(items.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)))} className="mt-1 accent-[var(--accent)]" aria-label={t.text} />
            <span className={`flex-1 ${t.done ? "text-muted line-through" : ""}`}>
              {t.text}
              {t.due && <span className={`ml-2 text-[11px] ${!t.done && t.due < today ? "text-red-500" : "text-muted"}`}>{t.due}</span>}
            </span>
            {canEdit && (
              <button type="button" onClick={() => save(items.filter((x) => x.id !== t.id))} aria-label={`Delete ${t.text}`} className="text-muted opacity-0 group-hover:opacity-100 hover:text-red-500">
                <Icon name="close" size={12} />
              </button>
            )}
          </li>
        ))}
      </ul>
      {!items.length && <p className="text-sm text-muted">Nothing to do.</p>}
      {canEdit && (
        <form
          className="mt-2 flex gap-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            if (!text.trim()) return;
            // "Pay rent @2026-11-01" sets a due date.
            const m = text.match(/^(.*?)\s*@(\d{4}-\d{2}-\d{2})$/);
            save([...items, { id: uid(), text: (m ? m[1] : text).trim().slice(0, 200), done: false, ...(m && { due: m[2] }) }]);
            setText("");
          }}
        >
          <input className={input} value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a task (… @2026-12-31)" aria-label="New task" />
        </form>
      )}
      {canEdit && items.some((t) => t.done) && (
        <button type="button" onClick={() => save(items.filter((t) => !t.done))} className="mt-1.5 text-xs text-muted hover:text-accent">
          Clear done
        </button>
      )}
    </div>
  );
}

const LANES = ["To do", "Doing", "Done"] as const;
type Card = { id: string; text: string; lane: number };

function Kanban({ widget, canEdit, update }: WidgetProps) {
  const cards = dat<Card[]>(widget, "cards", []);
  const [text, setText] = useState("");
  const [drag, setDrag] = useState<string | null>(null);
  const save = (next: Card[]) => update({ data: { ...widget.data, cards: next } });
  return (
    <div>
      <div className="grid grid-cols-3 gap-1.5">
        {LANES.map((lane, i) => (
          <div
            key={lane}
            className="min-h-20 rounded-lg bg-chip p-1.5"
            onDragOver={(e) => drag && e.preventDefault()}
            onDrop={(e) => {
              if (!drag) return;
              e.preventDefault();
              e.stopPropagation();
              save(cards.map((c) => (c.id === drag ? { ...c, lane: i } : c)));
              setDrag(null);
            }}
          >
            <p className="mb-1 text-[11px] font-semibold uppercase text-muted">
              {lane} <span className="font-normal">{cards.filter((c) => c.lane === i).length}</span>
            </p>
            {cards
              .filter((c) => c.lane === i)
              .map((c) => (
                <div
                  key={c.id}
                  draggable={canEdit}
                  onDragStart={(e) => {
                    e.stopPropagation();
                    setDrag(c.id);
                  }}
                  onDoubleClick={() => canEdit && save(cards.filter((x) => x.id !== c.id))}
                  title={canEdit ? "Drag to move, double-click to delete" : undefined}
                  className="mb-1 cursor-grab rounded-md border border-border bg-surface px-1.5 py-1 text-xs"
                >
                  {c.text}
                </div>
              ))}
          </div>
        ))}
      </div>
      {canEdit && (
        <form
          className="mt-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!text.trim()) return;
            save([...cards, { id: uid(), text: text.trim().slice(0, 160), lane: 0 }]);
            setText("");
          }}
        >
          <input className={input} value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a card" aria-label="New card" />
        </form>
      )}
    </div>
  );
}

function Clock({ widget }: WidgetProps) {
  const now = useNow();
  const zones = cfg(widget, "zones", "")
    .split(",")
    .map((z) => z.trim())
    .filter(Boolean);
  const h12 = cfg(widget, "format", "auto") === "12";
  const h24 = cfg(widget, "format", "auto") === "24";
  const fmt = (tz?: string, opts: Intl.DateTimeFormatOptions = {}) => {
    try {
      return new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit", ...(h12 && { hour12: true }), ...(h24 && { hour12: false }), timeZone: tz, ...opts }).format(now ?? 0);
    } catch {
      return "—";
    }
  };
  if (now === null) return <div className="h-14" />;
  return (
    <div>
      <p className="text-4xl font-semibold tabular-nums tracking-tight">{fmt()}</p>
      <p className="text-sm text-muted">{new Intl.DateTimeFormat(undefined, { weekday: "long", day: "numeric", month: "long" }).format(now)}</p>
      {!!zones.length && (
        <ul className="mt-3 space-y-1 border-t border-border pt-2 text-sm">
          {zones.map((z) => (
            <li key={z} className="flex justify-between">
              <span className="text-muted">{z.split("/").pop()?.replace(/_/g, " ")}</span>
              <span className="tabular-nums">{fmt(z)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Calendar() {
  const now = useNow(60_000);
  const [offset, setOffset] = useState(0);
  if (now === null) return <div className="h-48" />;
  const today = new Date(now);
  const first = new Date(today.getFullYear(), today.getMonth() + offset, 1);
  const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const lead = (first.getDay() + 6) % 7; // Monday first
  const cells = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const isToday = (d: number) => offset === 0 && d === today.getDate();
  return (
    <div className="text-sm">
      <div className="mb-2 flex items-center justify-between">
        <button type="button" onClick={() => setOffset(offset - 1)} aria-label="Previous month" className="rounded px-1.5 hover:bg-chip">
          ‹
        </button>
        <button type="button" onClick={() => setOffset(0)} className="font-semibold">
          {first.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </button>
        <button type="button" onClick={() => setOffset(offset + 1)} aria-label="Next month" className="rounded px-1.5 hover:bg-chip">
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center text-xs">
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
          <span key={d} className="py-1 text-muted">
            {d}
          </span>
        ))}
        {cells.map((d, i) => (
          <span key={i} className={`rounded-md py-1 tabular-nums ${d && isToday(d) ? "bg-accent font-bold text-surface" : ""}`}>
            {d ?? ""}
          </span>
        ))}
      </div>
    </div>
  );
}

function Countdown({ widget }: WidgetProps) {
  const now = useNow();
  const target = Date.parse(cfg(widget, "date", ""));
  if (!Number.isFinite(target)) return <p className="text-sm text-muted">Set a date in this widget&apos;s settings.</p>;
  if (now === null) return <div className="h-14" />;
  const left = Math.max(0, target - now);
  const parts: [number, string][] = [
    [Math.floor(left / 86400_000), "days"],
    [Math.floor(left / 3600_000) % 24, "hours"],
    [Math.floor(left / 60_000) % 60, "min"],
    [Math.floor(left / 1000) % 60, "sec"],
  ];
  return (
    <div className="text-center">
      <p className="mb-2 text-sm text-muted">{cfg(widget, "label", "") || new Date(target).toLocaleString()}</p>
      {left === 0 ? (
        <p className="text-2xl font-semibold">🎉 It&apos;s here</p>
      ) : (
        <div className="grid grid-cols-4 gap-1.5">
          {parts.map(([n, l]) => (
            <div key={l} className="rounded-lg bg-chip py-2">
              <p className="text-2xl font-semibold tabular-nums">{n}</p>
              <p className="text-[11px] text-muted">{l}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Pomodoro({ widget }: WidgetProps) {
  const work = cfg(widget, "work", 25) * 60;
  const rest = cfg(widget, "rest", 5) * 60;
  const [phase, setPhase] = useState<"work" | "rest">("work");
  const [left, setLeft] = useState(work);
  const [running, setRunning] = useState(false);
  const [rounds, setRounds] = useState(0);
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setLeft((s) => {
        if (s > 1) return s - 1;
        const next = phase === "work" ? "rest" : "work";
        if (phase === "work") setRounds((r) => r + 1);
        setPhase(next);
        try {
          new Notification(next === "rest" ? "Time for a break" : "Back to work", { silent: false });
        } catch {
          /* notifications not allowed */
        }
        return next === "work" ? work : rest;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [running, phase, work, rest]);
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  return (
    <div className="text-center">
      <p className={`text-xs font-semibold uppercase ${phase === "work" ? "text-accent" : "text-green-600"}`}>{phase === "work" ? "Focus" : "Break"}</p>
      <p className="my-1 text-5xl font-semibold tabular-nums tracking-tight">
        {mm}:{ss}
      </p>
      <div className="flex justify-center gap-2">
        <button
          type="button"
          onClick={() => {
            if (!running && typeof Notification !== "undefined" && Notification.permission === "default") void Notification.requestPermission();
            setRunning(!running);
          }}
          className="inline-flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-surface"
        >
          <Icon name={running ? "pause" : "play"} size={14} /> {running ? "Pause" : "Start"}
        </button>
        <button
          type="button"
          onClick={() => {
            setRunning(false);
            setPhase("work");
            setLeft(work);
          }}
          className="rounded-lg border border-border px-3 py-1.5 text-sm"
        >
          Reset
        </button>
      </div>
      <p className="mt-2 text-xs text-muted">{rounds} focus rounds today</p>
    </div>
  );
}

function Calculator() {
  const [expr, setExpr] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const result = calculate(expr);
  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (result === null) return;
          setHistory([`${expr} = ${+result.toPrecision(12)}`, ...history].slice(0, 5));
          setExpr(String(+result.toPrecision(12)));
        }}
      >
        <input className={`${input} font-mono`} value={expr} onChange={(e) => setExpr(e.target.value)} placeholder="(12 + 30) * 1.2" aria-label="Expression" />
      </form>
      <p className="mt-1.5 h-6 text-right font-mono text-lg font-semibold tabular-nums">{expr && (result === null ? "…" : `= ${+result.toPrecision(12)}`)}</p>
      {!!history.length && (
        <ul className="mt-1 space-y-0.5 border-t border-border pt-1.5 font-mono text-xs text-muted">
          {history.map((h, i) => (
            <li key={i}>{h}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export const PRODUCTIVITY_WIDGETS: Record<string, WidgetModule> = {
  notes: { View: Notes, defaults: { data: { text: "" } } },
  todo: { View: TodoList, defaults: { data: { items: [] } } },
  kanban: { View: Kanban, defaults: { data: { cards: [] } } },
  clock: {
    View: Clock,
    settings: [
      { key: "zones", label: "Other cities (time zones, comma separated)", kind: "text", placeholder: "America/New_York, Europe/London, Asia/Tokyo" },
      { key: "format", label: "Format", kind: "select", options: [{ value: "auto", label: "Automatic" }, { value: "12", label: "12-hour" }, { value: "24", label: "24-hour" }] },
    ],
  },
  calendar: { View: Calendar },
  countdown: {
    View: Countdown,
    settings: [
      { key: "date", label: "Date and time", kind: "text", placeholder: "2026-12-31T23:59" },
      { key: "label", label: "Label", kind: "text", placeholder: "Launch day" },
    ],
  },
  pomodoro: {
    View: Pomodoro,
    settings: [
      { key: "work", label: "Focus minutes", kind: "number", min: 1, max: 120 },
      { key: "rest", label: "Break minutes", kind: "number", min: 1, max: 60 },
    ],
  },
  calculator: { View: Calculator },
};
