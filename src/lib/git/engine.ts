// A small in-memory model of Git's commit graph, enough to teach branching and remotes:
// commits, branches, tags, HEAD, merge, rebase, reset, revert, cherry-pick, reflog,
// and a single remote ("origin") with clone / fetch / pull / push.

export type Commit = { id: string; parents: string[]; message: string; order: number };

export type Head = { type: "branch"; name: string } | { type: "detached"; id: string };

/** The remote repository: its own commits and branches. */
export type Remote = { commits: Record<string, Commit>; branches: Record<string, string> };

export type Repo = {
  commits: Record<string, Commit>;
  branches: Record<string, string>;
  tags: Record<string, string>;
  head: Head;
  /** Where HEAD was before the last switch, for `git switch -`. */
  prevHead?: Head;
  /** Newest first, like `git reflog`. */
  reflog: { id: string; msg: string }[];
  remote?: Remote;
  /** Remote-tracking branches, e.g. { "origin/main": "C3" }. */
  remoteBranches: Record<string, string>;
  nextId: number;
  nextOrder: number;
};

export type RunResult = { repo: Repo; output: string[]; error?: string };

export function initRepo(): Repo {
  return {
    commits: {
      C0: { id: "C0", parents: [], message: "Initial commit", order: 0 },
      C1: { id: "C1", parents: ["C0"], message: "Add README", order: 1 },
    },
    branches: { main: "C1" },
    tags: {},
    head: { type: "branch", name: "main" },
    reflog: [{ id: "C1", msg: "commit: Add README" }],
    remoteBranches: {},
    nextId: 2,
    nextOrder: 2,
  };
}

export const headCommit = (repo: Repo) => (repo.head.type === "branch" ? repo.branches[repo.head.name] : repo.head.id);

class GitError extends Error {}

/** Every commit reachable from `id` (including itself) in a commit map. */
export function reachableIn(commits: Record<string, Commit>, id: string): Set<string> {
  const seen = new Set<string>();
  const stack = [id];
  while (stack.length) {
    const c = stack.pop()!;
    if (seen.has(c) || !commits[c]) continue;
    seen.add(c);
    stack.push(...commits[c].parents);
  }
  return seen;
}

export const reachable = (repo: Repo, id: string) => reachableIn(repo.commits, id);

/** Is `ancestor` reachable from `from`? */
export const isAncestor = (repo: Repo, ancestor: string, from: string) => reachable(repo, from).has(ancestor);

const byOrder = (repo: Repo) => (a: string, b: string) => repo.commits[a].order - repo.commits[b].order;

/** Resolves refs like main, C3, HEAD, HEAD~2, main^, C5^2, v1.0, origin/main, HEAD@{2}. */
export function resolve(repo: Repo, ref: string): string {
  const reflogMatch = /^HEAD@\{(\d+)\}$/.exec(ref);
  if (reflogMatch) {
    const entry = repo.reflog[Number(reflogMatch[1])];
    if (!entry) throw new GitError(`fatal: log for 'HEAD' only has ${repo.reflog.length} entries`);
    return entry.id;
  }
  const m = /^([^~^]+)((?:[~^]\d*)*)$/.exec(ref);
  if (!m) throw new GitError(`fatal: invalid reference: ${ref}`);
  const [, base, ops] = m;
  let id: string | undefined;
  if (base === "HEAD" || base === "@") id = headCommit(repo);
  else if (repo.branches[base]) id = repo.branches[base];
  else if (repo.tags[base]) id = repo.tags[base];
  else if (repo.remoteBranches[base]) id = repo.remoteBranches[base];
  else id = Object.keys(repo.commits).find((c) => c.toLowerCase() === base.toLowerCase());
  if (!id) throw new GitError(`fatal: ambiguous argument '${ref}': unknown revision`);
  for (const op of ops.match(/[~^]\d*/g) ?? []) {
    const n = op.length > 1 ? Number(op.slice(1)) : 1;
    if (op[0] === "~") {
      for (let i = 0; i < n; i++) {
        id = repo.commits[id!].parents[0];
        if (!id) throw new GitError(`fatal: '${ref}' goes past the first commit`);
      }
    } else {
      id = n === 0 ? id : repo.commits[id!].parents[n - 1];
      if (!id) throw new GitError(`fatal: '${ref}' has no parent ${n}`);
    }
  }
  return id!;
}

