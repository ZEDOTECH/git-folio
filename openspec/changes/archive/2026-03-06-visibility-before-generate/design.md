## Context

目前架構中 Visibility 頁面的資料來源是 `portfolio.json`（`GET /repos`），而這個檔案只有 Generate 完成後才會存在。這造成「先 Generate 才能設定 Visibility、設完再 Generate 一次」的雙重流程。新設計讓 Visibility 在 Generate 之前就可操作，並且 Generate 只對勾選的 repos 做 AI enrichment。

## Goals / Non-Goals

**Goals:**
- Visibility 頁面可在未 Generate 的情況下運作（直接從 GitHub 輕量 fetch）
- 使用者的 repo 勾選狀態在 Generate 後仍保留
- Generate 只對勾選的 repos 執行 AI token 消耗的步驟
- Visibility 快取獨立存放，不受 Clear Cache 影響

**Non-Goals:**
- 不改動 GitHub GraphQL 查詢本身（仍全撈，在應用層過濾）
- 不改動 portfolio.json 的結構（`enable` 欄位仍保留，由 Generate 寫入）
- 不新增 per-repo 詳細設定（只有 include/exclude）

## Decisions

### 1. 新增 `GET /repos/list` endpoint（輕量快取）

**決策**：新增獨立的 `/repos/list` endpoint，使用 `.git-folio-repos-list-cache.json` 快取，與 generate 快取（`.git-folio-cache/`）完全分開。

**理由**：Visibility 頁只需要 `name + isPrivate`，不需要 language stats、star count 等 generate 所需的完整資料。若共用 generate 快取，使用者在 Visibility 階段還沒有快取時需要等全量 fetch，體驗差。獨立快取讓 Visibility 的輕量 fetch 可以快速完成。

**快取 TTL**：1 小時（可接受略舊的 repo list；使用者若需要最新清單可按 Load Repos 強制刷新）。快取不被 Clear Cache 按鈕清除。

**Alternatives considered**：
- 共用 generate 快取：會造成 Visibility 和 Generate 快取生命週期耦合
- 每次都打 GitHub：無必要，repo 清單不會頻繁變動

### 2. 勾選狀態存 localStorage，不存伺服器端

**決策**：`localStorage` key `git-folio:excluded-repos`，存被排除的 repo names（`string[]`）。預設空陣列（即全部勾選）。

**理由**：選擇狀態是純 UI/使用者偏好，不需要伺服器感知。localStorage 天然持久，跨頁籤切換和 Generate 後都保留。排除清單通常比包含清單短，存 excluded list 節省空間。

**Alternatives considered**：
- 存伺服器端 JSON 檔：需要 API，增加複雜度，對純 UI 偏好沒有必要
- 存 included list：當 repos 很多時比 excluded list 大

### 3. Generate 端：fetch all → filter → AI enrichment

**決策**：`POST /generate` body 新增 optional `includedRepos?: string[]`。若有傳，在 GitHub fetch 完成後、AI enrichment 開始前，將 `rawData.repos` 過濾為只包含 `includedRepos` 中的 repos。

**理由**：GitHub GraphQL 不支援依 name 精確查詢多個 repos，全撈後在應用層 filter 是最直接的方式。過濾放在 AI enrichment 之前，確保 token 不浪費在排除的 repos 上。

**Generate 時也寫入 enable 欄位**：portfolio.json 的 `enable` 欄位依 includedRepos 設定（in list → `enable: true`，否則 `enable: false`）。這樣舊的 `PUT /repos` endpoint 仍可後期微調，但不再是主要入口。

### 4. 移除 Generate 頁「Include private repos」checkbox

**決策**：直接移除。

**理由**：Visibility 頁面的 Load Repos 會抓全部 repos（包含 private），使用者可在 Visibility 頁面個別取消勾選 private repos。這個 global checkbox 的功能已被個別控制取代，保留反而造成混淆。

**Alternatives considered**：
- 保留作為「Load Repos 時是否包含 private」的控制：增加一層複雜度，且 Visibility 已能做到

## Risks / Trade-offs

- **首次 Load Repos 仍需等 GitHub pagination**：如果使用者有 100+ repos，第一次按 Load Repos 還是需要幾秒。緩解：UI 顯示明確的 loading state。
- **localStorage 與 repo list 不同步**：如果 GitHub 上刪掉或新增了 repo，localStorage 裡的 excluded list 可能包含已不存在的 repo 名稱。緩解：Generate 時 filter 採用「intersection」邏輯（只保留 rawData.repos 中確實存在且不在 excluded list 的 repos），孤立的 excluded 名稱自然被忽略。
- **快取過期判斷**：`.git-folio-repos-list-cache.json` 以檔案內 `fetchedAt` 欄位判斷是否過期（>1hr），無需 OS 層 mtime 判斷，跨平台一致。

## Migration Plan

無 schema migration。`portfolio.json` 結構不變，`enable` 欄位繼續存在。UI 改動不影響已有的 output 目錄。

## Open Questions

- 無。所有決策已在 explore 階段與使用者確認。
