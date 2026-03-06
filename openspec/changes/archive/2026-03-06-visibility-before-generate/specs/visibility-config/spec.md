## REMOVED Requirements

### Requirement: Visibility Tab (Old - Post-Generate Flow)
**Reason**: 舊的 Visibility tab 流程（Generate 後才能操作）被新的「pre-select before generate」流程取代。使用者現在在 Visibility tab 透過 Load Repos 直接從 GitHub 取得 repo 清單，並在 Generate 前完成勾選，無需先執行 Generate。
**Migration**: 新的 Visibility tab 行為見 `web-ui-visibility-preselect` spec。`GET /api/repos` 和 `PUT /api/repos` endpoint 仍保留（Generate 時寫入 `enable` 欄位），但不再作為使用者主要操作的 UI 入口。
