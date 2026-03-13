## Requirements

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

---

### Requirement: Settings Tab
Settings tab SHALL 顯示 `.env` 設定表單，包含：GITHUB_PAT（password input，顯示遮罩值）、OPENAI_API_KEY（password input）、OPENAI_MODEL（text input）、AUTHOR_NAME（text input）、SITE_URL（text input）。每個 token 欄位旁有「👁」切換顯示/隱藏。提供「Save」按鈕寫回 `.env`。

#### Scenario: 開啟 Settings tab
- **WHEN** 使用者切換到 Settings tab
- **THEN** 發送 `GET /api/env`，以遮罩方式填入各欄位值

#### Scenario: 儲存 settings
- **WHEN** 使用者修改欄位並點擊「Save」
- **THEN** 發送 `PUT /api/env`，成功後顯示「Settings saved!」提示

#### Scenario: 切換顯示 token
- **WHEN** 使用者點擊「👁」按鈕
- **THEN** 對應 input 的 type 在 password / text 之間切換

---

### Requirement: Preview Tab
Preview tab SHALL 顯示 Astro dev server 控制區（Start/Stop 按鈕、狀態指示）與「Open ↗」外部連結。Dev server 未啟動時連結隱藏；啟動並就緒後顯示連結供使用者在新分頁開啟 `http://localhost:4321`。（原 iframe 方案因 X-Frame-Options 限制改為外開連結）

#### Scenario: 啟動 preview
- **WHEN** 使用者點擊「Start Preview」
- **THEN** 發送 `POST /api/preview/start`，顯示「Starting...」；前端每秒 poll `http://localhost:4321` 直到回應，成功後顯示「Open ↗」連結與提示文字

#### Scenario: 停止 preview
- **WHEN** 使用者點擊「Stop Preview」
- **THEN** 發送 `POST /api/preview/stop`，隱藏「Open ↗」連結，狀態變為「Stopped」

#### Scenario: output 目錄不存在
- **WHEN** 使用者嘗試啟動 preview 但 output 目錄不存在
- **THEN** 顯示「No output directory. Run Generate first.」
