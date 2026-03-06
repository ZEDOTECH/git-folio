## Why

README 目前只引導 CLI 操作流程，完全沒有提到已存在的網頁版 UI（`npm run ui`），導致使用者第一次上手時必須手動編輯 `.env`，且對 GITHUB_PAT 和 OPENAI_API_KEY 是否必填感到困惑。

## What Changes

- README 新增「快速開始：網頁版」章節，放在安裝步驟之後，CLI 使用說明之前
- 在 Settings 分頁說明中明確標注 OPENAI_API_KEY 為選填（搭配 Skip AI 選項）
- 在 GITHUB_PAT 說明補充：若只需展示 public repos，申請時 scope 只需 `public_repo`
- 原 CLI 流程章節標題改為「命令列使用（進階）」，降低為次要選項

## Capabilities

### New Capabilities

- `web-ui-onboarding`: README 中新增網頁版 UI 快速上手說明，包含 4 個分頁的操作引導

### Modified Capabilities

- 無

## Impact

- 只影響 `README.md`，無程式碼變更
