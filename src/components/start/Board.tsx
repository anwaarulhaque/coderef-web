"use client";

// The page body: its background, then 1–5 columns of widgets. In edit mode widgets drag between columns.
import { useMemo, useState, type ReactNode } from "react";
import { BACKGROUNDS, previewDocument } from "@/lib/backgrounds";
import { themeStyle, type StartPage, type StartWidget } from "@/lib/start/client";
import { placeWidget } from "@/lib/start/layout";
import { WidgetFrame } from "./WidgetFrame";
import type { WidgetPatch } from "./widgets/types";

export function Backdrop({ page }: { page: Pick<StartPage, "theme"> }) {
  const anim = page.theme.background?.startsWith("anim:") ? BACKGROUNDS.find((b) => b.id === page.theme.background!.slice(5)) : null;
  const doc = useMemo(() => (anim ? previewDocument(anim.code(anim.defaults)) : null), [anim]);
  if (!doc) return null;
  // Sandboxed and inert: the effect's script can't reach the page.
  return <iframe aria-hidden tabIndex={-1} title="" srcDoc={doc} sandbox="allow-scripts" className="pointer-events-none fixed inset-0 z-0 h-full w-full border-0" />;
}

/** `ownCss`: the page's custom CSS only applies in its owner's app, never on public pages other people open. */
export function PageShell({ page, brandColor, children, ownCss = true }: { page: Pick<StartPage, "theme" | "id">; brandColor?: string | null; children: ReactNode; ownCss?: boolean }) {
  return (
    <div id="start-root" className="fixed inset-0 z-40 overflow-y-auto bg-background text-foreground" style={themeStyle(page.theme, brandColor)}>
      <Backdrop page={page} />
      {ownCss && page.theme.customCss && <style>{`#start-root { ${page.theme.customCss} }`}</style>}
      <div className="relative z-10 min-h-full">{children}</div>
    </div>
  );
}

export function Board({
  page,
  widgets,
  editing,
  canEdit,
  onWidget,
  onDelete,
  onLayout,
  onOpen,
  emptyState,
}: {
  page: StartPage;
  widgets: StartWidget[];
  editing: boolean;
  canEdit: boolean;
  onWidget: (id: string, patch: WidgetPatch & { color?: string; collapsed?: boolean }) => void;
  onDelete: (id: string) => void;
  onLayout: (next: StartWidget[]) => void;
  onOpen: (widgetId: string, url: string) => void;
  emptyState?: ReactNode;
}) {
  const cols = Math.min(5, Math.max(1, page.theme.columns ?? 4));
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<{ col: number; index: number } | null>(null);
  const gap = page.theme.density === "compact" ? "gap-2" : "gap-4";
  const columns = Array.from({ length: cols }, (_, c) => widgets.filter((w) => Math.min(w.col, cols - 1) === c).sort((a, b) => a.position - b.position));

  const drop = (col: number, index: number) => {
    if (!dragId) return;
    onLayout(placeWidget(widgets, dragId, col, index));
    setDragId(null);
    setOver(null);
  };

  if (!widgets.length && emptyState) return <>{emptyState}</>;
  return (
    <div className={`grid ${gap} px-4 pb-16`} style={{ gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${cols >= 5 ? 220 : 260}px), 1fr))` }}>
      {columns.map((list, c) => (
        <div
          key={c}
          className={`flex min-h-24 flex-col ${gap} rounded-xl ${editing && dragId ? "outline-2 outline-dashed outline-accent/25" : ""}`}
          onDragOver={(e) => {
            if (!dragId) return;
            e.preventDefault();
            if (over?.col !== c || over.index !== list.length) setOver({ col: c, index: list.length });
          }}
          onDrop={(e) => {
            if (!dragId) return;
            e.preventDefault();
            drop(c, over?.col === c ? over.index : list.length);
          }}
        >
          {list.map((w, i) => (
            <div
              key={w.id}
              onDragOver={(e) => {
                if (!dragId) return;
                e.preventDefault();
                e.stopPropagation();
                const r = e.currentTarget.getBoundingClientRect();
                const index = e.clientY < r.top + r.height / 2 ? i : i + 1;
                if (over?.col !== c || over.index !== index) setOver({ col: c, index });
              }}
              onDrop={(e) => {
                if (!dragId) return;
                e.preventDefault();
                e.stopPropagation();
                drop(c, over?.col === c ? over.index : i);
              }}
              className={over && dragId && over.col === c && over.index === i ? "border-t-4 border-accent pt-1" : ""}
            >
              <WidgetFrame
                widget={w}
                editing={editing}
                canEdit={canEdit}
                dragging={dragId === w.id}
                update={(p) => onWidget(w.id, p)}
                onDelete={() => onDelete(w.id)}
                onOpen={(url) => onOpen(w.id, url)}
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", w.id);
                  setDragId(w.id);
                }}
                onDragEnd={() => {
                  setDragId(null);
                  setOver(null);
                }}
              />
            </div>
          ))}
          {over && dragId && over.col === c && over.index === list.length && <div className="h-1 rounded bg-accent" />}
        </div>
      ))}
    </div>
  );
}
