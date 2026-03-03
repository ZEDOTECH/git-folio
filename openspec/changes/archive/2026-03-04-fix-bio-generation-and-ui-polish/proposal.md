## Why

The portfolio site has three UX issues: the AI-generated bio is always empty for accounts with few or no public repos (the prompt is data-poor and lacks private repo context), the homepage "Featured Projects" sorts by stars instead of recency, and repo card metadata (private badge, date) uses a muted color that conflicts with the repo name's brighter tone.

## What Changes

- **Bio generation prompt enriched**: pass language breakdown, full skill descriptions, and anonymized private repo data (languages, topics, count, activity span) when private repos were included in the fetch
- **Skip-AI fallback bio**: compose a factual bio from viewer profile + language breakdown + skills instead of returning empty string
- **AI bio fallback**: if AI generation fails or returns empty, also use the composed fallback (non-empty guaranteed)
- **Featured Projects → Recently Updated**: sort by `pushedAt` descending instead of `stargazerCount`; update section title and subtitle in the homepage template
- **ProjectCard color consistency**: private badge and date range use `text-stone-100` to match the repo name color

## Capabilities

### New Capabilities

- `bio-generation`: Rules for how the developer bio is generated — AI path (enriched prompt with private repo context) and skip-AI path (composed fallback); guarantees bio is never empty

### Modified Capabilities

- `site-generator`: Homepage featured repos selection changes from stars-sorted to recency-sorted
- `ai-enricher`: Bio generation prompt inputs and fallback behavior change

## Impact

- `src/ai/prompts.ts` — `buildBioPrompt` signature and content
- `src/ai/enricher.ts` — `generateBio` method (pass languageBreakdown, add fallback)
- `src/cli/commands/generate.ts` — skip-AI path bio composition
- `src/generator/data-writer.ts` — `featuredRepos` sort key
- `src/template/src/pages/index.astro` — section title/subtitle
- `src/template/src/components/ProjectCard.astro` — badge and date colors
