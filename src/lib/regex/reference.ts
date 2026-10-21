export type ReferenceItem = { token: string; desc: string; insert?: string };

export const QUICK_REFERENCE: { title: string; items: ReferenceItem[] }[] = [
  {
    title: "Character classes",
    items: [
      { token: ".", desc: "Any character except line terminators" },
      { token: "\\d", desc: "Digit [0-9]" },
      { token: "\\D", desc: "Not a digit" },
      { token: "\\w", desc: "Word character [a-zA-Z0-9_]" },
      { token: "\\W", desc: "Not a word character" },
      { token: "\\s", desc: "Whitespace" },
      { token: "\\S", desc: "Not whitespace" },
      { token: "[abc]", desc: "Any of a, b or c" },
      { token: "[^abc]", desc: "Not a, b or c" },
      { token: "[a-z]", desc: "Character between a and z" },
      { token: "\\p{L}", desc: "Unicode letter (needs u or v flag)" },
      { token: "\\P{L}", desc: "Not a Unicode letter (needs u or v flag)" },
    ],
  },
  {
    title: "Anchors",
    items: [
      { token: "^", desc: "Start of string, or line with m flag" },
      { token: "$", desc: "End of string, or line with m flag" },
      { token: "\\b", desc: "Word boundary" },
      { token: "\\B", desc: "Not a word boundary" },
    ],
  },
  {
    title: "Quantifiers",
    items: [
      { token: "*", desc: "0 or more" },
      { token: "+", desc: "1 or more" },
      { token: "?", desc: "0 or 1" },
      { token: "{3}", desc: "Exactly 3" },
      { token: "{3,}", desc: "3 or more" },
      { token: "{3,6}", desc: "Between 3 and 6" },
      { token: "*?", desc: "0 or more, lazy" },
      { token: "+?", desc: "1 or more, lazy" },
    ],
  },
  {
    title: "Groups & references",
    items: [
      { token: "(...)", desc: "Capturing group", insert: "()" },
      { token: "(?:...)", desc: "Non-capturing group", insert: "(?:)" },
      { token: "(?<name>...)", desc: "Named capturing group", insert: "(?<name>)" },
      { token: "\\1", desc: "Backreference to group 1" },
      { token: "\\k<name>", desc: "Backreference to a named group" },
      { token: "a|b", desc: "a or b", insert: "|" },
      { token: "(?i:...)", desc: "Modifier: case-insensitive inside", insert: "(?i:)" },
    ],
  },
  {
    title: "Lookaround",
    items: [
      { token: "(?=...)", desc: "Positive lookahead", insert: "(?=)" },
      { token: "(?!...)", desc: "Negative lookahead", insert: "(?!)" },
      { token: "(?<=...)", desc: "Positive lookbehind", insert: "(?<=)" },
      { token: "(?<!...)", desc: "Negative lookbehind", insert: "(?<!)" },
    ],
  },
  {
    title: "Escapes",
    items: [
      { token: "\\t", desc: "Tab" },
      { token: "\\n", desc: "Line feed" },
      { token: "\\r", desc: "Carriage return" },
      { token: "\\0", desc: "Null character" },
      { token: "\\xFF", desc: "Character by hex code" },
      { token: "\\uFFFF", desc: "Character by Unicode code unit" },
      { token: "\\u{1F600}", desc: "Code point (needs u or v flag)" },
      { token: "\\.", desc: "Escaped metacharacter (also \\* \\+ \\? \\( \\[ …)" },
    ],
  },
  {
    title: "Substitution",
    items: [
      { token: "$&", desc: "Whole match" },
      { token: "$1", desc: "Contents of group 1" },
      { token: "$<name>", desc: "Contents of a named group" },
      { token: "$`", desc: "Text before the match" },
      { token: "$'", desc: "Text after the match" },
      { token: "$$", desc: "A literal $" },
    ],
  },
];
