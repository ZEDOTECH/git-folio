import fs from 'fs/promises';
import path from 'path';
import type { EnrichedData, EnrichedRepo } from '../ai/types.js';
import type { GenerateOptions } from '../config/types.js';
import { renderHtmlFiles } from './html/render.js';

/** Compute per-repo language breakdown sorted by usage percentage */
function repoLanguages(r: EnrichedRepo) {
  const total = r.languages.edges.reduce((sum, e) => sum + e.size, 0);
  if (total === 0) return [];
  return r.languages.edges
    .map(e => ({
      name: e.node.name,
      color: e.node.color ?? '#8b8b8b',
      percentage: Math.round((e.size / total) * 100),
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 6);
}


export async function writePortfolioData(
  data: EnrichedData,
  outputDir: string,
  opts: Pick<GenerateOptions, 'author' | 'theme'>,
): Promise<void> {
  const dataDir = path.join(outputDir, 'src', 'data');
  await fs.mkdir(dataDir, { recursive: true });

  const portfolioPath = path.join(dataDir, 'portfolio.json');

  const repoEntry = (r: EnrichedRepo) => ({
    name: r.name,
    description: r.aiSummary ?? r.description,
    url: r.url,
    isPrivate: r.isPrivate,
    stars: r.stargazerCount,
    forks: r.forkCount,
    primaryLanguage: r.primaryLanguage,
    languages: repoLanguages(r),
    techTags: r.repoTechTags,
    skillCategories: r.repoSkillCategories,
    topics: r.topics,
    createdAt: r.createdAt,
    pushedAt: r.pushedAt,
    updatedAt: r.updatedAt,
    homepageUrl: r.homepageUrl,
    license: r.licenseInfo?.name ?? null,
    diskUsage: r.diskUsage,
    commitsByMonth: r.commitsByMonth,
    commitsByWeek: r.commitsByWeek,
    commitsByDay: r.commitsByDay,
    contributors: r.contributors,
  });

  // Featured: top 6 repos (public + private), sorted by most recently pushed
  const featuredRepos = data.repos
    .sort((a, b) => new Date(b.pushedAt).getTime() - new Date(a.pushedAt).getTime())
    .slice(0, 6)
    .map(repoEntry);

  const siteName = opts.author
    ? `${opts.author}'s Portfolio`
    : `${data.viewer.name ?? data.viewer.login}'s Portfolio`;

  const portfolioData = {
    profile: {
      login: data.viewer.login,
      name: data.viewer.name ?? data.viewer.login,
      bio: data.bio || data.viewer.bio || '',
      avatarUrl: data.viewer.avatarUrl,
      websiteUrl: data.viewer.websiteUrl,
      company: data.viewer.company,
      location: data.viewer.location,
      githubUrl: `https://github.com/${data.viewer.login}`,
    },
    repos: data.repos.map(repoEntry),
    featuredRepos,
    skills: data.skills,
    languageBreakdown: data.languageBreakdown.slice(0, 12),
    generatedAt: data.generatedAt,
    meta: {
      siteTitle: siteName,
      theme: opts.theme || 'default',
    },
  };

  await fs.writeFile(
    portfolioPath,
    JSON.stringify(portfolioData, null, 2),
    'utf-8',
  );

  await renderHtmlFiles(portfolioData, outputDir);
}
