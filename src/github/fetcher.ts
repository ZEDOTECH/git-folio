import type { AppConfig } from '../config/types.js';
import type { RawGitHubData, GQLViewerResponse, GQLReposResponse, GQLRepoNode } from './types.js';
import { createGitHubClient } from './client.js';
import { VIEWER_QUERY, ALL_REPOS_QUERY_PUBLIC, ALL_REPOS_QUERY_ALL } from './queries.js';
import { transformRepoNode } from './transformer.js';
import { RateLimiter } from '../utils/rate-limiter.js';
import { logger } from '../utils/logger.js';

const TRANSIENT_ERROR_PATTERNS = ['502', '503', '504', 'Bad Gateway', 'Service Unavailable', 'ECONNRESET', 'ETIMEDOUT', 'socket hang up'];
const MAX_RETRIES = 5;

function isTransient(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return TRANSIENT_ERROR_PATTERNS.some(p => msg.includes(p));
}

async function withRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (!isTransient(err) || attempt === MAX_RETRIES) throw err;
      const waitSec = attempt * 5; // 5s, 10s, 15s, 20s
      logger.warn(`${label} — transient error, retrying in ${waitSec}s (attempt ${attempt}/${MAX_RETRIES - 1})...`);
      await new Promise<void>(r => setTimeout(r, waitSec * 1000));
    }
  }
  throw new Error(`${label} failed after ${MAX_RETRIES} attempts`);
}

export class GitHubFetcher {
  private client: ReturnType<typeof createGitHubClient>;
  private rateLimiter: RateLimiter;

  constructor(config: AppConfig) {
    this.client = createGitHubClient(config.githubToken);
    this.rateLimiter = new RateLimiter({ requestsPerSecond: 2 });
  }

  async fetchAll(opts: { includePrivate: boolean; maxRepos: number }): Promise<RawGitHubData> {
    logger.step('Fetching GitHub profile...');
    const viewerResp = await withRetry(
      () => this.client<GQLViewerResponse>(VIEWER_QUERY),
      'Viewer query',
    );
    const v = viewerResp.viewer;
    const viewer = {
      login: v.login,
      name: v.name,
      bio: v.bio,
      avatarUrl: v.avatarUrl,
      websiteUrl: v.websiteUrl,
      company: v.company,
      location: v.location,
      followers: v.followers.totalCount,
      following: v.following.totalCount,
    };

    logger.step('Fetching repositories...');
    const query = opts.includePrivate ? ALL_REPOS_QUERY_ALL : ALL_REPOS_QUERY_PUBLIC;
    const nodes: GQLRepoNode[] = [];
    let after: string | null = null;
    let page = 0;
    let totalCount = 0;

    while (true) {
      await this.rateLimiter.throttle();

      const resp: GQLReposResponse = await withRetry(
        () => this.client<GQLReposResponse>(query, { after }),
        `Page ${page + 1}`,
      );
      const { nodes: pageNodes, pageInfo, totalCount: tc } = resp.viewer.repositories;
      const { remaining, resetAt } = resp.rateLimit;
      totalCount = tc;

      if (remaining < 10) {
        const waitMs = new Date(resetAt).getTime() - Date.now() + 1000;
        logger.warn(`Rate limit low (${remaining} remaining). Waiting ${Math.ceil(waitMs / 1000)}s...`);
        await new Promise<void>(r => setTimeout(r, Math.max(waitMs, 0)));
      }

      nodes.push(...pageNodes);
      page++;
      logger.progress(`Fetched ${nodes.length} of ${totalCount} repos (page ${page})`);

      if (!pageInfo.hasNextPage || nodes.length >= opts.maxRepos) break;
      after = pageInfo.endCursor;
    }

    const repos = nodes.slice(0, opts.maxRepos).map(transformRepoNode);

    return {
      viewer,
      repos,
      fetchedAt: new Date().toISOString(),
    };
  }
}
