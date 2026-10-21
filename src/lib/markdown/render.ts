// One Markdown renderer for the cheat sheet (build time) and the editor (browser):
// CommonMark + GitHub-style tables/strikethrough/autolinks, plus the common extended syntax.
import MarkdownIt from "markdown-it";
import attrs from "markdown-it-attrs";
import deflist from "markdown-it-deflist";
import { full as emoji } from "markdown-it-emoji";
import footnote from "markdown-it-footnote";
import mark from "markdown-it-mark";
import sub from "markdown-it-sub";
import sup from "markdown-it-sup";
import tasks from "markdown-it-task-lists";

function create() {
  return (
    new MarkdownIt({ html: true, linkify: true, typographer: true })
      .use(footnote)
      .use(deflist)
      .use(mark)
      .use(sub)
      .use(sup)
      .use(emoji)
      .use(tasks, { enabled: true })
      // Only {#custom-id} on headings etc. — not arbitrary attributes like onclick.
      .use(attrs, { allowedAttributes: ["id"] })
  );
}

let instance: ReturnType<typeof create> | null = null;

/** Renders Markdown to HTML. `docId` keeps footnote ids unique when several documents share a page. */
export function renderMarkdown(src: string, docId?: string): string {
  instance ??= create();
  return instance.render(src, docId ? { docId } : {});
}
