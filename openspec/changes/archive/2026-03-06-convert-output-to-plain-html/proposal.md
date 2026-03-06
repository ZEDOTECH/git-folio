## Why

The current generator outputs an Astro project, which requires `npm install` + `npm run build` before the portfolio can be viewed. This adds unnecessary build tooling complexity to what should be a simple static output. Users want to generate a portfolio and open it directly in a browser—no additional build steps.

## What Changes

- **BREAKING**: Remove `src/template/` Astro project entirely (`.astro` files, `astro.config.mjs`, `tailwind.config.mjs`, `package.json` for template)
- Generator directly renders HTML files from portfolio data at generate-time (no Astro build step)
- Output `output/` becomes a plain static site: `index.html`, `projects.html`, `skills.html`, `projects/{name}.html` per repo
- CSS via Tailwind CDN `<script>` tag (no compilation step needed)
- Commit activity chart rendered client-side via embedded JSON + JS (instead of Astro build-time SVG)
- Preview no longer spawns `astro dev`; uses a simple static file server instead
- Remove `enable` field logic from HTML rendering (Visibility tab already filters repos before generate)

## Capabilities

### New Capabilities

- `plain-html-generator`: HTML rendering engine that generates `index.html`, `projects.html`, `skills.html`, and per-repo `projects/{name}.html` directly from portfolio data using TypeScript template literals

### Modified Capabilities

- `site-generator`: Output format changes from Astro project to plain HTML/CSS/JS static site
- `web-ui-preview`: Preview no longer manages an Astro dev server subprocess; serves `output/` as static files directly

## Impact

- `src/template/` — deleted entirely
- `src/generator/scaffold.ts` — simplified to only copy static assets (favicon)
- `src/generator/data-writer.ts` — no longer writes only `portfolio.json`; triggers HTML rendering
- `src/server/routes/` — preview route simplified (no subprocess management)
- `output/` structure changes completely (no longer an npm project)
- No user-facing API changes; Web UI flow remains the same
