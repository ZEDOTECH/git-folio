## Requirements

### Requirement: Hono HTTP Server
系統 SHALL 在 `src/server/` 建立一個 Hono HTTP server，監聽指定 port（預設 3000）。Server SHALL 提供靜態檔案服務（`src/server/static/`）與所有 REST API 路由。

#### Scenario: 啟動 server
- **WHEN** 使用者執行 `git-folio serve`
- **THEN** server 啟動並印出「git-folio UI running at http://localhost:3000」，瀏覽器可開啟該網址

#### Scenario: 自訂 port
- **WHEN** 使用者執行 `git-folio serve --port 8080`
- **THEN** server 在 port 8080 啟動，印出對應網址

---

### Requirement: Generate API with SSE Streaming
`POST /api/generate` SHALL 接受 JSON body（含 generate 選項），啟動 generate 流程，並以 Server-Sent Events 串流回傳進度 log。每個 SSE event 格式為 `data: <log line>\n\n`，完成時發送 `event: done`，失敗時發送 `event: error`。

#### Scenario: 成功執行 generate
- **WHEN** `POST /api/generate` 附帶合法選項
- **THEN** SSE stream 依序推送各階段 log，最後發送 `event: done, data: {"output":"./output"}`

#### Scenario: 缺少 GITHUB_PAT
- **WHEN** `.env` 未設定 `GITHUB_PAT`
- **THEN** SSE 立即發送 `event: error, data: {"message":"GITHUB_PAT not found in .env"}`

#### Scenario: 同時有兩個 generate 請求
- **WHEN** 前一個 generate 尚未完成，又收到新的 `POST /api/generate`
- **THEN** 回傳 `409 Conflict`，訊息「Generate already running」

---

### Requirement: Clear Cache API
`POST /api/clear-cache` SHALL 刪除 `.git-folio-cache/` 目錄，回傳 JSON 結果。

#### Scenario: 刪除成功
- **WHEN** cache 目錄存在
- **THEN** 回傳 `{ "ok": true, "message": "Cache cleared." }`

#### Scenario: Cache 不存在
- **WHEN** cache 目錄不存在
- **THEN** 回傳 `{ "ok": true, "message": "No cache found." }`

---

### Requirement: Status API
`GET /api/status` SHALL 回傳系統狀態，包含：cache 是否存在、cache 年齡（小時）、`.env` 中各 key 是否設定、output 目錄是否存在。

#### Scenario: 狀態查詢
- **WHEN** `GET /api/status`
- **THEN** 回傳 `{ "cache": { "exists": true, "ageHours": 2.5 }, "env": { "githubPat": true, "openaiKey": true }, "outputExists": true }`

---

### Requirement: Repos Visibility API
`GET /api/repos` SHALL 讀取 `output/src/data/portfolio.json` 並回傳 repos 陣列（含 `name`、`enable`、`isPrivate`、`stargazerCount`、`primaryLanguage`）。`PUT /api/repos` SHALL 接受 `{ "repos": [{ "name": string, "enable": boolean }] }` 並更新 `portfolio.json` 中對應 repo 的 `enable` 欄位。

#### Scenario: 讀取 repos
- **WHEN** `GET /api/repos` 且 `portfolio.json` 存在
- **THEN** 回傳 repos 陣列，僅包含前端需要的欄位

#### Scenario: portfolio.json 不存在
- **WHEN** `GET /api/repos` 但 output 目錄或 portfolio.json 不存在
- **THEN** 回傳 `{ "repos": [], "message": "No portfolio data. Run generate first." }`

#### Scenario: 儲存 visibility 設定
- **WHEN** `PUT /api/repos` 附帶合法的 repos 陣列
- **THEN** portfolio.json 中對應 repo 的 `enable` 欄位被更新，其他欄位不變，回傳 `{ "ok": true }`
