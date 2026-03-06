import { escape, safeUrl } from './escape.js';

export type CurrentPage = 'index' | 'projects' | 'skills' | 'repo';

export interface LayoutOpts {
  title: string;
  description?: string;
  currentPage: CurrentPage;
  login: string;
  githubUrl: string;
  generatedAt: string;
  siteTitle: string;
}

const GITHUB_SVG = `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/>
            </svg>`;

export function renderLayout(content: string, opts: LayoutOpts): string {
  const isRepo = opts.currentPage === 'repo';
  const base = isRepo ? '../' : '';

  const nav = [
    { href: `${base}index.html`, label: 'Home', page: 'index' as CurrentPage },
    { href: `${base}projects.html`, label: 'Projects', page: 'projects' as CurrentPage },
    { href: `${base}skills.html`, label: 'Skills', page: 'skills' as CurrentPage },
  ];

  const navLinks = nav.map(item => {
    const isActive = opts.currentPage === item.page;
    const cls = isActive
      ? 'text-sm transition-colors duration-150 text-amber-400 font-medium'
      : 'text-sm transition-colors duration-150 text-stone-400 hover:text-stone-200';
    return `<a href="${item.href}" class="${cls}">${item.label}</a>`;
  }).join('\n          ');

  const generatedDate = new Date(opts.generatedAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="${escape(opts.description ?? `Portfolio of ${opts.login}`)}" />
    <title>${escape(opts.title)}</title>
    <link rel="icon" type="image/svg+xml" href="${base}favicon.svg" />
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
    <style type="text/tailwindcss">
      @layer base {
        html { font-family: 'Inter', system-ui, sans-serif; }
        ::selection { @apply bg-amber-500/30 text-amber-100; }
        ::-webkit-scrollbar { @apply w-1.5; }
        ::-webkit-scrollbar-track { @apply bg-stone-900; }
        ::-webkit-scrollbar-thumb { @apply bg-stone-700 rounded-full; }
      }
      @layer components {
        .mono { font-family: 'JetBrains Mono', monospace; }
        .card { @apply bg-stone-900 border border-stone-800 rounded-xl p-6 transition-colors duration-200; }
        .card:hover { @apply border-amber-500/50; }
        .tag { @apply text-xs px-2.5 py-1 rounded-full bg-stone-800 text-stone-400 font-mono; }
        .lang-badge { @apply text-xs px-2.5 py-1 rounded-full font-mono font-medium; }
        .btn-ghost { @apply text-sm text-stone-400 hover:text-amber-400 transition-colors duration-150; }
        .section-title { @apply text-2xl font-bold text-stone-100 mb-2; }
        .section-subtitle { @apply text-stone-500 text-sm mb-8; }
      }
    </style>
  </head>
  <body class="min-h-screen flex flex-col bg-stone-950 text-stone-100 antialiased">
    <header class="sticky top-0 z-50 border-b border-stone-800/80 bg-stone-950/90 backdrop-blur-sm">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <a href="${base}index.html" class="mono text-amber-400 font-bold text-sm hover:text-amber-300 transition-colors">
          ~/${escape(opts.login)}
        </a>
        <nav class="flex items-center gap-6">
          ${navLinks}
          <a href="${safeUrl(opts.githubUrl)}" target="_blank" rel="noopener noreferrer"
             class="text-stone-500 hover:text-stone-300 transition-colors" aria-label="GitHub profile">
            ${GITHUB_SVG}
          </a>
        </nav>
      </div>
    </header>
    <main class="flex-1">
      ${content}
    </main>
    <footer class="border-t border-stone-800 py-8 mt-16">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-stone-500">
        <span class="mono">
          Built with <a href="https://github.com/zedotech/git-folio" class="text-amber-500/70 hover:text-amber-400 transition-colors">git-folio</a>
        </span>
        <span>Generated ${generatedDate}</span>
      </div>
    </footer>
  </body>
</html>`;
}
