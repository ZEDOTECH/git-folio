## ADDED Requirements

### Requirement: Validate OpenAI API Key
系統 SHALL 從 `.env` 讀取 `OPENAI_API_KEY`。若未設定且未使用 `--skip-ai` 旗標，SHALL 拋出明確錯誤訊息並終止執行。

#### Scenario: API Key 缺失且未 skip
- **WHEN** `OPENAI_API_KEY` 未設定，且未傳入 `--skip-ai`
- **THEN** 輸出「OPENAI_API_KEY not found in .env. Use --skip-ai to skip AI enrichment.」並結束

#### Scenario: 傳入 --skip-ai
- **WHEN** 使用者傳入 `--skip-ai`
- **THEN** 系統跳過所有 AI 分析，repo 描述直接使用 GitHub 原始 `description`

---

### Requirement: Generate Per-Repo AI Summary
系統 SHALL 為每個 repo 呼叫 OpenAI，以 repo 的名稱、GitHub description、primaryLanguage、完整語言列表（含百分比）、topics、README 前 1500 字元、最近 20 筆 commit messages 為輸入，同時生成：（1）不超過 25 字的一句話精華描述（`summary`）；（2）最多 5 個具體技術標籤（`techTags`，如 `"React"`、`"Docker"`）；（3）最多 3 個從全域技能清單中選出的技能分類（`skillCategories`）。所有 repo 的處理 SHALL 以最多 5 個並發請求平行處理（`p-limit(5)`）。`max_completion_tokens` SHALL 設為 2000（reasoning model 需要足夠 token budget 供內部推理使用）。

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

---

### Requirement: Generate Professional Bio
系統 SHALL 根據以下輸入生成 2-3 句第一人稱專業 Bio：使用者 GitHub 個人資料（name、bio、company、location）、**語言比例前 5 名（含百分比）**、**完整技能分析（name + description）**、**前 5 個最高 star 的 public repos 名稱**。

當抓取資料包含 private repos 時（`data.repos` 中有 `isPrivate: true`），prompt SHALL **額外附加匿名化 private repo 資訊**：private repo 數量、主要語言聚合、topics 聚合、所有 repos 的活躍年份跨度。

Prompt 中 SHALL 明確指示避免「passionate developer」等陳腔濫調。

若 AI 生成失敗或回傳空值，系統 SHALL fallback 至 `viewer.bio`；若 `viewer.bio` 亦為空，SHALL 使用組合 fallback bio（參見 `bio-generation` spec）。

#### Scenario: 成功生成 Bio（含 private repo 資訊）
- **WHEN** OpenAI API 回應包含 `{ "bio": "..." }`，且資料中有 private repos
- **THEN** 返回 AI 生成的 bio 字串（AI 可參考語言比例、技能描述、匿名 private 資訊）

#### Scenario: 成功生成 Bio（純 public 帳號）
- **WHEN** OpenAI API 回應包含 `{ "bio": "..." }`，資料中無 private repos
- **THEN** 返回 AI 生成的 bio 字串（prompt 不含 private 資訊）

#### Scenario: 生成失敗，GitHub bio 存在
- **WHEN** OpenAI API 呼叫失敗或回傳空值，`viewer.bio` 不為 null
- **THEN** Fallback 為 `viewer.bio`

#### Scenario: 生成失敗，GitHub bio 也為空
- **WHEN** OpenAI API 失敗且 `viewer.bio` 為 null 或空字串
- **THEN** 使用組合 fallback bio，確保返回非空字串

---

### Requirement: Compute Language Breakdown
系統 SHALL 彙整所有 repos 的語言 bytes 資料，計算每種語言佔總 bytes 的百分比，並依百分比降序排列。此計算 SHALL 在本機執行，不依賴 AI。

#### Scenario: 計算語言比例
- **WHEN** 有多個 repos 各有不同語言分布
- **THEN** 輸出按百分比降序的語言陣列，每個元素含 `name`、`color`、`bytes`、`percentage`

#### Scenario: 沒有任何語言資料
- **WHEN** 所有 repos 均無語言資料（如空 repo）
- **THEN** 返回空陣列，不拋出錯誤
