import type { Command } from 'commander';
import { loadConfig } from '../../config/index.js';
import { GitHubFetcher } from '../../github/fetcher.js';
import { AIEnricher } from '../../ai/enricher.js';
import { CacheManager } from '../../cache/index.js';
import { SiteGenerator } from '../../generator/index.js';
import { logger } from '../../utils/logger.js';
import { Spinner } from '../../utils/spinner.js';
import type { GenerateOptions } from '../../config/types.js';

export function registerGenerate(program: Command): void {
  program
    .command('generate')
    .description('Fetch GitHub data, enrich with AI, and generate your portfolio site')
    .option('-o, --output <dir>', 'Output directory for the generated site', './output')
    .option('--public-only', 'Fetch only public repositories (default includes private)', false)
    .option('--skip-private-descriptions', 'Skip AI descriptions for private repos', false)
    .option('--no-cache', 'Bypass local cache and re-fetch from GitHub')
    .option('--cache-ttl <hours>', 'Cache TTL in hours', '24')
    .option('--max-repos <n>', 'Maximum number of repos to process', '100')
    .option('--skip-ai', 'Skip AI enrichment (use raw GitHub data only)', false)
    .option('--theme <name>', 'Site theme (default)', 'default')
    .option('--author <name>', 'Override author display name')
    .action(async (rawOpts: Record<string, unknown>) => {
      const opts: GenerateOptions = {
        output: rawOpts.output as string,
        publicOnly: rawOpts.publicOnly as boolean,
        skipPrivateDescriptions: rawOpts.skipPrivateDescriptions as boolean,
        cache: rawOpts.cache as boolean,
        cacheTtl: parseInt(rawOpts.cacheTtl as string, 10),
        maxRepos: parseInt(rawOpts.maxRepos as string, 10),
        skipAi: rawOpts.skipAi as boolean,
        theme: rawOpts.theme as string,
        author: (rawOpts.author as string) ?? '',
      };

      const spinner = new Spinner();

      try {
        // 1. Load and validate config
        const config = await loadConfig(opts);

        // 2. Fetch or load from cache
        const cache = new CacheManager('.git-folio-cache');
        let rawData = opts.cache ? await cache.load(opts.cacheTtl, !opts.publicOnly) : null;

        if (rawData) {
          logger.success('Using cached GitHub data (use --no-cache to refresh)');
        } else {
          const fetcher = new GitHubFetcher(config);
          rawData = await fetcher.fetchAll({
            includePrivate: !opts.publicOnly,
            maxRepos: opts.maxRepos,
          });
          spinner.start('Saving to cache...');
          await cache.save(rawData, !opts.publicOnly);
          spinner.succeed(`Fetched ${rawData.repos.length} repos — saved to cache`);
        }

        // 3. AI enrichment
        let enrichedData;
        if (opts.skipAi) {
          logger.info('Skipping AI enrichment (--skip-ai)');
          const enricher = new AIEnricher(config);
          const langBreakdown = enricher.computeLanguageBreakdown(rawData.repos);
          enrichedData = {
            viewer: rawData.viewer,
            repos: rawData.repos.map(r => ({ ...r, aiSummary: r.description })),
            skills: [],
            bio: rawData.viewer.bio ?? '',
            languageBreakdown: langBreakdown,
            generatedAt: new Date().toISOString(),
          };
        } else {
          const enricher = new AIEnricher(config);
          enrichedData = await enricher.enrich(rawData, opts);
          logger.success('AI enrichment complete');
        }

        // 4. Generate site
        spinner.start('Generating site...');
        const generator = new SiteGenerator();
        await generator.generate(enrichedData, opts);
        spinner.succeed(`Portfolio generated → ${opts.output}`);
        logger.info('');
        logger.info(`Ready! Run:`);
        logger.info(`  cd ${opts.output} && npm run dev`);
      } catch (err) {
        spinner.fail();
        const message = err instanceof Error ? err.message : String(err);
        logger.error(message);
        process.exit(1);
      }
    });
}
