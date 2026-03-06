## ADDED Requirements

### Requirement: README 只包含 WebUI 操作說明
README.md SHALL 只描述透過 WebUI（`npm run ui`）操作 git-folio 的流程，不包含 CLI 指令操作說明。

#### Scenario: 移除 CLI 章節
- **WHEN** 使用者閱讀 README
- **THEN** 不應出現 `node dist/index.js generate`、`node dist/index.js clear-cache` 或任何 `node dist/index.js` 操作指令

#### Scenario: 保留部署說明
- **WHEN** 使用者完成 generate 後需要部署
- **THEN** README SHALL 提供 Vercel / Netlify / GitHub Pages 的部署方式說明

### Requirement: WebUI Tab 操作順序正確
README SHALL 描述 Tab 操作順序為 Settings → Visibility → Generate → Preview，與 `index.html` 中實際的 tab 排列一致。

#### Scenario: 說明順序與 UI 一致
- **WHEN** 使用者依 README 操作
- **THEN** README 的步驟順序與瀏覽器中 tab 由左至右的順序相同

### Requirement: Visibility tab 說明正確反映實際行為
README SHALL 說明 Visibility tab 的用途是在 Generate **之前**選擇哪些 repos 要被 generate，且勾選狀態自動儲存（無需點 Save）。

#### Scenario: 說明 Visibility 在 Generate 前使用
- **WHEN** 使用者閱讀 Visibility 說明
- **THEN** 說明 SHALL 清楚表示此步驟在 Generate 前完成

#### Scenario: 說明無 Save 按鈕
- **WHEN** 使用者閱讀 Visibility 說明
- **THEN** 說明 SHALL 表示勾選即自動儲存，不需額外點擊 Save

### Requirement: Generate tab 選項說明正確
README SHALL 列出 Generate tab 實際存在的選項，不包含不存在的選項。

#### Scenario: 選項列表與 UI 一致
- **WHEN** 使用者閱讀 Generate 說明
- **THEN** 說明 SHALL 包含 Skip AI enrichment、Skip AI descriptions for private repos、No cache 三個選項
- **THEN** 說明 SHALL NOT 包含「Include private repos」（此選項不存在於 UI）

### Requirement: Settings 說明包含 OPENAI_MODEL
README 的 Settings 說明與 .env 完整說明 SHALL 包含 `OPENAI_MODEL` 欄位的說明。

#### Scenario: Settings tab 說明有 OPENAI_MODEL
- **WHEN** 使用者閱讀 Settings 說明
- **THEN** README SHALL 提及 OPENAI_MODEL 欄位（預設 `gpt-4o-mini`，可自訂模型）

#### Scenario: .env 完整說明有 OPENAI_MODEL
- **WHEN** 使用者查閱 .env 說明
- **THEN** README SHALL 列出 `OPENAI_MODEL` 的說明與預設值
