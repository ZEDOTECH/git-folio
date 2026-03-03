import { Hono } from 'hono';
import fs from 'node:fs/promises';
import path from 'node:path';

export const reposRouter = new Hono();

const portfolioPath = () => path.join(process.cwd(), 'output', 'src', 'data', 'portfolio.json');

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
