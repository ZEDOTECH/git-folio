## Requirements

### Requirement: Output Exists Modal
當 output 目錄已存在時，系統 SHALL 顯示自訂 modal（非瀏覽器原生 `window.confirm`），提供兩個選項：Cancel、Regenerate（Clean rebuild）。

- Modal SHALL 顯示 output 目錄路徑與「將被刪除」的警告訊息，讓用戶確認操作
- Cancel SHALL 關閉 modal 並完全中止 generate 流程
- Regenerate SHALL 關閉 modal 並以 `cleanOutput: true` 執行 generate pipeline（含 AI enrichment）
- 點擊 modal 背景（overlay）SHALL 等同 Cancel

#### Scenario: 選擇 Cancel
- **WHEN** output 目錄已存在，modal 出現，使用者點擊「Cancel」或點擊背景
- **THEN** modal 關閉，generate 流程中止，log 不更新

#### Scenario: 選擇 Regenerate
- **WHEN** output 目錄已存在，modal 出現，使用者點擊「Regenerate」
- **THEN** modal 關閉，以 `cleanOutput: true` POST 至 `/api/generate`，output 目錄先清除再重建

#### Scenario: output 目錄不存在
- **WHEN** output 目錄不存在
- **THEN** modal 不出現，直接以 `cleanOutput: false` 執行 generate
