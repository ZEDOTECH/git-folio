import type { GQLRepoNode, RawRepoNode, CommitByMonth, CommitByWeek, CommitByDay, Contributor } from './types.js';

function computeCommitsByMonth(nodes: Array<{ committedDate: string; message?: string }>): CommitByMonth[] {
  const counts = new Map<string, number>();
  for (const c of nodes) {
    const d = new Date(c.committedDate);
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    counts.set(month, (counts.get(month) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));
}

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1)); // back to Monday
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function computeCommitsByWeek(nodes: Array<{ committedDate: string; message?: string }>): CommitByWeek[] {
  const counts = new Map<string, number>();
  for (const c of nodes) {
    const week = getWeekStart(new Date(c.committedDate));
    counts.set(week, (counts.get(week) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, count]) => ({ week, count }));
}

function computeCommitsByDay(nodes: Array<{ committedDate: string; message?: string }>): CommitByDay[] {
  const counts = new Map<string, number>();
  for (const c of nodes) {
    const day = c.committedDate.slice(0, 10);
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, count]) => ({ day, count }));
}

function computeContributors(
  nodes: Array<{ author?: { user?: { login: string; avatarUrl: string; name: string | null } | null } | null }>,
  isPrivate: boolean,
): Contributor[] {
  if (isPrivate) return [];
  const map = new Map<string, Contributor>();
  for (const c of nodes) {
    const user = c.author?.user;
    if (!user?.login) continue;
    const existing = map.get(user.login);
    if (existing) {
      existing.count++;
    } else {
      map.set(user.login, { login: user.login, avatarUrl: user.avatarUrl, name: user.name, count: 1 });
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}

export function transformRepoNode(node: GQLRepoNode): RawRepoNode {
  const historyNodes = node.defaultBranchRef?.target?.history?.nodes ?? [];
  return {
    name: node.name,
    nameWithOwner: node.nameWithOwner,
    description: node.description,
    url: node.url,
    isPrivate: node.isPrivate,
    stargazerCount: node.stargazerCount,
    forkCount: node.forkCount,
    primaryLanguage: node.primaryLanguage,
    languages: {
      edges: node.languages.edges,
      totalSize: node.languages.totalSize,
    },
    topics: node.repositoryTopics.nodes.map(n => n.topic.name),
    readmeText: node.object?.text ?? null,
    recentCommits: historyNodes,
    commitsByMonth: computeCommitsByMonth(historyNodes),
    commitsByWeek: computeCommitsByWeek(historyNodes),
    commitsByDay: computeCommitsByDay(historyNodes),
    contributors: computeContributors(historyNodes, node.isPrivate),
    createdAt: node.createdAt,
    pushedAt: node.pushedAt,
    updatedAt: node.updatedAt,
    licenseInfo: node.licenseInfo,
    homepageUrl: node.homepageUrl,
    diskUsage: node.diskUsage,
  };
}
