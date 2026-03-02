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
系統 SHALL 為每個 repo 呼叫 OpenAI gpt-4o-mini，以 repo 的名稱、GitHub description、primaryLanguage、topics、README 前 1500 字元、最近 5 筆 commit headlines 為輸入，生成不超過 25 字的一句話精華描述。所有 repo 的摘要 SHALL 以最多 5 個並發請求平行處理（`p-limit(5)`）。

#### Scenario: 成功生成摘要
- **WHEN** OpenAI API 回應包含 `{ "summary": "..." }`
- **THEN** 該 repo 的 `aiSummary` 設為此值

#### Scenario: API 呼叫失敗
- **WHEN** OpenAI API 回應錯誤（網路異常、timeout、rate limit 等）
- **THEN** 該 repo 的 `aiSummary` fallback 為 GitHub 原始 `description`，不中斷其他 repos 的處理，並印出警告訊息

#### Scenario: Private repo 且 --skip-private-descriptions
- **WHEN** repo `isPrivate = true` 且使用者傳入 `--skip-private-descriptions`
- **THEN** 跳過 AI 分析，`aiSummary` 直接設為 GitHub 原始 `description`

---

### Requirement: Generate Skills Analysis
系統 SHALL 對所有 repos 執行一次整體技能分析（非 per-repo），以前 30 個 repos 的名稱/語言/描述及前 10 大語言百分比為輸入，生成 6-8 個具體技能區塊（非單純語言名稱），每個技能包含：`name`、`description`（一句話）、`level`（expert/advanced/proficient）、`relatedTech`（相關技術清單）。

#### Scenario: 成功生成技能分析
- **WHEN** OpenAI API 回應包含合法的 `{ "skills": [...] }` JSON
- **THEN** 返回技能陣列，每個元素含 `name`、`description`、`level`、`relatedTech`

#### Scenario: 分析失敗
- **WHEN** OpenAI API 呼叫失敗
- **THEN** 返回空陣列 `[]`，不中斷網站生成流程

---

### Requirement: Generate Professional Bio
系統 SHALL 根據使用者 GitHub 個人資料（name、bio、company、location）、前 5 個最高 star 的 public repos 名稱、技能分析結果，生成 2-3 句第一人稱專業 Bio。Prompt 中 SHALL 明確指示避免「passionate developer」等陳腔濫調。

#### Scenario: 成功生成 Bio
- **WHEN** OpenAI API 回應包含 `{ "bio": "..." }`
- **THEN** 返回此 Bio 字串

#### Scenario: 生成失敗
- **WHEN** OpenAI API 呼叫失敗
- **THEN** Fallback 為 GitHub 個人資料的 `bio` 欄位，或空字串

---

### Requirement: Compute Language Breakdown
系統 SHALL 彙整所有 repos 的語言 bytes 資料，計算每種語言佔總 bytes 的百分比，並依百分比降序排列。此計算 SHALL 在本機執行，不依賴 AI。

#### Scenario: 計算語言比例
- **WHEN** 有多個 repos 各有不同語言分布
- **THEN** 輸出按百分比降序的語言陣列，每個元素含 `name`、`color`、`bytes`、`percentage`

#### Scenario: 沒有任何語言資料
- **WHEN** 所有 repos 均無語言資料（如空 repo）
- **THEN** 返回空陣列，不拋出錯誤
