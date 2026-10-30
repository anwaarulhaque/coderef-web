import type { Metadata } from "next";
import Link from "next/link";
import { EditorPage, EMMET_STEP, KEEP_STEP, RUN_STEP } from "@/components/tryit/EditorPage";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Online CSS Editor — Style HTML and See It Live",
  description: "Free online CSS editor: write CSS against your own HTML and see the styled result instantly. Flexbox, grid, animation examples, Emmet and share links.",
  path: "/css-editor/",
});

export default function CssEditorPage() {
  return (
    <EditorPage
      mode="css"
      title="CSS Editor"
      name="Online CSS Editor"
      intro={{
        heading: "Online CSS editor",
        body: (
          <p>
            Write CSS in the first tab and the HTML it styles in the second, then see the result. For layout, the visual{" "}
            <Link href="/flexbox/" className="text-accent hover:underline">Flexbox</Link> and{" "}
            <Link href="/css-grid/" className="text-accent hover:underline">CSS Grid</Link> sheets show every property in action.
          </p>
        ),
      }}
      steps={[
        ["Write CSS", <>Style the page in the <strong>CSS</strong> tab; change the markup in the <strong>HTML</strong> tab. Start from an <strong>Example</strong> — flexbox, grid, transitions, animations.</>],
        RUN_STEP,
        EMMET_STEP,
        KEEP_STEP,
      ]}
      faq={[["Do I need a <link> or <style> tag?", "No. The CSS tab is applied to the HTML automatically. Download gives you one HTML file with the CSS inside a <style> element."]]}
      features={["CSS editor", "HTML editor", "Live result preview", "Emmet abbreviations", "Examples", "Share links"]}
    />
  );
}
