## Requirements

### Requirement: Single-Page Layout with Four Tabs
前端 SHALL 為單頁 HTML（`src/server/static/index.html`），包含四個 tab：Generate、Visibility、Settings、Preview。預設顯示 Generate tab。Tab 切換為純 DOM 操作，不重新載入頁面。

#### Scenario: 切換 tab
- **WHEN** 使用者點擊 Visibility tab
- **THEN** Visibility 內容顯示，其他 tab 內容隱藏，Visibility tab 標籤高亮

#### Scenario: 頁面載入
- **WHEN** 瀏覽器開啟 localhost:3000
- **THEN** Generate tab 預設顯示，同時發送 `GET /api/status` 更新各 tab 的狀態指示

---

### Requirement: Generate Tab
Generate tab SHALL 顯示表單含以下欄位：output dir（text input）、max repos（number input）、author（text input）、include private repos（checkbox）、skip AI（checkbox）、skip private descriptions（checkbox）、no-cache（checkbox）。提供「Generate」和「Clear Cache」兩個按鈕。Generate 執行中 SHALL 顯示即時 log 串流，按鈕變為 disabled。

#### Scenario: 執行 generate
- **WHEN** 使用者填寫選項並點擊「Generate」
- **THEN** 按鈕 disabled，log 區域開始顯示 SSE 串流內容，每行 append 到 log panel

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

### Requirement: Visibility Tab
Visibility tab SHALL 顯示 repo 列表，每行包含：enable toggle（checkbox）、repo 名稱、star 數、主要語言、private 標示（🔒）。頂部提供文字搜尋 input 即時過濾。提供「Save」按鈕儲存所有變更。

#### Scenario: 開啟 Visibility tab
- **WHEN** 使用者切換到 Visibility tab
- **THEN** 發送 `GET /api/repos`，以列表顯示所有 repos

#### Scenario: 過濾 repos
- **WHEN** 使用者在搜尋框輸入文字
- **THEN** 即時過濾，只顯示 name 包含關鍵字的 repos

#### Scenario: 儲存 visibility
- **WHEN** 使用者切換若干 checkbox 後點擊「Save」
- **THEN** 發送 `PUT /api/repos`，成功後顯示「Saved!」提示

#### Scenario: portfolio.json 不存在
- **WHEN** 尚未執行 generate，`GET /api/repos` 回傳空陣列
- **THEN** 顯示「No portfolio data. Run Generate first.」

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
