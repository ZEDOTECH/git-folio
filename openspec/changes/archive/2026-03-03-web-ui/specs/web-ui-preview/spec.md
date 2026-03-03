## ADDED Requirements

### Requirement: Astro Dev Server Lifecycle Management
系統 SHALL 在 `src/server/astro-preview.ts` 維護一個全域 Astro dev server subprocess（`ChildProcess | null`）。`POST /api/preview/start` SHALL 在 `output/` 目錄執行 `npm run dev`（若 `node_modules` 不存在則先執行 `npm install`）。`POST /api/preview/stop` SHALL 終止該 subprocess。同一時間只允許一個 Astro dev server 執行。

#### Scenario: 首次啟動（無 node_modules）
- **WHEN** `POST /api/preview/start`，`output/node_modules` 不存在
- **THEN** 先執行 `npm install`（在 output 目錄），完成後執行 `npm run dev`，回傳 `{ "ok": true, "status": "starting" }`

#### Scenario: 再次啟動（node_modules 已存在）
- **WHEN** `POST /api/preview/start`，`output/node_modules` 已存在
- **THEN** 直接執行 `npm run dev`，回傳 `{ "ok": true, "status": "starting" }`

#### Scenario: 重複啟動
- **WHEN** Astro dev server 已在執行中，再次收到 `POST /api/preview/start`
- **THEN** 回傳 `{ "ok": true, "status": "already_running" }`，不重複啟動

#### Scenario: 停止 server
- **WHEN** `POST /api/preview/stop`
- **THEN** subprocess 被終止，回傳 `{ "ok": true, "status": "stopped" }`

#### Scenario: output 目錄不存在
- **WHEN** `POST /api/preview/start`，output 目錄不存在
- **THEN** 回傳 `{ "ok": false, "message": "Output directory not found. Run generate first." }`

---

### Requirement: Preview Status API
`GET /api/preview/status` SHALL 回傳 Astro dev server 的目前狀態。

#### Scenario: 查詢狀態
- **WHEN** `GET /api/preview/status`
- **THEN** 回傳 `{ "running": true, "port": 4321 }` 或 `{ "running": false }`

---

### Requirement: Preview 存取方式
Preview tab 以「Open ↗」外部連結取代 iframe 方案（iframe 因 X-Frame-Options 無法嵌入）。`src/template/astro.config.mjs` 不需要修改。

#### Scenario: 開啟 portfolio 預覽
- **WHEN** Astro dev server 在 localhost:4321 執行，使用者點擊「Open ↗」
- **THEN** 瀏覽器在新分頁開啟 `http://localhost:4321`，portfolio 網站正常顯示

---

### Requirement: Process Cleanup on Server Exit
Web UI server 關閉時（`process.on('exit')`、`SIGINT`、`SIGTERM`），SHALL 自動終止 Astro dev server subprocess，避免孤兒進程。

#### Scenario: Ctrl+C 關閉 Web UI server
- **WHEN** 使用者在終端機按下 Ctrl+C
- **THEN** Astro dev server subprocess 一併被終止
