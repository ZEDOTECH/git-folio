import type { RawGitHubData } from '../github/types.js';

export interface CacheManifest {
  version: number;
  savedAt: string;
  includePrivate: boolean;
  data: RawGitHubData;
}
