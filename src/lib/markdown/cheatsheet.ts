// The Markdown cheat sheet — syntax examples written for this site, rendered at build time.
import { renderMarkdown } from "./render";

export type MarkdownEntry = {
  id: string;
  element: string;
  group: "Basic syntax" | "Extended syntax";
  markdown: string;
  note?: string;
  html: string;
};

const ENTRIES: Omit<MarkdownEntry, "html">[] = [
  // Basic syntax — supported by nearly every Markdown application.
  { id: "heading", group: "Basic syntax", element: "Heading", markdown: "# H1\n## H2\n### H3", note: "One # per level, up to six. Put a space after the #." },
  { id: "bold", group: "Basic syntax", element: "Bold", markdown: "**bold text**", note: "__text__ also works, but ** is safer mid-word." },
  { id: "italic", group: "Basic syntax", element: "Italic", markdown: "*italicized text*", note: "_text_ also works." },
  { id: "bold-italic", group: "Basic syntax", element: "Bold & italic", markdown: "***really important***" },
  { id: "blockquote", group: "Basic syntax", element: "Blockquote", markdown: "> Quoted text\n>\n> > Nested quote" },
  { id: "ordered-list", group: "Basic syntax", element: "Ordered list", markdown: "1. First item\n2. Second item\n3. Third item", note: "The numbers don't have to be in order — the first one sets the start." },
  { id: "unordered-list", group: "Basic syntax", element: "Unordered list", markdown: "- First item\n- Second item\n- Third item", note: "-, * or + — just don't mix them in one list." },
  { id: "nested-list", group: "Basic syntax", element: "Nested list", markdown: "1. Prepare\n   - Gather tools\n   - Read the docs\n2. Build", note: "Indent nested items to line up with the parent's text." },
  { id: "code", group: "Basic syntax", element: "Inline code", markdown: "Run `npm install` first.", note: "Use double backticks to include a backtick: `` `x` ``." },
  { id: "hr", group: "Basic syntax", element: "Horizontal rule", markdown: "Above\n\n---\n\nBelow", note: "Leave a blank line before ---, or it turns the line above into a heading." },
  { id: "link", group: "Basic syntax", element: "Link", markdown: '[Markdown Guide](https://www.markdownguide.org "Optional title")' },
  { id: "reference-link", group: "Basic syntax", element: "Reference link", markdown: "Read the [CommonMark spec][spec].\n\n[spec]: https://spec.commonmark.org/" },
  { id: "image", group: "Basic syntax", element: "Image", markdown: "![coderef logo](/logo-small.png)", note: "Like a link, with a ! in front; the text in [ ] is the alt text." },
  { id: "line-break", group: "Basic syntax", element: "Line break", markdown: "First line<br>\nSecond line", note: "End a line with two spaces, a backslash, or <br> for a break within a paragraph." },
  { id: "paragraphs", group: "Basic syntax", element: "Paragraphs", markdown: "First paragraph.\n\nSecond paragraph.", note: "Separate paragraphs with a blank line." },
  { id: "escaping", group: "Basic syntax", element: "Escaping characters", markdown: "\\*not italic\\* and 1\\. not a list", note: "A backslash shows a character that would otherwise be formatting." },

  // Extended syntax — widely supported (GitHub, many editors), but not everywhere.
  { id: "table", group: "Extended syntax", element: "Table", markdown: "| Syntax | Description | Price |\n| :--- | :---: | ---: |\n| Header | Title | $10 |\n| Paragraph | Text | $200 |", note: "Colons in the divider row align columns: left, center, right." },
  { id: "fenced-code", group: "Extended syntax", element: "Fenced code block", markdown: '```json\n{\n  "name": "coderef",\n  "private": true\n}\n```', note: "Add a language after the opening ``` for syntax highlighting where supported." },
  { id: "footnote", group: "Extended syntax", element: "Footnote", markdown: "Here's a sentence with a footnote.[^1]\n\n[^1]: This is the footnote.", note: "Footnotes collect at the bottom of the document." },
  { id: "heading-id", group: "Extended syntax", element: "Heading ID", markdown: "### My Great Heading {#custom-id}\n\n[Jump to it](#custom-id)", note: "Gives a heading a fixed anchor to link to." },
  { id: "definition-list", group: "Extended syntax", element: "Definition list", markdown: "term\n: definition of the term" },
  { id: "strikethrough", group: "Extended syntax", element: "Strikethrough", markdown: "~~The world is flat.~~" },
  { id: "task-list", group: "Extended syntax", element: "Task list", markdown: "- [x] Write the press release\n- [ ] Update the website\n- [ ] Contact the media" },
  { id: "emoji", group: "Extended syntax", element: "Emoji", markdown: "That is so funny! :joy: :rocket: :tada:", note: "Shortcodes vary by app; you can also paste emoji directly." },
  { id: "highlight", group: "Extended syntax", element: "Highlight", markdown: "I need to highlight these ==very important words==." },
  { id: "subscript", group: "Extended syntax", element: "Subscript", markdown: "H~2~O" },
  { id: "superscript", group: "Extended syntax", element: "Superscript", markdown: "X^2^" },
  { id: "autolink", group: "Extended syntax", element: "Automatic links", markdown: "https://www.example.com", note: "Wrap a URL in backticks to stop it becoming a link: `https://www.example.com`." },
  { id: "inline-html", group: "Extended syntax", element: "Inline HTML", markdown: "Press <kbd>Ctrl</kbd> + <kbd>C</kbd> to copy.", note: "Most renderers allow some HTML for things Markdown can't express." },
];

export function getMarkdownCheatSheet(): MarkdownEntry[] {
  return ENTRIES.map((e) => ({ ...e, html: renderMarkdown(e.markdown, e.id) }));
}
