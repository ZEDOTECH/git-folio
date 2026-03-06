import { escape, safeUrl } from './escape.js';
import { renderLayout } from './layout.js';
import type { Portfolio, PortfolioLanguage, PortfolioRepo } from './types.js';

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

function renderCard(repo: PortfolioRepo): string {
  const langs = repo.languages.length > 0
    ? repo.languages
    : (repo.primaryLanguage ? [{ ...repo.primaryLanguage, percentage: 100 }] : []);

  const dateRange = (repo.createdAt && repo.pushedAt)
    ? `<p class="mono text-xs text-stone-100 mb-3">${ym(repo.createdAt)} ~ ${ym(repo.pushedAt)}</p>`
    : '';

  const privateBadge = repo.isPrivate
    ? `<span class="flex-shrink-0 text-xs px-1.5 py-0.5 rounded border border-stone-700 text-stone-500 mono">private</span>`
    : `<a href="${safeUrl(repo.url)}" target="_blank" rel="noopener noreferrer" title="Open on GitHub"
         class="flex-shrink-0 text-xs px-1.5 py-0.5 rounded border border-stone-700 text-stone-400 mono hover:border-amber-500/50 hover:text-amber-400 transition-colors">↗</a>`;

  const topicsHtml = repo.topics.length > 0
    ? `<div class="flex flex-wrap gap-1.5 mb-3">${repo.topics.slice(0, 4).map(t => `<span class="tag">${escape(t)}</span>`).join('')}</div>`
    : '';

  const skillsHtml = (repo.matchedSkills && repo.matchedSkills.length > 0)
    ? `<div class="flex flex-wrap gap-1.5 mb-3">${repo.matchedSkills.map(s =>
        `<span class="text-xs px-2 py-0.5 rounded-full border border-amber-500/30 text-amber-400/80 mono">${escape(s)}</span>`
      ).join('')}</div>`
    : '';

  const footerLinks = [
    !repo.isPrivate ? `<a href="${safeUrl(repo.url)}" target="_blank" rel="noopener noreferrer" class="btn-ghost text-xs">GitHub →</a>` : '',
    repo.homepageUrl ? `<a href="${safeUrl(repo.homepageUrl)}" target="_blank" rel="noopener noreferrer" class="btn-ghost text-xs">Demo →</a>` : '',
  ].filter(Boolean).join('');

  const dataName = escape(`${repo.name} ${repo.description ?? ''}`.toLowerCase());
  const dataLang = escape((repo.primaryLanguage?.name ?? '').toLowerCase());

  return `<div class="project-item card group flex flex-col h-full" data-name="${dataName}" data-lang="${dataLang}">
    <div class="flex items-start gap-2 mb-3">
      <svg class="w-4 h-4 text-stone-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
      </svg>
      <span class="mono font-semibold text-stone-100 leading-tight flex-1 min-w-0 truncate">${escape(repo.name)}</span>
      ${privateBadge}
      <a href="projects/${escape(repo.name)}.html" title="View details"
         class="flex-shrink-0 text-xs px-1.5 py-0.5 rounded border border-stone-700 text-stone-400 mono hover:border-amber-500/50 hover:text-amber-400 transition-colors">info</a>
    </div>
    ${dateRange}
    <p class="text-stone-400 text-sm leading-relaxed flex-1 mb-4">${escape(repo.description ?? 'No description available.')}</p>
    ${langBar(langs)}${topicsHtml}${skillsHtml}
    <div class="flex items-center justify-between mt-auto pt-4 border-t border-stone-800">
      <div class="flex items-center gap-4 text-xs text-stone-500">
        <span>★ ${repo.stars}</span>
        <span>⑂ ${repo.forks}</span>
      </div>
      <div class="flex items-center gap-3">${footerLinks}</div>
    </div>
  </div>`;
}

export function renderProjects(portfolio: Portfolio): string {
  const { profile, repos } = portfolio;
  const languages = [...new Set(repos.map(r => r.primaryLanguage?.name).filter(Boolean))].sort() as string[];

  const langOptions = languages.map(lang =>
    `<option value="${escape(lang.toLowerCase())}">${escape(lang)}</option>`
  ).join('\n        ');

  const cards = repos.map(r => renderCard(r)).join('\n      ');

  const content = `<div class="max-w-6xl mx-auto px-4 sm:px-6 py-16">
  <div class="mb-10">
    <h1 class="text-4xl font-bold text-stone-100 mb-2">Projects</h1>
    <p class="text-stone-500 mono text-sm">${repos.length} repositories</p>
  </div>

  <div class="flex flex-col sm:flex-row gap-3 mb-8">
    <input id="search" type="text" placeholder="Search by name or description..."
      class="flex-1 bg-stone-900 border border-stone-800 rounded-lg px-4 py-2.5 text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-colors" />
    <select id="lang-filter"
      class="bg-stone-900 border border-stone-800 rounded-lg px-4 py-2.5 text-sm text-stone-300 focus:outline-none focus:border-amber-500/50 transition-colors sm:w-44">
      <option value="">All languages</option>
      ${langOptions}
    </select>
  </div>

  <div id="project-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    ${cards}
  </div>

  <div id="empty-state" class="hidden text-center py-16 text-stone-500">
    <p class="text-lg mb-1">No projects found</p>
    <p class="text-sm">Try adjusting your search or filter</p>
  </div>
</div>

<script>
  (function() {
    var search = document.getElementById('search');
    var langFilter = document.getElementById('lang-filter');
    var items = document.querySelectorAll('.project-item');
    var emptyState = document.getElementById('empty-state');

    function applyFilter() {
      var q = search.value.toLowerCase().trim();
      var lang = langFilter.value.toLowerCase();
      var visible = 0;
      items.forEach(function(el) {
        var nameMatch = !q || (el.dataset.name || '').includes(q);
        var langMatch = !lang || el.dataset.lang === lang;
        var show = nameMatch && langMatch;
        el.style.display = show ? '' : 'none';
        if (show) visible++;
      });
      emptyState.classList.toggle('hidden', visible > 0);
    }

    search.addEventListener('input', applyFilter);
    langFilter.addEventListener('change', applyFilter);
  })();
</script>`;

  return renderLayout(content, {
    title: `Projects — ${portfolio.meta.siteTitle}`,
    currentPage: 'projects',
    login: profile.login,
    githubUrl: profile.githubUrl,
    generatedAt: portfolio.generatedAt,
    siteTitle: portfolio.meta.siteTitle,
  });
}
