import dotenv from 'dotenv';
import path from 'path';
import type { AppConfig, GenerateOptions } from './types.js';

export async function loadConfig(opts: Partial<GenerateOptions>): Promise<AppConfig> {
  dotenv.config({ path: path.join(process.cwd(), '.env'), override: true });

  const githubToken = process.env.GITHUB_PAT ?? process.env.GITHUB_TOKEN ?? '';
  const openaiKey = process.env.OPENAI_API_KEY ?? '';

  if (!githubToken) {
    throw new Error(
      'GITHUB_PAT not found in .env\n' +
      'Create a GitHub Personal Access Token at https://github.com/settings/tokens/new\n' +
      'and add it to your .env file: GITHUB_PAT=ghp_...'
    );
  }

  if (!openaiKey && !opts.skipAi) {
    throw new Error(
      'OPENAI_API_KEY not found in .env\n' +
      'Add your OpenAI API key to .env: OPENAI_API_KEY=sk-...\n' +
      'Or skip AI enrichment with: --skip-ai'
    );
  }

  return {
    githubToken,
    openaiApiKey: openaiKey,
    openaiModel: process.env.OPENAI_MODEL ?? 'gpt-5-mini',
    authorName: (opts.author ?? '') || (process.env.AUTHOR_NAME ?? ''),
    siteUrl: process.env.SITE_URL ?? '',
  };
}
