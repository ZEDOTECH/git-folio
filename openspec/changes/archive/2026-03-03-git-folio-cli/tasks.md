## 1. 專案基礎建設

- [x] 1.1 初始化 `package.json`（type: module, bin: git-folio, engines: node >=18, 所有依賴）
- [x] 1.2 建立 `tsconfig.json`（target ES2022, module NodeNext, moduleResolution NodeNext, outDir dist）
- [x] 1.3 建立 `.gitignore`（node_modules, dist, .git-folio-cache, .env）
- [x] 1.4 建立 `.env.example`（GITHUB_PAT, OPENAI_API_KEY, 選用欄位及說明）
- [x] 1.5 建立完整目錄結構（src/cli, src/config, src/github, src/ai, src/cache, src/generator, src/utils）

## 2. Config 與 Utils

- [x] 2.1 實作 `src/config/types.ts`（AppConfig, GenerateOptions 介面）
- [x] 2.2 實作 `src/config/index.ts`（dotenv 載入、GITHUB_PAT/OPENAI_API_KEY 驗證、缺少時拋出明確錯誤）
- [x] 2.3 實作 `src/utils/logger.ts`（step/progress/warn/success 彩色輸出）
- [x] 2.4 實作 `src/utils/rate-limiter.ts`（token bucket，2 req/s）
- [x] 2.5 實作 `src/utils/spinner.ts`（封裝 ora，提供 start/succeed/fail/warn）

## 3. GitHub 資料抓取

- [x] 3.1 定義 `src/github/types.ts`（ViewerProfile, RawRepoNode, LanguageEdge, RepoCommit, RawGitHubData）
- [x] 3.2 實作 `src/github/queries.ts`（VIEWER_QUERY, ALL_REPOS_QUERY_PUBLIC, ALL_REPOS_QUERY_ALL — 兩份獨立 query string）
- [x] 3.3 實作 `src/github/client.ts`（以 `@octokit/graphql` 建立帶 Authorization header 的 client factory）
- [x] 3.4 實作 `src/github/transformer.ts`（將 GraphQL 原始節點轉換為 RawRepoNode，含 topics 展開、README text 提取）
- [x] 3.5 實作 `src/github/fetcher.ts`（分頁迴圈、pageInfo 處理、rateLimit 檢查與等待、max-repos 上限）

## 4. 本機快取

- [x] 4.1 定義 `src/cache/types.ts`（CacheManifest 介面）
- [x] 4.2 實作 `src/cache/index.ts`（save: 寫入 JSON + savedAt；load: 讀取並驗證 TTL；clear: 刪除目錄）

## 5. AI 分析

- [x] 5.1 定義 `src/ai/types.ts`（SkillArea, EnrichedRepo, EnrichedData 介面）
- [x] 5.2 實作 `src/ai/client.ts`（以 `openai` SDK 建立 OpenAI client factory）
- [x] 5.3 實作 `src/ai/prompts.ts`（buildProjectSummaryPrompt: README 截 1500 字元 + 5 commits；buildSkillsAnalysisPrompt；buildBioPrompt）
- [x] 5.4 實作 `src/ai/enricher.ts`（per-repo 摘要以 p-limit(5) 並發；技能分析單一呼叫；Bio 單一呼叫；各自 try/catch + fallback；computeLanguageBreakdown）

## 6. Astro 模板

- [x] 6.1 在 `src/template/` 建立 Astro 專案（`package.json`, `astro.config.mjs`, `tailwind.config.mjs`, `tsconfig.json`）
- [x] 6.2 設定 Tailwind 色系（stone + amber 自訂 tokens，JetBrains Mono + Geist 字體）
- [x] 6.3 實作 `src/template/src/layouts/BaseLayout.astro`（HTML shell、head meta、字體載入、Header、Footer）
- [x] 6.4 實作 `src/template/src/components/Hero.astro`（大頭照、名字、bio、GitHub 連結、location）
- [x] 6.5 實作 `src/template/src/components/ProjectCard.astro`（repo 資訊卡：名稱、AI 描述、語言 badge、stars、forks、topics、GitHub/Demo 連結）
- [x] 6.6 實作 `src/template/src/components/ProjectGrid.astro`（響應式格狀佈局，接受 repos 陣列）
- [x] 6.7 實作 `src/template/src/components/SkillsSection.astro`（技能卡片格狀，顯示 name/description/level/relatedTech）
- [x] 6.8 實作 `src/template/src/components/LanguageBreakdown.astro`（水平比例長條圖 + 圖例）
- [x] 6.9 實作 `src/template/src/pages/index.astro`（Hero + Featured 6 repos + 技能概覽 + 語言預覽）
- [x] 6.10 實作 `src/template/src/pages/projects.astro`（所有 repos 格狀 + 文字搜尋 + 語言下拉篩選，純 vanilla JS）
- [x] 6.11 實作 `src/template/src/pages/skills.astro`（完整語言長條圖 + 完整技能區塊）
- [x] 6.12 在 `src/template/src/data/` 放置 `.gitkeep`（佔位，generator 會在此寫入 portfolio.json）

## 7. 網站生成器

- [x] 7.1 實作 `src/generator/scaffold.ts`（fs.cp 將 template 複製到 output；重複生成時保留 portfolio.json）
- [x] 7.2 實作 `src/generator/data-writer.ts`（序列化 EnrichedData → portfolio.json 結構；每個 repo 加入 enable 欄位（讀取既有 portfolio.json 保留使用者設定）；選取 featuredRepos；截取前 12 個語言）
- [x] 7.3 Visibility 機制改用 portfolio.json 的 enable 欄位（取代原 config-writer.ts 方案）；Astro 頁面 render 時過濾 enable: false 的 repos
- [x] 7.4 實作 `src/generator/index.ts`（組合 scaffold + data-writer + README 生成）

## 8. CLI 命令

- [x] 8.1 實作 `src/cli/commands/generate.ts`（完整流程：config → cache → fetcher → enricher → generator；整合 spinner 進度）
- [x] 8.2 實作 `src/cli/commands/clear-cache.ts`（呼叫 CacheManager.clear()，處理不存在情況）
- [x] 8.3 實作 `src/index.ts`（Commander.js 根 program，註冊 generate 和 clear-cache，設定 version + description，`#!/usr/bin/env node`）

## 9. 整合測試

- [x] 9.1 以真實 GitHub PAT + OPENAI_API_KEY 執行 `git-folio generate --output ./test-output`，確認 cache 檔案正確建立
- [x] 9.2 確認 `test-output/src/data/portfolio.json` 包含 AI 增強的摘要、技能和 Bio
- [x] 9.3 確認 `output/src/data/portfolio.json` 中所有 repos 均含 `enable: true` 欄位
- [x] 9.4 在 `test-output` 執行 `npm install && npm run dev`，在瀏覽器確認三頁均正常渲染
- [x] 9.5 在 `test-output` 執行 `npm run build`，確認靜態輸出正常（無 build error）
- [x] 9.6 手動將某個 repo 的 `enable` 改為 `false`，確認 `npm run dev` 後頁面即時不顯示該 repo；重新執行 `git-folio generate` 後設定被保留
- [x] 9.7 執行 `git-folio clear-cache`，確認 `.git-folio-cache/` 被刪除
- [x] 9.8 執行 `git-folio generate --skip-ai`，確認網站以 GitHub 原始描述生成（無 OpenAI 請求）
