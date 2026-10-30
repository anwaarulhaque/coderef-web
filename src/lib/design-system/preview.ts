// light.html / dark.html: a standalone design-system showcase built from the generated tokens. No scripts, no
// external requests; every value from the source is escaped or was validated when parsed.
import { componentsCss, esc, previewCss, tokensCss } from "./css.ts";
import { slugify } from "./parse.ts";
import { ROLES, type DesignSystem, type Role, type ThemeName } from "./types.ts";

const ROLE_LABEL: Record<Role, string> = {
  background: "Background", surface: "Surface", foreground: "Foreground", muted: "Muted text", border: "Border",
  primary: "Primary", onPrimary: "On primary", secondary: "Secondary", accent: "Accent",
};
const tag = (from: string) => (from === "source" ? "" : `<span class="ds-tag">${from}</span>`);

export function renderPreviewHtml(ds: DesignSystem, theme: ThemeName): string {
  const t = ds.themes[theme];
  const label = theme === "dark" ? "Dark" : "Light";
  const roles = ROLES.map(
    (r) => `<div class="ds-sw"><i style="background:${t[r].value}"></i><div><b>${ROLE_LABEL[r]}${tag(t[r].from)}</b><code>${t[r].value}</code></div></div>`,
  ).join("");
  const palette = ds.palette.value
    .slice(0, 24)
    .map((c) => `<div class="ds-sw"><i style="background:${c.hex}"></i><div><b>${esc(c.name)}</b><code>${c.hex}</code></div></div>`)
    .join("");

  const sample = "The quick brown fox jumps over the lazy dog";
  const types = ds.typeScale.value
    .slice(0, 10)
    .map((s) => {
      const meta = [s.fontSize, s.fontWeight && `w${s.fontWeight}`, s.lineHeight && `lh ${s.lineHeight}`].filter(Boolean).join(" · ");
      const family = s.fontFamily ? `font-family:${s.fontFamily.includes(",") ? s.fontFamily : `"${s.fontFamily}"`},var(--ds-font-body);` : "";
      const style = `${family}font-size:min(${s.fontSize},11vw);${s.fontWeight ? `font-weight:${s.fontWeight};` : ""}${s.lineHeight ? `line-height:${s.lineHeight};` : ""}${s.letterSpacing ? `letter-spacing:${s.letterSpacing};` : ""}`;
      return `<div class="ds-type"><small>${esc(s.name)}<br>${esc(meta)}</small><span style="${style}">${sample}</span></div>`;
    })
    .join("");

  const radii = ds.radius.value
    .slice(0, 8)
    .map((r) => `<div><div class="ds-box" style="border-radius:${r.value}">${esc(r.name)}</div><p class="ds-cap">${esc(r.name)} · ${r.value}</p></div>`)
    .join("");
  const shadows = ds.shadows.value
    .map((s) => `<div class="ds-card" style="box-shadow:var(--ds-shadow-${slugify(s.name)})"><b>shadow-${esc(s.name)}</b><p class="ds-cap">${esc(s.value)}</p></div>`)
    .join("");
  const maxSpace = Math.max(...ds.spacing.value.map((s) => parseFloat(s.value) || 0), 1);
  const spaces = ds.spacing.value
    .slice(0, 10)
    .map((s) => `<div class="ds-space"><span style="min-width:64px">${esc(s.name)}</span><i style="width:${Math.max(2, Math.round(((parseFloat(s.value) || 0) / maxSpace) * 100))}%"></i><span>${s.value}</span></div>`)
    .join("");

  const comps = ds.components
    .filter((c) => c.backgroundColor || c.textColor)
    .slice(0, 12)
    .map(
      (c) =>
        `<div><div class="ds-comp" style="background:${c.backgroundColor ?? "transparent"};color:${c.textColor ?? "inherit"};${c.rounded ? `border-radius:${c.rounded};` : ""}${c.padding ? `padding:${c.padding};` : ""}">${esc(c.name)}</div></div>`,
    )
    .join("");

  const css = `${tokensCss(ds)}${componentsCss(ds)}${previewCss()}`;
  return `<!doctype html>
<html lang="en" data-theme="${theme}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="${theme}">
<meta name="generator" content="CodeRef design-system generator">
<title>${esc(ds.name)} — ${label} theme design system</title>
<style>${css}</style>
</head>
<body>
<div class="ds-page">
<header class="ds-nav"><span class="ds-brand">${esc(ds.name)}</span><span class="ds-badge">${label} theme</span></header>

<section class="ds-hero">
<p class="ds-eyebrow">Design system</p>
<h1>${esc(ds.name)}</h1>
<p>${esc(ds.description.value)}</p>
<div class="ds-row"><a class="ds-btn" href="#colors">Primary action</a><a class="ds-btn ds-btn--secondary" href="#type">Secondary</a><a href="#components">Text link</a></div>
</section>

<section class="ds-section" id="colors"><h2>Color · ${label.toLowerCase()} theme</h2>
<div class="ds-grid">${roles}</div>
${palette ? `<h2 style="margin-top:32px">Source palette</h2><div class="ds-grid">${palette}</div>` : ""}
</section>

<section class="ds-section" id="type"><h2>Typography</h2>
<div class="ds-fonts">
<div class="ds-card"><b style="font-family:var(--ds-font-display)">Aa Display</b><small>${esc(ds.fonts.display.value)}</small></div>
<div class="ds-card"><b style="font-family:var(--ds-font-body)">Aa Body</b><small>${esc(ds.fonts.body.value)}</small></div>
<div class="ds-card"><b style="font-family:var(--ds-font-mono)">Aa Mono</b><small>${esc(ds.fonts.mono.value)}</small></div>
</div>
${types}
</section>

<section class="ds-section" id="components"><h2>Buttons &amp; links</h2>
<div class="ds-row"><button class="ds-btn" type="button">Primary</button><button class="ds-btn ds-btn--secondary" type="button">Secondary</button><button class="ds-btn ds-btn--ghost" type="button">Ghost</button><button class="ds-btn" type="button" disabled>Disabled</button><a href="#colors">Inline link</a></div>
</section>

<section class="ds-section"><h2>Form inputs</h2>
<div class="ds-form" role="group" aria-label="Sample form">
<label>Email<input class="ds-input" type="email" placeholder="you@example.com"></label>
<label>Message<textarea class="ds-input" rows="3" placeholder="Write something…"></textarea></label>
<label>Plan<select class="ds-input"><option>Starter</option><option>Team</option><option>Enterprise</option></select></label>
<label class="ds-check"><input type="checkbox" checked> Remember me</label>
</div>
</section>

<section class="ds-section"><h2>Cards &amp; panels</h2>
<div class="ds-grid ds-grid--wide">
<div class="ds-card"><b>Card title</b><p style="color:var(--ds-muted);margin:8px 0 16px">Surface, border and radius come from the ${esc(ds.name)} tokens.</p><a class="ds-btn ds-btn--secondary" href="#colors">Learn more</a></div>
<div class="ds-card" style="background:var(--ds-primary);color:var(--ds-on-primary);border-color:transparent"><b>Featured</b><p style="margin:8px 0 0;opacity:.85">Primary surface with on-primary text.</p></div>
<div class="ds-card"><b>Stat</b><p style="font:700 34px/1 var(--ds-font-display);margin:10px 0 0;color:var(--ds-primary)">98.6%</p></div>
</div>
</section>

<section class="ds-section"><h2>Borders, radius, shadow &amp; spacing</h2>
<div class="ds-grid">${radii}</div>
<div class="ds-grid ds-grid--wide" style="margin-top:24px">${shadows}</div>
<div style="margin-top:24px">${spaces}</div>
</section>
${comps ? `<section class="ds-section"><h2>Components from the source</h2><div class="ds-grid">${comps}</div></section>` : ""}

<footer class="ds-foot">Generated by CodeRef from <code>${esc(ds.id)}</code> · source version ${ds.version}. Tokens marked derived or default are not defined by the source file.</footer>
</div>
</body>
</html>
`;
}
