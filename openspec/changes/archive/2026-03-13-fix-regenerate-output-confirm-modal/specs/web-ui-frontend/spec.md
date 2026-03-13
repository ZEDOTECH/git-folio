## MODIFIED Requirements

### Requirement: Generate Tab
Generate tab SHALL 顯示表單含以下欄位：output dir（text input）、max repos（number input）、author（text input）、skip AI（checkbox）、skip private descriptions（checkbox）、no-cache（checkbox）。**移除「include private repos」checkbox**。提供「Generate」和「Clear Cache」兩個按鈕。Generate 執行中 SHALL 顯示即時 log 串流，按鈕變為 disabled。Generate 請求 body SHALL 包含從 localStorage `git-folio:excluded-repos` 推導出的 `includedRepos` 欄位。

當使用者點擊「Generate」且 output 目錄已存在時，SHALL 顯示兩選項 modal（見 `generate-output-confirm-modal` spec），取代原本的瀏覽器原生 `window.confirm`。

#### Scenario: 執行 generate
- **WHEN** 使用者填寫選項並點擊「Generate」
- **THEN** 按鈕 disabled，從 localStorage 讀取 `git-folio:excluded-repos`，連同其他選項一起 POST 至 `/api/generate`，log 區域開始顯示 SSE 串流內容

#### Scenario: 無 Visibility 選擇記錄（includedRepos 為空）
- **WHEN** localStorage `git-folio:excluded-repos` 不存在或為空陣列
- **THEN** POST body 不帶 `includedRepos`（或傳空陣列），Generate 對所有 repos 執行

#### Scenario: output 目錄已存在（取代 window.confirm）
- **WHEN** 使用者點擊「Generate」且 `/api/status` 回傳 `outputExists: true`
- **THEN** 顯示自訂兩選項 modal，不使用 `window.confirm`；用戶選擇決定後續行為（Cancel 中止 / Regenerate 清除重建）

#### Scenario: Generate 完成
- **WHEN** SSE 收到 `event: done`
- **THEN** 按鈕恢復 enabled，log 末尾顯示「✓ Done!」；接著查詢 `GET /api/preview/status`，若 `running: false` 則 append「→ Go to the Preview tab to start previewing your portfolio」提示

#### Scenario: Generate 失敗
- **WHEN** SSE 收到 `event: error`
- **THEN** 按鈕恢復 enabled，log 末尾以紅色顯示錯誤訊息

#### Scenario: Clear Cache
- **WHEN** 使用者點擊「Clear Cache」
- **THEN** 發送 `POST /api/clear-cache`，在 log 區域顯示結果訊息
