export const VIEWER_QUERY = `
  query ViewerInfo {
    viewer {
      login
      name
      bio
      avatarUrl
      websiteUrl
      company
      location
      followers { totalCount }
      following { totalCount }
    }
    rateLimit {
      remaining
      resetAt
    }
  }
`;

const REPO_FIELDS = `
  name
  nameWithOwner
  description
  url
  isPrivate
  stargazerCount
  forkCount
  primaryLanguage { name color }
  languages(first: 10, orderBy: { field: SIZE, direction: DESC }) {
    edges {
      size
      node { name color }
    }
    totalSize
  }
  repositoryTopics(first: 10) {
    nodes { topic { name } }
  }
  object(expression: "HEAD:README.md") {
    ... on Blob { text }
  }
  defaultBranchRef {
    target {
      ... on Commit {
        history(first: 10) {
          nodes {
            messageHeadline
            committedDate
          }
        }
      }
    }
  }
  createdAt
  pushedAt
  updatedAt
  licenseInfo { name spdxId }
  homepageUrl
  diskUsage
`;

export const ALL_REPOS_QUERY_PUBLIC = `
  query AllReposPublic($after: String) {
    viewer {
      repositories(
        first: 30
        after: $after
        ownerAffiliations: OWNER
        isFork: false
        privacy: PUBLIC
        orderBy: { field: PUSHED_AT, direction: DESC }
      ) {
        pageInfo { hasNextPage endCursor }
        totalCount
        nodes {
          ${REPO_FIELDS}
        }
      }
    }
    rateLimit {
      remaining
      resetAt
    }
  }
`;

export const ALL_REPOS_QUERY_ALL = `
  query AllReposAll($after: String) {
    viewer {
      repositories(
        first: 30
        after: $after
        ownerAffiliations: OWNER
        isFork: false
        orderBy: { field: PUSHED_AT, direction: DESC }
      ) {
        pageInfo { hasNextPage endCursor }
        totalCount
        nodes {
          ${REPO_FIELDS}
        }
      }
    }
    rateLimit {
      remaining
      resetAt
    }
  }
`;
