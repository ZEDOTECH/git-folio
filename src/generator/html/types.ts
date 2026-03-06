export interface PortfolioLanguage {
  name: string;
  color: string;
  percentage: number;
}

export interface PortfolioContributor {
  login: string;
  avatarUrl: string;
  name: string | null;
  count: number;
}

export interface PortfolioRepo {
  name: string;
  description: string | null;
  url: string;
  isPrivate: boolean;
  stars: number;
  forks: number;
  primaryLanguage: { name: string; color: string } | null;
  languages: PortfolioLanguage[];
  matchedSkills: string[];
  topics: string[];
  createdAt: string;
  pushedAt: string;
  updatedAt: string;
  homepageUrl: string | null;
  license: string | null;
  diskUsage: number;
  commitsByMonth: { month: string; count: number }[];
  commitsByWeek: { week: string; count: number }[];
  commitsByDay: { day: string; count: number }[];
  contributors: PortfolioContributor[];
}

export interface SkillArea {
  name: string;
  description: string;
  level: 'expert' | 'advanced' | 'proficient';
  relatedTech: string[];
}

export interface Portfolio {
  profile: {
    login: string;
    name: string;
    bio: string;
    avatarUrl: string;
    websiteUrl?: string | null;
    company?: string | null;
    location?: string | null;
    githubUrl: string;
  };
  repos: PortfolioRepo[];
  featuredRepos: PortfolioRepo[];
  skills: SkillArea[];
  languageBreakdown: (PortfolioLanguage & { bytes?: number })[];
  generatedAt: string;
  meta: {
    siteTitle: string;
    theme: string;
  };
}
