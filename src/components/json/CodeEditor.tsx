"use client";

import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import { xml } from "@codemirror/lang-xml";
import { yaml } from "@codemirror/lang-yaml";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { lintGutter, setDiagnostics } from "@codemirror/lint";
import { Compartment, EditorState, Prec, type Extension } from "@codemirror/state";
import { EditorView, keymap, placeholder as placeholderExt } from "@codemirror/view";
import { tags as t } from "@lezer/highlight";
import { basicSetup } from "codemirror";
import { useEffect, useRef } from "react";

export type EditorLanguage = "json" | "yaml" | "xml" | "typescript" | "javascript" | "html" | "css" | "text";

const LANGUAGES: Record<EditorLanguage, () => Extension> = {
  json: () => json(),
  yaml: () => yaml(),
  xml: () => xml(),
  typescript: () => javascript({ typescript: true }),
  javascript: () => javascript(),
  html: () => html(),
  css: () => css(),
  text: () => [],
};

const languageFor = (lang: EditorLanguage): Extension => LANGUAGES[lang]();

// Colors come from CSS variables so the editor follows the site's light/dark theme.
const highlight = HighlightStyle.define([
  { tag: t.propertyName, color: "var(--json-key, #9333ea)" },
  { tag: [t.string, t.special(t.string)], color: "var(--json-string, #16a34a)" },
  { tag: t.number, color: "var(--json-number, #2563eb)" },
  { tag: [t.bool, t.null, t.atom], color: "var(--json-bool, #ea580c)" },
  { tag: [t.keyword, t.typeName, t.definitionKeyword], color: "var(--json-key, #9333ea)" },
  { tag: [t.tagName], color: "var(--json-key, #9333ea)" },
  { tag: [t.attributeName], color: "var(--json-bool, #ea580c)" },
  { tag: [t.className, t.labelName], color: "var(--json-number, #2563eb)" },
  { tag: [t.function(t.variableName), t.function(t.propertyName)], color: "var(--json-number, #2563eb)" },
  { tag: [t.comment], color: "var(--muted)", fontStyle: "italic" },
  { tag: [t.punctuation, t.bracket, t.separator], color: "var(--muted)" },
]);

const theme = EditorView.theme({
  "&": { height: "100%", fontSize: "13px", backgroundColor: "transparent", color: "var(--foreground)" },
  ".cm-scroller": { fontFamily: "var(--font-geist-mono), ui-monospace, monospace", lineHeight: "1.55" },
  ".cm-content": { caretColor: "var(--foreground)" },
  ".cm-gutters": { backgroundColor: "var(--surface)", color: "var(--muted)", borderRight: "1px solid var(--border)" },
  ".cm-activeLine": { backgroundColor: "color-mix(in srgb, var(--accent) 6%, transparent)" },
  ".cm-activeLineGutter": { backgroundColor: "color-mix(in srgb, var(--accent) 10%, transparent)" },
  ".cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection": { backgroundColor: "color-mix(in srgb, var(--accent) 25%, transparent) !important" },
  ".cm-cursor": { borderLeftColor: "var(--foreground)" },
  ".cm-foldPlaceholder": { backgroundColor: "var(--chip)", border: "1px solid var(--border)", color: "var(--muted)" },
  ".cm-tooltip": { backgroundColor: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)" },
  ".cm-panels": { backgroundColor: "var(--surface)", color: "var(--foreground)" },
  ".cm-panels input, .cm-panels button": { color: "var(--foreground)" },
  ".cm-placeholder": { color: "var(--muted)" },
  "&.cm-focused": { outline: "none" },
});

export type EditorError = { offset: number; message: string } | null;

export function CodeEditor({
  value,
  onChange,
  language = "json",
  readOnly = false,
  error = null,
  revealError = 0,
  placeholder,
  label,
  onSubmit,
  extensions,
}: {
  value: string;
  onChange?: (value: string) => void;
  language?: EditorLanguage;
  readOnly?: boolean;
  error?: EditorError;
  /** Change this number to scroll to and select the error. */
  revealError?: number;
  placeholder?: string;
  label: string;
  /** Ctrl/⌘+Enter */
  onSubmit?: () => void;
  /** Extra CodeMirror extensions, applied when the editor is created. */
  extensions?: Extension;
}) {
  const host = useRef<HTMLDivElement | null>(null);
  const view = useRef<EditorView | null>(null);
  const lang = useRef(new Compartment());
  const ro = useRef(new Compartment());
  const onChangeRef = useRef(onChange);
  const onSubmitRef = useRef(onSubmit);
  useEffect(() => {
    onChangeRef.current = onChange;
    onSubmitRef.current = onSubmit;
  });

  // Create once.
  useEffect(() => {
    if (!host.current) return;
    const v = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: value,
        extensions: [
          basicSetup,
          lintGutter(),
          theme,
          syntaxHighlighting(highlight),
          EditorView.lineWrapping,
          lang.current.of(languageFor(language)),
          ro.current.of([EditorState.readOnly.of(readOnly), EditorView.editable.of(!readOnly)]),
          placeholder ? placeholderExt(placeholder) : [],
          EditorView.contentAttributes.of({ "aria-label": label }),
          // High precedence: basicSetup binds Mod-Enter to "insert blank line".
          Prec.high(keymap.of([{ key: "Mod-Enter", run: () => (onSubmitRef.current ? (onSubmitRef.current(), true) : false) }])),
          extensions ?? [],
          EditorView.updateListener.of((u) => {
            if (u.docChanged) onChangeRef.current?.(u.state.doc.toString());
          }),
        ],
      }),
    });
    view.current = v;
    return () => v.destroy();
    // Created once; later prop changes are applied by the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Outside value changes (format, load file…) replace the document.
  useEffect(() => {
    const v = view.current;
    if (v && v.state.doc.toString() !== value) v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: value } });
  }, [value]);

  useEffect(() => {
    view.current?.dispatch({ effects: lang.current.reconfigure(languageFor(language)) });
  }, [language]);

  useEffect(() => {
    view.current?.dispatch({ effects: ro.current.reconfigure([EditorState.readOnly.of(readOnly), EditorView.editable.of(!readOnly)]) });
  }, [readOnly]);

  // Underline the error position.
  useEffect(() => {
    const v = view.current;
    if (!v) return;
    const len = v.state.doc.length;
    const from = error ? Math.min(error.offset, Math.max(0, len - 1)) : 0;
    v.dispatch(setDiagnostics(v.state, error ? [{ from, to: Math.min(len, from + 1), severity: "error", message: error.message }] : []));
  }, [error, value]);

  useEffect(() => {
    const v = view.current;
    if (!v || !error || !revealError) return;
    const pos = Math.min(error.offset, v.state.doc.length);
    v.dispatch({ selection: { anchor: pos, head: Math.min(v.state.doc.length, pos + 1) }, effects: EditorView.scrollIntoView(pos, { y: "center" }) });
    v.focus();
    // Only when asked to reveal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealError]);

  return <div ref={host} className="h-full min-h-0 overflow-hidden" />;
}
