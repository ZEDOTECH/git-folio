import type { RawRepoNode } from '../github/types.js';

export interface SkillArea {
  name: string;
  description: string;
  level: 'expert' | 'advanced' | 'proficient';
  relatedTech: string[];
}

export interface LanguageBreakdown {
  name: string;
  color: string;
  bytes: number;
  percentage: number;
}

export interface EnrichedRepo extends RawRepoNode {
  aiSummary: string | null;
}

export interface EnrichedData {
  viewer: import('../github/types.js').ViewerProfile;
  repos: EnrichedRepo[];
  skills: SkillArea[];
  bio: string;
  languageBreakdown: LanguageBreakdown[];
  generatedAt: string;
}
