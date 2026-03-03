## MODIFIED Requirements

### Requirement: Write portfolio.json
系統 SHALL 將 AI 增強後的完整資料序列化為 `output/src/data/portfolio.json`，結構包含：`profile`（使用者基本資料 + AI bio）、`repos`（**所有** repos，每個帶有 `enable` 欄位）、`featuredRepos`（前 6 個 public 且 `enable: true` 的 repos，**依 `pushedAt` 降序排列**）、`skills`（AI 技能分析）、`languageBreakdown`（前 12 種語言）、`generatedAt`（ISO timestamp）、`meta`（`siteTitle`、`theme`）。

#### Scenario: 正常寫入
- **WHEN** AI 增強完成
- **THEN** `portfolio.json` 寫入 output 目錄，所有欄位完整，Astro build 可直接使用

#### Scenario: Private repos 處理
- **WHEN** 抓取結果包含 private repos（預設行為）
- **THEN** private repos 出現在 `repos` 陣列中（標有 `isPrivate: true`），但不出現在 `featuredRepos` 中

#### Scenario: Featured repos 依最近更新排序
- **WHEN** 多個 public repos 符合條件
- **THEN** `featuredRepos` 依 `pushedAt` 降序（最近 push 的排在最前面），最多 6 個

---

### Requirement: Astro Template Pages
Astro 模板 SHALL 包含三個頁面：
1. `index.astro`：Hero（大頭照 + 名字 + Bio）+ **Recently Updated**（最近更新的 6 個 repos）+ 技能概覽
2. `projects.astro`：所有 repos 的格狀列表 + 客戶端即時搜尋（文字搜尋 + 語言篩選，純 vanilla JS）
3. `skills.astro`：語言比例長條圖 + 技能區塊

首頁 Recently Updated 區塊 SHALL 顯示標題「Recently Updated」和副標題「Latest activity from my repositories」，並附有「View all →」連結。

#### Scenario: projects 頁搜尋功能
- **WHEN** 使用者在搜尋框輸入文字
- **THEN** 即時過濾 repo 卡片（不重新載入頁面）；同時支援語言下拉篩選

#### Scenario: 空狀態
- **WHEN** 搜尋結果為零
- **THEN** 顯示「No projects found」訊息

#### Scenario: 首頁 Recently Updated 標題
- **WHEN** 首頁載入
- **THEN** 區塊標題為「Recently Updated」，副標題為「Latest activity from my repositories」

---

### Requirement: Astro Template Theme（Stone + Amber）
模板 SHALL 使用 Tailwind CSS 實作深色主題，色系以 stone 為底色、amber 為強調色。字體 SHALL 使用 Geist（body）和 JetBrains Mono（code 元素/標題點綴），透過 Google Fonts 或 Fontsource 載入。

Repo 卡片中，private badge 的文字色和日期範圍的文字色 SHALL 與 repo name 的文字色一致（`text-stone-100`）。

#### Scenario: 深色主題基礎色
- **WHEN** 網站載入
- **THEN** 背景為 `stone-950`，卡片為 `stone-900`，主文字為 `stone-100`，強調色為 `amber-500`

#### Scenario: 互動狀態
- **WHEN** 使用者 hover 專案卡片
- **THEN** 卡片邊框變為 `amber-500`，有 transition 動畫

#### Scenario: Repo 卡片 Private badge 顏色
- **WHEN** repo 為 private，卡片顯示 private badge
- **THEN** badge 文字色為 `text-stone-100`（與 repo name 一致）

#### Scenario: Repo 卡片日期顏色
- **WHEN** repo 有 createdAt 和 pushedAt
- **THEN** 日期範圍文字色為 `text-stone-100`（與 repo name 一致）
