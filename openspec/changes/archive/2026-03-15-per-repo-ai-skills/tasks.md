## 1. GitHub Data Layer（commit message）

- [x] 1.1 修改 `src/github/queries.ts`：在 `REPO_FIELDS` 的 `history` nodes 中加入 `message` 欄位
- [x] 1.2 修改 `src/github/types.ts`：`RepoCommit` interface 加入 `message?: string`
- [x] 1.3 修改 `src/github/transformer.ts`：`transformRepoNode` 中 `recentCommits` 傳遞 `message` 欄位

## 2. AI 型別與資料結構

- [x] 2.1 修改 `src/ai/types.ts`：`EnrichedRepo` 加入 `repoTechTags: string[]` 與 `repoSkillCategories: string[]`

## 3. AI Prompt 更新

- [x] 3.1 修改 `src/ai/prompts.ts`：`buildProjectSummaryPrompt` 加入完整語言列表（含百分比）、最近 20 筆 commit messages 作為輸入
- [x] 3.2 修改 `src/ai/prompts.ts`：`buildProjectSummaryPrompt` 加入全域技能名稱清單參數（`skillNames: string[]`）注入 prompt
- [x] 3.3 修改 `src/ai/prompts.ts`：`buildProjectSummaryPrompt` 輸出格式改為 `{ "summary": "...", "techTags": [...], "skillCategories": [...] }`

## 4. AI Enricher 邏輯更新

- [x] 4.1 修改 `src/ai/enricher.ts`：`enrich()` 改為先 `await generateSkills()`，取得全域技能清單後再執行 per-repo enrichment
- [x] 4.2 修改 `src/ai/enricher.ts`：per-repo enrichment 呼叫 `buildProjectSummaryPrompt` 時傳入全域技能名稱清單
- [x] 4.3 修改 `src/ai/enricher.ts`：`max_completion_tokens` 從 150 改為 2000（`gpt-5-mini` 為 reasoning model，需要更大 token budget 供推理使用）
- [x] 4.4 修改 `src/ai/enricher.ts`：解析 per-repo 回應中的 `techTags`（最多取 5 個）與 `skillCategories`（過濾非全域技能名稱，最多取 3 個），並設到 `EnrichedRepo`

## 5. Data Writer 更新

- [x] 5.1 修改 `src/generator/data-writer.ts`：移除 `matchedSkills()` 函式
- [x] 5.2 修改 `src/generator/data-writer.ts`：`repoEntry` 中 `matchedSkills` 欄位改為使用 `r.repoTechTags`（保留欄位名稱向後相容）或新增 `techTags` / `skillCategories` 欄位
- [x] 5.3 確認 `portfolio.json` 輸出結構包含 `techTags` 與 `skillCategories` 欄位

## 6. HTML Generator 雙層徽章 UI

- [x] 6.1 定位 repo 卡片渲染位置（`src/generator/html/` 相關檔案），確認目前 `matchedSkills` 的渲染邏輯
- [x] 6.2 修改 repo 卡片：`repoTechTags` 渲染為實心背景徽章（amber/blue/emerald 等多色，以技術類別區分）
- [x] 6.3 修改 repo 卡片：`repoSkillCategories` 渲染為外框徽章（stone border 樣式），接在 tech tags 後
- [x] 6.4 卡片徽章加入上限顯示：各最多 3 個，超出顯示「+N」
- [x] 6.5 修改 repo 詳細頁（`projects/{name}.html`）：同樣渲染雙層徽章，無上限限制
- [x] 6.6 修改首頁 featured 卡片（`index.html`）：只顯示 `repoTechTags`，不顯示 `repoSkillCategories`

## 7. 驗證

- [x] 7.1 執行 `npm run build` 確認 TypeScript 編譯無錯誤
- [x] 7.2 清除 cache 後執行 generate，確認每個 repo 的 `techTags` 與 `skillCategories` 有合理輸出
- [x] 7.3 開啟 `output/projects.html` 確認雙層徽章視覺正確顯示（實心 vs 外框可區分）
- [x] 7.4 確認無 repo 顯示與其內容無關的技能標籤
