## ADDED Requirements

### Requirement: Visibility Tab Repo List Fetch
Visibility tab SHALL 提供「Load Repos」按鈕，按下後呼叫 `GET /api/repos/list` 輕量抓取 GitHub 上所有 repos（name + isPrivate）。抓取過程中按鈕顯示 loading state（disabled + 文字變為「Loading...」）。抓取完成後以 checkbox list 顯示所有 repos，每行含：checkbox、repo name、private/public badge。

#### Scenario: 按下 Load Repos
- **WHEN** 使用者點擊「Load Repos」按鈕
- **THEN** 按鈕變為 disabled 且文字顯示「Loading...」，向 `GET /api/repos/list` 發送請求

#### Scenario: Load 成功
- **WHEN** `GET /api/repos/list` 回傳 repos 陣列
- **THEN** 按鈕恢復可用，顯示 repo checkbox list，private repos 顯示 `.badge-private` 樣式 badge，public repos 顯示一般 badge

#### Scenario: Load 失敗（未設定 PAT）
- **WHEN** `GET /api/repos/list` 回傳錯誤（如 401）
- **THEN** 按鈕恢復可用，顯示錯誤提示「Failed to load repos. Check your GitHub PAT in Settings.」

---

### Requirement: Visibility Tab Default All-Selected
Visibility tab 的 repo list 顯示後，SHALL 預設所有 repos 皆勾選（enable）。使用者取消勾選的 repos 表示「不納入下一次 Generate」。

#### Scenario: 首次載入（無 localStorage 記錄）
- **WHEN** 使用者首次按下 Load Repos，localStorage 中無 `git-folio:excluded-repos`
- **THEN** 所有 repos 的 checkbox 預設勾選

#### Scenario: 有 localStorage 記錄
- **WHEN** localStorage `git-folio:excluded-repos` 存有 `["old-fork"]`，Load Repos 回傳包含 `old-fork`
- **THEN** `old-fork` 的 checkbox 顯示為未勾選，其餘全部勾選

---

### Requirement: Visibility Selection Persisted in localStorage
使用者對 repo checkbox 的勾選狀態 SHALL 即時儲存至 localStorage key `git-folio:excluded-repos`（`string[]`，存放被排除（未勾選）的 repo names）。不需另外按「Save」按鈕，每次 checkbox 變更即自動更新。

#### Scenario: 取消勾選一個 repo
- **WHEN** 使用者取消勾選 `old-fork`
- **THEN** localStorage `git-folio:excluded-repos` 更新為包含 `"old-fork"`

#### Scenario: 重新勾選一個 repo
- **WHEN** 使用者重新勾選原本未勾選的 `old-fork`
- **THEN** `"old-fork"` 從 localStorage `git-folio:excluded-repos` 中移除

#### Scenario: Generate 後切回 Visibility tab
- **WHEN** Generate 完成後使用者切換到 Visibility tab
- **THEN** 勾選狀態從 localStorage 還原，與 Generate 前一致

---

### Requirement: Repos List Lightweight Cache
`GET /api/repos/list` SHALL 使用獨立快取檔案 `.git-folio-repos-list-cache.json`。快取有效期為 1 小時（以快取檔案內 `fetchedAt` 欄位判斷）。此快取 SHALL NOT 被 `POST /api/clear-cache` 清除。

#### Scenario: 快取命中
- **WHEN** `.git-folio-repos-list-cache.json` 存在且 `fetchedAt` 距今未超過 1 小時
- **THEN** 直接回傳快取資料，不呼叫 GitHub API

#### Scenario: 快取過期或不存在
- **WHEN** 快取不存在或 `fetchedAt` 距今超過 1 小時
- **THEN** 呼叫 GitHub GraphQL 抓取全部 repos，更新快取，回傳結果

#### Scenario: Clear Cache 不影響 repos list 快取
- **WHEN** 使用者點擊「Clear Cache」按鈕（`POST /api/clear-cache`）
- **THEN** `.git-folio-cache/` 被清除，`.git-folio-repos-list-cache.json` 保持不變
