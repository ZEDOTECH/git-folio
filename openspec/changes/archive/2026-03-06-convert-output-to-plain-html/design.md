## Context

Currently the generator scaffolds an Astro project into `output/`, writes `portfolio.json` as Astro's data source, and then runs `npm install`. Users who want to preview must also run `astro dev` (via the Web UI which spawns a subprocess). This makes the output dependent on Node.js tooling and a non-trivial build step.

The goal is to make `output/` a plain static site—open `index.html` in a browser and it works, no build step.

## Goals / Non-Goals

**Goals:**
- Generator directly renders all HTML files at generate-time
- Output `output/` is a self-contained static site with no npm dependencies
- Visual output is identical to the current Astro site
- Preview tab works without spawning an external process

**Non-Goals:**
- Supporting multiple themes or templating engines
- Removing `portfolio.json` entirely (it stays as a data artifact read by `/api/repos`)
- Offline-capable CSS (Tailwind CDN requires network; acceptable trade-off)

## Decisions

### 1. HTML rendering via TypeScript template literals

**Decision**: Add `src/generator/html/` modules that export functions returning HTML strings. The generator calls these functions with portfolio data and writes the results to files.

**Rationale**: No new dependency needed. TypeScript template literals are sufficient for the complexity of these pages. Alternatives like EJS/Handlebars add deps and an extra layer; JSX requires a transform.

**Structure**:
```
src/generator/html/
  escape.ts       — HTML entity escaping utility (XSS prevention)
  layout.ts       — renderLayout(content, opts) → full HTML page with header/footer
  index.ts        — renderIndex(portfolio) → string
  projects.ts     — renderProjects(portfolio) → string
  skills.ts       — renderSkills(portfolio) → string
  repo.ts         — renderRepo(repo, portfolio) → string
```

`data-writer.ts` is renamed/repurposed to `render.ts` which: (1) writes `portfolio.json`, (2) calls each renderer, (3) writes output HTML files.

### 2. CSS via Tailwind CDN

**Decision**: Every HTML page includes `<script src="https://cdn.tailwindcss.com"></script>` in `<head>`. Custom component classes (`.card`, `.mono`, `.tag`, `.btn-ghost`, `.section-title`, `.section-subtitle`) are defined in an inline `<style>` block inside the shared layout.

**Rationale**: All existing Tailwind utility classes work unchanged. No Tailwind CLI or PostCSS needed. CDN adds ~300KB but this is a developer portfolio tool, not a production app.

**Alternative considered**: Pre-compile Tailwind via `@tailwind/standalone` binary during generate — rejected because it adds a binary dependency and complicates the generator.

### 3. Commit activity chart rendered client-side

**Decision**: Each `projects/{name}.html` embeds the raw commit data as a JSON object in a `<script>` tag. A self-contained `<script>` block at the bottom of the page reads the data and renders an SVG chart.

**Rationale**: Keeps the TypeScript generator simple (no complex coordinate math in template strings). The chart logic from `[repo].astro` (fillWeekGaps, fillDayGaps, showLabel, SVG rendering) moves to inline JS. This is a small amount of client JS with no dependencies.

### 4. Preview: Node.js built-in static file server

**Decision**: Replace `src/server/astro-preview.ts` with `src/server/static-preview.ts`. On `POST /api/preview/start`, spawn a child process that runs a minimal Node.js static file server (written inline, using `node:http` + `node:fs`) on port 4321 serving `output/`.

**Rationale**: No new npm dependency. Node's built-in `http` module can serve files. The child process approach keeps the same start/stop API shape, so the frontend (`app.js`) needs minimal changes.

**Alternative considered**: Mount a `/preview/*` route on the existing Hono server (port 3000) — rejected because the frontend already links to `http://localhost:4321` and changing the preview port requires frontend changes.

### 5. `portfolio.json` is retained

**Decision**: Generator still writes `output/src/data/portfolio.json`. The `enable` field is no longer used in HTML rendering (all repos in the data are included), but the JSON is still read by `/api/repos` GET for the Visibility tab's post-generate state.

**Rationale**: Removing it would break the `/api/repos` route. Keeping it costs nothing and preserves API compatibility.

### 6. HTML escaping

**Decision**: All user-supplied strings (repo names, descriptions, bio, etc.) are passed through an `escape()` helper before insertion into HTML. URLs are validated to start with `https://` or `http://` before being rendered as `href`.

**Rationale**: Content comes from GitHub API and AI enrichment—generally safe, but defense-in-depth is appropriate.

## Risks / Trade-offs

- **Tailwind CDN requires network** → Portfolios won't render correctly offline. Mitigation: acceptable for a dev tool; document it.
- **Template literal HTML is verbose** → Large template strings in `.ts` files are harder to read than `.astro` files. Mitigation: split into small focused functions per section.
- **Static server on port 4321 may conflict** → If user has another service on that port. Mitigation: same risk existed before (Astro also used 4321).
- **`portfolio.json` `enable` field becomes vestigial** → Slightly confusing. Mitigation: remove it from the JSON schema in the renderer; keep it in the file for backwards compat with the API route.

## Migration Plan

1. Add `src/generator/html/` modules (escape, layout, renderers)
2. Update `src/generator/data-writer.ts` to call HTML renderers and write files to `output/`
3. Simplify `src/generator/scaffold.ts` to only copy `src/template/assets/favicon.svg`
4. Update `src/generator/index.ts` — remove `npm install` execSync call, update log message
5. Replace `src/server/astro-preview.ts` with `src/server/static-preview.ts`
6. Delete `src/template/` (all Astro files)
7. Update `output/README.md` content in the generator
8. Test full generate → preview flow

No rollback complexity — `output/` is always fully regenerated; old Astro output is simply overwritten.

## Open Questions

- None. All decisions confirmed during explore session.
