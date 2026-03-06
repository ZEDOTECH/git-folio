## Requirements

### Requirement: HTML Page Rendering from Portfolio Data
系統 SHALL 在 generate-time 直接從 portfolio data 渲染出所有 HTML 頁面，無需後續 build 步驟。輸出至 `output/` 的 HTML 檔案可直接用瀏覽器開啟。

#### Scenario: 成功渲染所有頁面
- **WHEN** generate pipeline 完成
- **THEN** `output/` 包含 `index.html`、`projects.html`、`skills.html`，以及每個 repo 一個 `output/projects/{name}.html`

#### Scenario: 渲染排除 disabled repos
- **WHEN** portfolio data 中的 repos 皆已透過 Visibility 篩選（includedRepos）
- **THEN** 所有傳入 HTML renderer 的 repos 皆直接渲染，不再做 `enable` 欄位二次過濾

---

### Requirement: Shared Layout with Header and Footer
每個 HTML 頁面 SHALL 使用共用的 `renderLayout(content, opts)` 函式包覆，包含：sticky header（logo + nav + GitHub icon）、`<main>` 內容區、footer（git-folio link + 生成時間）。

#### Scenario: 導覽列 active 狀態
- **WHEN** 渲染 `projects.html`
- **THEN** nav 中「Projects」連結套用 active 樣式（`text-amber-400 font-medium`），其他連結套用非 active 樣式

#### Scenario: Footer 生成時間
- **WHEN** 任何頁面載入
- **THEN** footer 顯示 `portfolio.generatedAt` 格式化後的日期

---

### Requirement: CSS via Tailwind CDN
每個 HTML 頁面的 `<head>` SHALL 包含 `<script src="https://cdn.tailwindcss.com"></script>`。自訂元件樣式（`.card`、`.mono`、`.tag`、`.btn-ghost`、`.section-title`、`.section-subtitle`）SHALL 以 `<style type="text/tailwindcss">` inline block 定義。

#### Scenario: 樣式套用
- **WHEN** 頁面在有網路連線的瀏覽器開啟
- **THEN** Tailwind utility class 與自訂元件 class 皆正確渲染

---

### Requirement: HTML Entity Escaping
所有來自 portfolio data 的使用者字串（repo name、description、bio、login、topic 等）在插入 HTML 前 SHALL 經過 HTML entity escaping（`&`, `<`, `>`, `"`, `'`）。

#### Scenario: 含特殊字元的 description
- **WHEN** repo description 包含 `<script>` 或 `&` 等字元
- **THEN** 渲染到 HTML 時以 entity 形式呈現（`&lt;script&gt;`、`&amp;`），不執行為 HTML

---

### Requirement: Home Page (index.html)
`index.html` SHALL 渲染：Hero section（大頭照 + 名字 + bio + GitHub/website 連結）、Recently Updated section（最多 6 個 featuredRepos 的卡片格）、Skills & Expertise section（最多 8 個 skills）、Languages section（語言分佈長條 + legend）。

#### Scenario: 首頁載入
- **WHEN** 使用者開啟 `index.html`
- **THEN** 顯示 Hero、Recently Updated（含「View all →」連結至 `projects.html`）、Skills（含「View full breakdown →」連結至 `skills.html`）、Languages

---

### Requirement: Projects Page (projects.html)
`projects.html` SHALL 渲染所有 repos 的卡片格，並包含客戶端即時搜尋（文字）和語言篩選（下拉）功能。

#### Scenario: 搜尋篩選
- **WHEN** 使用者在搜尋框輸入文字
- **THEN** 卡片即時顯示/隱藏，無頁面重新載入；語言下拉同時有效

#### Scenario: 空狀態
- **WHEN** 搜尋結果為零
- **THEN** 顯示「No projects found」訊息

---

### Requirement: Skills Page (skills.html)
`skills.html` SHALL 渲染語言分佈長條圖、每種語言的水平進度條，以及 AI 分析的 skill area 卡片。

#### Scenario: 無技能資料
- **WHEN** `skills` 和 `languageBreakdown` 皆為空
- **THEN** 顯示「No skill data available. Run with AI enabled to generate analysis.」

---

### Requirement: Repo Detail Page (projects/{name}.html)
每個 repo SHALL 生成一個 `output/projects/{name}.html`，包含：header（repo name + 日期範圍 + description + GitHub/Demo 連結）、stats row（stars、forks、total commits、repo size）、commit activity chart（client-side 渲染）、language breakdown、contributors（public repos）、topics & matched skills。

#### Scenario: Commit Chart 渲染
- **WHEN** repo 有 commit 資料（`commitsByWeek` 或 `commitsByDay`）
- **THEN** 頁面 embed raw commit JSON，client-side JS 計算座標並渲染 SVG bar chart；`< 14 weeks` 資料用 daily view，否則用 weekly view

#### Scenario: Private repo 不顯示 contributors
- **WHEN** repo 為 private
- **THEN** Contributors section 不渲染

#### Scenario: 返回連結
- **WHEN** 使用者在 repo 詳細頁
- **THEN** 頁面頂部有「← All projects」連結至 `projects.html`
