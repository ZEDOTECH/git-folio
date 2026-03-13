## Why

當 Web UI Generate tab 的 output 目錄已存在時，原本彈出瀏覽器原生 `confirm` dialog（「Delete it and regenerate from scratch?」），用戶點「取消」會導致整個 generate 流程中止，無法在不刪除 output 的情況下重新執行（含 AI enrichment）。這讓用戶誤以為只是「不刪除」，實際上是什麼都沒做。

## What Changes

- 移除瀏覽器原生 `window.confirm` dialog
- 新增自訂 modal，提供兩個選項：
  - **Cancel** → 中止，什麼都不做
  - **Regenerate** → 刪除 output 後重新生成（`cleanOutput: true`）

## Capabilities

### New Capabilities
- `generate-output-confirm-modal`: Web UI 的兩選項 modal，取代瀏覽器原生 confirm dialog，讓用戶在 output 已存在時可選擇 Cancel / Regenerate（Clean rebuild）

### Modified Capabilities
- `web-ui-frontend`: Generate tab 的 output 確認邏輯行為改變（從瀏覽器原生 confirm 改為自訂兩選項 modal）

## Impact

- `src/server/static/index.html`：新增 modal CSS + modal HTML element
- `src/server/static/app.js`：新增 `showOutputModal()` 函式，替換 `window.confirm` 邏輯
- 不影響後端 API（`cleanOutput` 欄位已支援 false/true，無需修改）
- 不需要 build，重新整理瀏覽器即可生效
