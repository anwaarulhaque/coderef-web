// Parts of the DESIGN.md library that the browser also needs (no fs here).

/** Compact search record shipped to the browser — keep keys short, there are ~1,100 of them. */
export type DesignIndexEntry = {
  i: string; // id
  n: string; // name
  c: string; // collection
  g: string; // category
  s: string; // summary
  p: string[]; // palette
  f: string[]; // fonts
  t: "light" | "dark";
  h: string; // hue family
  w: number; // words
  v: number; // number of files (DESIGN.md + platform variants)
  x?: string; // screenshot version, when the live site has been captured
};

/** A screenshot of the live site, from scripts/screenshot-design-md.mjs. */
export type DesignShot = { h: number; v: string };

/** thumb: 600×800, top of the page. full: 1440 wide, whole page. `v` busts caches after a recapture. */
export const shotHref = (id: string, kind: "thumb" | "full", v: string) => `/design-md/shots/${id}/${kind}.webp?v=${v}`;

export const HUES = ["red", "orange", "yellow", "green", "teal", "blue", "purple", "pink", "neutral"] as const;

export const HUE_SWATCH: Record<string, string> = {
  red: "#ef4444",
  orange: "#f97316",
  yellow: "#eab308",
  green: "#22c55e",
  teal: "#14b8a6",
  blue: "#3b82f6",
  purple: "#8b5cf6",
  pink: "#ec4899",
  neutral: "#9ca3af",
};

export const designHref = (id: string) => `/design-md/${id}/`;
export const designFileHref = (id: string, file = "DESIGN.md") => `/design-md/files/${id}/${file}`;

/** "DESIGN-swiftui.md" → "SwiftUI" */
export function variantLabel(file: string): string {
  const v = file.replace(/^DESIGN-?|\.md$/g, "");
  return ({ "": "DESIGN.md", swiftui: "SwiftUI", android: "Android", expo: "Expo" } as Record<string, string>)[v] ?? v;
}

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);

export function lightness(hex: string): number {
  const [r, g, b] = rgb(hex);
  return (Math.max(r, g, b) + Math.min(r, g, b)) / 2;
}

function saturation(hex: string): number {
  const [r, g, b] = rgb(hex);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  return max === min ? 0 : (max - min) / (1 - Math.abs(2 * l - 1));
}

/** Background, text and accent for a design's preview tile, guessed from its palette and theme. */
export function previewColors(palette: string[], theme: "light" | "dark") {
  const dark = theme === "dark";
  const byLight = [...palette].sort((a, b) => lightness(a) - lightness(b));
  const bg = (dark ? byLight[0] : byLight[byLight.length - 1]) ?? (dark ? "#111111" : "#ffffff");
  let fg = (dark ? byLight[byLight.length - 1] : byLight[0]) ?? (dark ? "#ffffff" : "#111111");
  if (Math.abs(lightness(fg) - lightness(bg)) < 0.45) fg = dark ? "#ffffff" : "#111111";
  const accent = palette.find((c) => saturation(c) > 0.35 && lightness(c) > 0.2 && lightness(c) < 0.85) ?? fg;
  return { bg, fg, accent };
}

/** WCAG relative luminance: how bright a color looks, so yellow counts as light and blue as dark. */
function luminance(hex: string): number {
  const [r, g, b] = rgb(hex).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Black or white, whichever has the higher WCAG contrast on the given color. */
export function readableOn(hex: string): string {
  const l = luminance(hex);
  const onDark = 1.05 / (l + 0.05); // contrast of white text
  const onLight = (l + 0.05) / (0.0123 + 0.05); // contrast of #111111 text
  return onLight >= onDark ? "#111111" : "#ffffff";
}
