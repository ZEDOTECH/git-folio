## Context

目前 `matchedSkills()` 函式（`src/generator/data-writer.ts`）對每個 repo 做字串比對：將 repo 的語言名稱與全域技能的 `relatedTech` 陣列逐一比較，導致大量誤配對。原因是語言名稱（如 `TypeScript`）與技術標籤（如 `React`）並非一對一關係，且全域技能是抽象分類，不適合直接貼在個別 repo 上。

每個 repo 的 AI 摘要生成（`buildProjectSummaryPrompt`）已有 README、語言、topics 作為輸入，但目前只輸出 `summary`，未善用這個呼叫萃取技能。

## Goals / Non-Goals

**Goals:**
- 在現有的 per-repo AI 摘要呼叫中同時萃取具體技術標籤（`techTags`）
- 在同一 prompt 中讓 AI 直接比對全域技能分類，輸出 `skillCategories`
- 加入 commit message 作為 AI 輸入，提高萃取準確度
- 用雙層徽章 UI 區分「具體技術」與「技能分類」

**Non-Goals:**
- 不新增額外 OpenAI API 呼叫（技能萃取合併至現有 per-repo 呼叫）
- 不改變全域技能分析流程（`buildSkillsAnalysisPrompt` 保持現狀）
- 不引入新的 AI 模型或 provider

## Decisions

### Decision 1：技能萃取合併至現有 per-repo 摘要呼叫

**選擇**：修改 `buildProjectSummaryPrompt`，在同一個 prompt 中同時輸出 `summary`、`techTags`、`skillCategories`。

**理由**：
- 避免 API 呼叫數倍增（原本已是最多並發 5 個呼叫），維持成本可控
- 三個輸出共享相同的輸入資訊（README、語言、commits），不需重複傳送
- `max_completion_tokens` 從 150 提升至 400 即可容納新欄位

**捨棄方案**：
- 獨立的 per-repo skills API 呼叫 → 費用和時間倍增，不必要
- 保留字串比對 + 改善邏輯 → 治標不治本，語意仍不準確

---

### Decision 2：skillCategories 在 per-repo prompt 中直接配對全域技能

**選擇**：在生成每個 repo 的 prompt 時，傳入完整的全域技能名稱清單（來自已生成的 `SkillArea[]`），讓 AI 從中選出相關分類。

**挑戰**：全域技能在 per-repo 呼叫時尚未生成（`enrich()` 中摘要生成和技能分析是平行執行的）。

**解法**：調整 `enrich()` 執行順序：
```
1. 先執行 generateSkills()（全域技能分析）
2. 再以全域技能清單為輸入，並行執行 per-repo enrichment
```
這增加了少量串行等待（一次全域技能呼叫），但換來每個 repo 能直接做 category 配對，避免後處理字串比對。

**捨棄方案**：先跑所有 per-repo 呼叫，再做 post-processing 配對 → 仍是字串比對的問題，只是改由 AI 產生 `relatedTech` 後比對

---

### Decision 3：commit message 加入 GitHub query

**選擇**：在 `REPO_FIELDS` GraphQL fragment 中加入 `message` 欄位。

**考量**：目前抓取 100 筆 commit，只使用日期做統計圖表，訊息未被使用。加入 `message` 可提供 AI 豐富的語義線索（如 `feat: add OAuth2 login` 明確指向 auth 相關技能）。

**限制**：每個 commit 訊息平均 50 字，100 筆 × 50 字 = 5000 字，送 AI 分析時只取最近 20 筆，約 1000 字。

---

### Decision 4：雙層徽章視覺設計

| 類型 | 資料來源 | 視覺樣式 |
|------|---------|---------|
| `repoTechTags` | AI 萃取（具體技術） | 實心背景徽章，多色系（amber/blue/emerald…依技術類別） |
| `repoSkillCategories` | AI 配對（全域技能分類） | 外框徽章（`border` 樣式），單一色系（stone/amber） |

在 repo 卡片（`projects.html`）與詳細頁（`projects/{name}.html`）皆顯示雙層。首頁 featured 卡片只顯示 `repoTechTags`（空間有限）。

## Risks / Trade-offs

- **執行順序串行化** → 全域技能分析（約 1-2 秒）改為先執行，稍微增加總體時間；但因後續 per-repo 仍並行，影響微小
- **Prompt token 增加** → 傳入全域技能清單（6-8 個技能名稱）約 200 tokens；per-repo 呼叫費用小幅增加
- **AI 輸出不穩定** → 部分 repo 的 `techTags` 可能輸出空陣列或過多標籤；以 `slice(0, 5)` 做上限保護，空值 fallback 為 `[]`
- **舊 cache 相容性** → 現有 `.git-folio-cache/github-data.json` 不含 commit messages；用戶需清除 cache 後重新抓取（Clear Cache 按鈕可處理）

## Migration Plan

1. 更新 GitHub query → commit message 欄位（新抓取才有訊息，舊 cache 欄位為 undefined/null，graceful fallback）
2. 更新型別定義和 transformer
3. 更新 AI enricher（執行順序 + prompt + parser）
4. 更新 data-writer（移除 `matchedSkills()`，使用新欄位）
5. 更新 HTML generator（雙層徽章 UI）
6. 無需 DB migration，`portfolio.json` 格式向後相容（新增欄位，不移除舊欄位）

## Open Questions

- 無
