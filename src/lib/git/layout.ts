import { liveCommits, type Repo } from "./engine";

export type NodePos = { x: number; y: number; lane: number };
export type GraphLayout = {
  nodes: Record<string, NodePos>;
  /** Commits not reachable from any branch, tag or HEAD (drawn faded). */
  orphaned: Set<string>;
  width: number;
  height: number;
};

export const COL = 78;
export const ROW = 78;
export const PAD = { left: 48, top: 44, right: 150, bottom: 44 };

/**
 * Top-down tree layout. A commit's first parent is its tree parent; the first child continues straight
 * down and later children (branches) step to the right. Merge commits sit below both parents.
 */
export function layoutRepo(repo: Repo): GraphLayout {
  const ids = Object.keys(repo.commits).sort((a, b) => repo.commits[a].order - repo.commits[b].order);
  const children = new Map<string, string[]>();
  for (const id of ids) {
    const p = repo.commits[id].parents[0];
    if (p) children.set(p, [...(children.get(p) ?? []), id]);
  }

  // Columns: depth-first, first child keeps the parent's column.
  const col: Record<string, number> = {};
  let nextCol = 0;
  const place = (id: string, c: number) => {
    col[id] = c;
    (children.get(id) ?? []).forEach((child, i) => place(child, i === 0 ? c : ++nextCol));
  };
  ids
    .filter((id) => repo.commits[id].parents.length === 0)
    .forEach((root, i) => place(root, i === 0 ? 0 : ++nextCol));

  // Rows: one below the deepest parent.
  const row: Record<string, number> = {};
  for (const id of ids) {
    const parents = repo.commits[id].parents;
    row[id] = parents.length ? Math.max(...parents.map((p) => row[p] ?? 0)) + 1 : 0;
  }

  const live = liveCommits(repo);

  const nodes: Record<string, NodePos> = {};
  let maxCol = 0;
  let maxRow = 0;
  for (const id of ids) {
    nodes[id] = { x: PAD.left + col[id] * COL, y: PAD.top + row[id] * ROW, lane: col[id] };
    maxCol = Math.max(maxCol, col[id]);
    maxRow = Math.max(maxRow, row[id]);
  }
  return {
    nodes,
    orphaned: new Set(ids.filter((id) => !live.has(id))),
    width: PAD.left + maxCol * COL + PAD.right,
    height: PAD.top + maxRow * ROW + PAD.bottom,
  };
}
