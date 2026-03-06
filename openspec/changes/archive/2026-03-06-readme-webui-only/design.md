## Context

README 目前有兩條使用路徑：WebUI（`npm run ui`）和 CLI（`node dist/index.js generate`）。實際使用者幾乎只需要 WebUI，CLI 路徑造成文件混亂。此外，WebUI 說明本身有多處與實際實作不符的錯誤，需要一併修正。

## Goals / Non-Goals

**Goals:**
- 移除所有 CLI 操作說明（generate 指令、命令列選項、快取指令、更新指令）
- 修正 WebUI 流程說明，使其與 `index.html` 和 `app.js` 的實際行為一致
- 保留部署說明（Vercel/Netlify/GitHub Pages）作為獨立章節

**Non-Goals:**
- 修改任何程式碼（純文件修改）
- 新增 CLI 保護或隱藏機制

## Decisions

**決策 1：保留部署章節**
部署（Vercel/Netlify/GitHub Pages）雖然是 CLI 操作，但屬於 output 產出後的下游步驟，對使用者有實際需求，且與 git-folio 工具本身的 CLI 無關，因此保留。

**決策 2：Visibility 章節說明改為「Generate 前設定」**
根據 `app.js` 邏輯，Visibility 的勾選存入 localStorage，Generate 時讀取並附為 `includedRepos`。因此正確語意是「先決定哪些 repos 要 generate」，而非「generate 後控制顯示」。

**決策 3：移除手動編輯 portfolio.json 的說明**
WebUI 的 Visibility 已取代直接操作 `enable` 欄位的需求。保留此說明只會造成混亂。

## Risks / Trade-offs

[CLI 使用者找不到指令文件] → CLI 仍可正常使用，只是 README 不再說明。若未來需要，可補充進階文件或 `--help` 輸出。

## Migration Plan

單一檔案修改（`README.md`），無部署或回滾需求。
