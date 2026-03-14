import pLimit from 'p-limit';
import type { AppConfig, GenerateOptions } from '../config/types.js';
import type { RawGitHubData, RawRepoNode, ViewerProfile } from '../github/types.js';
import type { EnrichedData, EnrichedRepo, SkillArea, LanguageBreakdown } from './types.js';
import { createOpenAIClient } from './client.js';
import { buildProjectSummaryPrompt, buildSkillsAnalysisPrompt, buildBioPrompt } from './prompts.js';
import { logger } from '../utils/logger.js';

function parseJson(raw: string | null | undefined): Record<string, unknown> {
  const text = (raw ?? '').trim();
  if (!text) return {};

  // 1. Try direct parse
  try { return JSON.parse(text) as Record<string, unknown>; } catch { /* fall through */ }

  // 2. Strip outer markdown code fences (```json ... ```) and try again
  const unwrapped = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  try { return JSON.parse(unwrapped) as Record<string, unknown>; } catch { /* fall through */ }

  // 3. Bracket-count to find every top-level {...} block, then try each from last→first.
  //    This handles models that emit prose before/around the JSON, including stray {} in text.
  const blocks: string[] = [];
  let depth = 0;
  let start = -1;
  for (let i = 0; i < unwrapped.length; i++) {
    if (unwrapped[i] === '{') {
      if (depth === 0) start = i;
      depth++;
    } else if (unwrapped[i] === '}') {
      depth--;
      if (depth === 0 && start !== -1) {
        blocks.push(unwrapped.slice(start, i + 1));
        start = -1;
      }
    }
  }
  for (const block of blocks.reverse()) {
    try { return JSON.parse(block) as Record<string, unknown>; } catch { /* fall through */ }
  }

  return {};
}

export class AIEnricher {
  private openai: ReturnType<typeof createOpenAIClient>;
  private model: string;

  constructor(config: AppConfig) {
    this.openai = createOpenAIClient(config.openaiApiKey);
    this.model = config.openaiModel;
  }

  async enrich(
    data: RawGitHubData,
  ): Promise<EnrichedData> {
    const languageBreakdown = this.computeLanguageBreakdown(data.repos);

    logger.step('Analyzing skills across all repos...');
    const skills = await this.generateSkills(data.repos, languageBreakdown);
    const skillNames = skills.map(s => s.name);

    logger.step(`Generating AI summaries for ${data.repos.length} repos...`);
    const limit = pLimit(5);
    const skillNamesSet = new Set(skillNames);

    const enrichedRepos: EnrichedRepo[] = await Promise.all(
      data.repos.map(repo =>
        limit(async () => {
          try {
            const prompt = buildProjectSummaryPrompt(repo, skillNames);
            const response = await this.openai.chat.completions.create({
              model: this.model,
              messages: [{ role: 'user', content: prompt }],
              max_completion_tokens: 2000,
            });
            const parsed = parseJson(response.choices[0].message.content) as {
              summary?: string;
              techTags?: string[];
              skillCategories?: string[];
            };
            logger.progress(`Summarized: ${repo.name}`);
            return {
              ...repo,
              aiSummary: parsed.summary ?? repo.description,
              repoTechTags: (parsed.techTags ?? []).slice(0, 5),
              repoSkillCategories: (parsed.skillCategories ?? [])
                .filter(c => skillNamesSet.has(c))
                .slice(0, 3),
            };
          } catch (err) {
            const reason = err instanceof Error ? err.message : String(err);
            logger.warn(`Failed to summarize ${repo.name}: ${reason}`);
            return { ...repo, aiSummary: repo.description, repoTechTags: [], repoSkillCategories: [] };
          }
        }),
      ),
    );

    logger.step('Generating professional bio...');
    const bio = await this.generateBio(data, skills, languageBreakdown);

    return {
      viewer: data.viewer,
      repos: enrichedRepos,
      skills,
      bio,
      languageBreakdown,
      generatedAt: new Date().toISOString(),
    };
  }

