// "How to use Emmet" — editor setup and the core ideas, written for this site.
const kbd = "rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[12px]";

export function EmmetGuide() {
  return (
    <details open className="group mb-8 rounded-xl border border-border bg-surface">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-3">
        <span className="font-semibold">How to use abbreviations</span>
        <span className="text-sm text-muted group-open:hidden">Show guide ▾</span>
        <span className="hidden text-sm text-muted group-open:inline">Hide guide ▴</span>
      </summary>
      <div className="grid gap-6 border-t border-border px-5 py-5 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <h3 className="mb-2 text-sm font-semibold">1. The idea</h3>
          <p className="text-sm text-muted">
            Write a short CSS-selector-like abbreviation and expand it into full code. <code className={kbd}>ul&gt;li*3</code>{" "}
            becomes a list with three items; <code className={kbd}>m10</code> becomes{" "}
            <code className={kbd}>margin: 10px;</code> in a stylesheet.
          </p>
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold">2. VS Code (built in)</h3>
          <ul className="space-y-1.5 text-sm text-muted">
            <li>
              Type an abbreviation in an HTML/CSS file and pick the Emmet suggestion, or press <kbd className={kbd}>Tab</kbd>{" "}
              after enabling <code className={kbd}>&quot;emmet.triggerExpansionOnTab&quot;: true</code>.
            </li>
            <li>
              Wrap a selection: run <strong>Emmet: Wrap with Abbreviation</strong> from the Command Palette (
              <kbd className={kbd}>Ctrl/Cmd+Shift+P</kbd>).
            </li>
            <li>
              Use it in JSX/other files with <code className={kbd}>&quot;emmet.includeLanguages&quot;</code>, e.g.{" "}
              <code className={kbd}>{"{ \"javascript\": \"javascriptreact\" }"}</code>.
            </li>
          </ul>
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold">3. Other editors</h3>
          <ul className="space-y-1.5 text-sm text-muted">
            <li>
              <strong>JetBrains</strong> (WebStorm, IntelliJ, PhpStorm): built in — type and press <kbd className={kbd}>Tab</kbd>.
            </li>
            <li>
              <strong>Sublime Text, Vim, Neovim, Notepad++</strong>: install the Emmet plugin —{" "}
              <a href="https://emmet.io/download/" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                emmet.io/download ↗
              </a>
              .
            </li>
            <li>Full reference: <a href="https://docs.emmet.io/" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">docs.emmet.io ↗</a></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold">4. This page</h3>
          <ul className="space-y-1.5 text-sm text-muted">
            <li>Type in the <strong>playground</strong> and pick an output syntax (HTML, JSX, Pug, CSS, SCSS…).</li>
            <li>
              Browse the <strong>index</strong>: <em>Syntax</em> explains the operators, <em>HTML</em> and <em>CSS</em> list
              every built-in abbreviation. Click any entry — or a keyword chip like <code className={kbd}>d:ib</code> — to try
              it.
            </li>
            <li>The URL updates as you type, so you can share an expansion.</li>
          </ul>
        </div>
      </div>
    </details>
  );
}
