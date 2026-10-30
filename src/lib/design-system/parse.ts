// Turns one design Markdown file into a normalised DesignSystem. The source is the truth: anything it defines is
// marked "source"; values computed from it are "derived"; anything missing falls back to a CodeRef default and says so.
// Two source shapes are supported: YAML front matter tokens (colors / typography / rounded / spacing / components),
// and prose-only files where values are mined from the text. Never throws on malformed input.
import { load } from "js-yaml";
import { contrast, ensureContrast, isDark, luminance, mix, parseColor, readableOn, saturation } from "./color.ts";
import type {
  ComponentSpec, Coverage, DesignMeta, DesignSystem, NamedValue, PaletteColor, Provenance, Role, Sourced, ThemeName, ThemeTokens, TypeStyle,
} from "./types.ts";

const SYSTEM_SANS = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const SYSTEM_MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace';

const src = <T,>(value: T): Sourced<T> => ({ value, from: "source" });
const derived = <T,>(value: T): Sourced<T> => ({ value, from: "derived" });
const fallback = <T,>(value: T): Sourced<T> => ({ value, from: "default" });

/** FNV-1a, enough to tell source versions apart. */
export function hashSource(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193);
  return (h >>> 0).toString(16).padStart(8, "0");
}

export const slugify = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "") || "design";

// ---- value sanitisers: everything below ends up inside CSS, so only known-safe shapes get through ----

