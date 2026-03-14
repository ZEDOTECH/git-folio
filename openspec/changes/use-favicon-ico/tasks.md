## 1. 靜態資源

- [x] 1.1 刪除 `src/template/assets/favicon.svg`

## 2. HTML 模板

- [x] 2.1 修改 `src/generator/html/layout.ts` 第 48 行，將 `<link rel="icon" type="image/svg+xml" href="${base}favicon.svg" />` 改為 `<link rel="icon" type="image/x-icon" href="${base}favicon.ico" />`

## 3. 編譯與驗證

- [x] 3.1 執行 `npm run build` 確認編譯無誤
- [x] 3.2 執行 generate，確認產生的 HTML 中 favicon `<link>` 指向 `favicon.ico`
- [x] 3.3 確認 output 目錄存在 `favicon.ico` 且不存在 `favicon.svg`
