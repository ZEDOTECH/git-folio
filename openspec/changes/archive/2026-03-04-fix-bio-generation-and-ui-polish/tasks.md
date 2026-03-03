## 1. Bio Prompt Enrichment

- [x] 1.1 更新 `buildBioPrompt` 簽名：加入 `languageBreakdown: LanguageBreakdown[]` 參數
- [x] 1.2 在 prompt 中加入語言比例（前 5 名，格式：`TypeScript: 45.2%`）
- [x] 1.3 將 skills 改為包含完整描述（`name: description`），不只傳名稱
- [x] 1.4 加入 private repo 匿名化資訊邏輯：判斷 `repos.some(r => r.isPrivate)` 後，附加 private repo 數量、主要語言聚合（去重）、topics 聚合（去重）、活躍年份跨度

## 2. Composed Fallback Bio

- [x] 2.1 在 `enricher.ts` 中實作 `static composeFallbackBio(viewer, languageBreakdown, skills, repos)` 方法（public static，供 CLI 與 server route 外部呼叫）
- [x] 2.2 Fallback bio 組合：name + company（若有）+ location（若有）+ 前 3 語言 + 前 2 技能名稱 + repo 總數
- [x] 2.3 更新 `generateBio` 方法簽名：加入 `languageBreakdown` 參數，並將 `buildBioPrompt` 呼叫傳入新參數
- [x] 2.4 更新 `generateBio` 失敗路徑：`viewer.bio` 為空時改用 `composeFallbackBio`，而非返回空字串
- [x] 2.5 更新 `enrich()` 呼叫 `generateBio` 時傳入 `languageBreakdown`

## 3. Skip-AI Fallback Path

- [x] 3.1 更新 `cli/commands/generate.ts` skip-AI 路徑：`bio` 欄位改為呼叫 `composeFallbackBio`（或等效邏輯），不再使用 `rawData.viewer.bio ?? ''`
- [x] 3.2 更新 `server/routes/generate.ts` skip-AI 路徑：同上，確保 server 路徑與 CLI 路徑一致

## 4. Featured Repos Sort

- [x] 4.1 更新 `data-writer.ts` `featuredRepos` 的排序：`b.stargazerCount - a.stargazerCount` 改為 `new Date(b.pushedAt).getTime() - new Date(a.pushedAt).getTime()`

## 5. Homepage Section Title

- [x] 5.1 更新 `index.astro` 首頁 section 標題：`"Featured Projects"` → `"Recently Updated"`
- [x] 5.2 更新 `index.astro` 首頁 section 副標題：`"Highlighted work from my repositories"` → `"Latest activity from my repositories"`

## 6. Repo Card Color Consistency

- [x] 6.1 更新 `ProjectCard.astro` private badge 文字色：`text-stone-300` → `text-stone-100`
- [x] 6.2 更新 `ProjectCard.astro` 日期範圍文字色：`text-stone-400` → `text-stone-100`
- [x] 6.3 更新 `projects.astro` inline 卡片 private badge 文字色：`text-stone-500` → `text-stone-100`
- [x] 6.4 更新 `projects.astro` inline 卡片日期範圍文字色：`text-stone-600` → `text-stone-100`
