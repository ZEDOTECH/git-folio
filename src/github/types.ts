export interface ViewerProfile {
  login: string;
  name: string | null;
  bio: string | null;
  avatarUrl: string;
  websiteUrl: string | null;
  company: string | null;
  location: string | null;
  followers: number;
  following: number;
}

export interface LanguageEdge {
  size: number;
  node: { name: string; color: string };
}

export interface RepoCommitAuthor {
  login: string;
  avatarUrl: string;
  name: string | null;
}

export interface RepoCommit {
  committedDate: string;
  author?: { user?: RepoCommitAuthor | null } | null;
}

export interface CommitByMonth {
  month: string; // YYYY-MM
  count: number;
}

export interface CommitByWeek {
  week: string; // YYYY-MM-DD (Monday of that week)
  count: number;
}

export interface CommitByDay {
  day: string; // YYYY-MM-DD
  count: number;
}

export interface Contributor {
  login: string;
  avatarUrl: string;
  name: string | null;
  count: number;
}

export interface RawRepoNode {
  name: string;
  nameWithOwner: string;
  description: string | null;
  url: string;
  isPrivate: boolean;
  stargazerCount: number;
  forkCount: number;
  primaryLanguage: { name: string; color: string } | null;
  languages: { edges: LanguageEdge[]; totalSize: number };
  topics: string[];
  readmeText: string | null;
  recentCommits: RepoCommit[];
  commitsByMonth: CommitByMonth[];
  commitsByWeek: CommitByWeek[];
  commitsByDay: CommitByDay[];
  contributors: Contributor[];
  createdAt: string;
  pushedAt: string;
  updatedAt: string;
  licenseInfo: { name: string; spdxId: string } | null;
  homepageUrl: string | null;
  diskUsage: number;
}

export interface RawGitHubData {
  viewer: ViewerProfile;
  repos: RawRepoNode[];
  fetchedAt: string;
}

// Raw GraphQL shapes (before transformation)
export interface GQLViewerResponse {
  viewer: {
    login: string;
    name: string | null;
    bio: string | null;
    avatarUrl: string;
    websiteUrl: string | null;
    company: string | null;
    location: string | null;
    followers: { totalCount: number };
    following: { totalCount: number };
  };
  rateLimit: { remaining: number; resetAt: string };
}

export interface GQLReposResponse {
  viewer: {
    repositories: {
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
      totalCount: number;
      nodes: GQLRepoNode[];
    };
  };
  rateLimit: { remaining: number; resetAt: string };
}

export interface GQLRepoNode {
  name: string;
  nameWithOwner: string;
  description: string | null;
  url: string;
  isPrivate: boolean;
  stargazerCount: number;
  forkCount: number;
  primaryLanguage: { name: string; color: string } | null;
  languages: {
    edges: Array<{ size: number; node: { name: string; color: string } }>;
    totalSize: number;
  };
  repositoryTopics: {
    nodes: Array<{ topic: { name: string } }>;
  };
  object: { text: string } | null;
  defaultBranchRef: {
    target: {
      history: {
        nodes: Array<{
          committedDate: string;
          author?: { user?: { login: string; avatarUrl: string; name: string | null } | null } | null;
        }>;
      };
    };
  } | null;
  createdAt: string;
  pushedAt: string;
  updatedAt: string;
  licenseInfo: { name: string; spdxId: string } | null;
  homepageUrl: string | null;
  diskUsage: number;
}
