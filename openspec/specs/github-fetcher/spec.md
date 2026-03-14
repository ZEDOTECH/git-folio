## ADDED Requirements

### Requirement: Authenticate with GitHub PAT
系統 SHALL 從 `.env` 檔案讀取 `GITHUB_PAT` 或 `GITHUB_TOKEN` 環境變數，並以此作為 GitHub GraphQL API 的 Bearer token。若兩個變數均未設定，SHALL 拋出明確錯誤訊息並終止執行。

#### Scenario: PAT 存在且有效
- **WHEN** `.env` 中設定了 `GITHUB_PAT=ghp_xxx`
- **THEN** 系統使用此 token 建立 `@octokit/graphql` client，所有 API 請求帶有 `Authorization: bearer ghp_xxx` header

#### Scenario: PAT 缺失
- **WHEN** `.env` 不存在或 `GITHUB_PAT` 和 `GITHUB_TOKEN` 均未設定
- **THEN** 系統輸出錯誤訊息「GITHUB_PAT not found in .env」並以非零 exit code 結束

---

### Requirement: Fetch Viewer Profile
系統 SHALL 使用 `VIEWER_QUERY` 抓取已驗證使用者的 GitHub 個人資料，包含：`login`、`name`、`bio`、`avatarUrl`、`websiteUrl`、`company`、`location`、`followers.totalCount`、`following.totalCount`。

#### Scenario: 成功取得個人資料
- **WHEN** API 請求成功
- **THEN** 返回包含上述所有欄位的 `ViewerProfile` 物件；空值欄位允許為 `null`

---

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

---

### Requirement: GitHub API Rate Limit Protection
系統 SHALL 在每次 API 回應後檢查 `rateLimit.remaining`。若 `remaining < 10`，SHALL 計算距 `rateLimit.resetAt` 的等待時間並暫停，待 reset 後再繼續。

#### Scenario: Rate limit 耗盡
- **WHEN** API 回應中 `rateLimit.remaining = 5`
- **THEN** 系統顯示警告訊息「Rate limit low (5 remaining). Waiting Xs...」並等待至 `resetAt + 1s`，之後繼續抓取

---

### Requirement: Local Cache with TTL
系統 SHALL 在抓取完成後將原始 GitHub 資料寫入 `.git-folio-cache/github-data.json`（含 `savedAt` timestamp）。下次執行時，若 cache 存在且未超過 TTL（預設 24 小時），SHALL 直接從 cache 讀取，跳過 GitHub API 請求。

#### Scenario: Cache 命中（未過期）
- **WHEN** cache 檔案存在且 `age < ttl`
- **THEN** 系統跳過 GitHub API 抓取，從 cache 載入資料，並顯示「Using cached data」

#### Scenario: Cache 過期
- **WHEN** cache 檔案存在但 `age >= ttl`
- **THEN** 系統重新從 GitHub API 抓取，並用新資料覆寫 cache

#### Scenario: --no-cache 旗標
- **WHEN** 使用者傳入 `--no-cache`
- **THEN** 系統不讀取 cache，強制重新抓取，並更新 cache
