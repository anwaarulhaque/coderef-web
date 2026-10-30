// The generated DESIGN.md: front matter tokens + prose guidance for AI coding tools, with every value marked as
// coming from the source, derived from it, or a CodeRef default.
import { dump } from "js-yaml";
import { componentStyle } from "./css.ts";
import { slugify } from "./parse.ts";
import { ROLES, type ComponentSpec, type DesignSystem, type Provenance, type Role, type ThemeName } from "./types.ts";

const ROLE_LABEL: Record<Role, string> = {
  background: "Background", surface: "Surface", foreground: "Foreground", muted: "Muted text", border: "Border",
  primary: "Primary", onPrimary: "On primary", secondary: "Secondary", accent: "Accent",
};
const ROLE_USE: Record<Role, string> = {
  background: "page background", surface: "cards, panels, inputs", foreground: "body text and headings", muted: "secondary text, captions, placeholders",
  border: "dividers and component outlines", primary: "main actions, links, focus rings", onPrimary: "text/icons on primary", secondary: "secondary emphasis", accent: "highlights",
};
const cell = (s: string) => s.replace(/\|/g, "\\|").replace(/\n/g, " ");
const table = (head: string[], rows: string[][]) => [`| ${head.join(" | ")} |`, `| ${head.map(() => "---").join(" | ")} |`, ...rows.map((r) => `| ${r.map(cell).join(" | ")} |`)].join("\n");
const note = (p: Provenance) => (p === "source" ? "" : p === "derived" ? " _(derived from the source)_" : " _(CodeRef default; the source does not define this)_");

export function frontMatter(ds: DesignSystem) {
  const theme = (t: ThemeName) => Object.fromEntries(ROLES.map((r) => [r.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`), ds.themes[t][r].value]));
  return {
    version: "alpha",
    name: ds.name,
    description: ds.description.value,
    generator: "coderef-design-system",
    source: { id: ds.id, file: ds.sourceFile, version: ds.version, theme: ds.sourceTheme },
    provenance: {
      description: ds.description.from, typeScale: ds.typeScale.from, fonts: [ds.fonts.display.from, ds.fonts.body.from, ds.fonts.mono.from].join("/"),
      radius: ds.radius.from, spacing: ds.spacing.from, shadows: ds.shadows.from, breakpoints: ds.breakpoints.from,
      light: ROLES.map((r) => ds.themes.light[r].from[0]).join(""), dark: ROLES.map((r) => ds.themes.dark[r].from[0]).join(""),
    },
    themes: { light: theme("light"), dark: theme("dark") },
    typography: Object.fromEntries(
      ds.typeScale.value.map((s) => [
        slugify(s.name),
        { fontFamily: s.fontFamily ?? ds.fonts.body.value, fontSize: s.fontSize, ...(s.fontWeight && { fontWeight: s.fontWeight }), ...(s.lineHeight && { lineHeight: s.lineHeight }), ...(s.letterSpacing && { letterSpacing: s.letterSpacing }) },
      ]),
    ),
    rounded: Object.fromEntries(ds.radius.value.map((r) => [slugify(r.name), r.value])),
    spacing: Object.fromEntries(ds.spacing.value.map((s) => [slugify(s.name), s.value])),
    shadows: Object.fromEntries(ds.shadows.value.map((s) => [slugify(s.name), s.value])),
  };
}

function componentGuide(ds: DesignSystem): string {
  const b = componentStyle(ds, "button");
  const i = componentStyle(ds, "input");
  const c = componentStyle(ds, "card");
  const t = ds.themes.light;
  const line = (label: string, s: { radius: string; padding: string; fromSource: boolean }, extra: string) =>
    `- **${label}** — radius ${s.radius}, padding ${s.padding}. ${extra}${s.fromSource ? "" : " _(shape values are CodeRef defaults; the source defines no matching component)_"}`;
  const out = [
    line("Buttons", b, `Primary: \`--ds-primary\` background with \`--ds-on-primary\` text (${t.primary.value} on ${t.onPrimary.value} in light). Secondary: transparent with a \`--ds-border\` outline. Show a 2px \`--ds-primary\` focus ring and reduce opacity when disabled.`),
    line("Inputs", i, "Background `--ds-surface`, 1px `--ds-border`, placeholder `--ds-muted`; focus swaps to a `--ds-primary` outline."),
    line("Cards & panels", c, `Background \`--ds-surface\`, 1px \`--ds-border\`, shadow \`${ds.shadows.value[0]?.name ?? "none"}\`. Use the primary surface for one featured card at most.`),
  ];
  const named = ds.components.slice(0, 24);
  if (named.length) {
    out.push("", "### Components defined by the source", "", table(["Component", "Background", "Text", "Radius", "Padding"], named.map((s: ComponentSpec) => [`\`${s.name}\``, s.backgroundColor ?? "—", s.textColor ?? "—", s.rounded ?? "—", s.padding ?? "—"])));
    if (ds.components.length > named.length) out.push("", `…and ${ds.components.length - named.length} more in the source file.`);
  }
  return out.join("\n");
}

export function renderDesignMd(ds: DesignSystem): string {
  const fm = dump(frontMatter(ds), { lineWidth: 120, noRefs: true }).trimEnd();
  const c = ds.coverage;
  const themeTable = (t: ThemeName) => table(["Role", "Value", "Use", "Provenance"], ROLES.map((r) => [ROLE_LABEL[r], `\`${ds.themes[t][r].value}\``, ROLE_USE[r], ds.themes[t][r].from]));
  const sourceTheme = ds.sourceTheme;
  const fromSource = [...ds.principles.dos.slice(0, 5).map((d) => `- Do: ${d}`), ...ds.principles.donts.slice(0, 5).map((d) => `- Don't: ${d.replace(/^(don['’]?t|do not|avoid|never)\s*/i, "")}`)];

  const md = `---
${fm}
---

# ${ds.name} Design System

${ds.description.value}${note(ds.description.from)}

> Generated by CodeRef from \`${ds.id}\` (source version \`${ds.version}\`). Every value is tagged **source** (read from the original file), **derived** (computed from source values, e.g. the ${sourceTheme === "dark" ? "light" : "dark"} theme) or **default** (a CodeRef fallback because the source does not define it). Treat **source** values as authoritative.

## Design Principles${note(ds.principles.items.from)}

${ds.principles.items.value.map((p) => `- ${p}`).join("\n")}

## Color Palette

Semantic tokens are exposed as CSS custom properties (\`--ds-background\`, \`--ds-primary\`, …). The source palette is listed below the theme tables.

### Source palette${note(ds.palette.from)}

${table(["Name", "Value"], ds.palette.value.slice(0, 40).map((p) => [`\`${p.name}\``, `\`${p.hex}\``]))}

