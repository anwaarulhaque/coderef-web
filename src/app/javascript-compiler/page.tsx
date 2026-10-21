import type { Metadata } from "next";
import Link from "next/link";
import { EditorPage, KEEP_STEP } from "@/components/tryit/EditorPage";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Online JavaScript Compiler — Run JS in Your Browser",
  description: "Free online JavaScript compiler and editor: run JavaScript and see console.log output instantly, with errors and line numbers. Preview DOM code, share links.",
  path: "/javascript-compiler/",
});

const kbd = "rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[12px]";

export default function JavaScriptCompilerPage() {
  return (
    <EditorPage
      mode="javascript"
      title="JavaScript Compiler"
      name="Online JavaScript Compiler"
      intro={{
        heading: "Online JavaScript compiler",
        body: (
          <p>
            Run JavaScript and read the output — <code>console.log()</code>, warnings and errors with their line numbers. Code that works with the page
            (DOM, events, timers) shows its result under <strong>Preview</strong>. Every snippet in the{" "}
            <Link href="/quick-reference/javascript/" className="text-accent hover:underline">JavaScript quick reference</Link> opens here.
          </p>
        ),
      }}
      steps={[
        ["Write JavaScript", <>Code goes in the <strong>JavaScript</strong> tab. The <strong>HTML</strong> and <strong>CSS</strong> tabs are optional, for code that uses the page.</>],
        ["Run it", <>Press <strong>Run ❯</strong> or <kbd className={kbd}>Ctrl/⌘</kbd>+<kbd className={kbd}>Enter</kbd>. <strong>Output</strong> shows the console; <strong>Preview</strong> shows the page.</>],
        ["Read errors", <>Uncaught errors appear in red with the JavaScript line they came from. Promise rejections are reported too.</>],
        KEEP_STEP,
      ]}
      faq={[
        ["Which JavaScript version is supported?", "Whatever your browser supports — in current browsers that's modern JavaScript: let/const, arrow functions, classes, async/await, optional chaining and more. Node.js modules like fs aren't available."],
        ["Can I use top-level await or import?", "The code runs as a classic script, so wrap await in an async function. To use modules, add <script type=\"module\"> in the HTML tab."],
      ]}
      features={["JavaScript editor", "Console output", "Error line numbers", "DOM preview", "Examples", "Share links"]}
    />
  );
}
