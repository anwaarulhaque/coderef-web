"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { buildRepo, matchesGoal, remoteView, runGit, splitCommands, type Repo } from "@/lib/git/engine";
import { LEVELS, SANDBOX_START } from "@/lib/git/levels";
import { GitGraph } from "./GitGraph";

type Line = { kind: "cmd" | "out" | "err" | "info" | "success"; text: string };
const STEP_DELAY = 700; // between commands in a multi-command line, so each animation is visible
const STORAGE_KEY = "coderef:git-levels-done";

const REFERENCE_GROUPS: { title: string; items: { cmd: string; desc: string }[] }[] = [
  {
    title: "Commits & branches",
    items: [
      { cmd: "git commit", desc: "Record a new commit on the current branch. -m \"msg\" sets a message; --amend replaces HEAD." },
      { cmd: "git branch <name> [<start>]", desc: "Create a branch. No args lists them; -v shows tips; -a includes origin/*." },
      { cmd: "git branch -m [<old>] <new>", desc: "Rename a branch." },
      { cmd: "git branch -d <name>", desc: "Delete a branch (not the one you're on)." },
      { cmd: "git branch -f <name> <ref>", desc: "Force a branch to point at <ref>." },
      { cmd: "git branch --contains <ref>", desc: "List branches that include a commit." },
      { cmd: "git tag <name> [<ref>]", desc: "Add a fixed label to a commit. -d deletes." },
    ],
  },
  {
    title: "Moving around",
    items: [
      { cmd: "git switch <branch>", desc: "Move HEAD to a branch. -c <name> creates it; --detach <ref> detaches; - goes back." },
      { cmd: "git checkout <ref>", desc: "Switch to a branch or detach at any commit. -b <name> creates; - goes back." },
      { cmd: "git reset <ref>", desc: "Move the current branch (and HEAD) to <ref>. --hard/--soft accepted." },
    ],
  },
  {
    title: "Combining work",
    items: [
      { cmd: "git merge <ref>", desc: "Merge into the current branch (fast-forward if possible). --no-ff forces a merge commit; --squash makes one plain commit." },
      { cmd: "git rebase <onto> [<branch>]", desc: "Replay the branch's commits on top of <onto>." },
      { cmd: "git rebase --onto <new> <upstream>", desc: "Replay only the commits after <upstream> onto <new>." },
      { cmd: "git cherry-pick <ref>…", desc: "Copy commits onto HEAD. Ranges work: A..B." },
      { cmd: "git revert <ref>…", desc: "Add commits that undo earlier ones." },
    ],
  },
  {
    title: "Remotes",
    items: [
      { cmd: "git clone", desc: "Create origin, a remote copy of this repo, with origin/* tracking labels." },
      { cmd: "git fakeTeamwork [<branch>] [<n>]", desc: "Simulate a teammate pushing n commits to origin." },
      { cmd: "git fetch", desc: "Download new commits from origin and move origin/* labels." },
      { cmd: "git pull [--rebase]", desc: "Fetch, then merge (or rebase onto) origin/<branch>." },
      { cmd: "git push [origin <branch>]", desc: "Upload commits; rejected if origin has commits you don't. -f forces." },
      { cmd: "git remote -v", desc: "Show configured remotes." },
    ],
  },
  {
    title: "Inspecting",
    items: [
      { cmd: "git log [<ref> | A..B | --all]", desc: "List commits; A..B shows commits in B but not A." },
      { cmd: "git show [<ref>]", desc: "Show a commit's parents, message and labels." },
      { cmd: "git status", desc: "Where HEAD is, and ahead/behind origin." },
      { cmd: "git reflog", desc: "Every place HEAD has been — use HEAD@{n} to go back." },
      { cmd: "git describe [<ref>]", desc: "Name a commit relative to the nearest tag (v1.0-2-gC5)." },
      { cmd: "git merge-base <a> <b>", desc: "The best common ancestor of two commits." },
    ],
  },
];
const REFERENCE = REFERENCE_GROUPS.flatMap((g) => g.items);
const REFS: { ref: string; desc: string }[] = [
  { ref: "HEAD", desc: "The commit you're on" },
  { ref: "main^", desc: "Parent of main" },
  { ref: "HEAD~3", desc: "3 commits back" },
  { ref: "C5^2", desc: "Second parent of a merge" },
  { ref: "origin/main", desc: "Where origin's main was at last fetch" },
  { ref: "HEAD@{2}", desc: "Where HEAD was 2 moves ago (reflog)" },
  { ref: "main..feature", desc: "Commits in feature but not main" },
  { ref: "C3", desc: "A commit by id" },
];
const EXTRA: { cmd: string; desc: string }[] = [
  { cmd: "undo", desc: "Undo the last command" },
  { cmd: "reset", desc: "Restart the level / sandbox" },
  { cmd: "clear", desc: "Clear the terminal" },
  { cmd: "help", desc: "List commands" },
];

