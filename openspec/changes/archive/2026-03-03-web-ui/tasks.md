## 1. 安裝依賴與專案設定

- [x] 1.1 安裝 `hono` 到 `package.json` dependencies
- [x] 1.2 在 `package.json` 新增 `"ui": "node dist/server/index.js"` script（可選，方便測試）

## 2. Hono Server 核心

- [x] 2.1 建立 `src/server/index.ts`：初始化 Hono app、掛載靜態檔案服務（`src/server/static/`）、啟動 Node.js HTTP server
- [x] 2.2 建立 `src/server/routes/generate.ts`：`POST /api/generate`，讀取 body 選項、monkey-patch logger、直接呼叫核心模組、以 `streamSSE` 推送 log、發送 `done` / `error` event
- [x] 2.3 在 generate route 中加入「同時只允許一個 generate」的 lock 邏輯，重複請求回傳 409
- [x] 2.4 建立 `src/server/routes/cache.ts`：`POST /api/clear-cache`，刪除 `.git-folio-cache/` 目錄
- [x] 2.5 建立 `src/server/routes/status.ts`：`GET /api/status`，回傳 cache 狀態、env key 存在性、output 目錄存在性
- [x] 2.6 建立 `src/server/routes/repos.ts`：`GET /api/repos`（讀 portfolio.json）、`PUT /api/repos`（更新 enable 欄位）
- [x] 2.7 建立 `src/server/routes/env.ts`：`GET /api/env`（讀 .env 並遮罩 token）、`PUT /api/env`（合併寫回 .env，跳過遮罩值）

## 3. Astro Preview 管理

- [x] 3.1 建立 `src/server/astro-preview.ts`：維護全域 `astroProcess`，實作 `startPreview(outputDir)` 和 `stopPreview()`
- [x] 3.2 在 `startPreview` 中判斷是否需要先執行 `npm install`（node_modules 不存在時）
- [x] 3.3 建立 `src/server/routes/preview.ts`：`POST /api/preview/start`、`POST /api/preview/stop`、`GET /api/preview/status`
- [x] 3.4 在 server 啟動時註冊 `process.on('exit' / 'SIGINT' / 'SIGTERM')` 清理 Astro subprocess
- [x] 3.5 ~~修改 `src/template/astro.config.mjs`：加入 `server.headers` 移除 X-Frame-Options 限制~~ → X-Frame-Options 問題以移除 iframe 改為外開連結方式解決，astro.config.mjs 不需要修改

## 4. 前端 HTML + JS

- [x] 4.1 建立 `src/server/static/index.html`：四 tab 結構（Generate、Visibility、Settings、Preview），內含 CSS（dark theme，石墨色系搭配 amber 強調色）
- [x] 4.2 建立 `src/server/static/app.js`：tab 切換邏輯、頁面載入時呼叫 `GET /api/status`
- [x] 4.3 實作 Generate tab JS：表單收集、`POST /api/generate` + `fetch + ReadableStream` SSE 接收（EventSource 不支援 POST）、log append、按鈕 disable/enable、完成後顯示 Preview 提示
- [x] 4.4 實作 Clear Cache 按鈕：`POST /api/clear-cache`、結果顯示於 log panel
- [x] 4.5 實作 Visibility tab JS：`GET /api/repos`、render 列表、搜尋過濾、`PUT /api/repos` 儲存
- [x] 4.6 實作 Settings tab JS：`GET /api/env`、填入遮罩值、👁 切換顯示、`PUT /api/env` 儲存
- [x] 4.7 實作 Preview tab JS：`POST /api/preview/start`、`POST /api/preview/stop`、`GET /api/preview/status`、狀態顯示與「Open ↗」外開連結（取代 iframe，避免 X-Frame-Options 問題）

## 5. CLI 命令整合

- [x] 5.1 建立 `src/cli/commands/serve.ts`：registerServe 函式，定義 `--port` 和 `--open` 選項，呼叫 server 啟動函式
- [x] 5.2 在 `src/index.ts` 中 import 並呼叫 `registerServe(program)`
- [x] 5.3 實作 `--open` 選項：使用 Node.js 內建方式（`child_process.exec('start ...')` 或跨平台 open）開啟瀏覽器

## 6. 驗收測試

- [x] 6.1 執行 `npm run build`，確認 TypeScript 編譯無錯誤
- [x] 6.2 執行 `git-folio serve`，確認瀏覽器可開啟 UI
- [x] 6.3 在 Settings tab 設定 token，確認 `.env` 正確更新
- [x] 6.4 執行 Generate，確認 SSE log 即時顯示
- [x] 6.5 修改 Visibility 設定並 Save，確認 `portfolio.json` 正確更新
- [x] 6.6 啟動 Preview，確認「Open ↗」連結可開啟 portfolio 網站（改為外開連結，非 iframe）
