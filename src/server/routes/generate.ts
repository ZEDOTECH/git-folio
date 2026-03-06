import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import fs from 'node:fs/promises';
import path from 'node:path';
import { loadConfig } from '../../config/index.js';
import { GitHubFetcher } from '../../github/fetcher.js';
import { AIEnricher } from '../../ai/enricher.js';
import { CacheManager } from '../../cache/index.js';
import { SiteGenerator } from '../../generator/index.js';
import { logger } from '../../utils/logger.js';
import { stopPreview } from '../astro-preview.js';
import type { GenerateOptions } from '../../config/types.js';

export const generateRouter = new Hono();

let isGenerating = false;

generateRouter.post('/generate', async (c) => {
  if (isGenerating) {
    return c.json({ message: 'Generate already running' }, 409);
  }

  const body = (await c.req.json<Partial<GenerateOptions> & { cleanOutput?: boolean; includedRepos?: string[] }>().catch(() => ({}))) as Partial<GenerateOptions> & { cleanOutput?: boolean; includedRepos?: string[] };
  const cleanOutput = Boolean(body.cleanOutput);
  const includedRepos = Array.isArray(body.includedRepos) && body.includedRepos.length > 0
    ? body.includedRepos
    : null;

  const opts: GenerateOptions = {
    output: body.output || './output',
    publicOnly: false,
    skipPrivateDescriptions: Boolean(body.skipPrivateDescriptions),
    cache: body.cache !== false,
    cacheTtl: Number(body.cacheTtl) || 24,
    maxRepos: Number(body.maxRepos) || 100,
    skipAi: Boolean(body.skipAi),
    theme: body.theme || 'default',
    author: body.author || '',
  };

  return streamSSE(c, async (stream) => {
    isGenerating = true;

    const emit = (msg: string) => stream.writeSSE({ data: msg });

    // Monkey-patch logger to stream output to SSE
    const origStep = logger.step.bind(logger);
    const origProgress = logger.progress.bind(logger);
    const origWarn = logger.warn.bind(logger);
    const origSuccess = logger.success.bind(logger);
    const origInfo = logger.info.bind(logger);
    const origError = logger.error.bind(logger);

    logger.step = (msg) => { origStep(msg); emit(`→ ${msg}`); };
    logger.progress = (msg) => { origProgress(msg); emit(`  ${msg}`); };
    logger.warn = (msg) => { origWarn(msg); emit(`⚠ ${msg}`); };
    logger.success = (msg) => { origSuccess(msg); emit(`✓ ${msg}`); };
    logger.info = (msg) => { origInfo(msg); emit(`  ${msg}`); };
    logger.error = (msg) => { origError(msg); emit(`✗ ${msg}`); };

    const restore = () => {
      logger.step = origStep;
      logger.progress = origProgress;
      logger.warn = origWarn;
      logger.success = origSuccess;
      logger.info = origInfo;
      logger.error = origError;
      isGenerating = false;
    };

    try {
      if (cleanOutput) {
        const absOutput = path.resolve(process.cwd(), opts.output);
        emit(`Cleaning ${opts.output}...`);
        // Stop preview server first to release any file locks (Windows)
        await stopPreview();
        // Delete contents rather than the directory itself to avoid EBUSY on Windows.
        // Skip node_modules — Astro's deps don't need to be wiped and may be locked.
        try {
          const entries = await fs.readdir(absOutput);
          await Promise.all(
            entries
              .filter(e => e !== 'node_modules')
              .map(e => fs.rm(path.join(absOutput, e), { recursive: true, force: true })),
          );
        } catch (err) {
          if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
          // Directory doesn't exist yet — nothing to clean
        }
        emit(`✓ Cleaned ${opts.output}`);
      }

      emit('Loading config...');
      const config = await loadConfig(opts);

      const cache = new CacheManager('.git-folio-cache');
      let rawData = opts.cache ? await cache.load(opts.cacheTtl, !opts.publicOnly) : null;

      if (rawData) {
        emit('✓ Using cached GitHub data (use no-cache to refresh)');
      } else {
        emit('Fetching GitHub profile and repos...');
        const fetcher = new GitHubFetcher(config);
        rawData = await fetcher.fetchAll({
          includePrivate: !opts.publicOnly,
          maxRepos: opts.maxRepos,
        });
        emit('Saving to cache...');
        await cache.save(rawData, !opts.publicOnly);
        emit(`✓ Fetched ${rawData.repos.length} repos — saved to cache`);
      }

      if (includedRepos) {
        const includedSet = new Set(includedRepos);
        rawData = { ...rawData, repos: rawData.repos.filter(r => includedSet.has(r.name)) };
        emit(`Filtered to ${rawData.repos.length} selected repos`);
      }

      let enrichedData;
      if (opts.skipAi) {
        emit('Skipping AI enrichment (skip-ai)');
        const enricher = new AIEnricher(config);
        const langBreakdown = enricher.computeLanguageBreakdown(rawData.repos);
        enrichedData = {
          viewer: rawData.viewer,
          repos: rawData.repos.map(r => ({ ...r, aiSummary: r.description })),
          skills: [],
          bio: rawData.viewer.bio || AIEnricher.composeFallbackBio(rawData.viewer, langBreakdown, [], rawData.repos),
          languageBreakdown: langBreakdown,
          generatedAt: new Date().toISOString(),
        };
      } else {
        const enricher = new AIEnricher(config);
        enrichedData = await enricher.enrich(rawData, opts);
        emit('✓ AI enrichment complete');
      }

      emit('Generating site...');
      const generator = new SiteGenerator();
      await generator.generate(enrichedData, opts);

      restore();
      await stream.writeSSE({ event: 'done', data: JSON.stringify({ output: opts.output }) });
    } catch (err) {
      restore();
      const message = err instanceof Error ? err.message : String(err);
      await stream.writeSSE({ event: 'error', data: JSON.stringify({ message }) });
    }
  });
});
