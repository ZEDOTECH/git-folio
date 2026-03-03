## Context

The portfolio generator currently produces an empty `profile.bio` in `portfolio.json` when:
1. The GitHub user has no bio set (`viewer.bio = null`), AND
2. The AI bio prompt lacks enough data to generate content reliably

The root cause of (2) is that `buildBioPrompt` only passes public repo **names** (no descriptions, topics, or languages), and filters out all private repos. For accounts where most work is private (e.g., 9/11 repos private), the prompt is nearly empty — giving the AI too little context to generate confidently.

Additionally, `computeLanguageBreakdown` already aggregates all repos (public + private) into a rich language breakdown, but this data is never passed to `buildBioPrompt`.

## Goals / Non-Goals

**Goals:**
- `profile.bio` is never an empty string after generation
- AI bio prompt uses language breakdown + full skill descriptions + anonymized private repo context when available
- skip-AI path produces a composed factual bio from available profile data
- Homepage featured repos reflect recency, not popularity
- ProjectCard visual consistency: badge and date match repo name color

**Non-Goals:**
- Exposing private repo names, descriptions, or URLs in the bio
- Changing the bio display UI (Hero component is fine as-is)
- Changing how skills are generated

## Decisions

### D1: Detect private repo inclusion from data, not from flags

**Decision**: Check `data.repos.some(r => r.isPrivate)` rather than threading `publicOnly` option through to the enricher.

**Rationale**: The repos array already reflects what was fetched. This avoids extending the `enrich()` opts interface and keeps the enricher self-contained.

**Alternative considered**: Pass `opts.publicOnly` into `enrich()` — rejected because the data already carries the answer.

---

### D2: Pass `languageBreakdown` into `generateBio` / `buildBioPrompt`

**Decision**: `generateBio(data, skills, languageBreakdown)` receives the pre-computed breakdown, which is already available in `enrich()` before `generateBio` is called.

**Rationale**: Language breakdown (TypeScript 45%, C# 30%…) is the richest signal about a developer's focus, especially when most repos are private. It's already computed — no extra cost.

---

### D3: Anonymized private repo context in the prompt

**Decision**: When private repos exist, add to the prompt:
- Count of private repositories
- Aggregated primary languages across private repos (no names or descriptions)
- Aggregated topics across private repos (deduplicated)
- Activity span: earliest `createdAt` to latest `pushedAt` across all repos

**Rationale**: This gives the AI meaningful signal (what technologies, what kind of work, how long active) without revealing confidential details. Topics like "dotnet", "api", "admin-panel" convey domain without exposing project names.

---

### D4: Guaranteed non-empty fallback bio

**Decision**: Both the AI path (on failure) and the skip-AI path use the same `composeFallbackBio()` helper that builds a factual sentence from: `viewer.name`, `viewer.company`, `viewer.location`, top 3 languages from breakdown, top 2 skill names, and total repo count.

**Rationale**: Centralizing fallback logic avoids duplication between `generate.ts` and `enricher.ts`. The output is always a non-empty string.

Example output:
> "Software developer at ZEDOTECH, based in Taiwan. Works primarily in TypeScript, C#, and HTML across 11 repositories, with expertise in Full-Stack .NET Backend and Front-end UI development."

---

### D5: Sort `featuredRepos` by `pushedAt` descending

**Decision**: Replace `b.stargazerCount - a.stargazerCount` with `new Date(b.pushedAt).getTime() - new Date(a.pushedAt).getTime()` in `data-writer.ts`.

**Rationale**: Stars favor old/popular repos that may be stale. `pushedAt` reflects current activity and is more meaningful for a working developer's homepage. Both fields are already in the repo data.

## Risks / Trade-offs

- **AI bio quality vs. data sensitivity**: Including private repo topics improves bio quality but surfaces aggregated metadata. Mitigation: topics only (no names/descriptions/URLs); user already opted in to private repo access by not passing `--public-only`.
- **Fallback bio is generic**: The composed fallback reads like a template. Mitigation: it only appears when AI fails or is skipped — it's a floor, not the goal.
- **`pushedAt` can reflect bot/dependency bumps**: A repo last pushed by a Dependabot PR would rank first. Mitigation: acceptable trade-off for now; future work could filter by human commits.

## Open Questions

- Should `composeFallbackBio` live in `enricher.ts` or a shared util? → Place in `enricher.ts` as a public static method, so both `generate.ts` (CLI) and `server/routes/generate.ts` can call it directly; easy to extract later.
