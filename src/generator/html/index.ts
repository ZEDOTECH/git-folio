import { escape, safeUrl } from './escape.js';
import { renderLayout } from './layout.js';
import type { Portfolio, PortfolioLanguage, PortfolioRepo, SkillArea } from './types.js';

function ym(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function langBar(langs: PortfolioLanguage[]): string {
  if (langs.length === 0) return '';
  const bars = langs.map(l =>
    `<div style="width:${l.percentage}%;background-color:${l.color};" title="${escape(l.name)} ${l.percentage}%"></div>`
  ).join('');
  const legend = langs.map(l =>
    `<span class="flex items-center gap-1 text-xs text-stone-400 mono">
      <span class="w-2 h-2 rounded-full flex-shrink-0" style="background-color:${l.color};"></span>
      ${escape(l.name)}<span class="text-stone-600">${l.percentage}%</span>
    </span>`
  ).join('');
  return `<div class="mb-3">
      <div class="flex h-1.5 rounded-full overflow-hidden mb-2 bg-stone-800">${bars}</div>
      <div class="flex flex-wrap gap-x-3 gap-y-1">${legend}</div>
    </div>`;
}

function renderProjectCard(repo: PortfolioRepo): string {
  const langs = repo.languages.length > 0
    ? repo.languages
    : (repo.primaryLanguage ? [{ ...repo.primaryLanguage, percentage: 100 }] : []);

  const dateRange = (repo.createdAt && repo.pushedAt)
    ? `<p class="mono text-xs text-stone-100 mb-3">${ym(repo.createdAt)} ~ ${ym(repo.pushedAt)}</p>`
    : '';

  const nameEl = repo.isPrivate
    ? `<span class="mono font-semibold text-stone-100 leading-tight">${escape(repo.name)}</span>`
    : `<a href="${safeUrl(repo.url)}" target="_blank" rel="noopener noreferrer"
         class="mono font-semibold text-stone-100 hover:text-amber-400 transition-colors leading-tight">
        ${escape(repo.name)}
      </a>`;

  const privateBadge = repo.isPrivate
    ? `<span class="flex-shrink-0 text-xs px-1.5 py-0.5 rounded border border-stone-700 text-stone-100 mono">private</span>`
    : '';

  const topicsHtml = repo.topics.length > 0
    ? `<div class="flex flex-wrap gap-1.5 mb-3">${repo.topics.slice(0, 4).map(t => `<span class="tag">${escape(t)}</span>`).join('')}</div>`
    : '';

  const skillsHtml = (repo.techTags ?? []).length > 0
    ? `<div class="flex flex-wrap gap-1.5 mb-3">${(repo.techTags ?? []).map(t =>
        `<span class="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 mono">${escape(t)}</span>`
      ).join('')}</div>`
    : '';

  const footerLinks = [
    !repo.isPrivate ? `<a href="${safeUrl(repo.url)}" target="_blank" rel="noopener noreferrer" class="btn-ghost text-xs">GitHub →</a>` : '',
    repo.homepageUrl ? `<a href="${safeUrl(repo.homepageUrl)}" target="_blank" rel="noopener noreferrer" class="btn-ghost text-xs">Demo →</a>` : '',
  ].filter(Boolean).join('');

  return `<div class="card group flex flex-col h-full">
    <div class="flex items-start gap-2 mb-3">
      <svg class="w-4 h-4 text-stone-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
      </svg>
      ${nameEl}${privateBadge}
    </div>
    ${dateRange}
    <p class="text-stone-400 text-sm leading-relaxed flex-1 mb-4">${escape(repo.description ?? 'No description available.')}</p>
    ${langBar(langs)}${topicsHtml}${skillsHtml}
    <div class="flex items-center justify-between mt-auto pt-4 border-t border-stone-800">
      <div class="flex items-center gap-4 text-xs text-stone-500">
        <span class="flex items-center gap-1">
          <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>${repo.stars}
        </span>
        <span class="flex items-center gap-1">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
          </svg>${repo.forks}
        </span>
      </div>
      <div class="flex items-center gap-3">${footerLinks}</div>
    </div>
  </div>`;
}

function renderSkillCard(skill: SkillArea): string {
  const levelColors: Record<string, string> = {
    expert: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    advanced: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    proficient: 'text-stone-400 bg-stone-500/10 border-stone-500/20',
  };
  const cls = levelColors[skill.level] ?? levelColors.proficient;
  const techTags = skill.relatedTech.slice(0, 5).map(t => `<span class="tag text-xs">${escape(t)}</span>`).join('');
  return `<div class="card group">
    <div class="flex items-start justify-between gap-2 mb-2">
      <h3 class="font-semibold text-stone-100 text-sm leading-tight">${escape(skill.name)}</h3>
      <span class="text-xs px-2 py-0.5 rounded border mono capitalize flex-shrink-0 ${cls}">${skill.level}</span>
    </div>
    <p class="text-stone-500 text-xs leading-relaxed mb-3">${escape(skill.description)}</p>
    <div class="flex flex-wrap gap-1">${techTags}</div>
  </div>`;
}

export function renderIndex(portfolio: Portfolio): string {
  const { profile, featuredRepos, skills, languageBreakdown } = portfolio;

  const heroSection = `<section class="relative py-20 sm:py-28 overflow-hidden">
  <div class="absolute inset-0 opacity-5" style="background-image: radial-gradient(circle, #a8a29e 1px, transparent 1px); background-size: 32px 32px;"></div>
  <div class="relative max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center gap-8">
    <div class="relative flex-shrink-0">
      <div class="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl overflow-hidden ring-2 ring-amber-500/30">
        <img src="${safeUrl(profile.avatarUrl)}" alt="${escape(profile.name)}" class="w-full h-full object-cover" />
      </div>
      <div class="absolute -bottom-1 -right-1 w-4 h-4 bg-amber-500 rounded-full ring-2 ring-stone-950"></div>
    </div>
    <div class="flex-1 min-w-0">
      <div class="mono text-amber-500 text-sm mb-2">@${escape(profile.login)}</div>
      <h1 class="text-3xl sm:text-4xl font-bold text-stone-100 mb-3">${escape(profile.name)}</h1>
      ${profile.bio ? `<p class="text-stone-400 text-lg leading-relaxed max-w-2xl mb-5">${escape(profile.bio)}</p>` : ''}
      <div class="flex flex-wrap items-center gap-4">
        ${profile.location ? `<span class="flex items-center gap-1.5 text-sm text-stone-500">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>${escape(profile.location)}</span>` : ''}
        <a href="${safeUrl(profile.githubUrl)}" target="_blank" rel="noopener noreferrer"
           class="flex items-center gap-1.5 text-sm text-stone-400 hover:text-amber-400 transition-colors">
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/>
          </svg>GitHub
        </a>
        ${(profile.websiteUrl && safeUrl(profile.websiteUrl)) ? `<a href="${safeUrl(profile.websiteUrl)}" target="_blank" rel="noopener noreferrer"
           class="flex items-center gap-1.5 text-sm text-stone-400 hover:text-amber-400 transition-colors">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
          </svg>Website
        </a>` : ''}
      </div>
    </div>
  </div>
</section>`;

  const recentlyUpdated = `<section class="max-w-6xl mx-auto px-4 sm:px-6 py-16">
  <div class="flex items-baseline justify-between mb-8">
    <div>
      <h2 class="section-title">Recently Updated</h2>
      <p class="section-subtitle">Latest activity from my repositories</p>
    </div>
    <a href="projects.html" class="text-sm text-amber-500 hover:text-amber-400 transition-colors mono">View all →</a>
  </div>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    ${featuredRepos.map(r => renderProjectCard(r)).join('\n    ')}
  </div>
</section>`;

  const skillsSection = skills.length > 0 ? `<section class="bg-stone-900/50 border-y border-stone-800 py-16">
  <div class="max-w-6xl mx-auto px-4 sm:px-6">
    <h2 class="section-title">Skills &amp; Expertise</h2>
    <p class="section-subtitle">Areas of focus across my work</p>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      ${skills.slice(0, 8).map(renderSkillCard).join('\n      ')}
    </div>
    <div class="mt-4 text-right">
      <a href="skills.html" class="text-sm text-amber-500 hover:text-amber-400 transition-colors mono">View full breakdown →</a>
    </div>
  </div>
</section>` : '';

  const langSection = languageBreakdown.length > 0 ? `<section class="max-w-6xl mx-auto px-4 sm:px-6 py-16">
  <h2 class="section-title">Languages</h2>
  <p class="section-subtitle">Code written across all repositories</p>
  ${renderLanguageBreakdown(languageBreakdown.slice(0, 8))}
</section>` : '';

  const content = heroSection + recentlyUpdated + skillsSection + langSection;

  return renderLayout(content, {
    title: portfolio.meta.siteTitle,
    currentPage: 'index',
    login: profile.login,
    githubUrl: profile.githubUrl,
    generatedAt: portfolio.generatedAt,
    siteTitle: portfolio.meta.siteTitle,
  });
}

function renderLanguageBreakdown(langs: (PortfolioLanguage & { bytes?: number })[]): string {
  const bars = langs.map(l =>
    `<div style="width:${l.percentage.toFixed(2)}%;background-color:${l.color};" title="${escape(l.name)}: ${l.percentage.toFixed(1)}%"></div>`
  ).join('');
  const legend = langs.map(l =>
    `<div class="flex items-center gap-1.5 text-xs text-stone-400">
      <span class="w-2.5 h-2.5 rounded-sm flex-shrink-0" style="background-color:${l.color};"></span>
      <span class="mono">${escape(l.name)}</span>
      <span class="text-stone-600">${l.percentage.toFixed(1)}%</span>
    </div>`
  ).join('');
  return `<div class="space-y-4">
    <div class="flex h-3 rounded-full overflow-hidden gap-px">${bars}</div>
    <div class="flex flex-wrap gap-x-5 gap-y-2">${legend}</div>
  </div>`;
}
