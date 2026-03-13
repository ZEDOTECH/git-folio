## Context

Web UI 的 Generate tab 在 output 目錄已存在時，使用瀏覽器原生 `window.confirm()` 詢問是否刪除重建。這是個二元選擇（確認/取消），但原生 dialog 樣式不符 dark theme 設計語言，且行為語意不清晰。

後端 `POST /api/generate` 已透過 `cleanOutput` boolean 支援兩種模式（刪除或覆蓋），前端只需提供對應的 UI 選項。

## Goals / Non-Goals

**Goals:**
- 提供兩選項 modal 取代 `window.confirm`：Cancel / Regenerate
- 確保 Regenerate 以 `cleanOutput: true` 觸發完整 pipeline（含 AI enrichment）
- 保持與現有設計語言一致（dark theme、amber accent）

**Non-Goals:**
- 不修改後端 API（`cleanOutput` 欄位已足夠）
- 不增加其他 modal 用途

## Decisions

**自訂 modal 而非第三方 library**
純 HTML/CSS/JS，不引入額外依賴。`index.html` 自帶所有樣式，`app.js` 用 Promise 封裝 modal 互動。這與整個 Web UI 的無 build step 架構一致。

**兩個按鈕的語意設計**
- `Cancel`（ghost）：放左側，明確表示「什麼都不做」
- `Regenerate`（primary/amber）：放右側，視覺上最顯眼，對應刪除重建行為（`cleanOutput: true`）

**`showOutputModal` 回傳 boolean**
resolve `true` → Regenerate（`cleanOutput = true`）；resolve `false` → Cancel（return）。

## Risks / Trade-offs

[重複點擊 modal 按鈕] → 每次開啟 modal 時重新綁定 onclick，確保只有最新的 handler 生效（不累積多個 listener）

[Modal 沒有 ESC 鍵支援] → 點擊 overlay 背景可關閉（等同 Cancel），可接受
