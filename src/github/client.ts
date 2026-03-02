import { graphql } from '@octokit/graphql';

export function createGitHubClient(token: string) {
  return graphql.defaults({
    headers: {
      authorization: `bearer ${token}`,
    },
  });
}

export type GitHubClient = ReturnType<typeof createGitHubClient>;
