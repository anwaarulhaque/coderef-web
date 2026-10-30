import type { Metadata } from "next";
import Link from "next/link";
import { EditorPage, EMMET_STEP, KEEP_STEP, RUN_STEP } from "@/components/tryit/EditorPage";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Try It Yourself — Online HTML, CSS & JavaScript Editor",
  description:
    "Write HTML, CSS and JavaScript in your browser and see the result instantly. Live preview, console output, Emmet, examples, share links and download as an HTML file.",
  path: "/try-it/",
});

export default function TryItPage() {
  return (
    <EditorPage
      mode="web"
      title="Try It Yourself"
      name="Try It Yourself — HTML, CSS & JavaScript Editor"
      intro={{
        heading: "Online HTML, CSS & JavaScript playground",
        body: (
          <p>
            Edit the code, press <strong>Run</strong>, and see the result — the quickest way to try out an idea. Everything runs in your browser.
            Prefer one language at a time? Use the <Link href="/html-editor/" className="text-accent hover:underline">HTML Editor</Link>,{" "}
            <Link href="/css-editor/" className="text-accent hover:underline">CSS Editor</Link> or{" "}
            <Link href="/javascript-compiler/" className="text-accent hover:underline">JavaScript Compiler</Link>.
          </p>
        ),
      }}
      steps={[
        ["Write code", <>Switch between the <strong>HTML</strong>, <strong>CSS</strong> and <strong>JavaScript</strong> tabs — a dot marks the tabs that have code — or start from one of the <strong>Examples</strong>.</>],
        RUN_STEP,
        EMMET_STEP,
        KEEP_STEP,
      ]}
      faq={[
        ["Can I write a full HTML document?", "Yes. The HTML tab takes either body content or a complete page with <!DOCTYPE html>, <head> and <body>. Anything in the CSS and JavaScript tabs is added at the end of the body."],
        ["How do I see console.log output?", "Open the Console under the result. It shows console.log, info, warn and error, plus uncaught errors with the line they happened on."],
      ]}
      features={["HTML, CSS and JavaScript editors", "Live result preview", "Console output", "Emmet abbreviations", "Examples", "Share links", "Download as HTML"]}
    />
  );
}
