## REMOVED Requirements

### Requirement: Scaffold Astro Template to Output Directory
**Reason**: Output 不再是 Astro 專案，不需要複製 Astro template 檔案（`astro.config.mjs`、`tailwind.config.mjs`、`package.json`、`.astro` 等）。
**Migration**: `scaffold.ts` 改為只複製靜態資產（`favicon.svg`）至 `output/`。

### Requirement: Astro Template Pages
**Reason**: 頁面改由 `plain-html-generator` 在 generate-time 直接渲染為 HTML 檔案。
**Migration**: 參閱 `plain-html-generator` spec 的 Home/Projects/Skills/Repo Detail 頁面需求。

---

## MODIFIED Requirements

### Requirement: Write portfolio.json
系統 SHALL 將 AI 增強後的完整資料序列化為 `output/src/data/portfolio.json`，結構包含：`profile`（使用者基本資料 + AI bio）、`repos`（**所有傳入的** repos）、`featuredRepos`（前 6 個 public repos，**依 `pushedAt` 降序排列**）、`skills`（AI 技能分析）、`languageBreakdown`（前 12 種語言）、`generatedAt`（ISO timestamp）、`meta`（`siteTitle`、`theme`）。

`enable` 欄位 SHALL 不再寫入 `portfolio.json`（已由 Visibility 篩選在 generate 前處理）。`portfolio.json` 保留作為 `/api/repos` API route 讀取的資料來源。

#### Scenario: 正常寫入
- **WHEN** AI 增強完成
- **THEN** `portfolio.json` 寫入 `output/src/data/`，不含 `enable` 欄位，HTML renderer 可直接使用

#### Scenario: Private repos 處理
- **WHEN** 抓取結果包含 private repos
- **THEN** private repos 出現在 `repos` 陣列中（標有 `isPrivate: true`），但不出現在 `featuredRepos` 中

#### Scenario: Featured repos 依最近更新排序
- **WHEN** 多個 public repos 符合條件
- **THEN** `featuredRepos` 依 `pushedAt` 降序排列，最多 6 個

---

### Requirement: Astro Template Theme（Stone + Amber）
網站 SHALL 使用 Tailwind CSS 實作深色主題，色系以 stone 為底色、amber 為強調色。字體 SHALL 使用 Inter（body）和 JetBrains Mono（mono 元素），透過 Google Fonts CDN 載入。CSS SHALL 透過 Tailwind Play CDN 套用（`<script src="https://cdn.tailwindcss.com">`），不需本地編譯。

#### Scenario: 深色主題基礎色
- **WHEN** 網站載入
- **THEN** 背景為 `stone-950`，卡片為 `stone-900`，主文字為 `stone-100`，強調色為 `amber-500`

#### Scenario: 互動狀態
- **WHEN** 使用者 hover 專案卡片
- **THEN** 卡片邊框變為 `amber-500`，有 transition 動畫

---

### Requirement: Generate README in Output Directory
系統 SHALL 在 output 目錄生成 `README.md`，說明這是用 git-folio 生成的靜態作品集網站，以及如何使用 git-folio 重新生成資料。README SHALL 不再包含 `npm install`、`npm run dev`、`npm run build` 等指令（因為 output 已是純靜態網站）。

#### Scenario: README 內容
- **WHEN** 生成完成
- **THEN** README 包含生成時間，以及如何用 git-folio 重新 generate 的說明；不包含 npm 操作指令
