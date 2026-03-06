## 1. Backend: Repos List API

- [x] 1.1 在 `src/server/routes/repos.ts` 新增 `GET /repos/list` handler：呼叫 GitHub GraphQL 抓取全部 repos（全量 pagination），只回傳 `{ name, isPrivate }[]`
- [x] 1.2 實作 `.git-folio-repos-list-cache.json` 快取邏輯：讀取時檢查 `fetchedAt` 是否在 1 小時內；命中則直接回傳，否則 fetch 後寫入快取
- [x] 1.3 `GET /repos/list` 錯誤處理：PAT 未設定或無效時回傳 HTTP 401 + 錯誤訊息
- [x] 1.4 確認 `POST /api/clear-cache`（`src/server/routes/cache.ts`）不刪除 `.git-folio-repos-list-cache.json`

## 2. Backend: Generate API 過濾邏輯

- [x] 2.1 在 `src/server/routes/generate.ts` 的 body 型別中新增 `includedRepos?: string[]`
- [x] 2.2 在 GitHub fetch 完成後、AI enrichment 開始前，若 `includedRepos` 為非空陣列，將 `rawData.repos` 過濾為只包含對應 names 的 repos
- [x] 2.3 過濾後 emit log：`Filtered to N selected repos`
- [x] 2.4 Generate 完成後，portfolio.json 中各 repo 的 `enable` 欄位依 `includedRepos` 設定（in list → `true`，不在 list 且 `includedRepos` 有值 → `false`）

## 3. Frontend: HTML 結構調整

- [x] 3.1 調整 `src/server/static/index.html` nav tab 順序為：Settings → Visibility → Generate → Preview
- [x] 3.2 將預設顯示的 tab 改為 Settings（`class="active"` 移至 Settings tab）
- [x] 3.3 移除 Generate tab 中「Include private repos」checkbox（`#opt-include-private`）

## 4. Frontend: Visibility Tab 重寫

- [x] 4.1 移除舊 Visibility tab 的搜尋框、repo list（舊 `GET /api/repos` 流程）、Save 按鈕
- [x] 4.2 新增「Load Repos」按鈕（id: `btn-load-repos`）
- [x] 4.3 新增 repo checkbox list 容器（id: `repo-preselect-list`），預設為空
- [x] 4.4 新增 loading state 樣式與 empty state 文字（如「Press Load Repos to fetch your repositories.」）

## 5. Frontend: app.js Visibility 邏輯

- [x] 5.1 實作 `btn-load-repos` click handler：按下後 disabled + 顯示「Loading...」，呼叫 `GET /api/repos/list`
- [x] 5.2 Load 成功後渲染 checkbox list：每行含 checkbox、repo name、private/public badge（使用現有 `.badge-private` 和 `.badge` class）
- [x] 5.3 從 `localStorage.getItem('git-folio:excluded-repos')` 讀取排除清單，渲染時對應 repo 的 checkbox 設為未勾選
- [x] 5.4 每個 checkbox change 事件即時更新 localStorage `git-folio:excluded-repos`（`JSON.stringify(excludedArray)`）
- [x] 5.5 Load 失敗時恢復按鈕並顯示錯誤提示

## 6. Frontend: app.js Generate 邏輯調整

- [x] 6.1 移除 Generate 請求 body 中的 `publicOnly`（對應已移除的 include-private checkbox）
- [x] 6.2 Generate 按下時，從 localStorage 讀取 `git-folio:excluded-repos`，計算出 `includedRepos`（Visibility 頁載入過的全部 repos 清單 minus excluded），附入 POST body
- [x] 6.3 若 Visibility 從未載入（localStorage 無 repo 清單），POST body 不傳 `includedRepos`（Generate 對全部 repos 執行）
