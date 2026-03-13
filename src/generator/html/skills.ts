import { escape } from './escape.js';
import { renderLayout } from './layout.js';
import type { Portfolio, PortfolioLanguage, SkillArea } from './types.js';

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

export function renderSkills(portfolio: Portfolio): string {
  const { profile, skills, languageBreakdown, repos } = portfolio;
  const enabledRepoCount = repos.length;
  const langSlice = languageBreakdown.slice(0, 12);

  let content = `<div class="max-w-6xl mx-auto px-4 sm:px-6 py-16">
  <h1 class="text-4xl font-bold text-stone-100 mb-2">Skills</h1>
  <p class="text-stone-500 mono text-sm mb-12">Technical expertise across all repositories</p>
`;

  if (skills.length > 0) {
    const skillCards = skills.map(renderSkillCard).join('\n      ');
    content += `  <section class="mb-16">
    <h2 class="section-title">Expertise Areas</h2>
    <p class="section-subtitle">AI-analyzed skill clusters from repository history</p>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      ${skillCards}
    </div>
  </section>
`;
  }

  if (langSlice.length > 0) {
    const perLangBars = langSlice.map(lang =>
      `<div class="flex items-center gap-4">
        <div class="w-28 text-right">
          <span class="mono text-xs text-stone-400">${escape(lang.name)}</span>
        </div>
        <div class="flex-1 bg-stone-800 rounded-full h-2 overflow-hidden">
          <div class="h-full rounded-full" style="width:${Math.min(lang.percentage, 100).toFixed(2)}%;background-color:${lang.color};"></div>
        </div>
        <span class="mono text-xs text-stone-500 w-12 text-right">${lang.percentage.toFixed(1)}%</span>
      </div>`
    ).join('\n      ');

    content += `  <section>
    <h2 class="section-title">Languages</h2>
    <p class="section-subtitle">Distribution across ${enabledRepoCount} repositories</p>
    ${renderLanguageBreakdown(langSlice)}
    <div class="mt-8 space-y-3">
      ${perLangBars}
    </div>
  </section>
`;
  }

  if (skills.length === 0 && langSlice.length === 0) {
    content += `  <div class="text-center py-16 text-stone-500">
    <p>No skill data available. Run with AI enabled to generate analysis.</p>
  </div>
`;
  }

  content += `</div>`;

  return renderLayout(content, {
    title: `Skills — ${portfolio.meta.siteTitle}`,
    currentPage: 'skills',
    login: profile.login,
    githubUrl: profile.githubUrl,
    generatedAt: portfolio.generatedAt,
    siteTitle: portfolio.meta.siteTitle,
  });
}