// Renders `code` spans in lesson text.
function rich(text: string): ReactNode {
  return text.split(/(`[^`]+`)/).map((part, i) =>
    part.startsWith("`") ? (
      <code key={i} className="rounded bg-chip px-1 py-0.5 font-mono text-[0.9em]">
        {part.slice(1, -1)}
      </code>
    ) : (
      part
    ),
  );
}

export function GitPlayground() {
  const [levelIndex, setLevelIndex] = useState<number | null>(0); // null = sandbox
  const level = levelIndex === null ? null : LEVELS[levelIndex];
  const startRepo = useMemo(() => buildRepo(level ? level.start : SANDBOX_START), [level]);
  const goalRepo = useMemo(() => {
    if (!level) return null;
    let r = startRepo;
    for (const c of splitCommands(level.goal)) r = runGit(r, c).repo;
    return r;
  }, [level, startRepo]);

  const [repo, setRepo] = useState<Repo>(startRepo);
  const remote = useMemo(() => remoteView(repo), [repo]);
  const goalRemote = useMemo(() => (goalRepo ? remoteView(goalRepo) : null), [goalRepo]);
  const [undo, setUndo] = useState<Repo[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showGoal, setShowGoal] = useState(true);
  const [showHint, setShowHint] = useState(false);
  const [solved, setSolved] = useState(false);
  const [done, setDone] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const repoRef = useRef(repo);
  const undoRef = useRef<Repo[]>([]);
  const terminalRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const cancelRun = useRef(0);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from storage
      if (Array.isArray(saved)) setDone(saved);
    } catch {
      // Storage unavailable: progress just isn't remembered.
    }
  }, []);

  useEffect(() => {
    terminalRef.current?.scrollTo({ top: terminalRef.current.scrollHeight });
  }, [lines]);

  const restart = useCallback(
    (message?: string) => {
      cancelRun.current++;
      repoRef.current = startRepo;
      setRepo(startRepo);
      undoRef.current = [];
      setUndo([]);
      setSolved(false);
      setShowHint(false);
      setBusy(false);
      setLines(message ? [{ kind: "info", text: message }] : []);
    },
    [startRepo],
  );

  // Switching level resets the board.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset when the level changes
    restart(level ? `Level: ${level.title.replace(/^\d+\.\s*/, "")} — ${level.task}` : "Sandbox: try any git command. Type help for a list.");
  }, [level, restart]);

  const markSolved = () => {
    setSolved(true);
    if (!level) return;
    setDone((prev) => {
      const next = prev.includes(level.id) ? prev : [...prev, level.id];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const execute = useCallback(
    (command: string): boolean => {
      const cmd = command.trim();
      if (!cmd) return true;
      setLines((l) => [...l, { kind: "cmd", text: cmd }]);
      if (cmd === "clear") {
        setLines([]);
        return true;
      }
      if (cmd === "help") {
        setLines((l) => [
          ...l,
          ...REFERENCE.map((r) => ({ kind: "out" as const, text: `${r.cmd.padEnd(30)} ${r.desc}` })),
          { kind: "out", text: "undo · reset · clear — playground commands" },
        ]);
        return true;
      }
      if (cmd === "reset") {
        restart("Reset to the starting state.");
        return false;
      }
      if (cmd === "undo") {
        const stack = undoRef.current;
        if (!stack.length) {
          setLines((l) => [...l, { kind: "err", text: "Nothing to undo." }]);
          return false;
        }
        const prev = stack[stack.length - 1];
        undoRef.current = stack.slice(0, -1);
        setUndo(undoRef.current);
        repoRef.current = prev;
        setRepo(prev);
        setSolved(false);
        return true;
      }
      const result = runGit(repoRef.current, cmd);
      if (result.error) {
        setLines((l) => [...l, { kind: "err", text: result.error! }]);
        return false;
      }
      undoRef.current = [...undoRef.current.slice(-50), repoRef.current];
      setUndo(undoRef.current);
      repoRef.current = result.repo;
      setRepo(result.repo);
      if (result.output.length) setLines((l) => [...l, ...result.output.map((text) => ({ kind: "out" as const, text }))]);
      if (goalRepo && level && matchesGoal(result.repo, goalRepo, !!level.compareHead)) {
        setLines((l) => [...l, { kind: "success", text: "🎉 Level complete! The graph matches the goal." }]);
        markSolved();
      }
      return true;
    },
    // markSolved only touches state setters and `level`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [goalRepo, level, restart],
  );

  // Runs "a; b && c" one command at a time so each animation plays.
  const runLine = async (line: string) => {
    const commands = splitCommands(line);
    if (!commands.length) return;
    const run = ++cancelRun.current;
    setBusy(true);
    for (let i = 0; i < commands.length; i++) {
      if (run !== cancelRun.current) return;
      const ok = execute(commands[i]);
      if (!ok) break;
      if (i < commands.length - 1) await new Promise((r) => setTimeout(r, STEP_DELAY));
    }
    if (run === cancelRun.current) setBusy(false);
  };

  const submit = () => {
    const line = input.trim();
    if (!line) return;
    setHistory((h) => [...h.filter((x) => x !== line), line]);
    setHistoryIndex(-1);
    setInput("");
    void runLine(line);
  };

  const insert = (text: string) => {
    // "git branch <name> [<start>]" -> "git branch "
    setInput(text.replace(/\s*[<[].*$/, " "));
    inputRef.current?.focus();
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
      {/* Lesson / level panel */}
      <aside className="space-y-4">
        <section className="rounded-xl border border-border bg-surface p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Levels</h2>
            <span className="text-xs text-muted">
              {done.length}/{LEVELS.length} done
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {LEVELS.map((l, i) => (
              <button
                key={l.id}
                type="button"
                onClick={() => setLevelIndex(i)}
                aria-pressed={levelIndex === i}
                title={l.title}
                className={`h-8 min-w-8 rounded-md border px-2 text-sm ${
                  levelIndex === i
                    ? "border-accent bg-accent text-surface"
                    : done.includes(l.id)
                      ? "border-emerald-600/40 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300"
                      : "border-border text-muted hover:text-foreground"
                }`}
              >
                {done.includes(l.id) && levelIndex !== i ? "✓" : i + 1}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setLevelIndex(null)}
              aria-pressed={levelIndex === null}
              className={`h-8 rounded-md border px-2.5 text-sm ${
                levelIndex === null ? "border-accent bg-accent text-surface" : "border-border text-muted hover:text-foreground"
              }`}
            >
              Sandbox
            </button>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-surface p-4">
          {level ? (
            <>
              <h2 className="mb-2 text-lg font-semibold">{level.title}</h2>
              <div className="space-y-2 text-sm text-muted">
                {level.lesson.map((p, i) => (
                  <p key={i}>{rich(p)}</p>
                ))}
              </div>
              <p className="mt-3 rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-sm">
                <strong>Task:</strong> {level.task}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => setShowHint((s) => !s)} className="rounded-md border border-border px-2.5 py-1 text-xs hover:border-accent hover:text-accent">
                  {showHint ? "Hide hint" : "Hint"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    restart("Showing the solution…");
                    setTimeout(() => void runLine(level.goal), 300);
                  }}
                  className="rounded-md border border-border px-2.5 py-1 text-xs hover:border-accent hover:text-accent"
                >
                  Show solution
                </button>
                <button type="button" onClick={() => setShowGoal((s) => !s)} className="rounded-md border border-border px-2.5 py-1 text-xs hover:border-accent hover:text-accent">
                  {showGoal ? "Hide goal" : "Show goal"}
                </button>
              </div>
              {showHint && <p className="mt-3 text-sm text-muted">{rich(level.hint)}</p>}
              {solved && (
                <div className="mt-4 rounded-lg border border-emerald-600/40 bg-emerald-500/15 px-3 py-2 text-sm">
                  <p className="font-medium">Level complete! 🎉</p>
                  {levelIndex !== null && levelIndex < LEVELS.length - 1 ? (
                    <button type="button" onClick={() => setLevelIndex(levelIndex + 1)} className="mt-1 text-accent hover:underline">
                      Next level →
                    </button>
                  ) : (
                    <button type="button" onClick={() => setLevelIndex(null)} className="mt-1 text-accent hover:underline">
                      Try the sandbox →
                    </button>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              <h2 className="mb-2 text-lg font-semibold">Sandbox</h2>
              <p className="text-sm text-muted">
                No goal — experiment freely. Branch, merge, rebase and watch the graph change. Use <code className="rounded bg-chip px-1 font-mono">undo</code>{" "}
                to step back.
              </p>
            </>
          )}
        </section>
      </aside>

      {/* Graph + terminal */}
      <div className="min-w-0 space-y-4">
        <section className="relative overflow-hidden rounded-xl border border-border bg-surface">
          <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Your repository</h2>
            <div className="flex gap-2">
              <button type="button" onClick={() => execute("undo")} disabled={!undo.length} className="rounded-md border border-border px-2.5 py-1 text-xs enabled:hover:border-accent enabled:hover:text-accent disabled:opacity-40">
                ↶ Undo
              </button>
              <button type="button" onClick={() => restart("Reset to the starting state.")} className="rounded-md border border-border px-2.5 py-1 text-xs hover:border-accent hover:text-accent">
                ⟲ Reset
              </button>
            </div>
          </header>
          <div className="flex min-h-[360px] items-start gap-4 overflow-auto bg-background/50 p-4">
            <div className="flex-1">
              {remote && <p className="mb-1 text-center text-[11px] font-semibold uppercase tracking-wide text-muted">Local</p>}
              <GitGraph repo={repo} />
            </div>
            {remote && (
              <div className="shrink-0 rounded-lg border border-border bg-surface/80 p-2">
                <p className="mb-1 text-center text-[11px] font-semibold uppercase tracking-wide text-muted">origin (remote)</p>
                <GitGraph repo={remote} showHead={false} />
              </div>
            )}
            {goalRepo && showGoal && (
              <div className="sticky top-0 shrink-0 space-y-2 rounded-lg border border-dashed border-accent/60 bg-surface/90 p-2 shadow-sm">
                <p className="text-center text-[11px] font-semibold uppercase tracking-wide text-accent">Goal</p>
                <GitGraph repo={goalRepo} animate={false} compact />
                {goalRemote && (
                  <>
                    <p className="text-center text-[10px] font-semibold uppercase tracking-wide text-accent/80">Goal · origin</p>
                    <GitGraph repo={goalRemote} animate={false} compact showHead={false} />
                  </>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-border bg-[#0f1115] text-[#e8eaee]">
          <div ref={terminalRef} className="h-56 overflow-y-auto px-4 py-3 font-mono text-[13px] leading-6" aria-live="polite">
            {lines.map((line, i) => (
              <div
                key={i}
                className={
                  line.kind === "cmd"
                    ? "text-[#e8eaee]"
                    : line.kind === "err"
                      ? "text-[#f87171]"
                      : line.kind === "success"
                        ? "text-[#4ade80]"
                        : line.kind === "info"
                          ? "text-[#60a5fa]"
                          : "whitespace-pre-wrap text-[#9198a5]"
                }
              >
                {line.kind === "cmd" ? <span className="text-[#4ade80]">$ </span> : null}
                {line.text}
              </div>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
            className="flex items-center gap-2 border-t border-white/10 px-4 py-2"
          >
            <span className="font-mono text-[#4ade80]">$</span>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "ArrowUp" && history.length) {
                  e.preventDefault();
                  const i = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
                  setHistoryIndex(i);
                  setInput(history[i]);
                } else if (e.key === "ArrowDown" && historyIndex !== -1) {
                  e.preventDefault();
                  const i = historyIndex + 1;
                  setHistoryIndex(i >= history.length ? -1 : i);
                  setInput(i >= history.length ? "" : history[i]);
                }
              }}
              placeholder={busy ? "running…" : 'git commit   (separate commands with ";")'}
              aria-label="Git command"
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              className="h-9 flex-1 bg-transparent font-mono text-[13px] text-[#e8eaee] outline-none placeholder:text-[#5f6673]"
            />
            <button type="submit" className="rounded-md bg-white/10 px-3 py-1 text-xs hover:bg-white/20">
              Run ⏎
            </button>
          </form>
        </section>

        {/* How to use: command reference */}
        <section className="rounded-xl border border-border bg-surface p-4">
          <h2 className="mb-1 text-sm font-semibold">How to use</h2>
          <p className="mb-3 text-sm text-muted">
            Type commands in the terminal (↑/↓ for history; separate several with <code className="font-mono">;</code>). Click a
            command below to put it in the terminal. Commits are labelled C0, C1…; copies made by rebase, revert or
            cherry-pick get a prime (C2′). Faded commits are no longer reachable from any branch. After{" "}
            <code className="font-mono">git clone</code>, origin&apos;s graph appears beside yours and dashed{" "}
            <code className="font-mono">origin/…</code> labels show where it was at your last fetch.
          </p>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <div className="space-y-3">
              {REFERENCE_GROUPS.map((group) => (
                <div key={group.title}>
                  <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">{group.title}</h3>
                  <ul className="divide-y divide-border rounded-lg border border-border">
                    {group.items.map((r) => (
                      <li key={r.cmd}>
                        <button type="button" onClick={() => insert(r.cmd)} className="flex w-full flex-col gap-0.5 px-3 py-2 text-left hover:bg-chip sm:flex-row sm:gap-3">
                          <code className="w-64 shrink-0 font-mono text-[13px] font-semibold text-accent">{r.cmd}</code>
                          <span className="text-sm text-muted">{r.desc}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">Refs</h3>
                <ul className="space-y-1 text-sm">
                  {REFS.map((r) => (
                    <li key={r.ref}>
                      <code className="mr-2 rounded bg-chip px-1.5 font-mono">{r.ref}</code>
                      <span className="text-muted">{r.desc}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">Playground</h3>
                <ul className="space-y-1 text-sm">
                  {EXTRA.map((r) => (
                    <li key={r.cmd}>
                      <code className="mr-2 rounded bg-chip px-1.5 font-mono">{r.cmd}</code>
                      <span className="text-muted">{r.desc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
