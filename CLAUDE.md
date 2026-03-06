# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Claude Code 偏好設定
- 請一律使用「繁體中文 (Traditional Chinese)」與我溝通。
- 除非是程式碼中的變數命名或特定技術文件要求，否則所有解釋與回答都請用繁體中文。

## 常用指令

```bash
npm run build      # 編譯 TypeScript → dist/
npm run dev        # 監聽模式編譯（tsc --watch）
npm run ui         # 啟動 Web UI（http://localhost:3000）
```

**編譯後才能跑**：所有後端變更（`src/` 下的 `.ts` 檔案）都需要 `npm run build` 後才會生效。靜態前端（`src/server/static/app.js`、`index.html`）不需要 build，直接重新整理瀏覽器即可。

沒有測試框架。

## 架構概覽

這是一個 CLI + Web UI 工具，從 GitHub 抓取 repo 資料、經 AI enrichment，生成 Astro 靜態作品集網站。

### 兩個執行入口

| 入口 | 指令 | 說明 |
|------|------|------|
| CLI | `node dist/index.js generate` | 直接跑 generate pipeline |
| Web UI | `node dist/index.js serve` | 啟動 Hono HTTP server，瀏覽器操作 |

### Generate Pipeline（`src/`）

```
GitHub GraphQL API
    → GitHubFetcher (src/github/fetcher.ts)   — 分頁抓取所有 repos
    → CacheManager  (src/cache/index.ts)       — 快取至 .git-folio-cache/
    → [filter by includedRepos if specified]   — 過濾勾選的 repos
    → AIEnricher    (src/ai/enricher.ts)       — OpenAI：AI 描述 + 技能分析 + bio
    → SiteGenerator (src/generator/index.ts)   — scaffold Astro template + writePortfolioData
    → output/                                  — 完整 Astro 網站
```

### Web UI Server（`src/server/`）

- **Framework**：Hono + `@hono/node-server`
- **靜態檔**：`src/server/static/`（`index.html` + `app.js`，不需要 build）
- **API 路由**（全部掛在 `/api` 前綴）：
  - `POST /api/generate` — SSE 串流回傳 generate 進度
  - `GET /api/repos/list` — 輕量 GitHub fetch（name + isPrivate + description），有獨立快取 `.git-folio-repos-list-cache.json`，`?refresh=true` 強制略過快取
  - `GET/PUT /api/repos` — 讀寫 `output/src/data/portfolio.json` 的 enable 欄位
  - `GET/PUT /api/env` — 讀寫 `.env` 檔案
  - `POST /api/clear-cache` — 刪除 `.git-folio-cache/`（**不影響** repos-list 快取）
  - `GET /api/status` — 回傳 cache/env/output 狀態
  - `POST /api/preview/start|stop` — 管理 Astro dev server 子程序

### Web UI 前端（`src/server/static/app.js`）

Tab 流程：**Settings → Visibility → Generate → Preview**

- **Visibility tab**：按 Load Repos → `GET /api/repos/list?refresh=true`，以卡片格式顯示，勾選狀態存 localStorage
  - `git-folio:all-repos-list`：完整 repo 清單（`{name, isPrivate, description}[]`）
  - `git-folio:excluded-repos`：未勾選（排除）的 repo names（`string[]`）
- **Generate tab**：按 Generate 時從 localStorage 讀取 excluded 清單，計算 `includedRepos` 附入 POST body；若 Visibility 從未載入則不帶此參數（抓全部）

### 輸出目錄（`output/`，generate 後產生）

Astro 網站，資料來源為 `output/src/data/portfolio.json`。`portfolio.json` 的 `enable` 欄位控制各 repo 是否顯示在網站。Generate 時會保留既有的 `enable: false` 設定（`src/generator/data-writer.ts`）。

### 兩種快取

| 快取 | 路徑 | 清除方式 |
|------|------|---------|
| Generate 完整資料 | `.git-folio-cache/github-data.json` | Clear Cache 按鈕 / `--no-cache` |
| Visibility 輕量清單 | `.git-folio-repos-list-cache.json` | 手動刪除（不被 Clear Cache 影響） |

### Astro Template（`src/template/`）

靜態模板，scaffold 時複製到 `output/`。頁面讀取 `src/data/portfolio.json`，在 build 時 filter `enable: false` 的 repos。
