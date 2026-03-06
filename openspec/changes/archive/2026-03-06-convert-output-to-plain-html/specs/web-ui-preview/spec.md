## REMOVED Requirements

### Requirement: Astro Dev Server Lifecycle Management
**Reason**: Output 不再是 Astro 專案，不需要 `npm run dev`。靜態 HTML 改由內建 Node.js static file server 提供。
**Migration**: 以 `src/server/static-preview.ts` 取代 `src/server/astro-preview.ts`，使用 Node.js `node:http` 模組在 port 4321 serve `output/` 目錄下的靜態檔案。

---

## ADDED Requirements

### Requirement: Static File Server Lifecycle Management
系統 SHALL 在 `src/server/static-preview.ts` 維護一個全域 Node.js static file server（`http.Server | null`）。`POST /api/preview/start` SHALL 啟動一個 HTTP server 在 port 4321 serve `output/` 目錄。`POST /api/preview/stop` SHALL 關閉該 server。同一時間只允許一個 static file server 執行。

#### Scenario: 首次啟動
- **WHEN** `POST /api/preview/start`，output 目錄存在
- **THEN** 啟動 static file server，回傳 `{ "ok": true, "status": "starting" }`

#### Scenario: 重複啟動
- **WHEN** static file server 已在執行中，再次收到 `POST /api/preview/start`
- **THEN** 回傳 `{ "ok": true, "status": "already_running" }`，不重複啟動

#### Scenario: 停止 server
- **WHEN** `POST /api/preview/stop`
- **THEN** HTTP server 被關閉，回傳 `{ "ok": true, "status": "stopped" }`

#### Scenario: output 目錄不存在
- **WHEN** `POST /api/preview/start`，output 目錄不存在
- **THEN** 回傳 `{ "ok": false, "message": "Output directory not found. Run generate first." }`

#### Scenario: 請求 HTML 頁面（無副檔名路徑）
- **WHEN** browser 請求 `/projects`（無 `.html`）
- **THEN** server 嘗試回傳 `output/projects.html`

#### Scenario: 請求目錄 index
- **WHEN** browser 請求 `/`
- **THEN** server 回傳 `output/index.html`

---

## MODIFIED Requirements

### Requirement: Preview Status API
`GET /api/preview/status` SHALL 回傳 static file server 的目前狀態。

#### Scenario: 查詢狀態
- **WHEN** `GET /api/preview/status`
- **THEN** 回傳 `{ "running": true, "port": 4321 }` 或 `{ "running": false, "port": 4321 }`

---

## MODIFIED Requirements

### Requirement: Process Cleanup on Server Exit
Web UI server 關閉時（`process.on('exit')`、`SIGINT`、`SIGTERM`），SHALL 自動關閉 static file server，避免 port 佔用。

#### Scenario: Ctrl+C 關閉 Web UI server
- **WHEN** 使用者在終端機按下 Ctrl+C
- **THEN** static file server 一併被關閉，port 4321 釋放