## Light Theme${sourceTheme === "light" ? " (source theme)" : " (derived)"}

${themeTable("light")}

## Dark Theme${sourceTheme === "dark" ? " (source theme)" : " (derived)"}

${themeTable("dark")}

## Typography${note(ds.typeScale.from)}

- **Display:** \`${ds.fonts.display.value}\`${note(ds.fonts.display.from)}
- **Body:** \`${ds.fonts.body.value}\`${note(ds.fonts.body.from)}
- **Mono:** \`${ds.fonts.mono.value}\`${note(ds.fonts.mono.from)}

${table(["Style", "Size", "Weight", "Line height", "Letter spacing"], ds.typeScale.value.map((s) => [`\`${s.name}\``, s.fontSize, s.fontWeight ?? "—", s.lineHeight ?? "—", s.letterSpacing ?? "—"]))}

Do not load additional typefaces. If a listed family is not installed, fall back to the rest of the stack.

## Spacing & Layout${note(ds.spacing.from)}

${table(["Token", "Value"], ds.spacing.value.map((s) => [`\`--ds-space-${slugify(s.name)}\``, s.value]))}

Space things only with these values. Keep one consistent rhythm inside a section; use the larger steps between sections.

## Borders, Radius & Shadows

**Radius**${note(ds.radius.from)}

${table(["Token", "Value"], ds.radius.value.map((r) => [`\`--ds-radius-${slugify(r.name)}\``, r.value]))}

**Shadows**${note(ds.shadows.from)}

${table(["Token", "Value"], ds.shadows.value.map((s) => [`\`--ds-shadow-${slugify(s.name)}\``, `\`${s.value}\``]))}

Borders are 1px \`--ds-border\` unless the source says otherwise. Do not add shadows to flat surfaces that have none.

## Components${ds.components.length ? "" : " (guidelines)"}

${componentGuide(ds)}

## Responsive Design${note(ds.breakpoints.from)}

Breakpoints: ${ds.breakpoints.value.map((b) => `\`${b}\``).join(", ")}. Design mobile-first: single column below the first breakpoint, add columns and spacing as the viewport grows. Touch targets are at least 44×44px. Never let content scroll horizontally.

## Instructions for AI Coding Tools

Follow this file for all UI work in this project.

1. **Use tokens, never raw values.** Reference \`--ds-*\` custom properties (see \`styles.css\` in the package) or the values in this file. Do not invent colours, fonts, radii or shadows.
2. **Support both themes.** Light is the default; dark applies under \`[data-theme="dark"]\` (and the OS preference when no theme is set). Verify every screen in both.
3. **Respect provenance.** Prefer **source** values. Where a value is **derived** or **default**, follow it but do not describe it as the original brand's.
4. **Keep contrast accessible.** Body text must meet 4.5:1 against its background; text on \`--ds-primary\` uses \`--ds-on-primary\`.
5. **Match components.** Reuse the button, input and card rules above before creating new variants.
6. **Be responsive.** Follow the breakpoints and touch-target rules above.
${fromSource.length ? `\n### From the source\n\n${fromSource.join("\n")}\n` : ""}
## Extraction Report

${table(["Group", "Found in source"], [["Colors", String(c.colors)], ["Typography styles", String(c.typography)], ["Radius values", String(c.rounded)], ["Spacing values", String(c.spacing)], ["Shadows", String(c.shadows)], ["Components", String(c.components)], ["Breakpoints", String(c.breakpoints)]])}
${ds.warnings.length ? `\n${ds.warnings.map((w) => `- ⚠ ${w}`).join("\n")}\n` : ""}`;
  return md.replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}

/** tokens.json: the same data as machine-readable JSON. */
export function renderTokensJson(ds: DesignSystem): string {
  const sourced = <T,>(s: { value: T; from: Provenance }) => ({ value: s.value, provenance: s.from });
  return (
    JSON.stringify(
      {
        $generator: "coderef-design-system",
        id: ds.id,
        name: ds.name,
        sourceVersion: ds.version,
        sourceTheme: ds.sourceTheme,
        themes: Object.fromEntries((["light", "dark"] as const).map((t) => [t, Object.fromEntries(ROLES.map((r) => [r, sourced(ds.themes[t][r])]))])),
        palette: sourced(ds.palette),
        fonts: { display: sourced(ds.fonts.display), body: sourced(ds.fonts.body), mono: sourced(ds.fonts.mono) },
        typography: sourced(ds.typeScale),
        radius: sourced(ds.radius),
        spacing: sourced(ds.spacing),
        shadows: sourced(ds.shadows),
        components: ds.components,
        breakpoints: sourced(ds.breakpoints),
        coverage: ds.coverage,
        warnings: ds.warnings,
      },
      null,
      2,
    ) + "\n"
  );
}
