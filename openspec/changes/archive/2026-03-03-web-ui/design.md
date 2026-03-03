## Context

git-folio 是一個 TypeScript/Node.js CLI 工具。所有核心邏輯（`GitHubFetcher`、`AIEnricher`、`SiteGenerator`、`CacheManager`）已封裝為可 import 的 class，目前只透過 CLI 命令使用。Web UI 的目標是在不改動核心模組的前提下，新增一個本機 HTTP server layer，讓使用者透過瀏覽器執行相同操作。

## Goals / Non-Goals

**Goals:**
- 新增 `git-folio serve` 命令啟動本機 Web UI
- 直接 import 現有核心模組，不透過 subprocess
- SSE 串流 generate 進度給瀏覽器
- 支援 Repo visibility 管理（讀寫 `portfolio.json`）
- 支援 `.env` 設定（讀寫 `GITHUB_PAT`、`OPENAI_API_KEY` 等）
- 管理 Astro dev server subprocess，在 iframe 內預覽

**Non-Goals:**
- 多使用者 / 雲端部署（本機 localhost only）
- 認證與權限控制
- 修改現有 CLI 命令行為
- 支援多個 output 目錄並行管理

## Decisions

### 1. HTTP Framework：Hono

**選擇 Hono，而非 Express / Fastify / 內建 http**

Hono 是 TypeScript-first 的輕量框架，內建 `streamSSE()` helper，API 簡潔。對於這個只需要少量路由的本機工具，Hono 是最低依賴成本的選擇。Express 的 SSE 需要手動處理 `res.write()`；Fastify 需要額外 plugin；內建 http 太 verbose。

### 2. SSE 而非 WebSocket

Generate 是單向操作：server push log → browser。SSE 足夠，不需要 WebSocket 的雙向複雜度。

**注意**：`/api/generate` 為 POST endpoint，原生 `EventSource` API 僅支援 GET，因此瀏覽器端改以 `fetch + ReadableStream` 讀取 SSE 串流（手動解析 `data:` / `event:` 行）。效果與 EventSource 相同，無需額外套件。

### 3. 直接 import 核心模組，不 subprocess

```
server route → new AIEnricher(config).enrich(...)
             → new GitHubFetcher(config).fetchAll(...)
```

好處：不需要等 build、不需要管 child process exit code、共用同一個 Node.js process 的 memory。缺點：generate 過程中如果 crash 會讓 server 也死掉（本機工具可接受）。

### 4. Logger / Spinner 攔截：替換為 SSE emitter

現有 `logger.ts` 和 `spinner.ts` 直接寫 `process.stdout`，在 server 模式下無法串流給瀏覽器。做法：`AIEnricher`、`GitHubFetcher` 等核心類別已接受 config 物件，可在 server route 中建立自訂 logger callback 傳入，或使用 monkey-patch 方式攔截 `logger` 模組。

**決定**：在 server route 中暫時 monkey-patch `logger` 的輸出函式，將 log 推入 SSE stream。這樣不需要改動核心模組介面。

### 5. Astro Preview：subprocess 管理

Astro dev server 需要在 `output/` 目錄執行 `npm run dev`。Server 維護一個全域 `astroProcess: ChildProcess | null`，透過 `/api/preview/start` 和 `/api/preview/stop` 控制。Astro 預設 port 4321，iframe 直接指向 `http://localhost:4321`。

**CORS/iframe 問題**：需在 `src/template/astro.config.mjs` 加入 `server.headers: { 'X-Frame-Options': 'SAMEORIGIN' }` 或移除該 header，允許 localhost iframe embed。

### 6. 前端：單頁 HTML + Vanilla JS

`src/server/static/index.html` 內含所有 HTML + CSS（inline 或單一 `<style>` block）。`src/server/static/app.js` 處理 tab 切換、fetch API 呼叫、`EventSource` SSE 接收、DOM 更新。不使用 bundler，直接由 Hono 的 `serveStatic` 提供。

### 7. .env 讀寫

使用 Node.js `fs` 直接讀寫 `.env`（simple key=value parsing，不依賴額外套件）。API endpoint `GET /api/env` 回傳已遮罩的值（token 只顯示前 4 + 後 4 字元）；`PUT /api/env` 接收完整值並覆寫。

## Risks / Trade-offs

- **Logger monkey-patch 脆弱**：如果 logger 模組內部改變匯出方式，攔截會失效 → Mitigation: logger 模組簡單且受控，風險低；未來可改為依賴注入
- **Astro subprocess 孤兒進程**：如果 server 異常終止，Astro dev server 可能殘留 → Mitigation: 監聽 `process.on('exit')` 清理
- **iframe X-Frame-Options**：需改動 template → Mitigation: 影響範圍小，只改一個 config 欄位
- **generate 中途 crash 讓 server 停止**：本機工具可接受，使用者重啟即可

## Migration Plan

1. 新增 `hono` 依賴
2. 新增 `src/server/` 模組（不改動現有程式碼）
3. 修改 `src/template/astro.config.mjs`（移除 X-Frame-Options）
4. 在 `src/index.ts` 中 import 並註冊 serve 命令
5. 無 breaking change，rollback 只需移除 serve 命令註冊
