import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const ASSETS_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../src/template/assets',
);

export async function scaffoldTemplate(outputDir: string): Promise<void> {
  await fs.mkdir(outputDir, { recursive: true });
  // Copy static assets (favicon, etc.) to output root
  await fs.cp(ASSETS_DIR, outputDir, { recursive: true, force: true });
}