const LENGTH = /^-?\d+(?:\.\d+)?(?:px|rem|em|%|vw|vh)?$/;
export const safeLength = (v: unknown): string | null => {
  const s = typeof v === "number" ? String(v) : typeof v === "string" ? v.trim() : "";
  return LENGTH.test(s) ? (/[a-z%]$/.test(s) ? s : `${s}px`) : null;
};
const safeShorthand = (v: unknown): string | null => {
  const parts = (typeof v === "string" ? v : typeof v === "number" ? `${v}px` : "").trim().split(/\s+/);
  if (!parts[0] || parts.length > 4 || !parts.every((p) => /^-?\d+(?:\.\d+)?(?:px|rem|em|%)?$/.test(p))) return null;
  return parts.map((p) => (/[a-z%]$/.test(p) ? p : `${p}px`)).join(" ");
};
const safeWeight = (v: unknown): string | undefined => {
  const s = String(v ?? "").trim();
  return /^(?:[1-9]00|normal|bold|bolder|lighter)$/.test(s) ? s : undefined;
};
const safeLineHeight = (v: unknown): string | undefined => {
  const s = String(v ?? "").trim();
  return /^\d+(?:\.\d+)?(?:px|rem|em|%)?$/.test(s) ? s : undefined;
};
const safeSpacing = (v: unknown): string | undefined => {
  const s = String(v ?? "").trim().replace(/[−–]/g, "-");
  return /^-?\d+(?:\.\d+)?(?:px|em|rem)?$/.test(s) ? (/[a-z]$/.test(s) ? s : `${s}px`) : undefined;
};
const safeShadow = (v: string): string | null => {
  const s = v.trim().replace(/;$/, "");
  return s.length <= 160 && /^[\w\s.,()#%/+-]+$/.test(s) && /\d+px/.test(s) ? s : null;
};
/** One family name or a full stack, stripped to characters that cannot break out of a CSS declaration. */
export function safeFontStack(v: string): string {
  return v.replace(/[^\w\s,'".-]/g, "").replace(/\s+/g, " ").trim().slice(0, 200);
}
const withFallback = (family: string, mono = false) => {
  const f = safeFontStack(family);
  if (!f) return mono ? SYSTEM_MONO : SYSTEM_SANS;
  return /\b(sans-serif|serif|monospace)\s*$/.test(f) ? f : `${f}, ${mono ? SYSTEM_MONO : SYSTEM_SANS}`;
};
const sizePx = (s: string | undefined) => {
  const m = s?.match(/^(-?\d+(?:\.\d+)?)(px|rem|em)?$/);
  return m ? parseFloat(m[1]) * (m[2] === "rem" || m[2] === "em" ? 16 : 1) : 0;
};

// ---- front matter / prose access ----

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => !!v && typeof v === "object" && !Array.isArray(v);

function splitFrontMatter(md: string): { fm: string | null; body: string } {
  const m = md.match(/^﻿?---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/);
  return m ? { fm: m[1], body: md.slice(m[0].length) } : { fm: null, body: md };
}

/** The text under the first heading matching `title`, up to the next heading of the same or higher level. */
function section(body: string, title: RegExp): string {
  const lines = body.split("\n");
  const out: string[] = [];
  let level = 0;
  for (const line of lines) {
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      if (level) {
        if (h[1].length <= level) break;
      } else if (title.test(h[2])) {
        level = h[1].length;
        continue;
      }
    }
    if (level) out.push(line);
  }
  return out.join("\n");
}

const clean = (s: string) => s.replace(/\*\*|__|`/g, "").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/\s+/g, " ").trim();

/** Resolves "{colors.primary}" style references against the front matter. Objects resolve to their token name. */
function makeResolver(fm: Obj) {
  return (v: unknown): string | undefined => {
    if (typeof v === "number") return String(v);
    if (typeof v !== "string") return undefined;
    const m = v.trim().match(/^\{([\w.-]+)\}$/);
    if (!m) return v.trim();
    const path = m[1].split(".");
    let cur: unknown = fm;
    for (const p of path) cur = isObj(cur) ? cur[p] : undefined;
    if (typeof cur === "string" || typeof cur === "number") return String(cur);
    return isObj(cur) ? path[path.length - 1] : undefined;
  };
}

// ---- colours ----

const ROLE_PATTERNS: Record<Exclude<Role, "onPrimary" | "accent" | "surface">, RegExp[]> = {
  background: [/^(canvas|background|bg|page|paper|base)$/, /^(canvas|background|bg|page)[-_](?!dark|inverse|soft|cream|alt|2)/, /^surface$/],
  foreground: [/^(ink|text|foreground|fg|body|content|on-(canvas|surface|background))$/, /^(ink|text|foreground|fg)[-_](primary|strong|default|base|1)$/, /^(ink|text)[-_]/],
  muted: [/^(ink|text|fg|foreground)[-_](mute|muted|secondary|subtle|soft|tertiary|2)/, /^(muted|caption|subtle)/, /^(secondary)[-_]?text/],
  border: [/^(hairline|border|line|divider|outline|stroke)$/, /^(hairline|border|line|divider|outline|stroke)[-_]/],
  primary: [/^(primary|brand|accent|action|cta)$/, /^(primary|brand)[-_](500|base|default|main)$/, /^(primary|brand)/],
  secondary: [/^secondary$/, /^secondary[-_]/, /^(accent|brand)[-_]?(2|secondary)$/],
};
const SURFACE_PATTERNS = [/^(surface|card|panel|elevated|container)$/, /^(surface|card|panel|elevated)[-_](?!dark|inverse)/, /^(canvas|background|bg)[-_](soft|alt|2|subtle|elevated)/];
const ON_PRIMARY = [/^on-(primary|brand|accent)$/, /^(primary|brand)[-_]?(text|foreground|on)$/];
const DARK_NAME = /dark|inverse|night/;

type Palette = Map<string, string>;
const findColor = (p: Palette, pats: RegExp[], accept: (hex: string) => boolean = () => true, skipDark = true): string | undefined => {
  for (const re of pats) for (const [name, hex] of p) if (re.test(name) && accept(hex) && !(skipDark && DARK_NAME.test(name))) return hex;
  return undefined;
};

function buildTheme(p: Palette, wanted: ThemeName, others: { bg: string[]; fg: string[]; all: string[] }): ThemeTokens | null {
  const wantDark = wanted === "dark";
  const fits = (hex: string) => isDark(hex) === wantDark;
  const named = (pats: RegExp[], accept?: (h: string) => boolean) => findColor(p, pats, accept, !wantDark);
  const darkOnly = (pats: RegExp[], accept?: (h: string) => boolean) => {
    for (const re of pats) for (const [name, hex] of p) if (DARK_NAME.test(name) && re.test(name.replace(DARK_NAME, "").replace(/^[-_]+|[-_]+$/g, "")) && accept?.(hex) !== false) return hex;
    return undefined;
  };

  let bg = named(ROLE_PATTERNS.background, fits);
  if (!bg && wantDark) bg = darkOnly([/^(canvas|background|bg|surface|page)?$/, /^(canvas|background|bg|surface|page)/], isDark);
  bg ??= others.bg.find(fits);
  if (!bg) return null;

  let fg = named(ROLE_PATTERNS.foreground, (h) => contrast(h, bg!) >= 4);
  // Unnamed text colour: the first neutral (low-saturation) palette colour that reads on the background.
  fg ??= others.fg.find((h) => saturation(h) < 0.35 && contrast(h, bg!) >= 4) ?? others.fg.find((h) => contrast(h, bg!) >= 7);
  const fgFrom: Provenance = fg ? "source" : "derived";
  fg ??= readableOn(bg);

  const accentLike = (h: string) => saturation(h) > 0.25 && luminance(h) > 0.04 && luminance(h) < 0.85 && contrast(h, bg!) >= 1.8 && h !== fg;
  const primaryCandidates = [...p.entries()].filter(([n, h]) => !DARK_NAME.test(n) && accentLike(h)).sort((a, b) => saturation(b[1]) - saturation(a[1]));
  let primary = named(ROLE_PATTERNS.primary, (h) => contrast(h, bg!) >= 1.5);
  let primaryFrom: Provenance = "source";
  if (!primary) {
    primary = primaryCandidates[0]?.[1] ?? others.all.filter(accentLike).sort((a, b) => saturation(b) - saturation(a))[0];
    if (!primary) {
      primary = fg;
      primaryFrom = "derived";
    }
  }

  const surfaceHex = named(SURFACE_PATTERNS, (h) => h !== bg && Math.abs(luminance(h) - luminance(bg!)) < 0.35);
  const mutedHex = named(ROLE_PATTERNS.muted, (h) => contrast(h, bg!) >= 2.2);
  const borderHex = named(ROLE_PATTERNS.border, (h) => h !== bg);
  const onPrimaryHex = named(ON_PRIMARY);
  const secondaryHex = named(ROLE_PATTERNS.secondary, (h) => h !== primary);
  const accentHex = findColor(p, [/^accent/, /^(highlight|link)/], (h) => h !== primary && contrast(h, bg!) >= 1.5, !wantDark);

  const tint = (t: number) => mix(bg!, fg!, t);
  return {
    background: src(bg),
    surface: surfaceHex ? src(surfaceHex) : derived(tint(wantDark ? 0.06 : 0.035)),
    foreground: { value: fg, from: fgFrom },
    muted: mutedHex ? src(mutedHex) : derived(ensureContrast(mix(fg, bg, 0.4), bg, 4.5)),
    border: borderHex ? src(borderHex) : derived(tint(wantDark ? 0.18 : 0.14)),
    primary: { value: primary, from: primaryFrom },
    onPrimary: onPrimaryHex ? src(onPrimaryHex) : derived(readableOn(primary)),
    secondary: secondaryHex ? src(secondaryHex) : derived(mix(primary, bg, 0.35)),
    accent: accentHex ? src(accentHex) : secondaryHex ? src(secondaryHex) : derived(primary),
  };
}

/** The other theme, computed from the source one when the file does not define it. */
export function deriveTheme(from: ThemeTokens, to: ThemeName, named: { bg?: string; fg?: string } = {}): ThemeTokens {
  const toDark = to === "dark";
  const bgSrc = from.background.value;
  const fgSrc = from.foreground.value;
  const bg = named.bg ?? (toDark ? (luminance(fgSrc) < 0.12 ? fgSrc : mix(fgSrc, "#000000", 0.7)) : luminance(fgSrc) > 0.75 ? fgSrc : mix(fgSrc, "#ffffff", 0.9));
  const fg = named.fg ?? (toDark ? (luminance(bgSrc) > 0.7 ? bgSrc : mix(bgSrc, "#ffffff", 0.8)) : luminance(bgSrc) < 0.12 ? bgSrc : mix(bgSrc, "#000000", 0.8));
  const mark = (v: string, explicit?: string) => (explicit ? src(v) : derived(v));
  const lift = (c: string, min: number) => ensureContrast(c, bg, min);
  const primary = lift(from.primary.value, 3.5);
  return {
    background: mark(bg, named.bg),
    surface: derived(mix(bg, fg, toDark ? 0.07 : 0.035)),
    foreground: mark(fg, named.fg),
    muted: derived(ensureContrast(mix(fg, bg, 0.4), bg, 4.5)),
    border: derived(mix(bg, fg, toDark ? 0.18 : 0.14)),
    primary: derived(primary),
    onPrimary: derived(readableOn(primary)),
    secondary: derived(lift(from.secondary.value, 3)),
    accent: derived(lift(from.accent.value, 3)),
  };
}

/** Colours the source explicitly names for a dark surface and its text, e.g. "canvas-dark" and "on-dark". */
function namedDark(p: Palette): { bg?: string; fg?: string } {
  let bg: string | undefined;
  let fg: string | undefined;
  for (const [n, h] of p) {
    if (!bg && /(canvas|background|bg|page|surface)[-_](dark|inverse|night)|(dark|inverse|night)[-_](canvas|background|bg|page)/.test(n) && isDark(h)) bg = h;
  }
  if (bg) {
    for (const [n, h] of p) if (!fg && /(on|text|ink)[-_](dark|inverse)|(dark|inverse)[-_](text|ink|foreground)/.test(n) && contrast(h, bg) >= 4.5) fg = h;
  }
  return { bg, fg };
}

// ---- typography ----

function parseTypography(raw: unknown, resolve: (v: unknown) => string | undefined): TypeStyle[] {
  if (!isObj(raw)) return [];
  const out: TypeStyle[] = [];
  for (const [name, v] of Object.entries(raw)) {
    if (!isObj(v)) continue;
    const size = safeLength(resolve(v.fontSize));
    if (!size) continue;
    out.push({
      name,
      fontSize: size,
      fontFamily: typeof v.fontFamily === "string" ? safeFontStack(v.fontFamily) || undefined : undefined,
      fontWeight: safeWeight(v.fontWeight),
      lineHeight: safeLineHeight(v.lineHeight),
      letterSpacing: safeSpacing(v.letterSpacing),
    });
  }
  return out;
}

/** Prose: "- **h2 (hero)**: 64px / 700 weight / 55.36px line-height" bullets and "| Display | token | 60px → 170px | 300 | −9px |" rows. */
function mineTypography(text: string): TypeStyle[] {
  const out: TypeStyle[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (out.length >= 10) break;
    if (/^\|/.test(line)) {
      const cells = line.replace(/^\||\|$/g, "").split("|").map((c) => clean(c));
      const size = cells.slice(1).map((c) => c.match(/(\d+(?:\.\d+)?)\s*px/)?.[1]).find(Boolean);
      if (!size || /^[-: ]+$/.test(cells[0]) || cells.length < 3) continue;
      const weight = cells.map((c) => c.match(/^([1-9]00)\b/)?.[1]).find(Boolean);
      const ls = cells.map((c) => c.match(/^([+\-−–]?\d+(?:\.\d+)?)\s*px/)?.[1]).filter(Boolean).pop();
      out.push({ name: slugify(cells[0]), fontSize: `${size}px`, fontWeight: weight, letterSpacing: cells.length > 4 ? safeSpacing(ls) : undefined });
      continue;
    }
    const m = line.match(/^[-*]\s+(.*?)(\d+(?:\.\d+)?)\s*px/);
    if (!m) continue;
    const label = clean(m[1]).replace(/[:/–-]+\s*$/, "").trim() || `style-${out.length + 1}`;
    if (label.length > 40) continue;
    const weight = line.match(/\b([1-9]00)\b/)?.[1];
    const lh = line.match(/(\d+(?:\.\d+)?)\s*px\s*line-height|line-height[:\s]+(\d+(?:\.\d+)?(?:px)?)/i);
    out.push({ name: slugify(label), fontSize: `${m[2]}px`, fontWeight: weight, lineHeight: safeLineHeight(lh?.[1] ? `${lh[1]}px` : lh?.[2]) });
  }
  return out;
}

// ---- main ----

const SCALE_DEFAULT: TypeStyle[] = [
  { name: "display", fontSize: "48px", fontWeight: "700", lineHeight: "1.1", letterSpacing: "-0.02em" },
  { name: "heading", fontSize: "30px", fontWeight: "650", lineHeight: "1.2" },
  { name: "subheading", fontSize: "20px", fontWeight: "600", lineHeight: "1.35" },
  { name: "body", fontSize: "16px", fontWeight: "400", lineHeight: "1.6" },
  { name: "caption", fontSize: "13px", fontWeight: "400", lineHeight: "1.5" },
];
const RADIUS_NAMES = ["sm", "md", "lg", "xl", "2xl"];

function nameScale(values: number[]): NamedValue[] {
  const pill = values.filter((n) => n >= 100);
  const rest = values.filter((n) => n < 100).slice(0, RADIUS_NAMES.length);
  return [...rest.map((n, i) => ({ name: RADIUS_NAMES[i], value: `${n}px` })), ...(pill.length ? [{ name: "pill", value: `${pill[0]}px` }] : [])];
}

export function parseDesignSystem(source: string, meta: DesignMeta): DesignSystem {
  const warnings: string[] = [];
  const text = typeof source === "string" ? source : "";
  if (!text.trim()) warnings.push("The source file is empty.");
  const { fm, body } = splitFrontMatter(text);

  let fmObj: Obj = {};
  if (fm) {
    try {
      const parsed = load(fm);
      if (isObj(parsed)) fmObj = parsed;
      else warnings.push("Front matter is not a key/value map; values were read from the prose instead.");
    } catch {
      warnings.push("Front matter is not valid YAML; values were read from the prose instead.");
    }
  }
  const resolve = makeResolver(fmObj);
  const coverage: Coverage = { colors: 0, typography: 0, rounded: 0, spacing: 0, shadows: 0, components: 0, breakpoints: 0, principles: 0 };

  // Name & description
  const h1 = body.match(/^#\s+(.+)$/m)?.[1];
  const fmName = typeof fmObj.name === "string" ? fmObj.name.replace(/-?(Inspired-)?design-analysis$/i, "").replace(/-/g, " ").trim() : "";
  const name = (meta.name || fmName || clean(h1 ?? "").replace(/\s*[—–-]\s*Design System.*$/i, "") || meta.id.split("/").pop() || "Design").slice(0, 80);
  const fmDesc = typeof fmObj.description === "string" ? clean(fmObj.description) : "";
  const proseDesc = clean(section(body, /visual theme|overview|atmosphere/i).split(/\n\s*\n/).find((p) => p.trim() && !/^[-*|#>]/.test(p.trim())) ?? "");
  const rawDesc = meta.summary || fmDesc || proseDesc;
  const description = rawDesc ? src(rawDesc.slice(0, 600)) : fallback(`${name} design system.`);

  // Colours: front matter first, then the catalogue's palette, then hex codes found in the prose.
  const palette: Palette = new Map();
  if (isObj(fmObj.colors)) {
    for (const [k, v] of Object.entries(fmObj.colors)) {
      const hex = parseColor(resolve(v));
      if (hex) palette.set(k.toLowerCase(), hex);
    }
  }
  const fmColors = palette.size;
  const proseHex = new Map<string, number>();
  for (const m of body.matchAll(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b|rgba?\(\s*\d{1,3}\s*[, ]\s*\d{1,3}\s*[, ]\s*\d{1,3}\s*\)/g)) {
    const hex = parseColor(m[0]);
    if (hex) proseHex.set(hex, (proseHex.get(hex) ?? 0) + 1);
  }
  const metaHex = (meta.colors ?? []).map(parseColor).filter((c): c is string => !!c);
  const looseColors = [...new Set([...metaHex, ...[...proseHex.entries()].sort((a, b) => b[1] - a[1]).map(([h]) => h)])];
  if (!fmColors) for (const [i, hex] of looseColors.slice(0, 16).entries()) palette.set(`color-${i + 1}`, hex);
  coverage.colors = fmColors || looseColors.length;

  // Unnamed colours are tried in the order the catalogue lists them (the page's real colours come first); hex codes
  // that only appear in the prose, often inside "avoid pure #000" advice, rank last.
  const all = [...new Set([...palette.values(), ...looseColors])];
  let sourceTheme: ThemeName = meta.theme ?? "light";
  const trial = (t: ThemeName) => buildTheme(palette, t, { bg: all, fg: all, all });
  // Trust the declared theme, but check the palette can actually build it.
  let primaryTheme = trial(sourceTheme) ?? trial(sourceTheme === "dark" ? "light" : "dark");
  if (primaryTheme && isDark(primaryTheme.background.value) !== (sourceTheme === "dark")) sourceTheme = isDark(primaryTheme.background.value) ? "dark" : "light";
  if (!primaryTheme) {
    warnings.push("No usable colours were found in the source; a neutral default palette was used.");
    sourceTheme = "light";
    primaryTheme = {
      background: fallback("#ffffff"), surface: fallback("#f6f7f9"), foreground: fallback("#16181d"), muted: fallback("#5b6270"), border: fallback("#e1e4ea"),
      primary: fallback("#2563eb"), onPrimary: fallback("#ffffff"), secondary: fallback("#64748b"), accent: fallback("#2563eb"),
    };
  }
  const otherName: ThemeName = sourceTheme === "dark" ? "light" : "dark";
  // The source may name the opposite theme's colours (e.g. "canvas-dark", "on-dark"); use those where they exist.
  const counterpart = deriveTheme(primaryTheme, otherName, otherName === "dark" ? namedDark(palette) : {});
  const other = counterpart;
  const themes = { [sourceTheme]: primaryTheme, [otherName]: other } as Record<ThemeName, ThemeTokens>;
  if (!fmColors && !looseColors.length) coverage.colors = 0;

  const paletteList: PaletteColor[] = [...palette.entries()].map(([n, hex]) => ({ name: n, hex }));
  const paletteOut: Sourced<PaletteColor[]> = paletteList.length ? src(paletteList) : fallback(Object.values(themes.light).slice(0, 6).map((t, i) => ({ name: ["background", "surface", "foreground", "muted", "border", "primary"][i], hex: t.value })));

  // Typography
  let scale = parseTypography(fmObj.typography, resolve);
  coverage.typography = scale.length;
  if (!scale.length) {
    scale = mineTypography(section(body, /typograph/i));
    coverage.typography = scale.length;
  }
  const bySize = [...scale].sort((a, b) => sizePx(b.fontSize) - sizePx(a.fontSize));
  const famOf = (s?: TypeStyle) => s?.fontFamily;
  const fmFonts = (Array.isArray(fmObj.fonts) ? fmObj.fonts : isObj(fmObj.fonts) ? Object.values(fmObj.fonts) : []).filter((f): f is string => typeof f === "string");
  const proseFam = [...section(body, /typograph|font/i).matchAll(/font-family[:\s]+`?([^;`\n]+)/gi)].map((m) => m[1]).concat([...section(body, /typograph|font/i).matchAll(/\*\*(?:body|heading|display|mono)[^*]*\*\*[:\s]+`([^`]+)`/gi)].map((m) => m[1]));
  const families = [...new Set([...scale.map(famOf), ...fmFonts, ...(meta.fonts ?? []), ...proseFam].filter((f): f is string => !!f && !!safeFontStack(f)))];
  const isMono = (f: string) => /mono|code|courier|consolas|menlo/i.test(f);
  const bodyStyle = scale.find((s) => /^body/.test(s.name)) ?? scale.find((s) => sizePx(s.fontSize) >= 14 && sizePx(s.fontSize) <= 17);
  const displayFam = famOf(bySize[0]) ?? families.find((f) => !isMono(f));
  const bodyFam = famOf(bodyStyle) ?? families.find((f) => !isMono(f)) ?? displayFam;
  const monoFam = families.find(isMono) ?? scale.map(famOf).find((f) => f && isMono(f));
  const fonts = {
    display: displayFam ? src(withFallback(displayFam)) : fallback(SYSTEM_SANS),
    body: bodyFam ? src(withFallback(bodyFam)) : fallback(SYSTEM_SANS),
    mono: monoFam ? src(withFallback(monoFam, true)) : fallback(SYSTEM_MONO),
  };
  const typeScale: Sourced<TypeStyle[]> = scale.length ? src(bySize.length > 10 ? [...bySize.filter((_, i) => i % Math.ceil(bySize.length / 10) === 0)] : bySize) : fallback(SCALE_DEFAULT);

  // Radius
  let radius: NamedValue[] = [];
  if (isObj(fmObj.rounded)) radius = Object.entries(fmObj.rounded).flatMap(([n, v]) => { const l = safeLength(resolve(v)); return l ? [{ name: n, value: l }] : []; });
  if (!radius.length) {
    const nums = new Set<number>();
    for (const m of body.matchAll(/(?:border-)?radius[^.\n]{0,40}?(\d+(?:\.\d+)?)\s*px|(\d+(?:\.\d+)?)\s*px[`*\s]*(?:border-)?radius/gi)) nums.add(+(m[1] ?? m[2]));
    radius = nameScale([...nums].filter((n) => n > 0 && n <= 9999).sort((a, b) => a - b));
  }
  coverage.rounded = radius.length;

  // Spacing
  let spacing: NamedValue[] = [];
  if (isObj(fmObj.spacing)) spacing = Object.entries(fmObj.spacing).flatMap(([n, v]) => { const l = safeLength(resolve(v)); return l ? [{ name: n, value: l }] : []; });
  if (!spacing.length) {
    const nums = new Set<number>();
    for (const m of section(body, /layout|spacing/i).matchAll(/(?:spacing|padding|gap|margin)[^.\n]{0,50}?(\d{1,3})\s*px/gi)) nums.add(+m[1]);
    spacing = [...nums].filter((n) => n >= 2 && n <= 128).sort((a, b) => a - b).slice(0, 8).map((n, i) => ({ name: `s${i + 1}`, value: `${n}px` }));
  }
  coverage.spacing = spacing.length;

  // Shadows
  const shadowVals: string[] = [];
  const shadowRe = /(?:rgba?\([^)]*\)\s*)?-?\d+(?:\.\d+)?px\s+-?\d+(?:\.\d+)?px\s+\d+(?:\.\d+)?px(?:\s+-?\d+(?:\.\d+)?px)?(?:\s*(?:rgba?\([^)]*\)|#[0-9a-fA-F]{3,8}))?/g;
  for (const line of body.split("\n")) {
    if (!/shadow/i.test(line)) continue;
    for (const m of line.matchAll(shadowRe)) {
      const v = safeShadow(m[0]);
      if (v && !shadowVals.includes(v)) shadowVals.push(v);
    }
  }
  const shadows = shadowVals.slice(0, 3).map((value, i) => ({ name: ["sm", "md", "lg"][i], value }));
  coverage.shadows = shadows.length;

  // Components (front matter only; prose files get generated guidelines)
  const components: ComponentSpec[] = [];
  if (isObj(fmObj.components)) {
    for (const [cname, v] of Object.entries(fmObj.components)) {
      if (!isObj(v)) continue;
      const bg = parseColor(resolve(v.backgroundColor));
      const fg = parseColor(resolve(v.textColor));
      components.push({
        name: cname,
        backgroundColor: bg ?? undefined,
        textColor: fg ?? undefined,
        rounded: safeLength(resolve(v.rounded)) ?? undefined,
        padding: safeShorthand(resolve(v.padding)) ?? undefined,
        typography: typeof v.typography === "string" ? resolve(v.typography) : undefined,
      });
    }
  }
  coverage.components = components.length;

  // Breakpoints
  const bpText = section(body, /responsive|breakpoint/i);
  const bp = [...new Set([...bpText.matchAll(/(\d{3,4})\s*px/g)].map((m) => +m[1]).filter((n) => n >= 320 && n <= 1920))].sort((a, b) => a - b).slice(0, 7);
  coverage.breakpoints = bp.length;

  // Do / Don't
  const dos: string[] = [];
  const donts: string[] = [];
  let mode: "do" | "dont" = "do";
  for (const line of section(body, /do'?s|don'?ts|do and don/i).split("\n")) {
    const t = line.trim();
    const head = t.match(/^(?:#{3,6}\s*|\*\*)(do(?:n['’]?t)?s?|avoid|never)\b/i);
    if (head) mode = /^do$|^dos$/i.test(head[1]) ? "do" : "dont";
    const b = t.match(/^[-*]\s+(.+)$/);
    if (!b) continue;
    const item = clean(b[1]);
    if (!item || item.length > 220) continue;
    const neg = /^(don['’]?t|do not|avoid|never)\b/i.test(item);
    const list = neg || mode === "dont" ? donts : dos;
    if (list.length < 8) list.push(item);
  }
  coverage.principles = dos.length + donts.length;
  const principleDefaults = [
    "Use only the colour, type, spacing and radius tokens defined here; do not introduce new values.",
    "Keep text/background contrast at WCAG AA (4.5:1 for body text) in both themes.",
    "Prefer the source system's component shapes and spacing rhythm over generic UI defaults.",
  ];
  const principles = coverage.principles ? src([...dos.slice(0, 4), ...donts.slice(0, 2).map((d) => (/^(don|do not|avoid|never)/i.test(d) ? d : `Avoid: ${d}`))]) : fallback(principleDefaults);

  if (!fmColors && !looseColors.length) warnings.push("No colour values were found in the source.");
  if (!coverage.typography && !families.length) warnings.push("No typography information was found; a system font stack was used.");

  return {
    id: meta.id,
    slug: slugify(meta.id.split("/").pop() || name),
    name,
    description,
    version: hashSource(text),
    sourceFile: meta.file ?? "DESIGN.md",
    sourceTheme,
    themes,
    palette: paletteOut,
    fonts,
    typeScale,
    radius: radius.length ? src(radius) : fallback([{ name: "sm", value: "4px" }, { name: "md", value: "8px" }, { name: "lg", value: "12px" }, { name: "pill", value: "9999px" }]),
    spacing: spacing.length ? src(spacing) : fallback(["4px", "8px", "12px", "16px", "24px", "32px", "48px"].map((value, i) => ({ name: `s${i + 1}`, value }))),
    shadows: shadows.length
      ? src(shadows)
      : fallback([{ name: "sm", value: "0 1px 2px rgba(0, 0, 0, 0.08)" }, { name: "md", value: "0 4px 12px rgba(0, 0, 0, 0.12)" }, { name: "lg", value: "0 12px 32px rgba(0, 0, 0, 0.16)" }]),
    components,
    breakpoints: bp.length >= 2 ? src(bp.map((n) => `${n}px`)) : fallback(["640px", "768px", "1024px", "1280px"]),
    principles: { items: principles, dos, donts },
    coverage,
    warnings,
  };
}

/** Enough to produce a trustworthy package: at least two real colours. Files with only a palette still qualify;
 * their other token groups are generated as labelled defaults. */
export function assess(ds: DesignSystem): { ok: boolean; reason?: string } {
  return ds.coverage.colors < 2 ? { ok: false, reason: "fewer than 2 colours found in the source" } : { ok: true };
}