/** "A..B" -> commits in B that aren't in A (oldest first); a plain ref -> [ref]. */
function resolveCommits(repo: Repo, arg: string): string[] {
  const range = /^(.*)\.\.(.*)$/.exec(arg);
  if (!range) return [resolve(repo, arg)];
  const exclude = reachable(repo, resolve(repo, range[1] || "HEAD"));
  return [...reachable(repo, resolve(repo, range[2] || "HEAD"))].filter((id) => !exclude.has(id)).sort(byOrder(repo));
}

function newCommit(repo: Repo, parents: string[], message: string, id = `C${repo.nextId++}`): string {
  repo.commits[id] = { id, parents, message, order: repo.nextOrder++ };
  return id;
}

/** C3 -> C3', C3' -> C3'' (the next free name), the way learning tools name copied commits. */
function copyId(repo: Repo, id: string): string {
  let next = `${id}'`;
  while (repo.commits[next] || repo.remote?.commits[next]) next += "'";
  return next;
}

function moveHead(repo: Repo, id: string) {
  if (repo.head.type === "branch") repo.branches[repo.head.name] = id;
  else repo.head = { type: "detached", id };
}

function setHead(repo: Repo, head: Head) {
  const same = head.type === repo.head.type && (head.type === "branch" ? head.name === (repo.head as { name: string }).name : head.id === (repo.head as { id: string }).id);
  if (!same) repo.prevHead = repo.head;
  repo.head = head;
}

function checkout(repo: Repo, ref: string): string {
  if (ref === "-") {
    if (!repo.prevHead) throw new GitError("error: no previous branch to switch to");
    const prev = repo.prevHead;
    setHead(repo, prev);
    return prev.type === "branch" ? `Switched to branch '${prev.name}'` : `HEAD is now at ${prev.id}`;
  }
  if (repo.branches[ref]) {
    setHead(repo, { type: "branch", name: ref });
    return `Switched to branch '${ref}'`;
  }
  const id = resolve(repo, ref);
  setHead(repo, { type: "detached", id });
  return `HEAD is now at ${id} (detached HEAD)`;
}

const validName = (name: string) => /^(?!-)(?!.*\.\.)[\w./-]+$/.test(name) && name !== "HEAD" && !/^C\d+'*$/i.test(name);

function createBranch(repo: Repo, name: string, start: string, force = false) {
  if (!validName(name)) throw new GitError(`fatal: '${name}' is not a valid branch name`);
  if (repo.branches[name] && !force) throw new GitError(`fatal: a branch named '${name}' already exists`);
  if (force && repo.head.type === "branch" && repo.head.name === name) {
    throw new GitError(`fatal: cannot force update the branch '${name}' used by HEAD`);
  }
  repo.branches[name] = resolve(repo, start);
}

/** Replays commits (oldest first, skipping merges) on top of `onto`; returns the new tip. */
function replay(repo: Repo, commits: string[], onto: string, out: string[]): string {
  let base = onto;
  for (const id of commits) {
    if (repo.commits[id].parents.length > 1) continue;
    base = newCommit(repo, [base], repo.commits[id].message, copyId(repo, id));
    out.push(`Applied ${id} → ${base}`);
  }
  return base;
}

const label = (repo: Repo) => (repo.head.type === "branch" ? repo.head.name : `detached at ${repo.head.id}`);

/** Positional arguments, skipping flags and the values of flags that take one. */
function positional(args: string[], valued: string[] = []): string[] {
  const out: string[] = [];
  for (let i = 0; i < args.length; i++) {
    if (valued.includes(args[i])) i++;
    else if (!args[i].startsWith("-") || args[i] === "-") out.push(args[i]);
  }
  return out;
}

function requireRemote(repo: Repo): Remote {
  if (!repo.remote) throw new GitError("fatal: no remote configured. Run `git clone` first to create origin.");
  return repo.remote;
}

