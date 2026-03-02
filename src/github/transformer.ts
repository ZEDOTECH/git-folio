import type { GQLRepoNode, RawRepoNode } from './types.js';

export function transformRepoNode(node: GQLRepoNode): RawRepoNode {
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
    recentCommits: node.defaultBranchRef?.target?.history?.nodes ?? [],
    createdAt: node.createdAt,
    pushedAt: node.pushedAt,
    updatedAt: node.updatedAt,
    licenseInfo: node.licenseInfo,
    homepageUrl: node.homepageUrl,
    diskUsage: node.diskUsage,
  };
}
