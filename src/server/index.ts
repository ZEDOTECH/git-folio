import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateRouter } from './routes/generate.js';
import { cacheRouter } from './routes/cache.js';
import { statusRouter } from './routes/status.js';
import { reposRouter } from './routes/repos.js';
import { envRouter } from './routes/env.js';
import { previewRouter } from './routes/preview.js';
import { stopPreview } from './astro-preview.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Static files live in src/server/static; __dirname is dist/server at runtime
const staticDir = path.resolve(__dirname, '../../src/server/static');

export function createApp() {
  const app = new Hono();

  // API routes first so they take priority over static catch-all
  app.route('/api', generateRouter);
  app.route('/api', cacheRouter);
  app.route('/api', statusRouter);
  app.route('/api', reposRouter);
  app.route('/api', envRouter);
  app.route('/api', previewRouter);

  // Static files (serves index.html for /)
  app.use('/*', serveStatic({ root: staticDir }));

  return app;
}

export function startServer(port: number): void {
  const app = createApp();

  const cleanup = () => {
    stopPreview();
    process.exit(0);
  };

  process.on('exit', () => stopPreview());
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  serve({ fetch: app.fetch, port }, () => {
    console.log(`git-folio UI running at http://localhost:${port}`);
  });
}
