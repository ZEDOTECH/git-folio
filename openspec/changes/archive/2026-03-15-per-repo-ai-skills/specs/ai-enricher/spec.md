## MODIFIED Requirements

### Requirement: Generate Per-Repo AI Summary
系統 SHALL 為每個 repo 呼叫 OpenAI，以 repo 的名稱、GitHub description、primaryLanguage、完整語言列表（含百分比）、topics、README 前 1500 字元、最近 20 筆 commit messages 為輸入，同時生成：（1）不超過 25 字的一句話精華描述（`summary`）；（2）最多 5 個具體技術標籤（`techTags`，如 `"React"`、`"Docker"`）；（3）最多 3 個從全域技能清單中選出的技能分類（`skillCategories`）。所有 repo 的處理 SHALL 以最多 5 個並發請求平行處理（`p-limit(5)`）。`max_completion_tokens` SHALL 設為 400。

全域技能清單 SHALL 在 per-repo 呼叫前先完成生成，並以名稱清單形式注入每個 repo 的 prompt。

#### Scenario: 成功生成摘要與技能
- **WHEN** OpenAI API 回應包含 `{ "summary": "...", "techTags": [...], "skillCategories": [...] }`
- **THEN** 該 repo 的 `aiSummary` 設為 `summary`；`repoTechTags` 設為 `techTags`（最多 5 個）；`repoSkillCategories` 設為 `skillCategories`（最多 3 個，且限全域技能名稱範圍內）

#### Scenario: API 呼叫失敗
- **WHEN** OpenAI API 回應錯誤（網路異常、timeout、rate limit 等）
- **THEN** 該 repo 的 `aiSummary` fallback 為 GitHub 原始 `description`，`repoTechTags` 和 `repoSkillCategories` 設為 `[]`，不中斷其他 repos 的處理，並印出警告訊息

#### Scenario: Private repo 且 --skip-private-descriptions
- **WHEN** repo `isPrivate = true` 且使用者傳入 `--skip-private-descriptions`
- **THEN** 跳過 AI 分析，`aiSummary` 直接設為 GitHub 原始 `description`，`repoTechTags` 和 `repoSkillCategories` 設為 `[]`

---

### Requirement: Generate Skills Analysis
系統 SHALL 對所有 repos 執行一次整體技能分析，**並在 per-repo enrichment 之前完成**。以前 30 個 repos 的名稱/語言/描述及前 10 大語言百分比為輸入，生成 6-8 個具體技能區塊（非單純語言名稱），每個技能包含：`name`、`description`（一句話）、`level`（expert/advanced/proficient）、`relatedTech`（相關技術清單）。生成後的技能名稱清單 SHALL 傳入每個 repo 的 per-repo enrichment prompt。

#### Scenario: 成功生成技能分析
- **WHEN** OpenAI API 回應包含合法的 `{ "skills": [...] }` JSON
- **THEN** 返回技能陣列，每個元素含 `name`、`description`、`level`、`relatedTech`；技能名稱清單傳入後續 per-repo 呼叫

#### Scenario: 分析失敗
- **WHEN** OpenAI API 呼叫失敗
- **THEN** 返回空陣列 `[]`，per-repo prompt 中的全域技能清單為空，不中斷網站生成流程
