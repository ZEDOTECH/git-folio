import type { RawRepoNode, ViewerProfile } from '../github/types.js';
import type { SkillArea, LanguageBreakdown } from './types.js';

export function buildProjectSummaryPrompt(repo: RawRepoNode): string {
  const readmeExcerpt = repo.readmeText
    ? repo.readmeText.slice(0, 1500)
    : 'No README available.';

  const recentWork = repo.recentCommits
    .slice(0, 5)
    .map(c => `- ${c.messageHeadline}`)
    .join('\n') || 'None available';

  return `You are a technical writer helping a developer showcase their work.

Analyze this GitHub repository and write a single compelling sentence (max 25 words) that describes what this project does and why it matters. Focus on the user value or technical achievement, not the tech stack.

Repository: ${repo.name}
GitHub description: ${repo.description ?? 'None'}
Primary language: ${repo.primaryLanguage?.name ?? 'Unknown'}
Topics/tags: ${repo.topics.join(', ') || 'None'}
Stars: ${repo.stargazerCount}

README excerpt:
${readmeExcerpt}

Recent commit messages:
${recentWork}

Respond with ONLY a JSON object:
{"summary": "your one-sentence summary here"}`;
}

export function buildSkillsAnalysisPrompt(
  repos: RawRepoNode[],
  languageBreakdown: LanguageBreakdown[],
): string {
  const repoList = repos
    .slice(0, 30)
    .map(r => `- ${r.name} (${r.primaryLanguage?.name ?? 'unknown'}): ${r.description ?? r.topics.slice(0, 3).join(', ') ?? 'no description'}`)
    .join('\n');

  const langList = languageBreakdown
    .slice(0, 10)
    .map(l => `${l.name}: ${l.percentage.toFixed(1)}%`)
    .join(', ');

  return `You are analyzing a developer's GitHub portfolio to identify their top skills and areas of expertise.

Based on their repository history, identify their top 6-8 skill areas. Each skill should be a specific, concrete expertise area (not just a language name). Think: "Full-Stack Web Development", "API Design & Integration", "Data Pipeline Engineering", "DevOps & Infrastructure".

Language breakdown: ${langList}

Repository sample:
${repoList}

Respond with ONLY a JSON object:
{
  "skills": [
    {
      "name": "skill area name",
      "description": "one sentence describing depth of expertise",
      "level": "expert|advanced|proficient",
      "relatedTech": ["tech1", "tech2", "tech3"]
    }
  ]
}`;
}

export function buildBioPrompt(
  viewer: ViewerProfile,
  repos: RawRepoNode[],
  skills: SkillArea[],
): string {
  const topRepos = repos
    .filter(r => !r.isPrivate)
    .sort((a, b) => b.stargazerCount - a.stargazerCount)
    .slice(0, 5)
    .map(r => r.name)
    .join(', ');

  const skillNames = skills.map(s => s.name).join(', ');

  return `You are writing a professional bio for a developer's portfolio website.

Write a 2-3 sentence professional bio in the first person. It should be honest, specific, and highlight what makes this developer interesting. Avoid clichés like "passionate developer" or "love to code".

Developer info:
- GitHub name: ${viewer.name ?? viewer.login}
- GitHub bio: ${viewer.bio || 'Not set'}
- Company: ${viewer.company ?? 'Independent'}
- Location: ${viewer.location ?? 'Unknown'}
- Top repositories: ${topRepos || 'None yet'}
- Key skill areas: ${skillNames || 'Not analyzed yet'}
- Total public repos: ${repos.filter(r => !r.isPrivate).length}

Respond with ONLY a JSON object:
{"bio": "your 2-3 sentence professional bio here"}`;
}
