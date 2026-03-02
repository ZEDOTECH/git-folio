## ADDED Requirements

### Requirement: Scaffold Astro Template to Output Directory
系統 SHALL 將 CLI 套件內的 `src/template/` 目錄完整複製到使用者指定的 output 目錄（預設 `./output`）。若 output 目錄已存在，SHALL 更新模板檔案但保留 `src/data/portfolio.json` 不被覆蓋（其中含有使用者編輯的 `enable` 欄位）。

#### Scenario: 首次生成
- **WHEN** output 目錄不存在
- **THEN** 建立 output 目錄並複製完整模板（含 `astro.config.mjs`、`package.json`、`tailwind.config.mjs`、`src/` 等）

#### Scenario: 重新生成（output 已存在）
- **WHEN** output 目錄已存在（使用者已修改過 `enable` 等設定）
- **THEN** 更新模板檔案，但 `src/data/portfolio.json` 保留不覆蓋

---

### Requirement: Write portfolio.json
系統 SHALL 將 AI 增強後的完整資料序列化為 `output/src/data/portfolio.json`，結構包含：`profile`（使用者基本資料 + AI bio）、`repos`（**所有** repos，每個帶有 `enable` 欄位）、`featuredRepos`（前 6 個 public 且 `enable: true` 的 repos，依 star 數降序）、`skills`（AI 技能分析）、`languageBreakdown`（前 12 種語言）、`generatedAt`（ISO timestamp）、`meta`（`siteTitle`、`theme`）。

#### Scenario: 正常寫入
- **WHEN** AI 增強完成
- **THEN** `portfolio.json` 寫入 output 目錄，所有欄位完整，Astro build 可直接使用

#### Scenario: Private repos 處理
- **WHEN** 抓取結果包含 private repos（預設行為）
- **THEN** private repos 出現在 `repos` 陣列中（標有 `isPrivate: true`），但不出現在 `featuredRepos` 中

---

### Requirement: Astro Template Pages
Astro 模板 SHALL 包含三個頁面：
1. `index.astro`：Hero（大頭照 + 名字 + Bio）+ Featured 6 repos + 技能概覽
2. `projects.astro`：所有 repos 的格狀列表 + 客戶端即時搜尋（文字搜尋 + 語言篩選，純 vanilla JS）
3. `skills.astro`：語言比例長條圖 + 技能區塊

#### Scenario: projects 頁搜尋功能
- **WHEN** 使用者在搜尋框輸入文字
- **THEN** 即時過濾 repo 卡片（不重新載入頁面）；同時支援語言下拉篩選

#### Scenario: 空狀態
- **WHEN** 搜尋結果為零
- **THEN** 顯示「No projects found」訊息

---

### Requirement: Astro Template Theme（Stone + Amber）
模板 SHALL 使用 Tailwind CSS 實作深色主題，色系以 stone 為底色、amber 為強調色。字體 SHALL 使用 Geist（body）和 JetBrains Mono（code 元素/標題點綴），透過 Google Fonts 或 Fontsource 載入。

#### Scenario: 深色主題基礎色
- **WHEN** 網站載入
- **THEN** 背景為 `stone-950`，卡片為 `stone-900`，主文字為 `stone-100`，強調色為 `amber-500`

#### Scenario: 互動狀態
- **WHEN** 使用者 hover 專案卡片
- **THEN** 卡片邊框變為 `amber-500`，有 transition 動畫

---

### Requirement: Generate README in Output Directory
系統 SHALL 在 output 目錄生成 `README.md`，說明如何安裝依賴、啟動開發伺服器、build 靜態檔案。

#### Scenario: README 內容
- **WHEN** 生成完成
- **THEN** README 包含：生成時間、`npm install` + `npm run dev` + `npm run build` 命令說明
