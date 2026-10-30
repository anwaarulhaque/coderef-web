// Emmet on Tab inside the Try It editors: "ul>li*3" + Tab → markup, "m10" + Tab → "margin: 10px;".
import { indentLess, insertTab } from "@codemirror/commands";
import { Prec, type Extension } from "@codemirror/state";
import { keymap, type EditorView } from "@codemirror/view";
import expand, { extract } from "emmet";

// A bare word only expands when it's an HTML element, so Tab after ordinary text just indents.
const TAGS = new Set(
  "a abbr address article aside audio b blockquote body br button canvas caption cite code col colgroup data datalist dd del details dfn dialog div dl dt em embed fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 head header hr html i iframe img input ins kbd label legend li link main mark menu meta meter nav noscript object ol optgroup option output p picture pre progress q s samp script section select slot small source span strong style sub summary sup table tbody td template textarea tfoot th thead time title tr track u ul var video wbr".split(" "),
);

const CURSOR = "\u0001";

function expandAt(view: EditorView, type: "markup" | "stylesheet") {
  const { state } = view;
  const sel = state.selection.main;
  if (!sel.empty) return false;
  const line = state.doc.lineAt(sel.head);
  const before = line.text.slice(0, sel.head - line.from);

  // CSS abbreviations only make sense inside a rule's braces.
  if (type === "stylesheet") {
    const text = state.doc.sliceString(0, sel.head);
    if (text.split("{").length <= text.split("}").length) return false;
  }

  const found = extract(before, before.length, { type, lookAhead: false });
  if (!found?.abbreviation) return false;
  const abbr = found.abbreviation;
  if (type === "markup" && /^[a-z][\w-]*$/i.test(abbr) && !TAGS.has(abbr.toLowerCase())) return false;

  let out: string;
  try {
    out = expand(abbr, {
      type,
      syntax: type === "markup" ? "html" : "css",
      options: { "output.indent": "  ", "output.field": (_i: number, placeholder: string) => placeholder + CURSOR },
    });
  } catch {
    return false;
  }
  if (!out.replaceAll(CURSOR, "").trim()) return false;

  const indent = /^\s*/.exec(line.text)![0];
  out = out.replace(/\n/g, `\n${indent}`);
  const caret = out.indexOf(CURSOR);
  const insert = out.replaceAll(CURSOR, "");
  const from = line.from + found.start;
  view.dispatch({
    changes: { from, to: sel.head, insert },
    selection: { anchor: from + (caret === -1 ? insert.length : caret) },
    scrollIntoView: true,
    userEvent: "input.complete",
  });
  return true;
}

/** Tab expands an Emmet abbreviation before the cursor, otherwise indents; Shift+Tab outdents. */
export const emmetTab = (type: "markup" | "stylesheet" | null): Extension =>
  Prec.high(
    keymap.of([
      { key: "Tab", run: (view) => (type ? expandAt(view, type) : false) || insertTab(view) },
      { key: "Shift-Tab", run: indentLess },
    ]),
  );
