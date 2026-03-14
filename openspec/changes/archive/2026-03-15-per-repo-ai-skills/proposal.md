## Why

目前每個 repo 顯示的技能標籤是透過字串比對（repo 語言 vs 全域技能的 `relatedTech`）產生，導致不相關的技能被錯誤配對（如純 CLI 工具顯示「Web Development」）。應改為讓 AI 直接針對每個 repo 的 README、commit 訊息、語言組成進行分析，才能輸出真正準確的技能標籤。

## What Changes

- **新增 per-repo AI 技能萃取**：在每個 repo 的 AI 摘要呼叫中同時萃取具體技術標籤（如 `["React", "Docker", "PostgreSQL"]`）
- **新增 commit message 抓取**：GitHub GraphQL query 加入 commit `message` 欄位，提供更豐富的 AI 分析輸入
- **兩層技能顯示**：
  - **Layer 1**：`repoTechTags`（具體技術，如 `React`、`Docker`）→ 實心色彩徽章
  - **Layer 2**：`repoSkillCategories`（全域技能分類，如 `Full-Stack Web Development`）→ 外框徽章
- **移除字串比對邏輯**：`data-writer.ts` 的 `matchedSkills()` 替換為直接使用 AI 萃取結果
- **UI 更新**：repo 卡片與詳細頁改用雙層徽章顯示，以顏色區分兩種技能類型

## Capabilities

### New Capabilities
- `repo-tech-tags`: Per-repo AI 萃取的具體技術標籤，包含 commit message 作為額外輸入，並在 repo 卡片上以實心色彩徽章顯示

### Modified Capabilities
- `ai-enricher`: Generate Per-Repo AI Summary 需同時回傳 `techTags`；技能分析 prompt 輸入需包含 commit messages；新增 per-repo → 全域技能 category 的 AI 配對邏輯
- `github-fetcher`: Fetch All Repositories 需包含 commit `message` 欄位（spec 中已提及 `messageHeadline` 但實際 query 未實作）
- `plain-html-generator`: Repo Detail Page 和 Projects Page 的 repo 卡片需渲染雙層技能徽章（實心 vs 外框，不同色彩）

## Impact

- `src/github/queries.ts`：加入 `message` 欄位
- `src/github/types.ts`：`RepoCommit` 加 `message?: string`
- `src/github/transformer.ts`：傳遞 commit message
- `src/ai/prompts.ts`：`buildProjectSummaryPrompt` 輸出改為 `{ summary, techTags, skillCategories }`
- `src/ai/types.ts`：`EnrichedRepo` 加 `repoTechTags: string[]`、`repoSkillCategories: string[]`
- `src/ai/enricher.ts`：解析新欄位，`max_completion_tokens: 150 → 400`
- `src/generator/data-writer.ts`：移除 `matchedSkills()`，改用 `r.repoTechTags` / `r.repoSkillCategories`
- `src/generator/html/`：repo 卡片與詳細頁加入雙層徽章 UI
