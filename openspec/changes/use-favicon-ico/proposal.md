## Why

產生的 HTML 目前以 `favicon.svg` 作為網站圖示，但部分瀏覽器與環境對 SVG favicon 的支援度不如 `.ico` 格式，改用 `favicon.ico` 可獲得更廣泛的相容性。

## What Changes

- 刪除 `src/template/assets/favicon.svg`
- 在 `src/template/assets/` 放入 `favicon.ico`（使用者自備，已就位）
- 修改 `src/generator/html/layout.ts` 的 `<link>` 標籤，將 `favicon.svg` 改為 `favicon.ico`，MIME type 從 `image/svg+xml` 改為 `image/x-icon`

## Capabilities

### New Capabilities
<!-- 無新能力，屬純修改 -->

### Modified Capabilities
- `favicon-asset`: HTML `<head>` 中的 favicon 參照由 SVG 改為 ICO 格式

## Impact

- `src/template/assets/`：移除 `favicon.svg`，保留 `favicon.ico`
- `src/generator/html/layout.ts`：第 48 行 `<link rel="icon">` 標籤
- 所有由 generate pipeline 產生的 HTML 頁面（`output/`）均受影響
