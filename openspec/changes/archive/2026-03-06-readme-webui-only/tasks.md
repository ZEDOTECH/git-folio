## 1. 移除 CLI 章節

- [x] 1.1 刪除「## 命令列使用（進階）」整個章節（步驟 1~4：generate / preview / build / deploy）
- [x] 1.2 刪除「## generate 命令選項」章節（選項表格與範例）
- [x] 1.3 刪除「## 快取機制」章節（`node dist/index.js clear-cache` 等）
- [x] 1.4 刪除「## 更新資料」章節
- [x] 1.5 刪除「## 管理要展示的 Repos」章節（手動改 `portfolio.json` enable 欄位）

## 2. 修正 WebUI 流程說明

- [x] 2.1 將快速開始的 Tab 順序改為 Settings → Visibility → Generate → Preview
- [x] 2.2 修正 Visibility tab 說明：改為「Generate 前先選擇要 generate 的 repos」，勾選自動儲存，移除「Generate 完成後」與「點 Save 儲存」的錯誤描述
- [x] 2.3 修正 Generate tab 說明：移除不存在的「Include private repos」選項，改為列出正確的三個選項（Skip AI enrichment、Skip AI descriptions for private repos、No cache）

## 3. 補充 Settings 與 .env 說明

- [x] 3.1 在 Settings tab 說明中加入 `OPENAI_MODEL` 欄位（預設 `gpt-4o-mini`，可自訂）
- [x] 3.2 在「## .env 完整說明」加入 `OPENAI_MODEL` 項目

## 4. 整理部署說明

- [x] 4.1 將部署說明（Vercel / Netlify / GitHub Pages）從「命令列使用」章節中獨立出來，改為頂層「## 部署」章節，放在 Preview 步驟之後
