## Context

generate pipeline 透過 `scaffoldTemplate()` 將 `src/template/assets/` 複製到 output 根目錄，再由 `layout.ts` 在每個 HTML 頁面的 `<head>` 注入 `<link rel="icon">` 標籤。使用者已將 `favicon.ico` 放入 `src/template/assets/`。

## Goals / Non-Goals

**Goals:**
- HTML 的 favicon `<link>` 標籤改指向 `favicon.ico`
- 移除不再使用的 `favicon.svg`

**Non-Goals:**
- 不修改 scaffold 的複製邏輯（現有機制已足夠）
- 不提供 SVG fallback 或多格式 favicon

## Decisions

**直接替換，不保留 SVG fallback**
- `.ico` 格式被所有主流瀏覽器支援，無需額外 fallback
- 保留兩個格式會造成資源冗余

**MIME type 改為 `image/x-icon`**
- `image/x-icon` 是 `.ico` 的標準 MIME type，瀏覽器辨識度最廣

## Risks / Trade-offs

- [既有 output/ 目錄不會自動更新] → 使用者需重新執行 generate 才能取得新 favicon