/** Copies commits reachable from `tip` from one commit map to another. */
function copyCommits(from: Record<string, Commit>, to: Record<string, Commit>, tip: string): number {
  let n = 0;
  for (const id of reachableIn(from, tip)) {
    if (!to[id]) {
      to[id] = { ...from[id], parents: [...from[id].parents] };
      n++;
    }
  }
  return n;
}

function fetch(repo: Repo, only?: string): string[] {
  const remote = requireRemote(repo);
  const out: string[] = [];
  for (const [name, tip] of Object.entries(remote.branches)) {
    if (only && name !== only) continue;
    const n = copyCommits(remote.commits, repo.commits, tip);
    const key = `origin/${name}`;
    if (repo.remoteBranches[key] !== tip) out.push(` ${repo.remoteBranches[key] ?? "[new branch]"}..${tip}  ${name} -> ${key}${n ? ` (${n} new commit${n > 1 ? "s" : ""})` : ""}`);
    repo.remoteBranches[key] = tip;
  }
  return out.length ? ["From origin", ...out] : [];
}

function merge(repo: Repo, ref: string, opts: { noFf?: boolean; squash?: boolean } = {}): string[] {
  const head = headCommit(repo);
  const target = resolve(repo, ref);
  if (isAncestor(repo, target, head)) return ["Already up to date."];
  if (opts.squash) {
    const id = newCommit(repo, [head], `Squashed commit of ${ref}`);
    moveHead(repo, id);
    return [`Squash commit ${id}: all of ${ref}'s changes in one commit (no merge parent).`];
  }
  if (isAncestor(repo, head, target) && !opts.noFf) {
    moveHead(repo, target);
    return [`Updating ${head}..${target}`, "Fast-forward"];
  }
  const id = newCommit(repo, [head, target], `Merge ${ref} into ${label(repo)}`);
  moveHead(repo, id);
  return [`Merge made by the 'ort' strategy. (${id})`];
}

function rebase(repo: Repo, onto: string, upstream: string): string[] {
  const head = headCommit(repo);
  const ontoId = resolve(repo, onto);
  const upstreamId = resolve(repo, upstream);
  if (onto === upstream && isAncestor(repo, ontoId, head)) return [`Current branch ${label(repo)} is up to date.`];
  if (onto === upstream && isAncestor(repo, head, ontoId)) {
    moveHead(repo, ontoId);
    return [`Successfully rebased and updated ${label(repo)} (fast-forward).`];
  }
  const exclude = reachable(repo, upstreamId);
  const commits = [...reachable(repo, head)].filter((id) => !exclude.has(id)).sort(byOrder(repo));
  const out: string[] = [];
  moveHead(repo, replay(repo, commits, ontoId, out));
  return [...out, `Successfully rebased and updated ${label(repo)}.`];
}

type Handler = (repo: Repo, args: string[]) => string[];

