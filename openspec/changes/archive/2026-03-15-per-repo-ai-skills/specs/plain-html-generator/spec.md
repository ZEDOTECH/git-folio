## MODIFIED Requirements

### Requirement: Repo Detail Page (projects/{name}.html)
每個 repo SHALL 生成一個 `output/projects/{name}.html`，包含：header（repo name + 日期範圍 + description + GitHub/Demo 連結）、stats row（stars、forks、total commits、repo size）、commit activity chart（client-side 渲染）、language breakdown、contributors（public repos）、topics 區塊、**雙層技能徽章**（`repoTechTags` 實心徽章 + `repoSkillCategories` 外框徽章）。

#### Scenario: Commit Chart 渲染
- **WHEN** repo 有 commit 資料（`commitsByWeek` 或 `commitsByDay`）
- **THEN** 頁面 embed raw commit JSON，client-side JS 計算座標並渲染 SVG bar chart；`< 14 weeks` 資料用 daily view，否則用 weekly view

#### Scenario: Private repo 不顯示 contributors
- **WHEN** repo 為 private
- **THEN** Contributors section 不渲染

#### Scenario: 返回連結
- **WHEN** 使用者在 repo 詳細頁
- **THEN** 頁面頂部有「← All projects」連結至 `projects.html`

#### Scenario: 雙層技能徽章渲染
- **WHEN** repo 同時有 `repoTechTags` 和 `repoSkillCategories`
- **THEN** 詳細頁的技能區塊先顯示實心背景的 tech tag 徽章（amber/blue/emerald 等多色），再顯示外框樣式的 skill category 徽章（stone border），兩層之間有間距分隔

#### Scenario: 技能資料為空
- **WHEN** `repoTechTags` 和 `repoSkillCategories` 皆為空陣列
- **THEN** 不渲染技能徽章區塊

---

### Requirement: Projects Page (projects.html)
`projects.html` SHALL 渲染所有 repos 的卡片格，並包含客戶端即時搜尋（文字）和語言篩選（下拉）功能。每張 repo 卡片 SHALL 顯示雙層技能徽章（`repoTechTags` 實心徽章 + `repoSkillCategories` 外框徽章）。

#### Scenario: 搜尋篩選
- **WHEN** 使用者在搜尋框輸入文字
- **THEN** 卡片即時顯示/隱藏，無頁面重新載入；語言下拉同時有效

#### Scenario: 空狀態
- **WHEN** 搜尋結果為零
- **THEN** 顯示「No projects found」訊息

#### Scenario: 卡片雙層技能徽章
- **WHEN** 渲染 repo 卡片且 repo 有 `repoTechTags` 或 `repoSkillCategories`
- **THEN** 卡片底部顯示技能徽章：實心 tech tags 在前，外框 skill categories 在後，最多顯示各 3 個（超出以「+N」省略）
