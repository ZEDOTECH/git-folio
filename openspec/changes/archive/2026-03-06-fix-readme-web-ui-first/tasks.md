## 1. 新增網頁版快速開始章節

- [x] 1.1 在「安裝」章節之後插入「快速開始：網頁版（推薦）」章節
- [x] 1.2 說明 `npm run ui` 啟動指令與預設網址（http://localhost:3000）
- [x] 1.3 說明 Settings 分頁：填入 GITHUB_PAT（必填）與 OPENAI_API_KEY（選填，不需 AI 可留空）
- [x] 1.4 說明 Generate 分頁：設定選項、點 Generate、觀察 log
- [x] 1.5 說明 Visibility 分頁：勾選要展示的 repos，點 Save
- [x] 1.6 說明 Preview 分頁：點 Start Preview，點 Open 開啟作品集

## 2. 調整環境變數說明

- [x] 2.1 在 OPENAI_API_KEY 說明補上「選填」標注，說明不需 AI 分析時可不填（搭配 Skip AI enrichment）
- [x] 2.2 在「取得 GitHub Personal Access Token」章節補充：只需 public repos 的話，scope 只勾 `public_repo` 即可

## 3. 調整原 CLI 流程章節

- [x] 3.1 將「完整使用流程」章節標題改為「命令列使用（進階）」或類似措辭，明確定位為次要路徑

## 4. 修正 npm run ui script

- [x] 4.1 修正 package.json 的 `ui` script：從 `node dist/server/index.js`（只 export，不執行）改為 `node dist/index.js serve`（透過 CLI 正確啟動伺服器）
