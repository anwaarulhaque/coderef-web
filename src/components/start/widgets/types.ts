import type { ComponentType } from "react";
import type { StartWidget } from "@/lib/start-plans";

export type WidgetPatch = { title?: string; config?: Record<string, unknown>; data?: Record<string, unknown> };

export type WidgetProps = {
  widget: StartWidget;
  /** Page edit mode (drag handles, remove buttons). */
  editing: boolean;
  /** Whether this viewer may change content (false on public pages and for team viewers). */
  canEdit: boolean;
  update: (patch: WidgetPatch) => void;
  /** Called when a link is opened, for team analytics. */
  onOpen: (url: string) => void;
};

/** One field of a widget's settings form; values live in widget.config[key]. */
export type SettingField =
  | { key: string; label: string; kind: "text" | "url" | "textarea"; placeholder?: string; help?: string }
  | { key: string; label: string; kind: "number"; min: number; max: number }
  | { key: string; label: string; kind: "select"; options: { value: string; label: string }[] }
  | { key: string; label: string; kind: "toggle" };

export type WidgetModule = { View: ComponentType<WidgetProps>; settings?: SettingField[]; defaults?: { config?: Record<string, unknown>; data?: Record<string, unknown> } };

/** Literal fallbacks ("list", 8, false) widen to their base type, so settings values compare freely. */
type Widen<T> = T extends string ? string : T extends number ? number : T extends boolean ? boolean : T;
export const cfg = <T>(w: StartWidget, key: string, fallback: T): Widen<T> => ((w.config[key] as Widen<T>) ?? fallback) as Widen<T>;
export const dat = <T>(w: StartWidget, key: string, fallback: T): Widen<T> => ((w.data[key] as Widen<T>) ?? fallback) as Widen<T>;
export const uid = () => Math.random().toString(36).slice(2, 10);
