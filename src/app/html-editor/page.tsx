import type { Metadata } from "next";
import Link from "next/link";
import { EditorPage, EMMET_STEP, KEEP_STEP, RUN_STEP } from "@/components/tryit/EditorPage";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Online HTML Editor — Write HTML and See the Result",
  description: "Free online HTML editor with a live result: write a whole HTML page, run it, and see it rendered. Emmet, examples, share links and download.",
  path: "/html-editor/",
});

export default function HtmlEditorPage() {
  return (
    <EditorPage
      mode="html"
      title="HTML Editor"
      name="Online HTML Editor"
      intro={{
        heading: "Online HTML editor",
        body: (
          <p>
            Write a complete HTML page — <code>&lt;style&gt;</code> and <code>&lt;script&gt;</code> included — and see it rendered next to the code.
            Every snippet in the <Link href="/quick-reference/html/" className="text-accent hover:underline">HTML quick reference</Link> has a{" "}
            <strong>Try it Yourself »</strong> link that opens it here.
          </p>
        ),
      }}
      steps={[
        ["Write HTML", <>Edit the page on the left, or pick one of the <strong>Examples</strong>. Body content alone works too — it&apos;s wrapped in a page for you.</>],
        RUN_STEP,
        EMMET_STEP,
        KEEP_STEP,
      ]}
      faq={[["Can I use CSS and JavaScript here?", "Yes — put them in <style> and <script> elements inside the page, the classic way. For separate tabs, use the HTML, CSS & JS playground."]]}
      features={["HTML editor", "Live result preview", "Emmet abbreviations", "Examples", "Share links", "Download as HTML"]}
    />
  );
}
