import { Hono } from 'hono';
import fs from 'node:fs/promises';
import path from 'node:path';
import dotenv from 'dotenv';
import { createGitHubClient } from '../../github/client.js';

export const reposRouter = new Hono();

const portfolioPath = () => path.join(process.cwd(), 'output', 'src', 'data', 'portfolio.json');
const REPOS_LIST_CACHE_PATH = path.join(process.cwd(), '.git-folio-repos-list-cache.json');
const REPOS_LIST_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

const REPOS_LIST_QUERY = `
  query ReposList($after: String) {
    viewer {
      repositories(
        first: 100
        after: $after
        ownerAffiliations: OWNER
        isFork: false
        orderBy: { field: PUSHED_AT, direction: DESC }
      ) {
        pageInfo { hasNextPage endCursor }
        nodes { name isPrivate description }
      }
    }
  }
`;

interface ReposListCache {
  fetchedAt: string;
  repos: Array<{ name: string; isPrivate: boolean; description: string | null }>;
}

interface ReposListGQLResponse {
  viewer: {
    repositories: {
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
      nodes: Array<{ name: string; isPrivate: boolean; description: string | null }>;
    };
  };
}

reposRouter.get('/repos/list', async (c) => {
  const forceRefresh = c.req.query('refresh') === 'true';

  // Try cache first (skip if force refresh requested)
  if (!forceRefresh) {
    try {
      const raw = await fs.readFile(REPOS_LIST_CACHE_PATH, 'utf-8');
      const cache = JSON.parse(raw) as ReposListCache;
      const age = Date.now() - new Date(cache.fetchedAt).getTime();
      if (age < REPOS_LIST_CACHE_TTL_MS) {
        return c.json({ repos: cache.repos });
      }
    } catch { /* cache miss or invalid — fetch fresh */ }
  }

  // Fetch from GitHub
  dotenv.config({ path: path.join(process.cwd(), '.env'), override: true });
  const token = process.env.GITHUB_PAT ?? process.env.GITHUB_TOKEN ?? '';
  if (!token) {
    return c.json({ message: 'GitHub PAT not configured or invalid.' }, 401);
  }

  try {
    const client = createGitHubClient(token);
    const repos: Array<{ name: string; isPrivate: boolean; description: string | null }> = [];
    let after: string | null = null;

    while (true) {
      const resp: ReposListGQLResponse = await client<ReposListGQLResponse>(REPOS_LIST_QUERY, { after });
      const { nodes, pageInfo } = resp.viewer.repositories;
      repos.push(...nodes.map((n: { name: string; isPrivate: boolean; description: string | null }) => ({ name: n.name, isPrivate: n.isPrivate, description: n.description ?? null })));
      if (!pageInfo.hasNextPage) break;
      after = pageInfo.endCursor;
    }

    const cache: ReposListCache = { fetchedAt: new Date().toISOString(), repos };
    await fs.writeFile(REPOS_LIST_CACHE_PATH, JSON.stringify(cache, null, 2), 'utf-8');
    return c.json({ repos });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return c.json({ message }, 401);
  }
});

reposRouter.get('/repos', async (c) => {
  try {
    const raw = await fs.readFile(portfolioPath(), 'utf-8');
    const portfolio = JSON.parse(raw) as {
      repos: Array<{
        name: string;
        enable: boolean;
        isPrivate: boolean;
        stargazerCount: number;
        primaryLanguage?: { name: string } | null;
      }>;
    };
    const repos = portfolio.repos.map(r => ({
      name: r.name,
      enable: r.enable,
      isPrivate: r.isPrivate,
      stargazerCount: r.stargazerCount,
      primaryLanguage: r.primaryLanguage?.name ?? null,
    }));
    return c.json({ repos });
  } catch {
    return c.json({ repos: [], message: 'No portfolio data. Run generate first.' });
  }
});

reposRouter.put('/repos', async (c) => {
  const body = await c.req.json<{ repos: Array<{ name: string; enable: boolean }> }>();
  try {
    const raw = await fs.readFile(portfolioPath(), 'utf-8');
    const portfolio = JSON.parse(raw) as { repos: Array<{ name: string; enable: boolean }> };

    const enableMap = new Map(body.repos.map(r => [r.name, r.enable]));
    portfolio.repos = portfolio.repos.map(r => ({
      ...r,
      enable: enableMap.has(r.name) ? (enableMap.get(r.name) as boolean) : r.enable,
    }));

    await fs.writeFile(portfolioPath(), JSON.stringify(portfolio, null, 2), 'utf-8');
    return c.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return c.json({ ok: false, message }, 500);
  }
});
