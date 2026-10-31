// Widget placement after drag and drop, kept free of React so it can be unit tested.
import type { StartWidget } from "../start-plans.ts";

export type Placement = { id: string; col: number; position: number };

/** Moves one widget to (col, index) and renumbers both affected columns. */
export function placeWidget(widgets: StartWidget[], id: string, col: number, index: number): StartWidget[] {
  const moving = widgets.find((w) => w.id === id);
  if (!moving) return widgets;
  const rest = widgets.filter((w) => w.id !== id);
  const target = rest.filter((w) => w.col === col).sort((a, b) => a.position - b.position);
  target.splice(Math.min(index, target.length), 0, { ...moving, col });
  const renumbered = new Map(target.map((w, i) => [w.id, { ...w, position: i }]));
  const source = rest.filter((w) => w.col === moving.col && moving.col !== col).sort((a, b) => a.position - b.position);
  source.forEach((w, i) => renumbered.set(w.id, { ...w, position: i }));
  return [...rest.filter((w) => !renumbered.has(w.id)), ...renumbered.values()];
}