  private async generateSkills(repos: RawRepoNode[], langBreakdown: LanguageBreakdown[]): Promise<SkillArea[]> {
    try {
      const prompt = buildSkillsAnalysisPrompt(repos, langBreakdown);
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        max_completion_tokens: 8000,
      });
      const raw = response.choices[0].message.content;
      const parsed = parseJson(raw) as { skills?: SkillArea[] };
      if (!parsed.skills?.length) {
        logger.warn(`Skills parse empty — finish_reason: ${response.choices[0].finish_reason}, raw: ${raw?.slice(0, 120)}`);
      }
      return parsed.skills ?? [];
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      logger.warn(`Skills analysis failed: ${reason}`);
      return [];
    }
  }

  private async generateBio(
    data: RawGitHubData,
    skills: SkillArea[],
    languageBreakdown: LanguageBreakdown[],
  ): Promise<string> {
    const fallback = () =>
      data.viewer.bio || AIEnricher.composeFallbackBio(data.viewer, languageBreakdown, skills, data.repos);
    try {
      const prompt = buildBioPrompt(data.viewer, data.repos, skills, languageBreakdown);
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        max_completion_tokens: 4000,
      });
      const raw = response.choices[0].message.content;
      const parsed = parseJson(raw) as { bio?: string };
      if (!parsed.bio) {
        logger.warn(`Bio parse empty — finish_reason: ${response.choices[0].finish_reason}, raw: ${raw?.slice(0, 120)}`);
      }
      return parsed.bio || fallback();
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      logger.warn(`Bio generation failed: ${reason}`);
      return fallback();
    }
  }

  static composeFallbackBio(
    viewer: ViewerProfile,
    languageBreakdown: LanguageBreakdown[],
    skills: SkillArea[],
    repos: RawRepoNode[],
  ): string {
    const companyPart = viewer.company ? ` at ${viewer.company}` : '';
    const locationPart = viewer.location ? `, based in ${viewer.location}` : '';
    const topLangs = languageBreakdown.slice(0, 3).map(l => l.name);
    const langStr = topLangs.length > 1
      ? `${topLangs.slice(0, -1).join(', ')} and ${topLangs[topLangs.length - 1]}`
      : (topLangs[0] ?? 'various languages');
    const topSkills = skills.slice(0, 2).map(s => s.name);
    const skillStr = topSkills.length > 0 ? ` with expertise in ${topSkills.join(' and ')}` : '';
    return `Software developer${companyPart}${locationPart}. Works primarily in ${langStr} across ${repos.length} repositories${skillStr}.`;
  }

  static skipAiEnrich(data: RawGitHubData, langBreakdown: LanguageBreakdown[]): EnrichedData {
    return {
      viewer: data.viewer,
      repos: data.repos.map(r => ({ ...r, aiSummary: r.description, repoTechTags: [], repoSkillCategories: [] })),
      skills: [],
      bio: data.viewer.bio || AIEnricher.composeFallbackBio(data.viewer, langBreakdown, [], data.repos),
      languageBreakdown: langBreakdown,
      generatedAt: new Date().toISOString(),
    };
  }

  computeLanguageBreakdown(repos: RawRepoNode[]): LanguageBreakdown[] {
    const langMap = new Map<string, { color: string; bytes: number }>();
    let total = 0;

    for (const repo of repos) {
      for (const edge of repo.languages.edges) {
        const name = edge.node.name;
        const existing = langMap.get(name) ?? { color: edge.node.color, bytes: 0 };
        existing.bytes += edge.size;
        langMap.set(name, existing);
        total += edge.size;
      }
    }

    return Array.from(langMap.entries())
      .map(([name, { color, bytes }]) => ({
        name,
        color,
        bytes,
        percentage: total > 0 ? (bytes / total) * 100 : 0,
      }))
      .sort((a, b) => b.bytes - a.bytes);
  }
}