const COMMANDS: Record<string, Handler> = {
  commit(repo, args) {
    const mIndex = args.findIndex((a) => a === "-m" || a === "-am");
    const message = mIndex >= 0 ? (args[mIndex + 1] ?? "") : "";
    const head = headCommit(repo);
    if (args.includes("--amend")) {
      const id = newCommit(repo, [...repo.commits[head].parents], message || repo.commits[head].message, copyId(repo, head));
      moveHead(repo, id);
      return [`[${label(repo)} ${id}] ${repo.commits[id].message} (amended ${head})`];
    }
    const id = newCommit(repo, [head], message || "Quick commit");
    moveHead(repo, id);
    return [`[${label(repo)} ${id}] ${repo.commits[id].message}`];
  },

  branch(repo, args) {
    const rest = positional(args, ["--contains", "-u", "--set-upstream-to"]);
    const has = (...f: string[]) => f.some((x) => args.includes(x));
    if (has("-d", "-D", "--delete")) {
      return rest.map((name) => {
        if (!repo.branches[name]) throw new GitError(`error: branch '${name}' not found`);
        if (repo.head.type === "branch" && repo.head.name === name) {
          throw new GitError(`error: cannot delete branch '${name}' used by HEAD`);
        }
        const id = repo.branches[name];
        delete repo.branches[name];
        return `Deleted branch ${name} (was ${id}).`;
      });
    }
    if (has("-m", "-M", "--move")) {
      const [from, to] = rest.length === 1 && repo.head.type === "branch" ? [repo.head.name, rest[0]] : rest;
      if (!from || !to) throw new GitError("usage: git branch -m [<old>] <new>");
      if (!repo.branches[from]) throw new GitError(`error: branch '${from}' not found`);
      if (!validName(to)) throw new GitError(`fatal: '${to}' is not a valid branch name`);
      if (repo.branches[to] && !args.includes("-M")) throw new GitError(`fatal: a branch named '${to}' already exists`);
      repo.branches[to] = repo.branches[from];
      delete repo.branches[from];
      if (repo.head.type === "branch" && repo.head.name === from) repo.head = { type: "branch", name: to };
      return [`Renamed branch ${from} to ${to}`];
    }
    if (has("--contains")) {
      const target = resolve(repo, args[args.indexOf("--contains") + 1] ?? "HEAD");
      return Object.keys(repo.branches)
        .filter((b) => isAncestor(repo, target, repo.branches[b]))
        .sort()
        .map((b) => `${repo.head.type === "branch" && repo.head.name === b ? "*" : " "} ${b}`);
    }
    if (has("-a", "-r", "--all", "--remotes")) {
      const remotes = Object.keys(repo.remoteBranches).sort().map((b) => `  remotes/${b}`);
      return has("-r", "--remotes") ? remotes : [...listBranches(repo, false), ...remotes];
    }
    if (rest.length === 0) return listBranches(repo, has("-v", "-vv", "--verbose"));
    const force = has("-f", "--force");
    createBranch(repo, rest[0], rest[1] ?? "HEAD", force);
    return force ? [`Moved branch ${rest[0]} to ${repo.branches[rest[0]]}`] : [];
  },

  checkout(repo, args) {
    if (args[0] === "-b" || args[0] === "-B") {
      if (!args[1]) throw new GitError("error: switch '-b' requires a value");
      createBranch(repo, args[1], args[2] ?? "HEAD", args[0] === "-B");
      setHead(repo, { type: "branch", name: args[1] });
      return [`Switched to a new branch '${args[1]}'`];
    }
    if (!args[0]) throw new GitError("error: specify a branch or commit to check out");
    // `git checkout origin-only-branch` creates a local tracking branch, like real Git.
    if (!repo.branches[args[0]] && repo.remoteBranches[`origin/${args[0]}`]) {
      repo.branches[args[0]] = repo.remoteBranches[`origin/${args[0]}`];
      setHead(repo, { type: "branch", name: args[0] });
      return [`branch '${args[0]}' set up to track 'origin/${args[0]}'.`, `Switched to a new branch '${args[0]}'`];
    }
    return [checkout(repo, args[0])];
  },

  switch(repo, args) {
    if (args[0] === "-c" || args[0] === "-C" || args[0] === "--create") {
      if (!args[1]) throw new GitError("error: switch '-c' requires a value");
      createBranch(repo, args[1], args[2] ?? "HEAD", args[0] === "-C");
      setHead(repo, { type: "branch", name: args[1] });
      return [`Switched to a new branch '${args[1]}'`];
    }
    if (args[0] === "--detach" || args[0] === "-d") {
      const id = resolve(repo, args[1] ?? "HEAD");
      setHead(repo, { type: "detached", id });
      return [`HEAD is now at ${id}`];
    }
    if (!args[0]) throw new GitError("fatal: missing branch name");
    if (args[0] !== "-" && !repo.branches[args[0]]) {
      if (repo.remoteBranches[`origin/${args[0]}`]) return COMMANDS.checkout(repo, args);
      throw new GitError(`fatal: invalid reference: ${args[0]} (use 'git switch --detach ${args[0]}' for a commit)`);
    }
    return [checkout(repo, args[0])];
  },

  merge(repo, args) {
    const refs = positional(args);
    if (!refs[0]) throw new GitError("fatal: no commit specified to merge");
    return merge(repo, refs[0], { noFf: args.includes("--no-ff"), squash: args.includes("--squash") });
  },

  rebase(repo, args) {
    if (args.some((a) => a === "-i" || a === "--interactive")) {
      throw new GitError("Interactive rebase isn't supported here — use cherry-pick to choose commits.");
    }
    const ontoIndex = args.indexOf("--onto");
    const refs = positional(args, ["--onto"]);
    if (ontoIndex >= 0) {
      // git rebase --onto <newbase> <upstream> [<branch>]
      const newBase = args[ontoIndex + 1];
      if (!newBase || !refs[0]) throw new GitError("usage: git rebase --onto <newbase> <upstream> [<branch>]");
      if (refs[1]) checkout(repo, refs[1]);
      return rebase(repo, newBase, refs[0]);
    }
    if (!refs[0]) throw new GitError("fatal: specify the branch to rebase onto");
    if (refs[1]) checkout(repo, refs[1]);
    return rebase(repo, refs[0], refs[0]);
  },

  reset(repo, args) {
    const id = resolve(repo, positional(args)[0] ?? "HEAD");
    moveHead(repo, id);
    return [`HEAD is now at ${id}`];
  },

  revert(repo, args) {
    const refs = positional(args);
    if (!refs.length) throw new GitError("fatal: specify a commit to revert");
    return refs.flatMap((r) => resolveCommits(repo, r)).map((target) => {
      const id = newCommit(repo, [headCommit(repo)], `Revert "${repo.commits[target].message}"`, copyId(repo, target));
      moveHead(repo, id);
      return `[${label(repo)} ${id}] Revert ${target}`;
    });
  },

  "cherry-pick"(repo, args) {
    const refs = positional(args);
    if (!refs.length) throw new GitError("fatal: specify commits to cherry-pick");
    // Resolve everything first so "HEAD~1" etc. mean what they meant before we start.
    const ids = refs.flatMap((r) => resolveCommits(repo, r));
    return ids.map((target) => {
      if (isAncestor(repo, target, headCommit(repo))) {
        throw new GitError(`error: ${target} is already part of ${label(repo)}`);
      }
      const id = newCommit(repo, [headCommit(repo)], repo.commits[target].message, copyId(repo, target));
      moveHead(repo, id);
      return `[${label(repo)} ${id}] picked ${target}`;
    });
  },

  tag(repo, args) {
    const rest = positional(args, ["-m"]);
    if (args.includes("-d")) {
      return rest.map((name) => {
        if (!repo.tags[name]) throw new GitError(`error: tag '${name}' not found.`);
        delete repo.tags[name];
        return `Deleted tag '${name}'`;
      });
    }
    if (!rest[0]) return Object.keys(repo.tags).sort();
    if (!validName(rest[0])) throw new GitError(`fatal: '${rest[0]}' is not a valid tag name`);
    if (repo.tags[rest[0]] && !args.includes("-f")) throw new GitError(`fatal: tag '${rest[0]}' already exists`);
    repo.tags[rest[0]] = resolve(repo, rest[1] ?? "HEAD");
    return [];
  },

  log(repo, args) {
    const ref = positional(args, ["-n"])[0];
    const all = args.includes("--all");
    let ids: string[];
    if (all) ids = Object.keys(repo.commits).filter((id) => liveCommits(repo).has(id));
    else if (ref?.includes("..")) ids = resolveCommits(repo, ref);
    else ids = [...reachable(repo, resolve(repo, ref ?? "HEAD"))];
    const limit = args.includes("-n") ? Number(args[args.indexOf("-n") + 1]) || 20 : 20;
    return ids
      .sort((a, b) => repo.commits[b].order - repo.commits[a].order)
      .slice(0, limit)
      .map((id) => {
        const refs = refsAt(repo, id);
        return `${id}${refs.length ? ` (${refs.join(", ")})` : ""} ${repo.commits[id].message}`;
      });
  },

  show(repo, args) {
    const id = resolve(repo, positional(args)[0] ?? "HEAD");
    const c = repo.commits[id];
    const refs = refsAt(repo, id);
    return [
      `commit ${id}${refs.length ? ` (${refs.join(", ")})` : ""}`,
      ...(c.parents.length > 1 ? [`Merge: ${c.parents.join(" ")}`] : c.parents.length ? [`Parent: ${c.parents[0]}`] : ["(root commit)"]),
      "",
      `    ${c.message}`,
    ];
  },

  status(repo) {
    const lines = repo.head.type === "branch" ? [`On branch ${repo.head.name}`] : [`HEAD detached at ${repo.head.id}`];
    if (repo.head.type === "branch") {
      const tracking = repo.remoteBranches[`origin/${repo.head.name}`];
      if (tracking) {
        const local = headCommit(repo);
        const ahead = [...reachable(repo, local)].filter((id) => !reachable(repo, tracking).has(id)).length;
        const behind = [...reachable(repo, tracking)].filter((id) => !reachable(repo, local).has(id)).length;
        lines.push(
          ahead && behind
            ? `Your branch and 'origin/${repo.head.name}' have diverged (${ahead} and ${behind} different commits).`
            : ahead
              ? `Your branch is ahead of 'origin/${repo.head.name}' by ${ahead} commit${ahead > 1 ? "s" : ""}.`
              : behind
                ? `Your branch is behind 'origin/${repo.head.name}' by ${behind} commit${behind > 1 ? "s" : ""}.`
                : `Your branch is up to date with 'origin/${repo.head.name}'.`,
        );
      }
    }
    return [...lines, "nothing to commit, working tree clean"];
  },

  reflog(repo) {
    return repo.reflog.slice(0, 20).map((e, i) => `${e.id} HEAD@{${i}}: ${e.msg}`);
  },

  describe(repo, args) {
    const from = resolve(repo, positional(args)[0] ?? "HEAD");
    // Breadth-first: the nearest tagged ancestor.
    const tagged = new Map(Object.entries(repo.tags).map(([t, id]) => [id, t]));
    let frontier = [from];
    const seen = new Set<string>();
    for (let distance = 0; frontier.length; distance++) {
      for (const id of frontier) {
        if (tagged.has(id)) return [distance === 0 ? tagged.get(id)! : `${tagged.get(id)}-${distance}-g${from}`];
      }
      frontier.forEach((id) => seen.add(id));
      frontier = frontier.flatMap((id) => repo.commits[id].parents).filter((p) => !seen.has(p));
    }
    throw new GitError("fatal: No names found, cannot describe anything. Create a tag first.");
  },

  "merge-base"(repo, args) {
    const [a, b] = positional(args);
    if (!a || !b) throw new GitError("usage: git merge-base <commit> <commit>");
    const fromB = reachable(repo, resolve(repo, b));
    const common = [...reachable(repo, resolve(repo, a))].filter((id) => fromB.has(id)).sort(byOrder(repo));
    return [common[common.length - 1]];
  },

  // ---- Remotes ----
  clone(repo) {
    if (repo.remote) throw new GitError("fatal: already cloned — origin exists.");
    repo.remote = { commits: structuredClone(repo.commits), branches: { ...repo.branches } };
    for (const [name, id] of Object.entries(repo.branches)) repo.remoteBranches[`origin/${name}`] = id;
    return ["Cloning into 'origin'... done.", "Your repo now has a remote, origin, with the same commits and branches."];
  },

  remote(repo, args) {
    if (!repo.remote) return [];
    return args.includes("-v") ? ["origin\thttps://example.com/repo.git (fetch)", "origin\thttps://example.com/repo.git (push)"] : ["origin"];
  },

  fetch(repo, args) {
    const rest = positional(args).filter((a) => a !== "origin");
    const out = fetch(repo, rest[0]);
    return out.length ? out : ["Already up to date — nothing new on origin."];
  },

  pull(repo, args) {
    requireRemote(repo);
    if (repo.head.type !== "branch") throw new GitError("fatal: You are not currently on a branch.");
    const rest = positional(args).filter((a) => a !== "origin");
    const branch = rest[0] ?? repo.head.name;
    const out = fetch(repo, branch);
    const tracking = `origin/${branch}`;
    if (!repo.remoteBranches[tracking]) throw new GitError(`fatal: couldn't find remote ref ${branch}`);
    const rebaseMode = args.includes("--rebase") || args.includes("-r");
    return [...out, ...(rebaseMode ? rebase(repo, tracking, tracking) : merge(repo, tracking))];
  },

  push(repo, args) {
    const remote = requireRemote(repo);
    const rest = positional(args).filter((a) => a !== "origin");
    const branch = rest[0] ?? (repo.head.type === "branch" ? repo.head.name : undefined);
    if (!branch) throw new GitError("fatal: You are not currently on a branch. Name one: git push origin <branch>");
    const local = repo.branches[branch];
    if (!local) throw new GitError(`error: src refspec ${branch} does not match any`);
    const remoteTip = remote.branches[branch];
    const force = args.includes("-f") || args.includes("--force");
    if (remoteTip && !isAncestor({ ...repo, commits: { ...remote.commits, ...repo.commits } }, remoteTip, local) && !force) {
      throw new GitError(
        `! [rejected] ${branch} -> ${branch} (fetch first)\nerror: origin has commits you don't have. Run git pull (or git pull --rebase), then push again.`,
      );
    }
    if (remoteTip === local) return ["Everything up-to-date"];
    const n = copyCommits(repo.commits, remote.commits, local);
    remote.branches[branch] = local;
    repo.remoteBranches[`origin/${branch}`] = local;
    return [`To origin`, `   ${remoteTip ?? "[new branch]"}..${local}  ${branch} -> ${branch}${n ? ` (${n} commit${n > 1 ? "s" : ""} uploaded)` : ""}`];
  },

  // Simulates a teammate pushing to origin, so there's something to fetch or pull.
  fakeTeamwork(repo, args) {
    const remote = requireRemote(repo);
    const rest = positional(args);
    const branch = rest.find((a) => isNaN(Number(a))) ?? "main";
    const count = Number(rest.find((a) => !isNaN(Number(a))) ?? 1);
    if (!remote.branches[branch]) throw new GitError(`error: origin has no branch '${branch}'`);
    const ids: string[] = [];
    for (let i = 0; i < Math.min(count, 10); i++) {
      const id = `C${repo.nextId++}`;
      remote.commits[id] = { id, parents: [remote.branches[branch]], message: "Teammate's work", order: repo.nextOrder++ };
      remote.branches[branch] = id;
      ids.push(id);
    }
    return [`A teammate pushed ${ids.join(", ")} to origin/${branch}. Run git fetch or git pull to get them.`];
  },
};

