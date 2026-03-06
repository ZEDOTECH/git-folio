## Why

目前的 Visibility 頁面讀取 `portfolio.json`（只有 Generate 之後才存在），導致使用者必須先執行一次 Generate、再設定 Visibility 排除不要的 repos、再執行第二次 Generate，才能得到乾淨的結果。這不僅流程不直觀，也浪費 AI token 在使用者根本不需要的 repos 上。

## What Changes

- Tab 順序調整為：**Settings → Visibility → Generate → Preview**
- Visibility 頁面改為「先選 repos，再 Generate」的流程
  - 新增「Load Repos」按鈕，輕量抓取 GitHub 上所有 repo 的 name + isPrivate（有獨立快取）
  - Repo 以 checkbox list 顯示，附 private/public badge，預設全部勾選
  - 勾選狀態存在 localStorage（跨頁籤切換、Generate 後仍保留）
- Generate 改為只處理 Visibility 頁勾選的 repos（fetch all → filter → AI enrichment）
- Generate 頁移除「Include private repos」checkbox（由 Visibility 逐一控制取代）
- 舊的「Generate 後才能用的 Visibility」流程完全由新流程取代
- Visibility 快取（`.git-folio-repos-list-cache.json`）獨立存放，不被 Generate 的「Clear Cache」影響

## Capabilities

### New Capabilities

- `web-ui-visibility-preselect`: Visibility 頁面的新行為：從 GitHub 輕量 fetch repo 清單、展示 checkbox 選擇介面、以 localStorage 持久化選擇狀態

### Modified Capabilities

- `web-ui-frontend`: Tab 順序與 Generate 頁面的選項變更（移除 include-private checkbox，Generate 按下時帶入選擇的 repos）
- `web-ui-server`: Generate API 接受 `includedRepos` 參數，並新增 `GET /repos/list` 輕量 endpoint
- `visibility-config`: 原本的 visibility-config（讀取 portfolio.json）行為被 pre-select 流程取代；`PUT /repos` 保留供 Generate 後寫入 `enable` 欄位使用，但不再作為主要使用者操作入口

## Impact

- `src/server/static/index.html`：Tab 順序、Visibility tab HTML 重寫、Generate tab 移除 checkbox
- `src/server/static/app.js`：Visibility tab 邏輯重寫、Generate 請求帶入 includedRepos
- `src/server/routes/repos.ts`：新增 `GET /repos/list` endpoint 含獨立快取
- `src/server/routes/generate.ts`：接受 `includedRepos` 並在 fetch 後過濾
- `src/server/index.ts`：若需要 route 調整
