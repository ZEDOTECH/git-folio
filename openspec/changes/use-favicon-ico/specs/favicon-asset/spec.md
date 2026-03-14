## MODIFIED Requirements

### Requirement: HTML pages reference favicon.ico
每個產生的 HTML 頁面 SHALL 在 `<head>` 中包含一個指向 `favicon.ico` 的 `<link rel="icon">` 標籤，MIME type 為 `image/x-icon`。

#### Scenario: 產生的 HTML 使用 favicon.ico
- **WHEN** generate pipeline 產生 HTML 頁面
- **THEN** `<head>` 中的 favicon `<link>` 標籤為 `<link rel="icon" type="image/x-icon" href="...favicon.ico" />`

#### Scenario: scaffold 複製 favicon.ico 到輸出目錄
- **WHEN** scaffoldTemplate 執行
- **THEN** `favicon.ico` 被複製到 output 根目錄，且不存在 `favicon.svg`
