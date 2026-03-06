## ADDED Requirements

### Requirement: Repos List API
`GET /api/repos/list` SHALL 回傳輕量 repo 清單（name + isPrivate），資料來源為 GitHub GraphQL（全量 fetch，包含 private repos）或快取。回傳格式：`{ "repos": [{ "name": string, "isPrivate": boolean }] }`。

#### Scenario: 成功回傳
- **WHEN** `GET /api/repos/list`，GitHub PAT 有效
- **THEN** 回傳 `{ "repos": [{ "name": "my-repo", "isPrivate": false }, ...] }`，包含所有 repos

#### Scenario: PAT 無效
- **WHEN** `GET /api/repos/list`，GitHub PAT 不存在或無效
- **THEN** 回傳 HTTP 401，body `{ "message": "GitHub PAT not configured or invalid." }`

---

## MODIFIED Requirements

### Requirement: Generate API with SSE Streaming
`POST /api/generate` SHALL 接受 JSON body（含 generate 選項），啟動 generate 流程，並以 Server-Sent Events 串流回傳進度 log。Body 新增 optional 欄位 `includedRepos?: string[]`。若 `includedRepos` 有值（非空陣列），系統 SHALL 在 GitHub fetch 完成後、AI enrichment 開始前，將 repos 過濾為只包含 `includedRepos` 中的 names。每個 SSE event 格式為 `data: <log line>\n\n`，完成時發送 `event: done`，失敗時發送 `event: error`。

#### Scenario: 成功執行 generate
- **WHEN** `POST /api/generate` 附帶合法選項
- **THEN** SSE stream 依序推送各階段 log，最後發送 `event: done, data: {"output":"./output"}`

#### Scenario: 帶 includedRepos 執行 generate
- **WHEN** `POST /api/generate` body 含 `{ "includedRepos": ["repo-a", "repo-b"] }`
- **THEN** GitHub fetch 完成後，rawData.repos 過濾為只包含 `repo-a` 和 `repo-b`；AI enrichment 只對這兩個 repo 執行；log 顯示「Filtered to N selected repos」

#### Scenario: includedRepos 中有不存在的 repo
- **WHEN** `includedRepos` 含有 GitHub 上不存在（或未被 fetch 到）的 repo name
- **THEN** 該 name 被忽略，Generate 僅對確實存在的 repos 執行，不報錯

#### Scenario: 缺少 GITHUB_PAT
- **WHEN** `.env` 未設定 `GITHUB_PAT`
- **THEN** SSE 立即發送 `event: error, data: {"message":"GITHUB_PAT not found in .env"}`

#### Scenario: 同時有兩個 generate 請求
- **WHEN** 前一個 generate 尚未完成，又收到新的 `POST /api/generate`
- **THEN** 回傳 `409 Conflict`，訊息「Generate already running」
