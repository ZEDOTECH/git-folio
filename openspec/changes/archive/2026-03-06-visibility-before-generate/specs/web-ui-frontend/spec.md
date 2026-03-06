## MODIFIED Requirements

### Requirement: Single-Page Layout with Four Tabs
前端 SHALL 為單頁 HTML（`src/server/static/index.html`），包含四個 tab：Settings、Visibility、Generate、Preview。Tab 順序（從左至右）SHALL 為：Settings → Visibility → Generate → Preview。預設顯示 Settings tab。Tab 切換為純 DOM 操作，不重新載入頁面。

#### Scenario: 切換 tab
- **WHEN** 使用者點擊 Visibility tab
- **THEN** Visibility 內容顯示，其他 tab 內容隱藏，Visibility tab 標籤高亮

#### Scenario: 頁面載入
- **WHEN** 瀏覽器開啟 localhost:3000
- **THEN** Settings tab 預設顯示，同時發送 `GET /api/status` 更新各 tab 的狀態指示

---

### Requirement: Generate Tab
Generate tab SHALL 顯示表單含以下欄位：output dir（text input）、max repos（number input）、author（text input）、skip AI（checkbox）、skip private descriptions（checkbox）、no-cache（checkbox）。**移除「include private repos」checkbox**。提供「Generate」和「Clear Cache」兩個按鈕。Generate 執行中 SHALL 顯示即時 log 串流，按鈕變為 disabled。Generate 請求 body SHALL 包含從 localStorage `git-folio:excluded-repos` 推導出的 `includedRepos` 欄位。

#### Scenario: 執行 generate
- **WHEN** 使用者填寫選項並點擊「Generate」
- **THEN** 按鈕 disabled，從 localStorage 讀取 `git-folio:excluded-repos`，連同其他選項一起 POST 至 `/api/generate`，log 區域開始顯示 SSE 串流內容

#### Scenario: 無 Visibility 選擇記錄（includedRepos 為空）
- **WHEN** localStorage `git-folio:excluded-repos` 不存在或為空陣列
- **THEN** POST body 不帶 `includedRepos`（或傳空陣列），Generate 對所有 repos 執行

#### Scenario: Generate 完成
- **WHEN** SSE 收到 `event: done`
- **THEN** 按鈕恢復 enabled，log 末尾顯示「✓ Done!」；接著查詢 `GET /api/preview/status`，若 `running: false` 則 append「→ Go to the Preview tab to start previewing your portfolio」提示

#### Scenario: Generate 失敗
- **WHEN** SSE 收到 `event: error`
- **THEN** 按鈕恢復 enabled，log 末尾以紅色顯示錯誤訊息

#### Scenario: Clear Cache
- **WHEN** 使用者點擊「Clear Cache」
- **THEN** 發送 `POST /api/clear-cache`，在 log 區域顯示結果訊息
