## Why

使用者目前只能透過 CLI 執行 git-folio，需要記住 flags、手動編輯 `portfolio.json` 控制 repo 顯示、並在終端機觀看 spinner 輸出。提供本機 Web UI 可大幅降低操作門檻，讓非技術使用者也能輕鬆配置、執行、預覽個人 portfolio 網站。

## What Changes

- 新增 `git-folio serve` CLI 命令，啟動本機 Hono HTTP server（預設 port 3000）
- 新增 `src/server/` 模組，包含 Hono app、路由、SSE log streaming
- 新增 `src/server/static/` 包含 Vanilla JS + HTML 前端（單頁四 tab 設計）
- 新增 `src/server/astro-preview.ts`，管理 Astro dev server subprocess 生命週期
- `src/cli/commands/serve.ts`：註冊 serve 命令

## Capabilities

### New Capabilities
- `web-ui-server`: Hono HTTP server，暴露 REST API + SSE，直接 import 現有核心模組執行操作
- `web-ui-frontend`: Vanilla JS + HTML 前端，四個 tab（Generate、Visibility、Settings、Preview）
- `web-ui-env-manager`: 透過 Web UI 讀寫 `.env` 檔案，支援 token 遮罩顯示與儲存
- `web-ui-preview`: 管理 Astro dev server subprocess，在 iframe 內顯示生成的 portfolio

### Modified Capabilities
- `cli-commands`: 新增 `serve` 命令（新增能力，現有命令不變）

## Impact

- **新依賴**：`hono`（HTTP framework）
- **新檔案**：`src/server/`、`src/server/static/`
- **修改**：`src/index.ts` 註冊新的 serve 命令、`package.json` 加入 hono
- **不影響**：現有 generate / clear-cache 命令、核心模組邏輯、輸出格式
