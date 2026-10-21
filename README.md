# CodeRef

Static cheat-sheet site in the spirit of [OverAPI](https://overapi.com/), built with Next.js 16 (App Router, static export) and Tailwind CSS 4.

## Scripts

```bash
npm run dev     # http://localhost:3000
npm run build   # static site written to ./out — host it anywhere
```

## Adding a cheat sheet

Drop a JSON file in `data/sheets/`. The file name must match its `slug`; it becomes the page `/<slug>/` on the next build. No code changes needed.

```json
{
  "slug": "git",
  "title": "Git",
  "category": "Tools",
  "color": "#f05032",
  "description": "Everyday Git commands.",
  "reference": "https://git-scm.com/docs",
  "sections": [
    {
      "title": "Snapshot",
      "groups": [
        {
          "title": "Optional group heading",
          "items": [{ "name": "commit", "url": "https://git-scm.com/docs/git-commit" }]
        }
      ]
    }
  ]
}
```

Add `"kind": "links"` for a resource page (official docs, external cheat sheets) instead of a full cheat sheet — it renders as a link list and shows up only in the A–Z directory on the home page. Item URLs starting with `/` link to other pages on this site.

Add `"kind": "visual"` for a visual cheat sheet (see `css-grid.json`, `flexbox.json`): each group is a CSS property with a `demo` (container/child CSS), and each item's `name` is a CSS snippet rendered as a live preview that copies on click. Visual sheets also get their own entry in the header menu.

## Deploying & SEO

Set the site's public address before building — it's used for canonical URLs, `sitemap.xml`, `robots.txt` and social share cards (see `.env.example`):

```bash
NEXT_PUBLIC_SITE_URL=https://your-domain.com npm run build
```

The build emits `out/sitemap.xml` (every page) and `out/robots.txt`. In [Google Search Console](https://search.google.com/search-console), add your domain, verify it (DNS, or set `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` to the HTML-tag code), then submit `https://your-domain.com/sitemap.xml`. Every page also has a canonical URL, Open Graph/Twitter tags (`public/og.png`), and JSON-LD (website + breadcrumbs).

Global search (Ctrl/⌘ K) reads `out/search-index.json`, built from all the data at build time.

## Interactive tools

All run entirely in the browser; there is no server.

| Route | What it is | Built on |
| --- | --- | --- |
| `/quick-reference/` | Task-based snippets for 24 languages/tools (incl. VS Code shortcuts), searchable across all | `data/quickref/*.json` |
| `/markdown/` | Markdown editor (live preview, toolbar, export) + cheat sheet | `markdown-it` + plugins, `dompurify` |
| `/regex-tester/` | Regex tester with highlighting, explanation, substitution, code generation | Own parser; matching runs in a Web Worker |
| `/git-branching/` | Animated Git playground with levels, remotes and a sandbox | Own engine in `src/lib/git/` |
| `/abbreviations/` | HTML & CSS abbreviation playground and index | `emmet` |
| `/css-grid/`, `/flexbox/` | Visual CSS cheat sheets | `data/sheets/*.json` with `"kind": "visual"` |
| `/browser-support/` | Browser support tables, Baseline status, compare | `web-features`, `@mdn/browser-compat-data` |

### Quick Reference data

Each `data/quickref/<slug>.json` is one topic: `sections[].rows` are `[task, code]` pairs, where `code` can be an array of alternatives. Set `"keys": true` with `"columns": ["Action", "Windows / Linux", "macOS"]` for keyboard-shortcut sheets (see `vscode.json`); `"try"` adds a button linking to a related tool.

## Logo

`public/` holds the logo set: `logo.svg`/`.png` (and `-dark` variants for dark backgrounds), the square `icon.svg` / `icon-192.png` / `icon-512.png`, `apple-touch-icon.png`, and `favicon.ico` + `favicon.svg`. Text is outlined from Geist Mono SemiBold: "code" in ink (`#16181d`), "ref" in blue (`#2563eb`).

## Browser Support

`/browser-support/` is generated at build time from two npm datasets: [`web-features`](https://github.com/web-platform-dx/web-features) (feature list, Baseline status, first supported versions) and [`@mdn/browser-compat-data`](https://github.com/mdn/browser-compat-data) (MDN links). To refresh the data, update both packages and rebuild. Hand-written "How to use" examples live in `data/compat-examples.json`, keyed by web-features ID; feature-detection snippets are generated in `src/lib/compat-detect.ts`.

The shape is defined in `src/lib/types.ts`; `src/lib/sheets.ts` reads the files at build time.
