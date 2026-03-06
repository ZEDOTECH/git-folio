## Context

`README.md` 是純文件變更，無程式碼異動。網頁版 UI（`npm run ui` → Hono server + `src/server/static/`）已完整實作，包含 Generate、Visibility、Settings、Preview 四個分頁。

## Goals / Non-Goals

**Goals:**
- 讓初次使用者優先看到網頁版 UI 流程
- 在適當位置標注 OPENAI_API_KEY 和 GITHUB_PAT 的選填條件

**Non-Goals:**
- 不修改任何程式碼
- 不改變 CLI 功能或行為

## Decisions

**網頁版章節放在哪裡**：安裝（`npm install`）之後、CLI 流程之前。理由：使用者完成安裝後，下一步應是最輕鬆的入門路徑。

**GITHUB_PAT 的說明方式**：仍標為必填（技術上確實如此，`viewer` GraphQL query 需要 token），但在申請方式一節補充「只需 public repos 的話，scope 只勾 `public_repo` 即可」。

**OPENAI_API_KEY 的說明方式**：在網頁版引導和 `.env` 說明兩處標注「選填，不需 AI 分析時可跳過」，並說明對應操作（Settings 不填 + Generate 勾選 Skip AI）。

## Risks / Trade-offs

[無]：純文件改動，無程式行為風險。
