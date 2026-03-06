import { escape, safeUrl } from './escape.js';
import { renderLayout } from './layout.js';
import type { Portfolio, PortfolioLanguage, PortfolioRepo } from './types.js';

function fmtDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function fmtSize(kb: number): string {
  if (kb < 1024) return `${kb} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

function renderLangBreakdown(langs: PortfolioLanguage[]): string {
  if (langs.length === 0) return '';
  const bars = langs.map(l =>
    `<div style="width:${l.percentage}%;background-color:${l.color};" title="${escape(l.name)} ${l.percentage}%"></div>`
  ).join('');
  const legend = langs.map(l =>
    `<span class="flex items-center gap-1.5 text-sm text-stone-400 mono">
        <span class="w-3 h-3 rounded-full flex-shrink-0" style="background-color:${l.color};"></span>
        ${escape(l.name)}<span class="text-stone-600">${l.percentage}%</span>
      </span>`
  ).join('');
  return `<div class="card mb-8">
    <h2 class="text-lg font-semibold text-stone-100 mb-4">Languages</h2>
    <div class="flex h-3 rounded-full overflow-hidden mb-4 bg-stone-800">${bars}</div>
    <div class="flex flex-wrap gap-x-5 gap-y-2">${legend}</div>
  </div>`;
}

const CHART_CLIENT_SCRIPT = `
(function() {
  var dataEl = document.getElementById('commit-data');
  var chartContainer = document.getElementById('commit-chart-container');
  if (!dataEl || !chartContainer) return;

  var data = JSON.parse(dataEl.textContent);
  var rawWeeks = data.commitsByWeek || [];
  var rawDays = data.commitsByDay || [];

  function fillWeekGaps(arr) {
    if (arr.length === 0) return [];
    var result = [];
    var countMap = {};
    arr.forEach(function(d) { countMap[d.week] = d.count; });
    var cur = new Date(arr[0].week);
    var end = new Date(arr[arr.length - 1].week);
    while (cur <= end) {
      var key = cur.getFullYear() + '-' + String(cur.getMonth() + 1).padStart(2, '0') + '-' + String(cur.getDate()).padStart(2, '0');
      result.push({ week: key, count: countMap[key] || 0 });
      cur.setDate(cur.getDate() + 7);
    }
    return result;
  }

  function fillDayGaps(arr) {
    if (arr.length === 0) return [];
    var result = [];
    var countMap = {};
    arr.forEach(function(d) { countMap[d.day] = d.count; });
    var cur = new Date(arr[0].day);
    var end = new Date(arr[arr.length - 1].day);
    while (cur <= end) {
      var key = cur.getFullYear() + '-' + String(cur.getMonth() + 1).padStart(2, '0') + '-' + String(cur.getDate()).padStart(2, '0');
      result.push({ day: key, count: countMap[key] || 0 });
      cur.setDate(cur.getDate() + 1);
    }
    return result;
  }

  function fmtBarDate(dateStr) {
    var d = new Date(dateStr);
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return months[d.getMonth()] + ' ' + String(d.getDate()).padStart(2, '0');
  }

  var weeksData = fillWeekGaps(rawWeeks);
  var daysData = fillDayGaps(rawDays);
  var useDay = weeksData.length < 14;
  var chartBars = useDay
    ? daysData.map(function(d) { return { key: d.day, count: d.count }; })
    : weeksData.map(function(w) { return { key: w.week, count: w.count }; });

  if (chartBars.length === 0) return;

  var totalBars = chartBars.length;
  var maxCount = Math.max.apply(null, chartBars.map(function(c) { return c.count; }).concat([1]));
  var VW = 600, CH = 72, LH = 20, VH = CH + LH + 8;
  var slotW = VW / totalBars;
  var barW = Math.max(1, slotW - 1);
  var minBarH = 3;
  var gridYs = [0.25, 0.5, 0.75].map(function(p) { return Math.round(CH * (1 - p)); });
  var labelEvery = Math.max(1, Math.ceil(totalBars / (VW / 40)));

  function showLabel(i) {
    if (i === 0 || i === chartBars.length - 1) return true;
    var isNewMonth = chartBars[i].key.slice(0, 7) !== chartBars[i - 1].key.slice(0, 7);
    return isNewMonth && i % labelEvery === 0;
  }

  var gridLines = gridYs.map(function(gy) {
    return '<line x1="0" y1="' + gy + '" x2="' + VW + '" y2="' + gy + '" stroke="#292524" stroke-width="1"/>';
  }).join('');

  var bars = chartBars.map(function(c, i) {
    var rawH = c.count > 0 ? Math.max(minBarH, Math.round((c.count / maxCount) * CH)) : 0;
    var x = i * slotW;
    var prefix = useDay ? '' : 'Week of ';
    var barEl = c.count > 0
      ? '<rect x="' + (x + 0.5) + '" y="' + (CH - rawH) + '" width="' + barW + '" height="' + rawH + '" rx="1" fill="#f59e0b" opacity="' + (0.4 + 0.6 * (c.count / maxCount)) + '"><title>' + prefix + fmtBarDate(c.key) + ': ' + c.count + ' commit' + (c.count !== 1 ? 's' : '') + '</title></rect>'
      : '';
    var labelEl = showLabel(i)
      ? '<text x="' + (x + slotW / 2) + '" y="' + (CH + LH + 2) + '" text-anchor="middle" font-size="9" fill="#78716c" font-family="monospace">' + c.key.slice(5, 7) + '/' + c.key.slice(8, 10) + '</text>'
      : '';
    return '<g>' + barEl + labelEl + '</g>';
  }).join('');

  var baseline = '<line x1="0" y1="' + CH + '" x2="' + VW + '" y2="' + CH + '" stroke="#44403c" stroke-width="1"/>';

  var viewLabel = useDay ? 'daily' : 'weekly';
  var dateRange = fmtBarDate(chartBars[0].key) + ' \u2013 ' + fmtBarDate(chartBars[chartBars.length - 1].key);

  chartContainer.innerHTML =
    '<div class="card mb-8">' +
    '<div class="flex items-baseline justify-between mb-4">' +
    '<div class="flex items-center gap-2">' +
    '<h2 class="text-lg font-semibold text-stone-100">Commit Activity</h2>' +
    '<span class="text-xs px-1.5 py-0.5 rounded border border-stone-700 text-stone-500 mono">' + viewLabel + '</span>' +
    '</div>' +
    '<span class="text-xs text-stone-500 mono">' + dateRange + '</span>' +
    '</div>' +
    '<svg viewBox="0 0 ' + VW + ' ' + VH + '" width="100%" style="display:block" aria-label="Commit frequency chart">' +
    gridLines + bars + baseline +
    '</svg>' +
    '<p class="text-xs text-stone-600 mt-2 mono">* Based on up to 100 most recent commits on default branch</p>' +
    '</div>';
})();
`;

export function renderRepo(repo: PortfolioRepo, portfolio: Portfolio): string {
  const { profile } = portfolio;

  const totalCommits = (repo.commitsByMonth ?? []).reduce((s, c) => s + c.count, 0);

  const commitData = JSON.stringify({
    commitsByWeek: repo.commitsByWeek ?? [],
    commitsByDay: repo.commitsByDay ?? [],
  });

  // Action links
  const actionLinks = [
    !repo.isPrivate && safeUrl(repo.url)
      ? `<a href="${safeUrl(repo.url)}" target="_blank" rel="noopener noreferrer"
           class="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg border border-stone-700 text-stone-300 hover:border-amber-500/50 hover:text-amber-400 transition-colors mono">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/>
          </svg>GitHub
        </a>` : '',
    repo.homepageUrl && safeUrl(repo.homepageUrl)
      ? `<a href="${safeUrl(repo.homepageUrl)}" target="_blank" rel="noopener noreferrer"
           class="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg border border-stone-700 text-stone-300 hover:border-amber-500/50 hover:text-amber-400 transition-colors mono">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
          </svg>Demo
        </a>` : '',
  ].filter(Boolean).join('\n        ');

  // Contributors
  const contributorsHtml = (!repo.isPrivate && repo.contributors && repo.contributors.length > 0)
    ? `<div class="card mb-8">
    <h2 class="text-lg font-semibold text-stone-100 mb-4">Contributors</h2>
    <div class="flex flex-wrap gap-3">
      ${repo.contributors.map(c =>
        `<a href="https://github.com/${escape(c.login)}" target="_blank" rel="noopener noreferrer"
           class="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-stone-800 hover:border-stone-700 transition-colors">
          <img src="${safeUrl(c.avatarUrl)}" alt="${escape(c.login)}" width="28" height="28" class="rounded-full" />
          <div class="text-left">
            <p class="text-sm text-stone-200 mono leading-tight">${escape(c.login)}</p>
            <p class="text-xs text-stone-500">${c.count} commit${c.count !== 1 ? 's' : ''}</p>
          </div>
        </a>`
      ).join('\n      ')}
    </div>
  </div>` : '';

  // Topics & skills
  const tagsHtml = (repo.topics.length > 0 || (repo.matchedSkills && repo.matchedSkills.length > 0))
    ? `<div class="card mb-8">
    <h2 class="text-lg font-semibold text-stone-100 mb-4">Tags</h2>
    ${repo.topics.length > 0
      ? `<div class="flex flex-wrap gap-2 mb-3">${repo.topics.map(t => `<span class="tag">${escape(t)}</span>`).join('')}</div>`
      : ''}
    ${(repo.matchedSkills && repo.matchedSkills.length > 0)
      ? `<div class="flex flex-wrap gap-2">${repo.matchedSkills.map(s =>
          `<span class="text-xs px-2 py-0.5 rounded-full border border-amber-500/30 text-amber-400/80 mono">${escape(s)}</span>`
        ).join('')}</div>`
      : ''}
  </div>` : '';

  const content = `<div class="max-w-4xl mx-auto px-4 sm:px-6 py-16">
  <a href="../projects.html" class="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-300 transition-colors mb-8">
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
    </svg>All projects
  </a>

  <div class="mb-10">
    <div class="flex items-center gap-3 flex-wrap mb-3">
      <h1 class="mono text-3xl font-bold text-stone-100">${escape(repo.name)}</h1>
      ${repo.isPrivate ? `<span class="text-xs px-2 py-1 rounded border border-stone-700 text-stone-500 mono">private</span>` : ''}
      ${repo.license ? `<span class="text-xs px-2 py-1 rounded border border-stone-700 text-stone-500 mono">${escape(repo.license)}</span>` : ''}
    </div>
    ${(repo.createdAt && repo.pushedAt) ? `<p class="mono text-sm text-stone-400 mb-4">
      ${fmtDate(repo.createdAt)}<span class="text-stone-600 mx-2">→</span>${fmtDate(repo.pushedAt)}
    </p>` : ''}
    <p class="text-stone-300 text-base leading-relaxed max-w-2xl">${escape(repo.description ?? 'No description available.')}</p>
    ${actionLinks ? `<div class="flex items-center gap-3 mt-5">${actionLinks}</div>` : ''}
  </div>

  <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
    <div class="card py-4 text-center">
      <p class="text-2xl font-bold text-stone-100 mono">${repo.stars}</p>
      <p class="text-xs text-stone-500 mt-1">Stars</p>
    </div>
    <div class="card py-4 text-center">
      <p class="text-2xl font-bold text-stone-100 mono">${repo.forks}</p>
      <p class="text-xs text-stone-500 mt-1">Forks</p>
    </div>
    <div class="card py-4 text-center">
      <p class="text-2xl font-bold text-stone-100 mono">${totalCommits}</p>
      <p class="text-xs text-stone-500 mt-1">Commits tracked</p>
    </div>
    <div class="card py-4 text-center">
      <p class="text-2xl font-bold text-stone-100 mono">${fmtSize(repo.diskUsage ?? 0)}</p>
      <p class="text-xs text-stone-500 mt-1">Repo size</p>
    </div>
  </div>

  <script id="commit-data" type="application/json">${commitData}</script>
  <div id="commit-chart-container"></div>

  ${renderLangBreakdown(repo.languages ?? [])}
  ${contributorsHtml}
  ${tagsHtml}
</div>

<script>${CHART_CLIENT_SCRIPT}</script>`;

  return renderLayout(content, {
    title: `${repo.name} — ${portfolio.meta.siteTitle}`,
    currentPage: 'repo',
    login: profile.login,
    githubUrl: profile.githubUrl,
    generatedAt: portfolio.generatedAt,
    siteTitle: portfolio.meta.siteTitle,
  });
}
