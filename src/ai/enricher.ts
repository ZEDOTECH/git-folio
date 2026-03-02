import pLimit from 'p-limit';
import type { AppConfig, GenerateOptions } from '../config/types.js';
import type { RawGitHubData, RawRepoNode } from '../github/types.js';
import type { EnrichedData, EnrichedRepo, SkillArea, LanguageBreakdown } from './types.js';
import { createOpenAIClient } from './client.js';
import { buildProjectSummaryPrompt, buildSkillsAnalysisPrompt, buildBioPrompt } from './prompts.js';
import { logger } from '../utils/logger.js';

export class AIEnricher {
  private openai: ReturnType<typeof createOpenAIClient>;
  private model: string;

  constructor(config: AppConfig) {
    this.openai = createOpenAIClient(config.openaiApiKey);
    this.model = config.openaiModel;
  }

  async enrich(
    data: RawGitHubData,
    opts: Pick<GenerateOptions, 'skipPrivateDescriptions'>,
  ): Promise<EnrichedData> {
    const languageBreakdown = this.computeLanguageBreakdown(data.repos);

    // Determine which repos get AI summaries
    const skipDescriptionFor = new Set(
      opts.skipPrivateDescriptions
        ? data.repos.filter(r => r.isPrivate).map(r => r.name)
        : [],
    );

    logger.step(`Generating AI summaries for ${data.repos.length} repos...`);
    const limit = pLimit(5);

    const enrichedRepos: EnrichedRepo[] = await Promise.all(
      data.repos.map(repo =>
        limit(async () => {
          if (skipDescriptionFor.has(repo.name)) {
            return { ...repo, aiSummary: repo.description };
          }
          try {
            const prompt = buildProjectSummaryPrompt(repo);
            const response = await this.openai.chat.completions.create({
              model: this.model,
              messages: [{ role: 'user', content: prompt }],
              temperature: 0.3,
              max_tokens: 100,
              response_format: { type: 'json_object' },
            });
            const parsed = JSON.parse(response.choices[0].message.content ?? '{}') as { summary?: string };
            logger.progress(`Summarized: ${repo.name}`);
            return { ...repo, aiSummary: parsed.summary ?? repo.description };
          } catch (err) {
            logger.warn(`Failed to summarize ${repo.name}, using GitHub description`);
            return { ...repo, aiSummary: repo.description };
          }
        }),
      ),
    );

    logger.step('Analyzing skills across all repos...');
    const skills = await this.generateSkills(data.repos, languageBreakdown);

    logger.step('Generating professional bio...');
    const bio = await this.generateBio(data, skills);

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
        temperature: 0.4,
        max_tokens: 800,
        response_format: { type: 'json_object' },
      });
      const parsed = JSON.parse(response.choices[0].message.content ?? '{}') as { skills?: SkillArea[] };
      return parsed.skills ?? [];
    } catch (err) {
      logger.warn('Skills analysis failed, skipping');
      return [];
    }
  }

  private async generateBio(data: RawGitHubData, skills: SkillArea[]): Promise<string> {
    try {
      const prompt = buildBioPrompt(data.viewer, data.repos, skills);
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        max_tokens: 200,
        response_format: { type: 'json_object' },
      });
      const parsed = JSON.parse(response.choices[0].message.content ?? '{}') as { bio?: string };
      return parsed.bio ?? data.viewer.bio ?? '';
    } catch (err) {
      logger.warn('Bio generation failed, using GitHub bio');
      return data.viewer.bio ?? '';
    }
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
