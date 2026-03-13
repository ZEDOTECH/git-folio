## 1. HTML — Modal 元素與樣式

- [x] 1.1 在 `src/server/static/index.html` 的 `<style>` 區塊新增 `#modal-overlay`、`.modal-box` 相關 CSS（fixed overlay、flex 置中、dark theme 配色）
- [x] 1.2 在 `</main>` 後插入 modal HTML：`#modal-overlay > .modal-box`，包含標題、動態訊息段落（`#modal-msg`）、兩個按鈕（`#modal-cancel`、`#modal-confirm`）

## 2. JavaScript — showOutputModal 函式

- [x] 2.1 在 `src/server/static/app.js` 新增 `showOutputModal(outputDir)` 函式，回傳 Promise，resolve 值為 `true`（Regenerate）或 `false`（Cancel）
- [x] 2.2 函式內設定 `#modal-msg` 文字，為兩個按鈕各自設定 `onclick`，點擊 overlay 背景也觸發 cancel

## 3. JavaScript — 替換 window.confirm 邏輯

- [x] 3.1 在 Generate 按鈕 click handler 中，將 `window.confirm(...)` 替換為 `await showOutputModal(outputDir)`
- [x] 3.2 根據回傳值判斷：`false`（Cancel）→ `return`；`true`（Regenerate）→ `cleanOutput = true`，繼續執行 generate
