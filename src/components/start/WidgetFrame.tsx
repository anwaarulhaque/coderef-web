"use client";

import { useState } from "react";
import { widgetDef, type StartWidget } from "@/lib/start-plans";
import { btn, btnGhost, btnPrimary, Icon, input, label, Modal } from "./ui";
import { WIDGETS } from "./widgets/registry";
import type { SettingField, WidgetPatch } from "./widgets/types";

const COLORS = ["", "#2563eb", "#16a34a", "#d97706", "#dc2626", "#9333ea", "#0891b2", "#db2777"];

function Field({ f, value, onChange }: { f: SettingField; value: unknown; onChange: (v: unknown) => void }) {
  const id = `wf-${f.key}`;
  if (f.kind === "toggle")
    return (
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} className="accent-[var(--accent)]" />
        {f.label}
      </label>
    );
  return (
    <div>
      <label htmlFor={id} className={label}>
        {f.label}
      </label>
      {f.kind === "select" ? (
        <select id={id} className={input} value={String(value ?? f.options[0]?.value ?? "")} onChange={(e) => onChange(e.target.value)}>
          {f.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : f.kind === "textarea" ? (
        <textarea id={id} className={`${input} font-mono text-xs`} rows={6} value={String(value ?? "")} placeholder={f.placeholder} onChange={(e) => onChange(e.target.value)} />
      ) : f.kind === "number" ? (
        <input id={id} type="number" className={input} min={f.min} max={f.max} value={value === undefined ? "" : String(value)} onChange={(e) => onChange(e.target.value === "" ? undefined : Math.min(f.max, Math.max(f.min, Number(e.target.value))))} />
      ) : (
        <input id={id} type={f.kind === "url" ? "url" : "text"} className={input} value={String(value ?? "")} placeholder={f.placeholder} onChange={(e) => onChange(e.target.value)} />
      )}
      {"help" in f && f.help && <p className="mt-1 text-xs text-muted">{f.help}</p>}
    </div>
  );
}

function SettingsDialog({ widget, open, onClose, onSave }: { widget: StartWidget; open: boolean; onClose: () => void; onSave: (p: WidgetPatch & { color?: string }) => void }) {
  const fields = WIDGETS[widget.type]?.settings ?? [];
  const [title, setTitle] = useState(widget.title);
  const [color, setColor] = useState(widget.color);
  const [config, setConfig] = useState(widget.config);
  return (
    <Modal open={open} onClose={onClose} title={`${widgetDef(widget.type)?.label ?? "Widget"} settings`}>
      <form
        className="grid gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          onSave({ title, color, config });
          onClose();
        }}
      >
        <div>
          <label htmlFor="wf-title" className={label}>
            Title
          </label>
          <input id="wf-title" className={input} value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <span className={label}>Colour</span>
          <div className="flex gap-1.5">
            {COLORS.map((c) => (
              <button
                key={c || "none"}
                type="button"
                onClick={() => setColor(c)}
                aria-label={c || "No colour"}
                aria-pressed={color === c}
                className={`size-6 rounded-full border ${color === c ? "ring-2 ring-accent ring-offset-2 ring-offset-surface" : "border-border"}`}
                style={{ background: c || "var(--surface)" }}
              />
            ))}
          </div>
        </div>
        {fields.map((f) => (
          <Field key={f.key} f={f} value={config[f.key]} onChange={(v) => setConfig({ ...config, [f.key]: v })} />
        ))}
        <div className="mt-2 flex justify-end gap-2">
          <button type="button" onClick={onClose} className={btn}>
            Cancel
          </button>
          <button type="submit" className={btnPrimary}>
            Save
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function WidgetFrame({
  widget,
  editing,
  canEdit,
  update,
  onDelete,
  onOpen,
  onDragStart,
  onDragEnd,
  dragging,
}: {
  widget: StartWidget;
  editing: boolean;
  canEdit: boolean;
  update: (p: WidgetPatch & { color?: string; collapsed?: boolean }) => void;
  onDelete: () => void;
  onOpen: (url: string) => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  dragging: boolean;
}) {
  const mod = WIDGETS[widget.type];
  const [settings, setSettings] = useState(false);
  const View = mod?.View;
  return (
    <section
      aria-label={widget.title || widgetDef(widget.type)?.label}
      className={`start-widget group/w rounded-xl border border-border bg-surface/95 shadow-sm backdrop-blur transition ${dragging ? "opacity-40" : ""} ${editing ? "ring-1 ring-dashed ring-accent/30" : ""}`}
      style={widget.color ? { borderTopColor: widget.color, borderTopWidth: 3 } : undefined}
    >
      <header
        className={`flex items-center gap-1.5 px-3 pt-2.5 ${widget.collapsed ? "pb-2.5" : "pb-1"} ${editing ? "cursor-grab active:cursor-grabbing" : ""}`}
        draggable={editing}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        {editing && <Icon name="grip" size={14} className="text-muted" />}
        <button
          type="button"
          onClick={() => canEdit && update({ collapsed: !widget.collapsed })}
          className="flex min-w-0 flex-1 items-center gap-1 text-left text-sm font-semibold"
          aria-expanded={!widget.collapsed}
          disabled={!canEdit}
        >
          <span className="truncate" style={widget.color ? { color: widget.color } : undefined}>
            {widget.title || widgetDef(widget.type)?.label}
          </span>
          {canEdit && <Icon name="chevron" size={12} className={`text-muted opacity-0 transition group-hover/w:opacity-100 ${widget.collapsed ? "-rotate-90" : ""}`} />}
        </button>
        {canEdit && (
          <span className={`flex items-center ${editing ? "" : "opacity-0 group-hover/w:opacity-100 focus-within:opacity-100"}`}>
            <button type="button" onClick={() => setSettings(true)} className={btnGhost} aria-label="Widget settings">
              <Icon name="gear" size={14} />
            </button>
            {editing && (
              <button type="button" onClick={onDelete} className={`${btnGhost} hover:text-red-500`} aria-label="Delete widget">
                <Icon name="trash" size={14} />
              </button>
            )}
          </span>
        )}
      </header>
      {!widget.collapsed && <div className="px-3 pb-3">{View ? <View widget={widget} editing={editing} canEdit={canEdit} update={update} onOpen={onOpen} /> : <p className="text-sm text-muted">This widget type isn&apos;t supported.</p>}</div>}
      {settings && <SettingsDialog widget={widget} open={settings} onClose={() => setSettings(false)} onSave={update} />}
    </section>
  );
}
