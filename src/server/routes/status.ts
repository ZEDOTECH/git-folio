import { Hono } from 'hono';
import fs from 'node:fs/promises';
import path from 'node:path';
import dotenv from 'dotenv';

export const statusRouter = new Hono();

statusRouter.get('/status', async (c) => {
  const cwd = process.cwd();
  const cacheFile = path.join(cwd, '.git-folio-cache', 'github-data.json');
  const outputDir = path.join(cwd, 'output');

  // Cache status
  let cacheExists = false;
  let cacheAgeHours: number | null = null;
  try {
    const stat = await fs.stat(cacheFile);
    cacheExists = true;
    cacheAgeHours = Math.round(((Date.now() - stat.mtimeMs) / 3_600_000) * 10) / 10;
  } catch {
    // no cache
  }

  // Env status
  dotenv.config({ path: path.join(cwd, '.env') });
  const env = {
    githubPat: Boolean(process.env.GITHUB_PAT || process.env.GITHUB_TOKEN),
    openaiKey: Boolean(process.env.OPENAI_API_KEY),
  };

  // Output dir status
  let outputExists = false;
  try {
    await fs.access(outputDir);
    outputExists = true;
  } catch {
    // no output
  }

  return c.json({
    cache: { exists: cacheExists, ageHours: cacheAgeHours },
    env,
    outputExists,
  });
});
