## 1. HTML Renderer Infrastructure

- [x] 1.1 建立 `src/generator/html/escape.ts`：實作 `escape(str)` HTML entity escaping 函式（`&`, `<`, `>`, `"`, `'`）
- [x] 1.2 建立 `src/generator/html/layout.ts`：實作 `renderLayout(content: string, opts: LayoutOpts) => string`，包含 sticky header（logo + nav + GitHub icon）、`<main>` 區塊、footer；nav active state 依 `opts.currentPath` 決定；Tailwind CDN script + Google Fonts + 自訂元件 class（`.card`、`.mono`、`.tag`、`.btn-ghost`、`.section-title`、`.section-subtitle`）定義於 inline style block

## 2. Page Renderers

- [x] 2.1 建立 `src/generator/html/index.ts`：實作 `renderIndex(portfolio) => string`，渲染 Hero section、Recently Updated（最多 6 featuredRepos）、Skills & Expertise（最多 8 skills，條件顯示）、Languages section（條件顯示）
- [x] 2.2 建立 `src/generator/html/projects.ts`：實作 `renderProjects(portfolio) => string`，渲染所有 repos 的卡片格；每張卡片含 language breakdown bar、topics、matchedSkills、stars/forks；底部 inline `<script>` 實作即時搜尋（文字）和語言下拉篩選
- [x] 2.3 建立 `src/generator/html/skills.ts`：實作 `renderSkills(portfolio) => string`，渲染語言分佈 stacked bar + legend、每種語言水平進度條、skill area 卡片（含 level badge 和 relatedTech tags）
- [x] 2.4 建立 `src/generator/html/repo.ts`：實作 `renderRepo(repo, portfolio) => string`，渲染 repo 詳細頁；embed raw commit JSON 至 `<script>` tag；inline client-side JS 實作 `fillWeekGaps`、`fillDayGaps`、`showLabel` 並渲染 SVG bar chart（`< 14 weeks` 用 daily view）

## 3. Generator Integration

- [x] 3.1 建立 `src/generator/html/render.ts`（或更新 `data-writer.ts`）：呼叫所有 page renderer，將 HTML 寫入 `output/index.html`、`output/projects.html`、`output/skills.html`、`output/projects/{name}.html`（每個 repo 一個）
- [x] 3.2 更新 `src/generator/scaffold.ts`：移除 Astro template 複製邏輯；改為只將 `src/template/assets/favicon.svg` 複製至 `output/favicon.svg`
- [x] 3.3 更新 `src/generator/index.ts`：移除 `execSync('npm install', ...)` 呼叫；更新 log 訊息（移除「Scaffolding Astro site」）
- [x] 3.4 更新 `writeReadme`：移除 `npm install`、`npm run dev`、`npm run build` 相關說明；改為說明這是純靜態網站，可直接開啟 `index.html`

## 4. Static File Template Assets

- [x] 4.1 建立 `src/template/assets/` 目錄，放入 `favicon.svg`（從現有 Astro template 取出）
- [x] 4.2 刪除 `src/template/` 下所有 Astro 相關檔案（`.astro`、`astro.config.mjs`、`tailwind.config.mjs`、`package.json`、`tsconfig.json`、`src/styles/`、`src/layouts/`、`src/components/`、`src/pages/`）

## 5. Preview: Static File Server

- [x] 5.1 建立 `src/server/static-preview.ts`：使用 `node:http` + `node:fs` 實作 static file server，serve `output/` 目錄；支援 `index.html` fallback、`.html` 副檔名自動補全（`/projects` → `projects.html`）、正確 MIME types；export `startPreview`、`stopPreview`、`getPreviewStatus`（同現有介面）
- [x] 5.2 更新 `src/server/routes/preview.ts`：import 從 `astro-preview.js` 改為 `static-preview.js`
- [x] 5.3 刪除 `src/server/astro-preview.ts`

## 6. portfolio.json Schema Update

- [x] 6.1 更新 `src/generator/data-writer.ts`：移除 `enable` 欄位寫入（`repoEntry` 函式中移除 `enable` 屬性）；移除 `existingEnableMap` 讀取/保留邏輯
- [x] 6.2 確認 `/api/repos` GET route 仍可正常讀取 `portfolio.json`（欄位異動後相容性）

## 7. Verification

- [x] 7.1 執行 `npm run build`，確認 TypeScript 無型別錯誤
- [x] 7.2 執行完整 generate 流程（`node dist/index.js generate`），確認 `output/` 產出正確的 HTML 結構
- [x] 7.3 用瀏覽器直接開啟 `output/index.html`，確認首頁正常渲染（Hero、repos、skills）
- [x] 7.4 驗證 `output/projects.html` 搜尋/篩選功能正常
- [x] 7.5 驗證任一 `output/projects/{name}.html` 的 commit chart 正確渲染
- [x] 7.6 在 Web UI 執行 Generate → 點擊 Preview → 確認靜態 server 在 port 4321 啟動，頁面正常顯示
