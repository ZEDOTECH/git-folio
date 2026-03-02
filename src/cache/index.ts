import fs from 'fs/promises';
import path from 'path';
import type { RawGitHubData } from '../github/types.js';
import type { CacheManifest } from './types.js';

export class CacheManager {
  private readonly cacheFile: string;

  constructor(cacheDir: string) {
    this.cacheFile = path.resolve(process.cwd(), cacheDir, 'github-data.json');
  }

  async save(data: RawGitHubData, includePrivate: boolean): Promise<void> {
    await fs.mkdir(path.dirname(this.cacheFile), { recursive: true });
    const manifest: CacheManifest = {
      version: 1,
      savedAt: new Date().toISOString(),
      includePrivate,
      data,
    };
    await fs.writeFile(this.cacheFile, JSON.stringify(manifest, null, 2), 'utf-8');
  }

  async load(ttlHours = 24, includePrivate = true): Promise<RawGitHubData | null> {
    try {
      const raw = await fs.readFile(this.cacheFile, 'utf-8');
      const manifest: CacheManifest = JSON.parse(raw);
      const ageMs = Date.now() - new Date(manifest.savedAt).getTime();
      if (ageMs > ttlHours * 60 * 60 * 1000) return null;
      // If private repos are requested but cache was built without them, invalidate
      if (includePrivate && !manifest.includePrivate) return null;
      return manifest.data;
    } catch {
      return null;
    }
  }

  async clear(): Promise<void> {
    const dir = path.dirname(this.cacheFile);
    try {
      await fs.rm(dir, { recursive: true, force: true });
    } catch {
      // already gone
    }
  }

  async exists(): Promise<boolean> {
    try {
      await fs.access(this.cacheFile);
      return true;
    } catch {
      return false;
    }
  }
}
