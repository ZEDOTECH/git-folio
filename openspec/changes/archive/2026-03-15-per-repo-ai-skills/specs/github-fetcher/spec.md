## MODIFIED Requirements

### Requirement: Fetch All Repositories with Pagination
系統 SHALL 使用分頁方式（每頁 30 筆）取得使用者所有 repos，並持續抓取直到 `pageInfo.hasNextPage` 為 `false` 或已達 `--max-repos` 上限。每個 repo SHALL 包含以下欄位：`name`、`nameWithOwner`、`description`、`url`、`isPrivate`、`stargazerCount`、`forkCount`、`primaryLanguage`、`languages`（含 bytes）、`repositoryTopics`、README blob（`object(expression:"HEAD:README.md")`）、最近 100 筆 commit 的 `committedDate`、**`message`**（commit 訊息）、`author`、`createdAt`、`pushedAt`、`updatedAt`、`licenseInfo`、`homepageUrl`、`diskUsage`。

#### Scenario: 抓取僅 public repos
- **WHEN** 未傳入 `--include-private` 旗標
- **THEN** 查詢使用 `privacy: PUBLIC` 參數，只返回 public repos

#### Scenario: 抓取含 private repos
- **WHEN** 傳入 `--include-private` 旗標
- **THEN** 查詢不帶 `privacy` 參數，返回所有 repos（public + private）

#### Scenario: 超過 max-repos 上限
- **WHEN** 使用者設定 `--max-repos 20` 且實際有 50 個 repos
- **THEN** 取得前 20 個 repos 後停止分頁，不繼續發送 API 請求

#### Scenario: repo 無 README
- **WHEN** 某個 repo 的 `HEAD:README.md` 不存在
- **THEN** `readmeText` 欄位為 `null`，不影響其他欄位的抓取

#### Scenario: commit message 可用
- **WHEN** repo 有 commit history
- **THEN** 每筆 `RepoCommit` 包含 `message` 欄位（commit 完整訊息）；若舊快取無此欄位，值為 `undefined`，AI enricher 應 graceful fallback（顯示為空字串）
