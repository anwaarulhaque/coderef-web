// The editor's flavors: the all-in-one playground, plus focused HTML, CSS and JavaScript editors.
import type { TryItCode } from "./document";
import { EXAMPLES, type TryItExample } from "./examples";

export type EditorMode = "web" | "html" | "css" | "javascript";
export type CodeTab = keyof TryItCode;

export type ModeConfig = {
  path: string;
  /** Tabs in display order; code for any other language is folded into the HTML. */
  tabs: CodeTab[];
  /** Where the output goes first: the rendered page, or the console (a JavaScript compiler). */
  output: "result" | "console";
  storageKey: string;
  starter: TryItCode;
  examples: TryItExample[];
};

export const MODES: Record<EditorMode, ModeConfig> = {
  web: {
    path: "/try-it/",
    tabs: ["html", "css", "js"],
    output: "result",
    storageKey: "coderef:try-it",
    starter: EXAMPLES[0],
    examples: EXAMPLES,
  },
  html: {
    path: "/html-editor/",
    tabs: ["html"],
    output: "result",
    storageKey: "coderef:html-editor",
    starter: {
      html: `<!DOCTYPE html>
<html>
<head>
<title>Page Title</title>
</head>
<body>

<h1>This is a Heading</h1>
<p>This is a paragraph.</p>

</body>
</html>`,
      css: "",
      js: "",
    },
    examples: EXAMPLES.filter((e) => e.group === "HTML"),
  },
  css: {
    path: "/css-editor/",
    tabs: ["css", "html"],
    output: "result",
    storageKey: "coderef:css-editor",
    starter: {
      html: `<h1>This is a heading</h1>
<p>This is a paragraph.</p>
<div class="box">A box</div>`,
      css: `body {
  background-color: lightblue;
  font-family: system-ui, sans-serif;
}

h1 {
  color: white;
  text-align: center;
}

p {
  font-size: 20px;
}

.box {
  width: 200px;
  padding: 20px;
  border-radius: 8px;
  background: white;
  box-shadow: 0 4px 12px rgb(0 0 0 / 0.15);
}`,
      js: "",
    },
    examples: EXAMPLES.filter((e) => e.group === "CSS"),
  },
  javascript: {
    path: "/javascript-compiler/",
    tabs: ["js", "html", "css"],
    output: "console",
    storageKey: "coderef:javascript-compiler",
    starter: {
      html: "",
      css: "",
      js: `// Write JavaScript and press Run — console.log() output appears on the right.
function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet("World"));

const numbers = [1, 2, 3, 4, 5];
console.log("Squares:", numbers.map((n) => n * n));
console.log("Sum:", numbers.reduce((a, b) => a + b, 0));`,
    },
    examples: EXAMPLES.filter((e) => e.group === "JavaScript"),
  },
};

/** Moves CSS or JavaScript that a mode has no tab for into the HTML, so nothing is lost. */
export function fitToTabs(code: TryItCode, tabs: CodeTab[]): TryItCode {
  let html = code.html;
  const out = { ...code };
  if (!tabs.includes("css") && code.css.trim()) {
    html = insertBefore(html, /<\/head>/i, `<style>\n${code.css}\n</style>\n`);
    out.css = "";
  }
  if (!tabs.includes("js") && code.js.trim()) {
    html = insertBefore(html, /<\/body>/i, `<script>\n${code.js}\n</script>\n`);
    out.js = "";
  }
  return { ...out, html };
}

function insertBefore(html: string, tag: RegExp, block: string) {
  const m = tag.exec(html);
  if (m) return html.slice(0, m.index) + block + html.slice(m.index);
  return `${html.trimEnd()}\n\n${block.trimEnd()}`;
}
