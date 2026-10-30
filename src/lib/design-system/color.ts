// Small colour helpers for the design-system generator. Everything is normalised to lowercase "#rrggbb".

const clamp = (n: number, lo = 0, hi = 255) => Math.min(hi, Math.max(lo, n));
const hex2 = (n: number) => Math.round(clamp(n)).toString(16).padStart(2, "0");
const toHex = (r: number, g: number, b: number) => `#${hex2(r)}${hex2(g)}${hex2(b)}`;

/** "#abc", "#aabbcc", "#aabbccdd", "rgb(1 2 3)", "rgba(1, 2, 3, .5)" or "hsl(210 50% 40%)" → "#rrggbb", else null. Alpha is dropped. */
export function parseColor(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const s = input.trim().toLowerCase();
  let m = s.match(/^#([0-9a-f]{3,4})$/);
  if (m) return `#${[...m[1].slice(0, 3)].map((c) => c + c).join("")}`;
  m = s.match(/^#([0-9a-f]{6})(?:[0-9a-f]{2})?$/);
  if (m) return `#${m[1]}`;
  m = s.match(/^rgba?\(\s*(\d{1,3}(?:\.\d+)?)[\s,]+(\d{1,3}(?:\.\d+)?)[\s,]+(\d{1,3}(?:\.\d+)?)(?:[\s,/]+[\d.]+%?)?\s*\)$/);
  if (m) return toHex(+m[1], +m[2], +m[3]);
  m = s.match(/^hsla?\(\s*(-?\d+(?:\.\d+)?)(?:deg)?[\s,]+(\d+(?:\.\d+)?)%[\s,]+(\d+(?:\.\d+)?)%(?:[\s,/]+[\d.]+%?)?\s*\)$/);
  if (m) {
    const h = (((+m[1] % 360) + 360) % 360) / 360;
    const sat = +m[2] / 100;
    const l = +m[3] / 100;
    const q = l < 0.5 ? l * (1 + sat) : l + sat - l * sat;
    const p = 2 * l - q;
    const f = (t: number) => {
      t = (t + 1) % 1;
      return 255 * (t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p);
    };
    return toHex(f(h + 1 / 3), f(h), f(h - 1 / 3));
  }
  return null;
}

export const rgb = (hex: string): [number, number, number] => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];

/** WCAG relative luminance, 0 (black) to 1 (white). */
export function luminance(hex: string): number {
  const [r, g, b] = rgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export const isDark = (hex: string) => luminance(hex) < 0.18;

/** 0 (grey) to 1 (fully saturated). */
export function saturation(hex: string): number {
  const [r, g, b] = rgb(hex).map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max === 0 ? 0 : (max - min) / max;
}

/** `t` of the way from a to b. */
export function mix(a: string, b: string, t: number): string {
  const [ar, ag, ab] = rgb(a);
  const [br, bg, bb] = rgb(b);
  return toHex(ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t);
}

/** Black or white, whichever reads better on `bg`. */
export const readableOn = (bg: string) => (contrast(bg, "#ffffff") >= contrast(bg, "#000000") ? "#ffffff" : "#000000");

/** Moves `color` away from `bg` (towards white on dark, black on light) until it reaches `min` contrast. */
export function ensureContrast(color: string, bg: string, min: number): string {
  const target = isDark(bg) ? "#ffffff" : "#000000";
  let out = color;
  for (let i = 0; i < 14 && contrast(out, bg) < min; i++) out = mix(out, target, 0.08);
  return out;
}
