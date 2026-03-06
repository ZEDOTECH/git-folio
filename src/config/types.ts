export interface AppConfig {
  githubToken: string;
  openaiApiKey: string;
  openaiModel: string;
  authorName: string;
  siteUrl: string;
}

export interface GenerateOptions {
  output: string;
  publicOnly: boolean;
  cache: boolean;
  cacheTtl: number;
  maxRepos: number;
  skipAi: boolean;
  theme: string;
  author: string;
}
