import fs from 'node:fs/promises';
import path from 'node:path';
import { renderIndex } from './index.js';
import { renderProjects } from './projects.js';
import { renderSkills } from './skills.js';
import { renderRepo } from './repo.js';
import type { Portfolio } from './types.js';

export async function renderHtmlFiles(portfolio: Portfolio, outputDir: string): Promise<void> {
  await fs.writeFile(path.join(outputDir, 'index.html'), renderIndex(portfolio), 'utf-8');
  await fs.writeFile(path.join(outputDir, 'projects.html'), renderProjects(portfolio), 'utf-8');
  await fs.writeFile(path.join(outputDir, 'skills.html'), renderSkills(portfolio), 'utf-8');

  const projectsDir = path.join(outputDir, 'projects');
  await fs.mkdir(projectsDir, { recursive: true });

  for (const repo of portfolio.repos) {
    const html = renderRepo(repo, portfolio);
    await fs.writeFile(path.join(projectsDir, `${repo.name}.html`), html, 'utf-8');
  }
}
