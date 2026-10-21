"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { headCommit, type Repo } from "@/lib/git/engine";
import { COL, layoutRepo } from "@/lib/git/layout";

type Frame = { x: number; y: number; o: number; s: number };
type Frames = Record<string, Frame>;

const LANE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4", "#ef4444", "#84cc16"];
const laneColor = (lane: number) => LANE_COLORS[lane % LANE_COLORS.length];
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const R = 17;
const labelWidth = (text: string) => text.length * 7.4 + 16;

/**
 * Interpolates every animated thing (commits and labels) from where it is now to its new target.
 * New keys grow in from `enter(key)`; removed keys simply disappear.
 */
function useTween(targets: Frames, enter: (key: string, current: Frames) => Frame, duration: number): Frames {
  const [frames, setFrames] = useState(targets);
  const current = useRef(targets);
  const enterRef = useRef(enter);
  useEffect(() => {
    enterRef.current = enter;
  });

  useEffect(() => {
    const from: Frames = {};
    for (const key of Object.keys(targets)) from[key] = current.current[key] ?? enterRef.current(key, current.current);
    if (duration === 0) {
      current.current = targets;
      const id = requestAnimationFrame(() => setFrames(targets));
      return () => cancelAnimationFrame(id);
    }
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = ease(Math.min(1, (now - start) / duration));
      const next: Frames = {};
      for (const [key, to] of Object.entries(targets)) {
        const f = from[key];
        next[key] = { x: f.x + (to.x - f.x) * t, y: f.y + (to.y - f.y) * t, o: f.o + (to.o - f.o) * t, s: f.s + (to.s - f.s) * t };
      }
      current.current = next;
      setFrames(next);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [targets, duration]);

  return frames;
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

type Label = { key: string; text: string; kind: "branch" | "remote" | "tag" | "head"; active: boolean; commit: string };

function labelsFor(repo: Repo, showHead: boolean): Label[] {
  const labels: Label[] = [];
  const head = headCommit(repo);
  for (const [name, id] of Object.entries(repo.branches)) {
    const active = showHead && repo.head.type === "branch" && repo.head.name === name;
    labels.push({ key: `b:${name}`, text: active ? `${name}*` : name, kind: "branch", active, commit: id });
  }
  for (const [name, id] of Object.entries(repo.remoteBranches)) {
    labels.push({ key: `r:${name}`, text: name, kind: "remote", active: false, commit: id });
  }
  for (const [name, id] of Object.entries(repo.tags)) labels.push({ key: `t:${name}`, text: name, kind: "tag", active: false, commit: id });
  if (showHead && repo.head.type === "detached") labels.push({ key: "HEAD", text: "HEAD", kind: "head", active: true, commit: head });
  // HEAD-ish labels first so they sit closest to the commit, remote-tracking labels last.
  const rank = (l: Label) => (l.active ? 0 : l.kind === "remote" ? 2 : 1);
  return labels.sort((a, b) => rank(a) - rank(b) || a.text.localeCompare(b.text));
}

export function GitGraph({
  repo,
  animate = true,
  compact = false,
  showHead = true,
}: {
  repo: Repo;
  animate?: boolean;
  compact?: boolean;
  /** False for the remote's graph, which has no checked-out HEAD. */
  showHead?: boolean;
}) {
  const reduced = useReducedMotion();
  const layout = useMemo(() => layoutRepo(repo), [repo]);
  const labels = useMemo(() => labelsFor(repo, showHead), [repo, showHead]);
  const head = showHead ? headCommit(repo) : undefined;

  // Labels stack to the right of their commit.
  const labelOffset = useMemo(() => {
    const perCommit = new Map<string, number>();
    const offsets: Record<string, number> = {};
    for (const l of labels) {
      const i = perCommit.get(l.commit) ?? 0;
      perCommit.set(l.commit, i + 1);
      offsets[l.key] = i;
    }
    return offsets;
  }, [labels]);

  const targets = useMemo(() => {
    const t: Frames = {};
    const occupied = new Set(Object.values(layout.nodes).map((p) => `${p.x},${p.y}`));
    for (const [id, p] of Object.entries(layout.nodes)) t[id] = { x: p.x, y: p.y, o: layout.orphaned.has(id) ? 0.3 : 1, s: 1 };
    for (const l of labels) {
      const p = layout.nodes[l.commit];
      // Labels go right of the commit, unless another commit sits there and the left side is free.
      const flip = occupied.has(`${p.x + COL},${p.y}`) && !occupied.has(`${p.x - COL},${p.y}`);
      const x = flip ? p.x - R - 10 - labelWidth(l.text) : p.x + R + 10;
      t[l.key] = { x, y: p.y - 10 + labelOffset[l.key] * 24, o: 1, s: 1 };
    }
    return t;
  }, [layout, labels, labelOffset]);

  // New commits grow out of their parent; new labels fade in where they land.
  const frames = useTween(
    targets,
    (key, current) => {
      const commit = repo.commits[key];
      const parent = commit?.parents[0];
      const t = targets[key];
      if (commit && parent && current[parent]) return { x: current[parent].x, y: current[parent].y, o: 0, s: 0.3 };
      return { ...t, o: 0, s: commit ? 0.3 : 1 };
    },
    animate && !reduced ? 520 : 0,
  );

  // Grow the canvas to the left when a label was flipped to the left of a first-lane commit.
  const minX = Math.min(0, ...labels.map((l) => targets[l.key].x - 8));
  const width = Math.max(layout.width, compact ? 160 : 360) - minX;
  const height = Math.max(layout.height, compact ? 140 : 260);
  const scale = compact ? 0.62 : 1;

  return (
    <svg
      width={width * scale}
      height={height * scale}
      viewBox={`${minX} 0 ${width} ${height}`}
      role="img"
      aria-label={`Commit graph: ${Object.keys(repo.commits).length} commits, HEAD at ${head}`}
      className="mx-auto block max-w-none select-none"
    >
      {/* Edges, drawn from current animated positions */}
      {Object.values(repo.commits).map((c) =>
        c.parents.map((p, i) => {
          const a = frames[p];
          const b = frames[c.id];
          if (!a || !b) return null;
          const midY = (a.y + b.y) / 2;
          return (
            <path
              key={`${p}-${c.id}`}
              d={`M ${a.x} ${a.y} C ${a.x} ${midY}, ${b.x} ${midY}, ${b.x} ${b.y}`}
              fill="none"
              stroke="var(--muted)"
              strokeWidth={2}
              strokeDasharray={i > 0 ? "5 4" : undefined}
              opacity={Math.min(a.o, b.o) * 0.8}
            />
          );
        }),
      )}

      {/* Commits */}
      {Object.values(repo.commits).map((c) => {
        const f = frames[c.id];
        if (!f) return null;
        const isHead = c.id === head;
        const color = laneColor(layout.nodes[c.id].lane);
        return (
          <g key={c.id} transform={`translate(${f.x} ${f.y}) scale(${f.s})`} opacity={f.o}>
            <title>{`${c.id}: ${c.message}${c.parents.length ? ` (parent${c.parents.length > 1 ? "s" : ""} ${c.parents.join(", ")})` : ""}`}</title>
            {isHead && <circle r={R + 6} fill="none" stroke="var(--accent)" strokeWidth={2.5} strokeDasharray="4 3" />}
            <circle r={R} fill={color} stroke="var(--surface)" strokeWidth={3} />
            <text textAnchor="middle" dy="0.35em" fontSize={12} fontWeight={600} fill="#fff" fontFamily="var(--font-geist-mono), monospace">
              {c.id}
            </text>
          </g>
        );
      })}

      {/* Branch, tag and HEAD labels */}
      {labels.map((l) => {
        const f = frames[l.key];
        if (!f) return null;
        const w = labelWidth(l.text);
        const color = l.kind === "head" ? "var(--foreground)" : l.kind === "tag" ? "#f59e0b" : laneColor(layout.nodes[l.commit].lane);
        const remote = l.kind === "remote";
        return (
          <g key={l.key} transform={`translate(${f.x} ${f.y})`} opacity={f.o}>
            {/* origin/* labels are outlined: they mark where origin was, not something you can commit to. */}
            <rect
              width={w}
              height={20}
              rx={l.kind === "tag" ? 3 : 10}
              fill={remote ? "var(--surface)" : color}
              stroke={remote ? color : undefined}
              strokeWidth={remote ? 1.5 : undefined}
              strokeDasharray={remote ? "4 2" : undefined}
              opacity={l.kind === "branch" && !l.active ? 0.85 : 1}
            />
            <text
              x={w / 2}
              y={10}
              textAnchor="middle"
              dy="0.35em"
              fontSize={11.5}
              fontWeight={l.active ? 700 : 500}
              fill={l.kind === "head" ? "var(--surface)" : remote ? color : "#fff"}
              fontFamily="var(--font-geist-mono), monospace"
            >
              {l.text}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
