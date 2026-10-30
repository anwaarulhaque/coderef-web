// Guided exercises. `start` and `goal` are command scripts run from the initial repo (C0 ← C1 on main),
// so every goal is produced by the same engine the player uses.
export type Level = {
  id: string;
  title: string;
  /** Short lesson text; `code` spans are written in backticks. */
  lesson: string[];
  task: string;
  hint: string;
  start: string;
  goal: string;
  compareHead?: boolean;
};

export const LEVELS: Level[] = [
  {
    id: "commits",
    title: "1. Commits",
    lesson: [
      "A commit is a snapshot of your project. Each commit points to its parent, forming a history.",
      "`git commit` records a new snapshot on top of the commit you're on (HEAD) and moves the current branch forward to it.",
    ],
    task: "Make two commits.",
    hint: "Run `git commit` twice.",
    start: "",
    goal: "git commit; git commit",
  },
  {
    id: "branching",
    title: "2. Branching",
    lesson: [
      "A branch is just a movable label pointing at a commit — creating one is instant and cheap.",
      "`git branch name` creates a branch; `git switch name` (or `git checkout name`) puts HEAD on it. `git switch -c name` does both.",
    ],
    task: "Create a branch named bugFix and switch to it.",
    hint: "`git switch -c bugFix`",
    start: "",
    goal: "git switch -c bugFix",
    compareHead: true,
  },
  {
    id: "merging",
    title: "3. Merging",
    lesson: [
      "`git merge other` combines another branch into the current one.",
      "If the histories have diverged, Git creates a merge commit with two parents. If your branch is simply behind, it fast-forwards.",
    ],
    task: "Create bugFix with one commit, add a commit on main, then merge bugFix into main.",
    hint: "`git switch -c bugFix; git commit; git switch main; git commit; git merge bugFix`",
    start: "",
    goal: "git switch -c bugFix; git commit; git switch main; git commit; git merge bugFix",
  },
  {
    id: "rebasing",
    title: "4. Rebasing",
    lesson: [
      "`git rebase target` replays your branch's commits on top of `target`, giving a straight, linear history.",
      "The copied commits get new identities (C2 becomes C2′); the originals are left behind, faded.",
    ],
    task: "Create bugFix with a commit, add a commit on main, then rebase bugFix onto main.",
    hint: "`git switch -c bugFix; git commit; git switch main; git commit; git switch bugFix; git rebase main`",
    start: "",
    goal: "git switch -c bugFix; git commit; git switch main; git commit; git switch bugFix; git rebase main",
  },
  {
    id: "relative-refs",
    title: "5. Relative refs & detached HEAD",
    lesson: [
      "`^` means “parent of” and `~n` means “n commits back”: `bugFix^` is bugFix's parent, `HEAD~2` is two commits before HEAD.",
      "Checking out a commit instead of a branch gives a detached HEAD. `git branch -f name ref` moves a branch anywhere.",
    ],
    task: "Check out the parent of bugFix, then force main back two commits from where HEAD is.",
    hint: "`git checkout bugFix^; git branch -f main HEAD~1`",
    start: "git switch -c bugFix; git commit; git commit; git switch main; git commit",
    goal: "git checkout bugFix^; git branch -f main HEAD~1",
    compareHead: true,
  },
  {
    id: "reset-revert",
    title: "6. Reset vs revert",
    lesson: [
      "`git reset ref` moves the current branch backwards, as if later commits never happened — fine for local work.",
      "`git revert ref` adds a new commit that undoes `ref`, so shared history stays intact. Use it on branches others have pulled.",
    ],
    task: "Undo main's last commit with reset, then undo the last commit on shared with revert.",
    hint: "`git reset HEAD~1; git switch shared; git revert HEAD`",
    start: "git switch -c shared; git commit; git switch main; git commit",
    goal: "git reset HEAD~1; git switch shared; git revert HEAD",
  },
  {
    id: "cherry-pick",
    title: "7. Cherry-pick",
    lesson: [
      "`git cherry-pick a b c` copies specific commits onto HEAD, in the order you list them.",
      "It's the precise tool for “I only want that one fix from the other branch”.",
    ],
    task: "Copy the first and last commits of side (C2 and C4) onto main.",
    hint: "`git cherry-pick C2 C4`",
    start: "git switch -c side; git commit; git commit; git commit; git switch main; git commit",
    goal: "git cherry-pick C2 C4",
  },
  {
    id: "tags",
    title: "8. Tags",
    lesson: [
      "A tag is a label that never moves — perfect for marking releases.",
      "`git tag v1.0` tags HEAD; `git tag v0.9 C1` tags any commit. You can check out tags, but committing there detaches HEAD.",
    ],
    task: "Make a commit, tag it v1.0, then make one more commit.",
    hint: "`git commit; git tag v1.0; git commit`",
    start: "",
    goal: "git commit; git tag v1.0; git commit",
  },
  {
    id: "remotes-fetch",
    title: "9. Remotes: clone & fetch",
    lesson: [
      "A remote (usually `origin`) is another copy of the repository. `git clone` connects yours to one; `origin/main` labels show where origin's branches were when you last talked to it.",
      "`git fetch` downloads new commits and moves the `origin/…` labels — it never touches your own branches. (`git fakeTeamwork` simulates a teammate pushing to origin.)",
    ],
    task: "Clone, let a teammate push two commits, then fetch them.",
    hint: "`git clone; git fakeTeamwork main 2; git fetch`",
    start: "",
    goal: "git clone; git fakeTeamwork main 2; git fetch",
  },
  {
    id: "pull-push",
    title: "10. Pull & push",
    lesson: [
      "`git pull` is fetch + merge; `git pull --rebase` is fetch + rebase, which keeps history linear.",
      "`git push` uploads your commits and moves origin's branch. If origin has commits you don't, the push is rejected — pull first.",
    ],
    task: "A teammate has pushed to origin. Make a commit, pull with rebase, then push.",
    hint: "`git commit; git pull --rebase; git push`",
    start: "git clone; git fakeTeamwork main 1",
    goal: "git commit; git pull --rebase; git push",
  },
];

/** Start sandbox: a slightly richer repo to experiment with. */
export const SANDBOX_START = "git switch -c feature; git commit; git switch main; git commit";
