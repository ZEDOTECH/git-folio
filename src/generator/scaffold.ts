import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const TEMPLATE_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../src/template',
);

// Files to preserve when re-generating (user-edited content)
const PRESERVE_ON_REGEN = [
  path.join('src', 'data', 'portfolio.json'),
];

export async function scaffoldTemplate(outputDir: string): Promise<void> {
  // Save preserved files before overwriting
  const saved = new Map<string, string>();
  for (const rel of PRESERVE_ON_REGEN) {
    const fullPath = path.join(outputDir, rel);
    try {
      saved.set(rel, await fs.readFile(fullPath, 'utf-8'));
    } catch {
      // doesn't exist yet, nothing to preserve
    }
  }

  // Copy template to output dir
  await fs.cp(TEMPLATE_DIR, outputDir, { recursive: true, force: true });

  // Restore preserved files
  for (const [rel, content] of saved) {
    const fullPath = path.join(outputDir, rel);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content, 'utf-8');
  }
}
