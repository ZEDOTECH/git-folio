## Why

README 目前混雜了 CLI 指令與 WebUI 操作說明，且 WebUI 的流程描述有多處錯誤（Tab 順序、Visibility 用途、Generate 選項）。工具已演進為以 WebUI 為主要操作介面，CLI 說明對一般使用者造成混亂且增加維護負擔。

## What Changes

- **移除** CLI 操作章節（命令列使用、generate 命令選項、快取機制、更新資料）
- **移除** 手動編輯 `portfolio.json` 的 Repos 管理說明
- **修正** WebUI Tab 操作順序：Settings → Visibility → Generate → Preview
- **修正** Visibility tab 說明：Generate 前先選 repos（非 Generate 後），勾選自動儲存（無 Save 按鈕）
- **修正** Generate tab 選項說明：移除不存在的「Include private repos」，列出正確的三個選項
- **新增** `OPENAI_MODEL` 到 Settings 與 `.env` 說明
- **保留** 部署說明（Vercel/Netlify/GitHub Pages），從 CLI 章節獨立成頂層章節

## Capabilities

### New Capabilities

- `readme-content`: README.md 的內容結構——正確的 WebUI 使用流程與各 tab 說明

### Modified Capabilities

（無——此為文件修改，不涉及程式碼行為規格變更）

## Impact

- 只影響 `README.md`
- 不影響任何程式碼或 API 行為
