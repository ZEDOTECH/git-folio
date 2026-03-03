## MODIFIED Requirements

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
