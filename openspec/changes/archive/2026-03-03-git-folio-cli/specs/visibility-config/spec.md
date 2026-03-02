## ADDED Requirements

### Requirement: Include enable Field in portfolio.json on First Run
系統 SHALL 在生成 `portfolio.json` 時，為每個 repo 加入 `enable: boolean` 欄位（預設為 `true`）。使用者可直接編輯此欄位來控制各 repo 是否在網站上顯示。

```json
{
  "repos": [
    { "name": "repo-name-1", "enable": true, ... },
    { "name": "private-repo", "enable": true, ... }
  ]
}
```

#### Scenario: 首次生成
- **WHEN** output 目錄不存在 `portfolio.json`
- **THEN** 所有 repos 的 `enable` 預設為 `true`

---

### Requirement: Preserve Existing enable Settings on Re-run
系統 SHALL 在重新生成時讀取既有的 `portfolio.json`，並保留使用者已設定的 `enable` 值。新出現的 repos 預設 `enable: true`；已刪除的 repos 自然不再出現。

#### Scenario: 保留隱藏設定
- **WHEN** `portfolio.json` 中 `"private-repo": { "enable": false, ... }` 且重新生成
- **THEN** `private-repo` 在新版 portfolio.json 中仍保持 `enable: false`

#### Scenario: 新增 repo
- **WHEN** GitHub 上新增了一個 repo，重新生成時出現在抓取結果
- **THEN** 新 repo 以 `enable: true` 加入 portfolio.json，既有設定不變

#### Scenario: 刪除的 repo
- **WHEN** 某個 repo 已從 GitHub 刪除，重新生成時不再出現
- **THEN** 該 repo 自然從 portfolio.json 中消失（不再被寫入）

---

### Requirement: Apply Visibility Filter at Render Time
Astro 頁面 SHALL 在 render 時過濾 `enable: false` 的 repos，使其不顯示在網站上。使用者只需修改 `portfolio.json` 的 `enable` 欄位後存檔，`npm run dev` 開發伺服器會即時反映變更，無須重新執行 CLI。

#### Scenario: 隱藏 repo 不出現在網站
- **WHEN** `{ "name": "secret-project", "enable": false, ... }`
- **THEN** `projects.astro` 頁面中不顯示 `secret-project`；`featuredRepos` 亦不包含（`enable: false` 者不選入）

#### Scenario: 所有 repo 均可見
- **WHEN** 所有 repos 的 `enable: true`
- **THEN** 網站顯示所有 repos（符合其他過濾條件者）
