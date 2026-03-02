## Why

開發者缺乏一個能自動彙整 GitHub 個人作品集並生成專業履歷網站的工具。手動整理所有 public/private repos、撰寫每個專案的描述、分析技術棧——這些重複性工作耗費大量時間，且成果往往不夠專業。`git-folio` 讓開發者只需提供 GitHub PAT，即可在數分鐘內自動生成一個可直接部署的 Astro 靜態履歷網站。

## What Changes

- 全新 CLI 工具 `git-folio`，以 TypeScript (ESM) 撰寫，可透過 `npx` 執行
- 透過 GitHub GraphQL API 抓取使用者所有 repos（含 private），讀取 README、語言比例、commit 歷史
- 使用 OpenAI gpt-4o-mini 為每個 repo 生成精華描述、分析跨 repo 技能、撰寫專業 Bio
- 本機快取（`.git-folio-cache/`），避免每次重新抓取 API
- 生成完整 Astro + Tailwind CSS 靜態網站（含 3 頁：主頁、所有專案、技能分析）
- 生成後在 output 目錄產生 `git-folio.config.json`，讓使用者控制每個 repo 的顯示/隱藏，下次重新生成時設定保留
- 主題：技術感 + 溫暖色調（stone + amber 色系）

## Capabilities

### New Capabilities

- `github-fetcher`: 透過 GitHub GraphQL API 分頁抓取所有 repos（含 private），讀取 README 文字、語言分布、最近 commit 訊息，支援 rate limit 保護與快取機制
- `ai-enricher`: 使用 OpenAI gpt-4o-mini 對 repo 資料進行三類 AI 分析：per-repo 精華描述（parallel, p-limit 5）、跨 repo 技能分析、整體專業 Bio
- `site-generator`: 將 AI 增強後的資料寫入 `portfolio.json`，並將內建 Astro 模板 scaffold 到 output 目錄，生成可直接 `npm run build` 的靜態網站
- `visibility-config`: 第一次生成後自動產生 `git-folio.config.json`，列出所有 repos 及其 `visible` 狀態；重新生成時讀取設定檔並套用，設定不被蓋掉
- `cli-commands`: Commander.js CLI 介面，包含 `generate`、`preview`、`clear-cache` 三個命令，以及相關旗標（`--include-private`、`--skip-ai`、`--no-cache` 等）

### Modified Capabilities

（無：全新專案）

## Impact

- **新增依賴**: `@octokit/graphql`, `commander`, `dotenv`, `openai`, `p-limit`, `ora`
- **環境需求**: Node.js >= 18，需要 `.env` 檔案提供 `GITHUB_PAT` 與 `OPENAI_API_KEY`
- **生成產物**: output 目錄為完整的獨立 Astro 專案，包含 `package.json`、`astro.config.mjs`、`src/` 等，與 CLI 工具完全解耦
- **不含**: 部署整合（Vercel/GitHub Pages 整合不在此次範圍）
