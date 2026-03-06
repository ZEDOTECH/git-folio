## ADDED Requirements

### Requirement: README 引導使用者先啟動網頁版 UI
README.md 中 SHALL 在安裝步驟之後、CLI 使用說明之前，新增「快速開始：網頁版」章節，引導使用者執行 `npm run ui` 啟動管理介面。

#### Scenario: 使用者第一次使用
- **WHEN** 使用者完成 `npm install && npm run build`
- **THEN** README 的下一步引導為 `npm run ui`，而非直接執行 CLI 命令

### Requirement: 網頁版 UI 四個分頁的操作說明
README 中 SHALL 說明網頁版 UI 的操作流程，涵蓋四個分頁的用途與操作順序。

#### Scenario: Settings 分頁說明
- **WHEN** 使用者閱讀網頁版快速開始章節
- **THEN** README 說明在 Settings 分頁填入 GITHUB_PAT 和 OPENAI_API_KEY

#### Scenario: Generate 分頁說明
- **WHEN** 使用者閱讀網頁版快速開始章節
- **THEN** README 說明在 Generate 分頁設定選項並點擊 Generate 按鈕

#### Scenario: Visibility 分頁說明
- **WHEN** 使用者閱讀網頁版快速開始章節
- **THEN** README 說明在 Visibility 分頁管理哪些 repo 要展示

#### Scenario: Preview 分頁說明
- **WHEN** 使用者閱讀網頁版快速開始章節
- **THEN** README 說明在 Preview 分頁啟動預覽並查看作品集

### Requirement: OPENAI_API_KEY 標注為選填
README 中 SHALL 在網頁版說明與 `.env` 說明兩處，標注 OPENAI_API_KEY 為選填，並說明跳過方式。

#### Scenario: 網頁版說明中的 OPENAI_API_KEY
- **WHEN** 使用者閱讀 Settings 分頁說明
- **THEN** README 提示「不需 AI 分析的話，此欄位可留空，並在 Generate 分頁勾選 Skip AI enrichment」

#### Scenario: .env 說明中的 OPENAI_API_KEY
- **WHEN** 使用者閱讀 `.env` 說明章節
- **THEN** README 標注 OPENAI_API_KEY 為「選填」，並說明 `--skip-ai` 時可不填

### Requirement: GITHUB_PAT scope 說明補充
README 中 SHALL 在「取得 GitHub Personal Access Token」章節說明，若只需展示 public repos，申請 PAT 時 scope 只需 `public_repo` 即可。

#### Scenario: 只需 public repos 的使用者
- **WHEN** 使用者閱讀 GitHub PAT 申請說明
- **THEN** README 提示「只需展示 public repos 的話，scope 勾選 `public_repo` 即可，不需要完整的 `repo` 權限」
