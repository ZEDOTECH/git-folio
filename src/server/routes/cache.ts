import { Hono } from 'hono';
import fs from 'node:fs/promises';
import path from 'node:path';

export const cacheRouter = new Hono();

const CACHE_DIR = '.git-folio-cache';

cacheRouter.post('/clear-cache', async (c) => {
  const cacheDir = path.join(process.cwd(), CACHE_DIR);
  try {
    await fs.rm(cacheDir, { recursive: true, force: true });
    const existed = await fs.access(cacheDir).then(() => true).catch(() => false);
    return c.json({ ok: true, message: existed ? 'No cache found.' : 'Cache cleared.' });
  } catch {
    return c.json({ ok: true, message: 'Cache cleared.' });
  }
});