function listBranches(repo: Repo, verbose: boolean): string[] {
  return Object.keys(repo.branches)
    .sort()
    .map((b) => {
      const current = repo.head.type === "branch" && repo.head.name === b;
      const id = repo.branches[b];
      return `${current ? "*" : " "} ${b}${verbose ? `  ${id} ${repo.commits[id].message}` : ""}`;
    });
}

function refsAt(repo: Repo, id: string): string[] {
  return [
    ...(headCommit(repo) === id ? [repo.head.type === "branch" ? `HEAD -> ${repo.head.name}` : "HEAD"] : []),
    ...Object.entries(repo.branches).filter(([b, c]) => c === id && !(repo.head.type === "branch" && repo.head.name === b)).map(([b]) => b),
    ...Object.entries(repo.remoteBranches).filter(([, c]) => c === id).map(([b]) => b),
    ...Object.entries(repo.tags).filter(([, c]) => c === id).map(([t]) => `tag: ${t}`),
  ];
}

/** Commits reachable from any branch, remote-tracking branch, tag or HEAD. */
export function liveCommits(repo: Repo): Set<string> {
  const live = new Set<string>();
  for (const id of [...Object.values(repo.branches), ...Object.values(repo.remoteBranches), ...Object.values(repo.tags), headCommit(repo)]) {
    for (const c of reachable(repo, id)) live.add(c);
  }
  return live;
}

