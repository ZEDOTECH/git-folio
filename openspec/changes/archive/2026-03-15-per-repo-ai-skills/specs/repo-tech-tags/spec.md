## ADDED Requirements

### Requirement: Per-Repo AI Tech Tag Extraction
系統 SHALL 在每個 repo 的 AI 摘要呼叫中同時萃取 `techTags`（具體技術名稱清單，如 `["React", "Docker", "PostgreSQL"]`）與 `skillCategories`（全域技能分類名稱清單，如 `["Full-Stack Web Development"]`）。`techTags` 最多 5 個；`skillCategories` 最多 3 個，且必須從已生成的全域技能名稱中選取（不可創造新分類）。

#### Scenario: 成功萃取 tech tags
- **WHEN** OpenAI 回應包含 `{ "summary": "...", "techTags": [...], "skillCategories": [...] }`
- **THEN** `EnrichedRepo.repoTechTags` 設為 `techTags`（最多取 5 個）；`EnrichedRepo.repoSkillCategories` 設為 `skillCategories`（最多取 3 個）

#### Scenario: AI 回應缺少 techTags
- **WHEN** OpenAI 回應只包含 `{ "summary": "..." }`（缺少 techTags 欄位）
- **THEN** `repoTechTags` fallback 為 `[]`，`repoSkillCategories` fallback 為 `[]`，不中斷流程

#### Scenario: AI 輸出超過上限標籤數
- **WHEN** OpenAI 回應的 `techTags` 包含超過 5 個項目
- **THEN** 系統只取前 5 個，其餘丟棄

#### Scenario: skillCategories 包含不存在的全域技能名稱
- **WHEN** OpenAI 輸出的某個 skillCategory 名稱不在全域技能清單中
- **THEN** 系統過濾掉該名稱，只保留與全域技能名稱完全匹配的項目

---

### Requirement: Tech Tag Display on Repo Cards
系統 SHALL 在 repo 卡片上渲染雙層技能徽章：
- **Layer 1**（`repoTechTags`）：實心背景徽章，依技術類別使用不同色彩
- **Layer 2**（`repoSkillCategories`）：外框徽章（border 樣式），使用統一的 stone/amber 色系

兩層徽章皆出現在 `projects.html` 的 repo 卡片與 `projects/{name}.html` 的詳細頁。首頁 `index.html` 的 featured 卡片僅顯示 `repoTechTags`。

#### Scenario: 卡片有兩層技能資料
- **WHEN** repo 同時有 `repoTechTags` 和 `repoSkillCategories`
- **THEN** 卡片先顯示實心 tech tag 徽章，其後顯示外框 skill category 徽章，視覺可明確區分

#### Scenario: repo 無任何技能資料
- **WHEN** `repoTechTags` 和 `repoSkillCategories` 皆為空陣列
- **THEN** 卡片不顯示技能徽章區塊，不留空白間距

#### Scenario: 首頁 featured 卡片
- **WHEN** 渲染 `index.html` 的 featured repos 區塊
- **THEN** 每張卡片只顯示 `repoTechTags` 徽章，不顯示 `repoSkillCategories`
