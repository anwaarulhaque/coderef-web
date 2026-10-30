"use client";

import { CloudSave } from "@/components/account/CloudSave";
import DOMPurify from "dompurify";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { MarkdownEntry } from "@/lib/markdown/cheatsheet";
import { htmlToMarkdown } from "@/lib/markdown/html-to-markdown";
import { renderMarkdown } from "@/lib/markdown/render";

const STORAGE_KEY = "coderef:markdown-editor";
const docTitle = (md: string) => md.match(/^#{1,3}\s+(.+)$/m)?.[1]?.trim().slice(0, 80) || "Untitled document";

type ToolMode = "editor" | "convert" | "table" | "cheatsheet";
type EditorView = "split" | "edit" | "preview" | "html";
type StatusMessage = { kind: "ok" | "error" | "info"; text: string } | null;
type ColAlign = "left" | "center" | "right";

const MODES: { id: ToolMode; label: string }[] = [
  { id: "editor", label: "Editor & Preview" },
  { id: "convert", label: "HTML → Markdown" },
  { id: "table", label: "Table Builder" },
  { id: "cheatsheet", label: "Cheat Sheet" },
];

const SAMPLE = `# Welcome to the Markdown Editor

Type on the left, see the live rendered preview on the right. Your text is **saved in this browser** automatically.

## Formatting & Typography

You can make text **bold**, *italic*, ~~struck through~~, ==highlighted==, or \`inline code\`.
Chemistry formulas like H~2~O, maths like E = mc^2^, and emoji :rocket: :tada: are supported out of the box.

> Markdown is a lightweight markup language that converts plain text formatting into structured HTML.

## Lists & Tasks

1. Write or paste your Markdown
2. Check the real-time preview on the right
   - Nested bullet points work seamlessly
3. Export your work as \`.md\` or styled \`.html\`

- [x] Try the formatting toolbar above
- [x] Experiment with keyboard shortcuts (Ctrl+B, Ctrl+I, Ctrl+K)
- [ ] Check out the built-in **Table Builder** and **HTML → Markdown** tools

## Code Block

\`\`\`javascript
function calculateReadingTime(wordCount, wpm = 220) {
  return Math.max(1, Math.ceil(wordCount / wpm));
}

console.log(\`Ready in \${calculateReadingTime(450)} min read\`);
\`\`\`

## Interactive Table

| Shortcut | Action | Description |
| :------- | :----: | :---------- |
| <kbd>Ctrl</kbd>+<kbd>B</kbd> | Bold | Wraps selection in \`**\` |
| <kbd>Ctrl</kbd>+<kbd>I</kbd> | Italic | Wraps selection in \`*\` |
| <kbd>Ctrl</kbd>+<kbd>K</kbd> | Link | Creates markdown hyperlink |
| <kbd>Ctrl</kbd>+<kbd>S</kbd> | Download | Exports document as \`.md\` |

Learn more about the specification at [CommonMark](https://spec.commonmark.org) or [Markdown Guide](https://www.markdownguide.org).[^1]

[^1]: Footnotes are automatically numbered and collected at the bottom of the document.
`;

const TEMPLATES: { id: string; name: string; content: string }[] = [
  {
    id: "sample",
    name: "Sample / Sandbox",
    content: SAMPLE,
  },
  {
    id: "readme",
    name: "Project README.md",
    content: `# Project Name

A high-performance modern web tool built for developers.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Features

- ⚡ **Instant Execution** — 100% client-side with zero latency.
- 🎨 **Adaptive Theme** — Automatic dark and light mode support.
- 🔒 **Privacy First** — Your documents never leave your browser.
- 📱 **Responsive Design** — Optimized for desktops, tablets, and phones.

## Quick Start

### Installation

\`\`\`bash
# Clone the repository
git clone https://github.com/example/project.git

# Install dependencies
npm install

# Run development server
npm run dev
\`\`\`

## Configuration

| Option | Type | Default | Description |
| :----- | :--- | :------ | :---------- |
| \`theme\` | \`string\` | \`"system"\` | UI color theme (\`light\`, \`dark\`, \`system\`) |
| \`autosave\` | \`boolean\` | \`true\` | Persist changes to local storage |
| \`timeout\` | \`number\` | \`300\` | Debounce delay for preview rendering (ms) |

## Roadmap

- [x] Core Markdown parsing engine
- [x] GitHub Flavored Markdown (GFM) extensions
- [ ] Export to PDF with custom margins
- [ ] Cloud sync integrations

## Contributing

Pull requests are always welcome! Please read the contribution guidelines first.

## License

MIT © [coderef](https://coderef.dev)
`,
  },
  {
    id: "changelog",
    name: "Changelog / Release Notes",
    content: `# Changelog

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added
- Real-time Markdown table editor with visual column alignment
- Export to self-contained styled HTML file

## [2.1.0] - 2026-10-15

### Added
- Syntax highlighting for 12 popular programming languages
- DOMPurify sanitization pipeline for raw HTML blocks
- Keyboard shortcuts for headings, links, and bold formatting

### Fixed
- Fixed nested list indentation in task checklists
- Corrected cursor jump when inserting blockquotes

### Changed
- Improved proportional scroll synchronization speed by 40%

## [2.0.0] - 2026-09-01

### Breaking Changes
- Migrated configuration format to JSON5
- Removed deprecated v1 export endpoint
`,
  },
  {
    id: "api-doc",
    name: "API Documentation",
    content: `# Users API Reference

The Users API allows you to retrieve, create, and update user accounts.

## Base URL

\`\`\`http
https://api.example.com/v1
\`\`\`

## Authentication

Authenticate all requests using a Bearer token in the \`Authorization\` header:

\`\`\`http
Authorization: Bearer <your_api_key>
\`\`\`

---

## Get User Profile

\`\`\`http
GET /users/:id
\`\`\`

### Path Parameters

| Parameter | Type | Required | Description |
| :-------- | :--- | :------- | :---------- |
| \`id\` | \`string\` | Yes | Unique identifier for the user (\`usr_xxx\`) |

### Request Example

\`\`\`bash
curl -X GET "https://api.example.com/v1/users/usr_48291" \\
  -H "Authorization: Bearer sec_9f81a7" \\
  -H "Accept: application/json"
\`\`\`

### Response (200 OK)

\`\`\`json
{
  "id": "usr_48291",
  "name": "Ada Lovelace",
  "email": "ada@example.org",
  "role": "admin",
  "created_at": "2026-01-15T08:30:00Z"
}
\`\`\`

### Error Codes

| Status | Code | Description |
| :----- | :--- | :---------- |
| 401 | \`unauthorized\` | Missing or invalid API key |
| 404 | \`user_not_found\` | No user with that ID was found |
| 429 | \`rate_limited\` | Exceeded 100 requests per minute |
`,
  },
  {
    id: "blog",
    name: "Technical Blog Post",
    content: `# Modern Web Architecture in 2026

*Published on October 16, 2026 · 4 min read · By Engineering Team*

Web development has evolved dramatically over the last several years. The industry has converged on a hybrid model that maximizes edge performance while retaining rich client-side interactivity.

![Architecture Diagram](https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&auto=format&fit=crop&q=80 "Cloud Architecture")

## 1. The Death of Server Latency

Traditional web apps endured hundreds of milliseconds of roundtrip latency. With modern edge computing:

> "The fastest request is the one that never has to cross an ocean."

Key benefits include:
- Sub-10ms response times worldwide
- Built-in geo-routing
- Instant cache invalidation

## 2. Interactive Client Sandboxes

Running complex computation directly inside the browser using modern JS engines removes the need for backend servers for tools like formatters, compilers, and parsers:

\`\`\`javascript
// Client-side local execution pattern
export async function processLocally(payload) {
  const result = await engine.compute(payload);
  return { ok: true, data: result };
}
\`\`\`

## 3. Summary & Takeaways

1. **Ship less JavaScript** to the critical initial render path.
2. **Push computation to the edge** or directly to the client.
3. **Respect user privacy** by avoiding unnecessary server uploads.

*Have feedback? Join the discussion on our community forum.*
`,
  },
  {
    id: "meeting",
    name: "Meeting Notes & Checklist",
    content: `# Product Sprint Planning — Week 42

**Date:** October 16, 2026  
**Facilitator:** Sarah Jenkins  
**Attendees:** David, Elena, Marcus, Priya  

---

## 🎯 Sprint Goals

1. Launch the updated Full-Page Markdown Editor with side-by-side preview.
2. Finalize cross-browser compatibility benchmarks.
3. Improve SEO performance score to 100.

## 📋 Discussion Topics

### 1. User Experience & Layout
- Full-viewport layout matching the JSON Formatter app pattern.
- Smooth synchronized scrolling between editor and preview.
- Keyboard shortcuts for all major formatting tags.

### 2. Table Generator Tool
- Visual grid interface to quickly insert markdown tables.
- Automatic pipe alignment.

## ✅ Action Items

- [x] Set up full-width layout configuration
- [x] Implement HTML-to-Markdown conversion engine
- [ ] Add PDF export styling rules
- [ ] QA testing across mobile, tablet, and desktop viewports
- [ ] Deploy release to production
`,
  },
];

const SAMPLE_HTML = `<article>
  <h1>Getting Started with Web Development</h1>
  <p>Building for the modern web requires understanding <strong>HTML</strong>, <em>CSS</em>, and <code>JavaScript</code>.</p>
  <blockquote>"Simplicity is prerequisite for reliability." — Edsger W. Dijkstra</blockquote>
  <h2>Core Technologies</h2>
  <ul>
    <li>HTML5 for semantic structure</li>
    <li>Vanilla CSS & Design Tokens for styling</li>
    <li>Modern TypeScript for rock-solid logic</li>
  </ul>
  <h3>Browser Support Matrix</h3>
  <table>
    <thead>
      <tr>
        <th>Browser</th>
        <th>Version</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Chrome</td>
        <td>120+</td>
        <td>Supported</td>
      </tr>
      <tr>
        <td>Firefox</td>
        <td>118+</td>
        <td>Supported</td>
      </tr>
      <tr>
        <td>Safari</td>
        <td>17+</td>
        <td>Supported</td>
      </tr>
    </tbody>
  </table>
  <p>Learn more at <a href="https://developer.mozilla.org">MDN Web Docs</a>.</p>
</article>`;

type Edit = { text: string; selStart: number; selEnd: number };

function wrapText(text: string, start: number, end: number, before: string, after: string, placeholder: string): Edit {
  const selected = text.slice(start, end);
  if (text.slice(start - before.length, start) === before && text.slice(end, end + after.length) === after) {
    return {
      text: text.slice(0, start - before.length) + selected + text.slice(end + after.length),
      selStart: start - before.length,
      selEnd: end - before.length,
    };
  }
  const inner = selected || placeholder;
  return {
    text: text.slice(0, start) + before + inner + after + text.slice(end),
    selStart: start + before.length,
    selEnd: start + before.length + inner.length,
  };
}

function prefixLines(text: string, start: number, end: number, prefix: (i: number) => string, match: RegExp): Edit {
  const lineStart = text.lastIndexOf("\n", start - 1) + 1;
  const lineEndIdx = text.indexOf("\n", end);
  const lineEnd = lineEndIdx === -1 ? text.length : lineEndIdx;
  const lines = text.slice(lineStart, lineEnd).split("\n");
  const allPrefixed = lines.every((l) => match.test(l));
  const next = lines
    .map((l, i) => (allPrefixed ? l.replace(match, "") : prefix(i) + l.replace(/^(#{1,6}\s+|>\s+|- \[[ x]\]\s+|- \s+|\d+\.\s+)/, "")))
    .join("\n");
  return {
    text: text.slice(0, lineStart) + next + text.slice(lineEnd),
    selStart: lineStart,
    selEnd: lineStart + next.length,
  };
}

function insertBlock(text: string, start: number, end: number, block: string, selectFrom = 0, selectLength = 0): Edit {
  const before = text.slice(0, start);
  const lead = before === "" || before.endsWith("\n\n") ? "" : before.endsWith("\n") ? "\n" : "\n\n";
  const after = text.slice(end);
  const trail = after.startsWith("\n") ? "" : "\n";
  const at = start + lead.length;
  return {
    text: before + lead + block + trail + after,
    selStart: at + selectFrom,
    selEnd: at + selectFrom + selectLength,
  };
}

type Action = { label: string; title: string; icon: ReactNode; run: (t: string, s: number, e: number) => Edit };

const ACTIONS: Action[] = [
  { label: "H1", title: "Heading 1", icon: <span className="font-bold text-xs">H1</span>, run: (t, s, e) => prefixLines(t, s, e, () => "# ", /^# /) },
  { label: "H2", title: "Heading 2", icon: <span className="font-bold text-xs">H2</span>, run: (t, s, e) => prefixLines(t, s, e, () => "## ", /^## /) },
  { label: "H3", title: "Heading 3", icon: <span className="font-bold text-xs">H3</span>, run: (t, s, e) => prefixLines(t, s, e, () => "### ", /^### /) },
  { label: "B", title: "Bold (Ctrl+B)", icon: <span className="font-bold">B</span>, run: (t, s, e) => wrapText(t, s, e, "**", "**", "bold text") },
  { label: "I", title: "Italic (Ctrl+I)", icon: <span className="italic">I</span>, run: (t, s, e) => wrapText(t, s, e, "*", "*", "italic text") },
  { label: "S", title: "Strikethrough", icon: <span className="line-through">S</span>, run: (t, s, e) => wrapText(t, s, e, "~~", "~~", "strikethrough text") },
  { label: "mark", title: "Highlight", icon: <span className="rounded bg-yellow-300/80 px-1 text-[11px] font-semibold text-black">ab</span>, run: (t, s, e) => wrapText(t, s, e, "==", "==", "highlighted text") },
  { label: "code", title: "Inline code", icon: <span className="font-mono text-xs">{"</>"}</span>, run: (t, s, e) => wrapText(t, s, e, "`", "`", "code") },
  { label: "sub", title: "Subscript", icon: <span className="text-xs">X<sub>2</sub></span>, run: (t, s, e) => wrapText(t, s, e, "~", "~", "2") },
  { label: "sup", title: "Superscript", icon: <span className="text-xs">X<sup>2</sup></span>, run: (t, s, e) => wrapText(t, s, e, "^", "^", "2") },
  {
    label: "link",
    title: "Link (Ctrl+K)",
    icon: <span>🔗</span>,
    run: (t, s, e) => {
      const sel = t.slice(s, e) || "link text";
      const md = `[${sel}](https://)`;
      return { text: t.slice(0, s) + md + t.slice(e), selStart: s + sel.length + 3, selEnd: s + sel.length + 11 };
    },
  },
  {
    label: "image",
    title: "Image",
    icon: <span>🖼</span>,
    run: (t, s, e) => {
      const alt = t.slice(s, e) || "alt text";
      const md = `![${alt}](https://)`;
      return { text: t.slice(0, s) + md + t.slice(e), selStart: s + alt.length + 4, selEnd: s + alt.length + 12 };
    },
  },
  { label: "quote", title: "Blockquote", icon: <span>❝</span>, run: (t, s, e) => prefixLines(t, s, e, () => "> ", /^> /) },
  { label: "ul", title: "Bulleted list", icon: <span>•≡</span>, run: (t, s, e) => prefixLines(t, s, e, () => "- ", /^- (?!\[)/) },
  { label: "ol", title: "Numbered list", icon: <span className="text-xs font-semibold">1.</span>, run: (t, s, e) => prefixLines(t, s, e, (i) => `${i + 1}. `, /^\d+\. /) },
  { label: "task", title: "Task list", icon: <span>☑</span>, run: (t, s, e) => prefixLines(t, s, e, () => "- [ ] ", /^- \[[ x]\] /) },
  {
    label: "table",
    title: "Table",
    icon: <span>▦</span>,
    run: (t, s, e) => insertBlock(t, s, e, "| Header 1 | Header 2 | Header 3 |\n| :------- | :------: | -------: |\n| Item 1   | Value 1  | $100     |\n| Item 2   | Value 2  | $200     |", 2, 10),
  },
  {
    label: "codeblock",
    title: "Code block",
    icon: <span className="font-mono text-xs">{"{ }"}</span>,
    run: (t, s, e) => {
      const sel = t.slice(s, e);
      return insertBlock(t, s, e, "```javascript\n" + (sel || "console.log('Hello, world!');") + "\n```", 14, (sel || "console.log('Hello, world!');").length);
    },
  },
  { label: "hr", title: "Horizontal rule", icon: <span>―</span>, run: (t, s, e) => insertBlock(t, s, e, "---") },
  {
    label: "footnote",
    title: "Footnote",
    icon: <span className="text-xs font-mono">[^1]</span>,
    run: (t, s, e) => {
      const sel = t.slice(s, e) || "statement";
      return insertBlock(t, s, e, `${sel}[^1]\n\n[^1]: Footnote description here.`, sel.length + 13, 25);
    },
  },
];

const bytes = (s: string) => new TextEncoder().encode(s).length;
const fmtBytes = (n: number) => (n < 1024 ? `${n} B` : n < 1024 * 1024 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1024 / 1024).toFixed(2)} MB`);
const countWords = (text: string) => (text.trim().match(/\S+/g) ?? []).length;
const countCharsNoSpaces = (text: string) => text.replace(/\s/g, "").length;

function downloadFile(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.append(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
}

const btn = "inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-sm font-medium transition-colors hover:border-accent hover:text-accent disabled:pointer-events-none disabled:opacity-40";
const btnPrimary = "inline-flex h-9 items-center gap-1.5 rounded-lg bg-accent px-3.5 text-sm font-medium text-surface transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-40";
const smallBtn = "rounded-md px-2 py-1 text-xs text-muted hover:bg-chip hover:text-foreground disabled:opacity-40 transition-colors";

function Pane({ title, actions, children, footer }: { title: ReactNode; actions?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  return (
    <section className="flex h-[65vh] min-h-[320px] min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-surface lg:h-full lg:min-h-0">
      <header className="flex min-h-11 flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-1.5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">{title}</h2>
        {actions && <div className="flex flex-wrap items-center gap-1">{actions}</div>}
      </header>
      <div className="relative min-h-0 flex-1 bg-background/40">{children}</div>
      {footer && <footer className="border-t border-border px-3 py-1.5 text-xs text-muted">{footer}</footer>}
    </section>
  );
}

export function MarkdownTool({
  entries,
  heading,
}: {
  entries: MarkdownEntry[];
  heading?: ReactNode;
}) {
  const [mode, setMode] = useState<ToolMode>("editor");
  const [text, setText] = useState(SAMPLE);
  const [view, setView] = useState<EditorView>("split");
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(true);
  const [flash, setFlash] = useState<string | null>(null);
  const [message, setMessage] = useState<StatusMessage>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [syncScrollActive, setSyncScrollActive] = useState(true);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });

  // HTML -> Markdown state
  const [htmlInput, setHtmlInput] = useState(SAMPLE_HTML);
  const [htmlConverted, setHtmlConverted] = useState("");

  // Table Builder state
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [tableAlign, setTableAlign] = useState<ColAlign[]>(["left", "center", "right"]);
  const [tableData, setTableData] = useState<string[][]>([
    ["Feature", "Status", "Notes"],
    ["Live Preview", "Ready", "Sync scroll active"],
    ["Table Builder", "Ready", "Interactive grid"],
  ]);

  // Cheat Sheet in-app search/filter state
  const [cheatSearch, setCheatSearch] = useState("");
  const [cheatTab, setCheatTab] = useState<"All" | MarkdownEntry["group"]>("All");

  const editorRef = useRef<HTMLTextAreaElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const lineNumbersRef = useRef<HTMLDivElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const isSyncingScroll = useRef(false);

  // Persistence
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- one-time restore from localStorage */
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) setText(stored);
    } catch {
      // Storage unavailable
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const id = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, text);
        setSaved(true);
      } catch {
        // Storage unavailable
      }
    }, 500);
    return () => clearTimeout(id);
  }, [text, loaded]);

  const notify = (msg: string) => {
    setFlash(msg);
    setTimeout(() => setFlash(null), 1500);
  };

  // Render HTML preview
  const rawHtml = useMemo(() => (loaded ? renderMarkdown(text, "doc") : ""), [text, loaded]);
  const cleanHtml = useMemo(() => (loaded ? DOMPurify.sanitize(rawHtml) : ""), [rawHtml, loaded]);

  // Statistics
  const words = countWords(text);
  const chars = text.length;
  const charsNoSpaces = countCharsNoSpaces(text);
  const linesCount = text ? text.split("\n").length : 0;
  const readMinutes = Math.max(1, Math.round(words / 220));

  const headingsCount = useMemo(() => (text.match(/^#{1,6}\s+/gm) ?? []).length, [text]);
  const linksCount = useMemo(() => (text.match(/\[[^\]]+\]\([^)]+\)/g) ?? []).length, [text]);
  const imagesCount = useMemo(() => (text.match(/!\[[^\]]*\]\([^)]+\)/g) ?? []).length, [text]);

  const updateCursorInfo = (el: HTMLTextAreaElement) => {
    const val = el.value.slice(0, el.selectionStart);
    const line = val.split("\n").length;
    const col = el.selectionStart - val.lastIndexOf("\n");
    setCursorPos({ line, col });
  };

  const applyEdit = useCallback((edit: Edit) => {
    setText(edit.text);
    setSaved(false);
    requestAnimationFrame(() => {
      const el = editorRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(edit.selStart, edit.selEnd);
      updateCursorInfo(el);
    });
  }, []);

  const runToolbarAction = (action: Action) => {
    if (view === "preview" || view === "html") setView("split");
    const el = editorRef.current;
    if (!el) {
      setView("split");
      return;
    }
    applyEdit(action.run(el.value, el.selectionStart, el.selectionEnd));
  };

  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const el = editorRef.current;
    if (!el) return;

    // Tab key indent/outdent
    if (e.key === "Tab") {
      e.preventDefault();
      const s = el.selectionStart;
      const end = el.selectionEnd;
      if (e.shiftKey) {
        // Outdent lines
        const lineStart = text.lastIndexOf("\n", s - 1) + 1;
        const lineEnd = text.indexOf("\n", end) === -1 ? text.length : text.indexOf("\n", end);
        const chunk = text.slice(lineStart, lineEnd);
        const unindented = chunk
          .split("\n")
          .map((line) => (line.startsWith("  ") ? line.slice(2) : line.startsWith(" ") ? line.slice(1) : line))
          .join("\n");
        const nextText = text.slice(0, lineStart) + unindented + text.slice(lineEnd);
        applyEdit({ text: nextText, selStart: lineStart, selEnd: lineStart + unindented.length });
      } else if (s !== end) {
        // Indent lines
        const lineStart = text.lastIndexOf("\n", s - 1) + 1;
        const lineEnd = text.indexOf("\n", end) === -1 ? text.length : text.indexOf("\n", end);
        const chunk = text.slice(lineStart, lineEnd);
        const indented = chunk
          .split("\n")
          .map((line) => "  " + line)
          .join("\n");
        const nextText = text.slice(0, lineStart) + indented + text.slice(lineEnd);
        applyEdit({ text: nextText, selStart: lineStart, selEnd: lineStart + indented.length });
      } else {
        // Insert 2 spaces
        const nextText = text.slice(0, s) + "  " + text.slice(end);
        applyEdit({ text: nextText, selStart: s + 2, selEnd: s + 2 });
      }
      return;
    }

    // Ctrl/Cmd shortcuts
    if (e.ctrlKey || e.metaKey) {
      const key = e.key.toLowerCase();
      if (key === "b") {
        e.preventDefault();
        runToolbarAction(ACTIONS[3]);
      } else if (key === "i") {
        e.preventDefault();
        runToolbarAction(ACTIONS[4]);
      } else if (key === "k") {
        e.preventDefault();
        runToolbarAction(ACTIONS[10]);
      } else if (key === "s") {
        e.preventDefault();
        downloadFile("document.md", text, "text/markdown");
        notify("Saved as document.md");
      }
    }
  };

  // Scroll synchronization
  const handleEditorScroll = () => {
    if (lineNumbersRef.current && editorRef.current) {
      lineNumbersRef.current.scrollTop = editorRef.current.scrollTop;
    }
    if (!syncScrollActive || isSyncingScroll.current || view !== "split") return;
    const ed = editorRef.current;
    const pv = previewRef.current;
    if (!ed || !pv) return;

    isSyncingScroll.current = true;
    const ratio = ed.scrollTop / Math.max(1, ed.scrollHeight - ed.clientHeight);
    pv.scrollTop = ratio * (pv.scrollHeight - pv.clientHeight);
    requestAnimationFrame(() => {
      isSyncingScroll.current = false;
    });
  };

  const handlePreviewScroll = () => {
    if (!syncScrollActive || isSyncingScroll.current || view !== "split") return;
    const ed = editorRef.current;
    const pv = previewRef.current;
    if (!ed || !pv) return;

    isSyncingScroll.current = true;
    const ratio = pv.scrollTop / Math.max(1, pv.scrollHeight - pv.clientHeight);
    ed.scrollTop = ratio * (ed.scrollHeight - ed.clientHeight);
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = ed.scrollTop;
    }
    requestAnimationFrame(() => {
      isSyncingScroll.current = false;
    });
  };

  // HTML document export template
  const htmlDocument = (title = "Markdown Document") => {
    const docTitle = (text.match(/^#\s+(.+)$/m)?.[1] ?? title).replace(/</g, "&lt;");
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${docTitle}</title>
<style>
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  max-width: 52rem;
  margin: 3rem auto;
  padding: 0 1.5rem;
  line-height: 1.65;
  color: #16181d;
  background: #ffffff;
}
@media (prefers-color-scheme: dark) {
  body { background: #0d0f13; color: #e8eaee; }
  pre, code, th { background: #1f232b !important; }
  th, td, hr, blockquote { border-color: #262a33 !important; }
  a { color: #60a5fa !important; }
}
h1, h2, h3, h4 { line-height: 1.25; margin-top: 1.5em; margin-bottom: 0.5em; font-weight: 600; }
h1 { font-size: 2rem; border-bottom: 1px solid #e3e6eb; padding-bottom: 0.3em; }
h2 { font-size: 1.5rem; border-bottom: 1px solid #e3e6eb; padding-bottom: 0.3em; }
code, pre { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
pre { background: #f1f3f6; padding: 1em; border-radius: 8px; overflow-x: auto; }
code { background: #f1f3f6; padding: 0.15em 0.35em; border-radius: 4px; font-size: 0.88em; }
pre code { background: none; padding: 0; }
table { border-collapse: collapse; width: 100%; margin: 1em 0; overflow-x: auto; display: block; }
th, td { border: 1px solid #e3e6eb; padding: 0.5em 0.8em; text-align: left; }
th { background: #f1f3f6; font-weight: 600; }
blockquote { border-left: 4px solid #2563eb; margin: 1em 0; padding: 0.2em 1em; color: #5f6673; }
mark { background: #fef08a; padding: 0.1em 0.25em; border-radius: 2px; }
img { max-width: 100%; border-radius: 6px; }
a { color: #2563eb; text-decoration: underline; text-underline-offset: 2px; }
hr { border: 0; border-top: 1px solid #e3e6eb; margin: 2em 0; }
.task-list-item { list-style-type: none; margin-left: -1.2em; }
.task-list-item-checkbox { margin-right: 0.5em; }
</style>
</head>
<body>
${cleanHtml}
</body>
</html>`;
  };

  const handleOpenFile = async (file: File) => {
    if (file.size > 20 * 1024 * 1024) {
      setMessage({ kind: "error", text: "File is larger than 20 MB." });
      return;
    }
    const content = await file.text();
    applyEdit({ text: content, selStart: 0, selEnd: 0 });
    notify(`Loaded ${file.name} (${fmtBytes(bytes(content))})`);
  };

  const loadTemplate = (tmpl: (typeof TEMPLATES)[0]) => {
    applyEdit({ text: tmpl.content, selStart: 0, selEnd: 0 });
    notify(`Loaded ${tmpl.name}`);
  };

  const insertEntryFromCheatsheet = (entry: MarkdownEntry) => {
    setMode("editor");
    if (view === "preview" || view === "html") setView("split");
    const el = editorRef.current;
    const start = el?.selectionStart ?? text.length;
    const end = el?.selectionEnd ?? text.length;
    applyEdit(insertBlock(text, start, end, entry.markdown, 0, entry.markdown.length));
    notify(`Inserted ${entry.element}`);
  };

  // Convert HTML -> Markdown
  const runHtmlConversion = () => {
    if (!htmlInput.trim()) {
      setMessage({ kind: "info", text: "Paste some HTML first." });
      return;
    }
    const md = htmlToMarkdown(htmlInput);
    setHtmlConverted(md);
    setMessage({ kind: "ok", text: `Converted HTML to Markdown (${fmtBytes(bytes(md))}).` });
  };

  // Table Builder Helpers
  const handleTableResize = (newRows: number, newCols: number) => {
    setTableRows(newRows);
    setTableCols(newCols);
    setTableAlign((prev) => {
      const next = [...prev];
      while (next.length < newCols) next.push("left");
      return next.slice(0, newCols);
    });
    setTableData((prev) => {
      const next: string[][] = [];
      for (let r = 0; r < newRows; r++) {
        const row: string[] = [];
        for (let c = 0; c < newCols; c++) {
          row.push(prev[r]?.[c] ?? (r === 0 ? `Header ${c + 1}` : `Data ${r},${c + 1}`));
        }
        next.push(row);
      }
      return next;
    });
  };

  const generateTableMarkdown = (): string => {
    if (tableData.length === 0 || tableCols === 0) return "";
    const headers = tableData[0] || [];
    const aligns = tableAlign.map((a) => (a === "center" ? ":---:" : a === "right" ? "---:" : ":---"));
    const rows = tableData.slice(1);

    const headerLine = `| ${headers.map((h) => h || " ").join(" | ")} |`;
    const alignLine = `| ${aligns.join(" | ")} |`;
    const dataLines = rows.map((r) => `| ${r.map((c) => c || " ").join(" | ")} |`).join("\n");

    return `${headerLine}\n${alignLine}\n${dataLines}`;
  };

  const insertTableIntoEditor = () => {
    const tableMd = generateTableMarkdown();
    setMode("editor");
    if (view === "preview" || view === "html") setView("split");
    const el = editorRef.current;
    const start = el?.selectionStart ?? text.length;
    const end = el?.selectionEnd ?? text.length;
    applyEdit(insertBlock(text, start, end, tableMd, 0, tableMd.length));
    notify("Table inserted into editor");
  };

  // Drag and Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };
  const handleDragLeave = () => setDragging(false);
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleOpenFile(file);
  };

  // Filtered cheat sheet
  const filteredCheatEntries = useMemo(() => {
    return entries.filter((e) => {
      if (cheatTab !== "All" && e.group !== cheatTab) return false;
      if (!cheatSearch.trim()) return true;
      const q = cheatSearch.toLowerCase();
      return e.element.toLowerCase().includes(q) || e.markdown.toLowerCase().includes(q) || (e.note && e.note.toLowerCase().includes(q));
    });
  }, [entries, cheatTab, cheatSearch]);

  return (
    <div className={`flex flex-col gap-2.5 ${fullscreen ? "fixed inset-0 z-50 overflow-auto bg-background p-3 sm:p-4" : "px-3 py-3 sm:px-4 lg:h-[calc(100dvh-3.5rem)]"}`}>
      <input
        ref={fileRef}
        type="file"
        accept=".md,.markdown,.txt,text/markdown,text/plain"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleOpenFile(file);
          e.target.value = "";
        }}
      />

      {/* Top Bar: Title & Main Mode Tabs */}
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {heading}

        <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-surface p-1" role="tablist" aria-label="Tool modes">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={mode === m.id}
              onClick={() => {
                setMode(m.id);
                setMessage(null);
              }}
              className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                mode === m.id ? "bg-accent font-medium text-surface shadow-sm" : "text-muted hover:bg-chip hover:text-foreground"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {flash && <span className="rounded-md bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent animate-fade">{flash}</span>}
          <CloudSave
            kind="markdown"
            noun="document"
            getData={() => ({ text })}
            getTitle={() => docTitle(text)}
            onLoad={(d: { text?: unknown }) => setText(typeof d?.text === "string" ? d.text : "")}
          />
          <button type="button" className={btn} onClick={() => setFullscreen((f) => !f)} aria-pressed={fullscreen}>
            {fullscreen ? "⤡ Exit fullscreen" : "⤢ Fullscreen"}
          </button>
        </div>
      </div>

      {/* Status Message */}
      {message && (
        <div
          role="status"
          className={`flex shrink-0 items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
            message.kind === "error"
              ? "border-rose-600/30 bg-rose-500/10 text-rose-800 dark:text-rose-300"
              : message.kind === "ok"
                ? "border-emerald-600/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                : "border-border bg-surface text-muted"
          }`}
        >
          <span className="flex-1">{message.text}</span>
          <button type="button" onClick={() => setMessage(null)} aria-label="Dismiss" className="shrink-0 opacity-60 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      {/* Mode 1: Editor & Preview Studio */}
      {mode === "editor" && (
        <>
          {/* Secondary Formatting Toolbar */}
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-surface px-2.5 py-1.5">
            <div className="flex flex-wrap items-center gap-0.5" role="toolbar" aria-label="Text formatting">
              {ACTIONS.map((a) => (
                <button
                  key={a.label}
                  type="button"
                  title={a.title}
                  aria-label={a.title}
                  onClick={() => runToolbarAction(a)}
                  className="flex h-8 min-w-8 items-center justify-center rounded-md px-1.5 text-sm text-muted hover:bg-chip hover:text-foreground transition-colors"
                >
                  {a.icon}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {/* Template Dropdown */}
              <details className="relative">
                <summary className="flex h-8 cursor-pointer list-none items-center gap-1 rounded-md border border-border bg-background px-2.5 text-xs font-medium hover:border-accent">
                  Templates ▾
                </summary>
                <div className="absolute right-0 z-20 mt-1 w-56 rounded-lg border border-border bg-surface p-1 shadow-xl">
                  {TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={(e) => {
                        (e.currentTarget.closest("details") as HTMLDetailsElement).open = false;
                        loadTemplate(tmpl);
                      }}
                      className="block w-full rounded-md px-2.5 py-1.5 text-left text-xs text-foreground hover:bg-chip"
                    >
                      {tmpl.name}
                    </button>
                  ))}
                </div>
              </details>

              {/* View Switcher Tabs */}
              <div className="flex rounded-md border border-border bg-background p-0.5" role="tablist" aria-label="Editor View">
                {(["split", "edit", "preview", "html"] as EditorView[]).map((v) => (
                  <button
                    key={v}
                    type="button"
                    role="tab"
                    aria-selected={view === v}
                    onClick={() => setView(v)}
                    className={`rounded px-2.5 py-1 text-xs capitalize transition-colors ${
                      view === v ? "bg-chip font-medium text-foreground shadow-xs" : "text-muted hover:text-foreground"
                    }`}
                  >
                    {v === "html" ? "HTML" : v}
                  </button>
                ))}
              </div>

              {/* Sync Scroll Toggle */}
              <button
                type="button"
                onClick={() => setSyncScrollActive((s) => !s)}
                className={`flex h-8 items-center gap-1 rounded-md border border-border px-2 text-xs transition-colors ${
                  syncScrollActive ? "bg-chip text-foreground font-medium" : "text-muted hover:text-foreground"
                }`}
                title="Toggle synchronized scrolling"
              >
                <span>⇅ Sync</span>
              </button>

              {/* File Actions Dropdown */}
              <details className="relative">
                <summary className="flex h-8 cursor-pointer list-none items-center gap-1 rounded-md border border-border bg-background px-2.5 text-xs font-medium hover:border-accent">
                  File ▾
                </summary>
                <div className="absolute right-0 z-20 mt-1 w-48 rounded-lg border border-border bg-surface p-1 shadow-xl">
                  <button
                    type="button"
                    onClick={(e) => {
                      (e.currentTarget.closest("details") as HTMLDetailsElement).open = false;
                      fileRef.current?.click();
                    }}
                    className="block w-full rounded-md px-2.5 py-1.5 text-left text-xs hover:bg-chip"
                  >
                    Open .md file…
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      (e.currentTarget.closest("details") as HTMLDetailsElement).open = false;
                      downloadFile("document.md", text, "text/markdown");
                    }}
                    className="block w-full rounded-md px-2.5 py-1.5 text-left text-xs hover:bg-chip"
                  >
                    Download .md
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      (e.currentTarget.closest("details") as HTMLDetailsElement).open = false;
                      downloadFile("document.html", htmlDocument(), "text/html");
                    }}
                    className="block w-full rounded-md px-2.5 py-1.5 text-left text-xs hover:bg-chip"
                  >
                    Download .html
                  </button>
                  <div className="my-1 border-t border-border" />
                  <button
                    type="button"
                    onClick={async (e) => {
                      (e.currentTarget.closest("details") as HTMLDetailsElement).open = false;
                      if (await copyToClipboard(text)) notify("Markdown copied!");
                    }}
                    className="block w-full rounded-md px-2.5 py-1.5 text-left text-xs hover:bg-chip"
                  >
                    Copy Markdown
                  </button>
                  <button
                    type="button"
                    onClick={async (e) => {
                      (e.currentTarget.closest("details") as HTMLDetailsElement).open = false;
                      if (await copyToClipboard(cleanHtml)) notify("HTML copied!");
                    }}
                    className="block w-full rounded-md px-2.5 py-1.5 text-left text-xs hover:bg-chip"
                  >
                    Copy HTML
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      (e.currentTarget.closest("details") as HTMLDetailsElement).open = false;
                      window.print();
                    }}
                    className="block w-full rounded-md px-2.5 py-1.5 text-left text-xs hover:bg-chip"
                  >
                    Print / PDF
                  </button>
                  <div className="my-1 border-t border-border" />
                  <button
                    type="button"
                    onClick={(e) => {
                      (e.currentTarget.closest("details") as HTMLDetailsElement).open = false;
                      applyEdit({ text: SAMPLE, selStart: 0, selEnd: 0 });
                      notify("Sample loaded");
                    }}
                    className="block w-full rounded-md px-2.5 py-1.5 text-left text-xs hover:bg-chip"
                  >
                    Reset to sample
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      (e.currentTarget.closest("details") as HTMLDetailsElement).open = false;
                      applyEdit({ text: "", selStart: 0, selEnd: 0 });
                      notify("Cleared");
                    }}
                    className="block w-full rounded-md px-2.5 py-1.5 text-left text-xs text-rose-600 hover:bg-chip dark:text-rose-400"
                  >
                    Clear all
                  </button>
                </div>
              </details>
            </div>
          </div>

          {/* Panes Layout */}
          <div className={`grid min-h-0 flex-1 gap-3 ${view === "split" || view === "html" ? "lg:grid-cols-2" : "grid-cols-1"}`}>
            {/* Left Pane: Markdown Source Editor */}
            {view !== "preview" && (
              <Pane
                title="Markdown Source"
                actions={
                  <>
                    <button type="button" className={smallBtn} onClick={() => fileRef.current?.click()} title="Open local file">
                      Open
                    </button>
                    <button
                      type="button"
                      className={smallBtn}
                      onClick={async () => {
                        if (await copyToClipboard(text)) notify("Markdown copied!");
                      }}
                    >
                      Copy
                    </button>
                    <button type="button" className={smallBtn} onClick={() => applyEdit({ text: "", selStart: 0, selEnd: 0 })}>
                      Clear
                    </button>
                  </>
                }
                footer={
                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                    <span className="flex flex-wrap gap-x-3 text-muted">
                      <span>{words.toLocaleString("en")} words</span>
                      <span>{chars.toLocaleString("en")} chars</span>
                      <span>({charsNoSpaces.toLocaleString("en")} non-space)</span>
                      <span>{linesCount.toLocaleString("en")} lines</span>
                      <span>~{readMinutes} min read</span>
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="font-mono text-[11px] text-muted">
                        Ln {cursorPos.line}, Col {cursorPos.col}
                      </span>
                      <span className="text-muted">{saved ? "Saved in browser" : "Saving…"}</span>
                    </span>
                  </div>
                }
              >
                <div
                  className="relative flex h-full min-h-0 w-full overflow-hidden"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {/* Line Numbers Gutter */}
                  <div
                    ref={lineNumbersRef}
                    aria-hidden="true"
                    className="select-none overflow-hidden border-r border-border bg-surface/50 py-3.5 pr-2.5 pl-3 text-right font-mono text-xs leading-6 text-muted/60"
                  >
                    {Array.from({ length: Math.max(1, linesCount) }).map((_, i) => (
                      <div key={i}>{i + 1}</div>
                    ))}
                  </div>

                  {/* Textarea Editor */}
                  <textarea
                    ref={editorRef}
                    value={text}
                    onChange={(e) => {
                      setText(e.target.value);
                      setSaved(false);
                    }}
                    onScroll={handleEditorScroll}
                    onKeyDown={handleEditorKeyDown}
                    onKeyUp={(e) => updateCursorInfo(e.currentTarget)}
                    onClick={(e) => updateCursorInfo(e.currentTarget)}
                    spellCheck
                    aria-label="Markdown editor source"
                    placeholder="Write Markdown here… (or drag & drop a .md file)"
                    className="h-full w-full resize-none bg-background p-3.5 font-mono text-[13.5px] leading-6 text-foreground outline-none selection:bg-accent/20"
                  />

                  {/* Drag and Drop File Overlay */}
                  {dragging && (
                    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-xl border-2 border-dashed border-accent bg-accent/10 text-sm font-semibold text-accent backdrop-blur-xs">
                      Drop Markdown (.md) or text file to load
                    </div>
                  )}
                </div>
              </Pane>
            )}

            {/* Right Pane: Live Rendered Preview or Raw HTML Code */}
            {view !== "edit" && (
              <Pane
                title={view === "html" ? "Generated HTML Output" : "Live Rendered Preview"}
                actions={
                  <>
                    <button
                      type="button"
                      className={smallBtn}
                      onClick={async () => {
                        if (await copyToClipboard(view === "html" ? rawHtml : cleanHtml)) notify("HTML copied!");
                      }}
                    >
                      Copy HTML
                    </button>
                    <button
                      type="button"
                      className={smallBtn}
                      onClick={() => downloadFile("document.html", htmlDocument(), "text/html")}
                    >
                      Download HTML
                    </button>
                    <button
                      type="button"
                      className={smallBtn}
                      onClick={() => downloadFile("document.md", text, "text/markdown")}
                    >
                      Download .md
                    </button>
                    <button type="button" className={smallBtn} onClick={() => window.print()} title="Print or save as PDF">
                      Print / PDF
                    </button>
                  </>
                }
                footer={
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                    <span className="flex flex-wrap gap-x-3 text-muted">
                      <span>{headingsCount} headings</span>
                      <span>{linksCount} links</span>
                      <span>{imagesCount} images</span>
                      <span>HTML: {fmtBytes(bytes(cleanHtml))}</span>
                    </span>
                    <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                      ✓ DOMPurify sanitized
                    </span>
                  </div>
                }
              >
                <div ref={previewRef} onScroll={handlePreviewScroll} className="h-full min-h-0 overflow-auto bg-surface/30 p-5 sm:p-6">
                  {view === "html" ? (
                    <pre className="whitespace-pre-wrap break-all font-mono text-[12.5px] leading-5 text-foreground selection:bg-accent/20">
                      {rawHtml || "<p>No output yet.</p>"}
                    </pre>
                  ) : cleanHtml ? (
                    <article className="md-preview" dangerouslySetInnerHTML={{ __html: cleanHtml }} />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center p-8 text-center text-sm text-muted">
                      <p>{loaded ? "Nothing to preview yet. Start typing on the left!" : "Loading preview…"}</p>
                    </div>
                  )}
                </div>
              </Pane>
            )}
          </div>
        </>
      )}

      {/* Mode 2: HTML to Markdown Converter */}
      {mode === "convert" && (
        <>
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-surface px-3 py-2">
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" className={btnPrimary} onClick={runHtmlConversion}>
                Convert to Markdown ➔
              </button>
              <button
                type="button"
                className={btn}
                onClick={() => {
                  setHtmlInput(SAMPLE_HTML);
                  notify("Sample HTML loaded");
                }}
              >
                Load Sample HTML
              </button>
              <button
                type="button"
                className={btn}
                onClick={() => {
                  setHtmlInput("");
                  setHtmlConverted("");
                  notify("Cleared");
                }}
              >
                Clear
              </button>
            </div>
            {htmlConverted && (
              <button
                type="button"
                className={btn}
                onClick={() => {
                  setText(htmlConverted);
                  setMode("editor");
                  setView("split");
                  notify("Loaded into Markdown Editor!");
                }}
              >
                ⇦ Use in Editor
              </button>
            )}
          </div>

          <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-2">
            <Pane
              title="HTML Input"
              actions={
                <button
                  type="button"
                  className={smallBtn}
                  onClick={async () => {
                    if (await copyToClipboard(htmlInput)) notify("Copied HTML!");
                  }}
                >
                  Copy
                </button>
              }
              footer={
                <span className="text-muted">
                  {lines(htmlInput)} lines · {fmtBytes(bytes(htmlInput))}
                </span>
              }
            >
              <textarea
                value={htmlInput}
                onChange={(e) => setHtmlInput(e.target.value)}
                placeholder="Paste your raw HTML here…"
                aria-label="Raw HTML input"
                className="h-full w-full resize-none bg-background p-4 font-mono text-[13px] leading-6 outline-none"
              />
            </Pane>

            <Pane
              title="Markdown Output"
              actions={
                htmlConverted && (
                  <>
                    <button
                      type="button"
                      className={smallBtn}
                      onClick={async () => {
                        if (await copyToClipboard(htmlConverted)) notify("Copied Markdown!");
                      }}
                    >
                      Copy Markdown
                    </button>
                    <button
                      type="button"
                      className={smallBtn}
                      onClick={() => downloadFile("converted.md", htmlConverted, "text/markdown")}
                    >
                      Download .md
                    </button>
                  </>
                )
              }
              footer={
                <span className="text-muted">
                  {htmlConverted ? `${countWords(htmlConverted)} words · ${fmtBytes(bytes(htmlConverted))}` : "Ready"}
                </span>
              }
            >
              {htmlConverted ? (
                <div className="h-full overflow-auto bg-surface/30 p-4 font-mono text-[13px] leading-6 whitespace-pre-wrap">
                  {htmlConverted}
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center p-8 text-center text-sm text-muted">
                  <p>Click &quot;Convert to Markdown&quot; to see the result.</p>
                </div>
              )}
            </Pane>
          </div>
        </>
      )}

      {/* Mode 3: Interactive Table Builder */}
      {mode === "table" && (
        <>
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface px-3 py-2">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <label className="flex items-center gap-1.5 font-medium">
                <span className="text-muted">Rows:</span>
                <input
                  type="number"
                  min="2"
                  max="12"
                  value={tableRows}
                  onChange={(e) => handleTableResize(Math.max(2, Math.min(12, Number(e.target.value) || 2)), tableCols)}
                  className="h-8 w-14 rounded-md border border-border bg-background px-2 text-center text-sm font-semibold outline-none"
                />
              </label>

              <label className="flex items-center gap-1.5 font-medium">
                <span className="text-muted">Columns:</span>
                <input
                  type="number"
                  min="2"
                  max="8"
                  value={tableCols}
                  onChange={(e) => handleTableResize(tableRows, Math.max(2, Math.min(8, Number(e.target.value) || 2)))}
                  className="h-8 w-14 rounded-md border border-border bg-background px-2 text-center text-sm font-semibold outline-none"
                />
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button type="button" className={btnPrimary} onClick={insertTableIntoEditor}>
                ⇦ Insert into Editor
              </button>
              <button
                type="button"
                className={btn}
                onClick={async () => {
                  if (await copyToClipboard(generateTableMarkdown())) notify("Table Markdown copied!");
                }}
              >
                Copy Markdown
              </button>
            </div>
          </div>

          <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-2">
            {/* Visual Grid Editor */}
            <Pane
              title="Visual Table Editor"
              footer={<span className="text-muted">Edit cell values and column alignment in real-time</span>}
            >
              <div className="h-full overflow-auto p-4">
                <div className="inline-block min-w-full overflow-x-auto rounded-lg border border-border bg-surface">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-chip/50">
                        {Array.from({ length: tableCols }).map((_, colIdx) => (
                          <th key={colIdx} className="p-2 text-left">
                            <div className="flex items-center gap-1">
                              <select
                                value={tableAlign[colIdx] || "left"}
                                onChange={(e) => {
                                  const nextAlign = [...tableAlign];
                                  nextAlign[colIdx] = e.target.value as ColAlign;
                                  setTableAlign(nextAlign);
                                }}
                                className="h-6 rounded border border-border bg-surface px-1 text-[11px] font-medium outline-none"
                                title="Column alignment"
                              >
                                <option value="left">Left ←</option>
                                <option value="center">Center ↔</option>
                                <option value="right">Right →</option>
                              </select>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.map((row, rIdx) => (
                        <tr key={rIdx} className={rIdx === 0 ? "border-b border-border bg-chip/30 font-semibold" : "border-b border-border/60"}>
                          {Array.from({ length: tableCols }).map((_, cIdx) => (
                            <td key={cIdx} className="p-1.5">
                              <input
                                value={row[cIdx] ?? ""}
                                onChange={(e) => {
                                  const next = tableData.map((r) => [...r]);
                                  if (!next[rIdx]) next[rIdx] = [];
                                  next[rIdx][cIdx] = e.target.value;
                                  setTableData(next);
                                }}
                                placeholder={rIdx === 0 ? `Header ${cIdx + 1}` : `Cell ${rIdx},${cIdx + 1}`}
                                className="h-8 w-full rounded border border-border/80 bg-background px-2 text-xs outline-none focus:border-accent"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Pane>

            {/* Markdown Output & Live Table Preview */}
            <Pane
              title="Markdown Output & Preview"
              footer={
                <span className="text-muted">
                  {tableCols} columns × {tableRows} rows
                </span>
              }
            >
              <div className="flex h-full flex-col divide-y divide-border overflow-auto">
                <div className="flex-1 p-4">
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Live Rendered Table</h3>
                  <div className="md-preview overflow-auto rounded-lg border border-border bg-surface p-4" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(renderMarkdown(generateTableMarkdown())) }} />
                </div>
                <div className="flex-1 p-4">
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Generated Source</h3>
                  <pre className="overflow-x-auto rounded-lg bg-background p-3 font-mono text-xs leading-5 text-foreground whitespace-pre">
                    {generateTableMarkdown()}
                  </pre>
                </div>
              </div>
            </Pane>
          </div>
        </>
      )}

      {/* Mode 4: Integrated Syntax Cheat Sheet Explorer */}
      {mode === "cheatsheet" && (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-surface">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-2.5">
            <div className="flex flex-wrap items-center gap-1.5">
              {(["All", "Basic syntax", "Extended syntax"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setCheatTab(tab)}
                  className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                    cheatTab === tab ? "bg-accent text-surface" : "text-muted hover:bg-chip hover:text-foreground"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="relative">
              <input
                type="search"
                value={cheatSearch}
                onChange={(e) => setCheatSearch(e.target.value)}
                placeholder="Search syntax (e.g. table, link, code)…"
                className="h-8 w-64 rounded-lg border border-border bg-background px-3 text-xs outline-none focus:border-accent"
              />
              {cheatSearch && (
                <button
                  type="button"
                  onClick={() => setCheatSearch("")}
                  className="absolute right-2 top-2 text-xs text-muted hover:text-foreground"
                >
                  ✕
                </button>
              )}
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-auto p-4">
            <div className="hidden grid-cols-[12rem_minmax(0,1.2fr)_minmax(0,1.2fr)_6rem] gap-4 border-b border-border pb-2 text-xs font-semibold uppercase tracking-wider text-muted md:grid">
              <span>Element</span>
              <span>Markdown</span>
              <span>Result</span>
              <span className="text-right">Action</span>
            </div>

            <ul className="divide-y divide-border">
              {filteredCheatEntries.map((e) => (
                <li key={e.id} className="grid gap-3 py-3 md:grid-cols-[12rem_minmax(0,1.2fr)_minmax(0,1.2fr)_6rem] md:items-center md:gap-4">
                  <div>
                    <p className="font-semibold text-sm">{e.element}</p>
                    {e.note && <p className="mt-1 text-xs text-muted leading-relaxed">{e.note}</p>}
                    <span className="mt-1 inline-block rounded bg-chip px-1.5 py-0.5 text-[10px] font-medium text-muted">
                      {e.group}
                    </span>
                  </div>

                  <pre className="overflow-x-auto rounded-lg bg-background p-2.5 font-mono text-[12.5px] leading-5 text-foreground whitespace-pre-wrap">
                    {e.markdown}
                  </pre>

                  <div className="md-preview overflow-auto rounded-lg border border-border bg-surface p-2.5 text-xs" dangerouslySetInnerHTML={{ __html: e.html }} />

                  <div className="flex justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => insertEntryFromCheatsheet(e)}
                      className="inline-flex items-center rounded-md bg-accent px-2.5 py-1 text-xs font-medium text-surface transition-opacity hover:opacity-90"
                      title="Insert into editor"
                    >
                      Insert ↑
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            {filteredCheatEntries.length === 0 && (
              <div className="py-12 text-center text-sm text-muted">
                No syntax matching &quot;{cheatSearch}&quot; found.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function lines(s: string) {
  return s ? s.split("\n").length : 0;
}