/** The remote as a Repo, so it can be drawn with the same graph component. */
export function remoteView(repo: Repo): Repo | null {
  if (!repo.remote) return null;
  const branch = repo.remote.branches.main ? "main" : Object.keys(repo.remote.branches)[0];
  return {
    commits: repo.remote.commits,
    branches: repo.remote.branches,
    tags: {},
    head: { type: "branch", name: branch },
    reflog: [],
    remoteBranches: {},
    nextId: repo.nextId,
    nextOrder: repo.nextOrder,
  };
}

export const SUPPORTED = Object.keys(COMMANDS).filter((c) => c !== "fakeTeamwork");

// Splits a command line into words, keeping quoted strings together.
function tokenize(line: string): string[] {
  return (line.match(/"[^"]*"|'[^']*'|\S+/g) ?? []).map((t) => t.replace(/^(["'])(.*)\1$/, "$2"));
}

/** Runs one `git …` command against a copy of the repo. The input repo is never mutated. */
export function runGit(input: Repo, line: string): RunResult {
  const repo = structuredClone(input);
  const words = tokenize(line.trim());
  if (words[0] !== "git") return { repo: input, output: [], error: `Unknown command: ${words[0] ?? ""}. Git commands start with "git".` };
  const [, cmd, ...args] = words;
  const handler = cmd ? COMMANDS[cmd] : undefined;
  if (!handler) {
    return {
      repo: input,
      output: [],
      error: cmd ? `git: '${cmd}' is not supported here. Try: ${SUPPORTED.join(", ")}` : "usage: git <command> [<args>]",
    };
  }
  try {
    const before = headCommit(repo);
    const beforeHead = JSON.stringify(repo.head);
    const output = handler(repo, args);
    // Record HEAD movements, like the real reflog.
    if (headCommit(repo) !== before || JSON.stringify(repo.head) !== beforeHead) {
      repo.reflog = [{ id: headCommit(repo), msg: `${cmd}: ${args.join(" ")}`.trim() }, ...repo.reflog].slice(0, 50);
    }
    return { repo, output };
  } catch (err) {
    if (err instanceof GitError) return { repo: input, output: [], error: err.message };
    throw err;
  }
}

/** Builds a repo by running a script of commands from the initial state. */
export function buildRepo(script: string): Repo {
  let repo = initRepo();
  for (const line of splitCommands(script)) {
    const result = runGit(repo, line);
    if (result.error) throw new Error(`Level script failed at "${line}": ${result.error}`);
    repo = result.repo;
  }
  return repo;
}

/** "git commit; git commit && git merge x" -> individual commands. */
export function splitCommands(input: string): string[] {
  return input
    .split(/;|&&|\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** C3'' -> C3' (any copy counts the same when comparing to a goal). */
const normalize = (id: string) => id.replace(/'+$/, (p) => (p ? "'" : ""));
const signature = (commits: Record<string, Commit>, id: string) => [...reachableIn(commits, id)].map(normalize).sort().join(",");

/** Does `repo` match `goal`'s branches, remote-tracking branches and remote (and HEAD, if asked)? Extra branches are fine. */
export function matchesGoal(repo: Repo, goal: Repo, compareHead: boolean): boolean {
  const same = (a: Record<string, Commit>, aId: string | undefined, b: Record<string, Commit>, bId: string) =>
    aId !== undefined && signature(a, aId) === signature(b, bId);
  for (const [name, id] of Object.entries(goal.branches)) {
    if (!same(repo.commits, repo.branches[name], goal.commits, id)) return false;
  }
  for (const [name, id] of Object.entries(goal.remoteBranches)) {
    if (!same(repo.commits, repo.remoteBranches[name], goal.commits, id)) return false;
  }
  if (goal.remote) {
    if (!repo.remote) return false;
    for (const [name, id] of Object.entries(goal.remote.branches)) {
      if (!same(repo.remote.commits, repo.remote.branches[name], goal.remote.commits, id)) return false;
    }
  }
  if (compareHead) {
    if (goal.head.type !== repo.head.type) return false;
    if (goal.head.type === "branch" && repo.head.type === "branch" && goal.head.name !== repo.head.name) return false;
    if (signature(repo.commits, headCommit(repo)) !== signature(goal.commits, headCommit(goal))) return false;
  }
  return true;
}
