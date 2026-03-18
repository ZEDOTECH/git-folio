## Context

git-folio 是一個 CLI + Web UI 工具，已有 GitHub Pages 上的作品集 demo（深色主題）。目前缺少對外介紹工具的 Landing Page。官方站 `ZEDOTECH/official/index.html` 已建立完整的 Fresh & Soft Glass Morphism 設計系統（`css/modern.css`），可直接複用其設計語言與 CSS class 結構。

Landing Page 需要嵌入一張已截取的 git-folio 作品集截圖（深色主題），放在 Hero 區的 browser mockup 內，以強調「工具生成的成品」。

## Goals / Non-Goals

**Goals:**
- 建立 `landing/index.html`：自包含的純靜態頁面
- 沿用 ZEDOTECH 官方站 CSS 設計語言（自行 inline 或引用相同的 CDN/font）
- 支援繁體中文，目標讀者為 ZEDOTECH YouTube 頻道觀眾
- 頁面完整涵蓋：Hero、How it Works、Features、Quick Start、費用估算、Footer

**Non-Goals:**
- 不修改現有 CLI/Web UI/generate pipeline 任何功能
- 不建立自己的 CSS 框架，直接 inline 必要樣式
- 不做多語言（只中文）
- 不使用 JS 框架，純 HTML + CSS + 少量 vanilla JS

## Decisions

### 1. 純 inline CSS，不引用外部 modern.css

**選擇**：在 `landing/index.html` 內 `<style>` 標籤直接寫必要 CSS，複製官方站的 design tokens 與核心 class（`.glass`、`.animated-bg`、漸層顏色等）。

**理由**：`landing/` 是獨立目錄，不與官方站共享資源。inline CSS 讓 `index.html` 完全自包含，部署時不需要額外複製 `css/` 資料夾。

**替代方案考慮**：引用相對路徑 `../official/css/modern.css`——但這會讓部署時有路徑依賴，部署到 GitHub Pages 後路徑不正確。

---

### 2. Hero 截圖：Base64 嵌入 vs 外部圖片 URL

**選擇**：引用 GitHub Pages 上的 live demo `https://zedotech.github.io/git-folio/` 的截圖，截圖存為 `landing/assets/preview.png`，HTML 中以相對路徑引用。

**理由**：Base64 會使 HTML 體積過大；GitHub Pages URL 依賴外部可用性；本地圖檔最可靠。截圖已透過 puppeteer 抓取完成。

---

### 3. 截圖 browser mockup：CSS 純實作

**選擇**：用 CSS 模擬瀏覽器視窗外框（白底圓角 card + 三個圓點 + 假網址列），截圖作為 img 放在其中。

**理由**：不需要 JS，純 CSS 可實現，且視覺效果與官方站的 glass card 風格一致。

---

### 4. Quick Start 區：terminal 風格 code block

**選擇**：`.terminal-body` div 內以多個 `.terminal-line` div 組成，搭配深色背景（`#1a1a1a`）+ 橙黃文字，與作品集截圖的配色呼應。

**理由**：強化「開發者工具」的定位，且視覺上與整體淡色頁面形成有趣對比。原設計提及 `<pre>` 標籤，實作改為 div 結構以便對每行的 prompt、指令、說明文字分別套用樣式，效果更佳。

---

### 5. MDI Icons 引用方式

**選擇**：使用 jsDelivr CDN 引用 `@mdi/font`。

**理由**：官方站也是外部引用 MDI，CDN 方式最省事，不需要在 `landing/` 內存放 icon font 檔案。

## Risks / Trade-offs

- [截圖過時] 作品集 demo 更新後，`landing/assets/preview.png` 不會自動同步 → 接受這個 trade-off，截圖只是示意，不需完全即時
- [CDN 依賴] MDI font 來自 CDN，離線時 icon 消失 → Landing Page 非核心工具功能，可接受
- [browser mockup 在小螢幕上擠壓] → 在 mobile breakpoint 改為圖片全寬顯示，隱藏 mockup 外框

## Migration Plan

1. 建立 `landing/` 目錄
2. 將截圖 `git-folio-hero.png` 複製到 `landing/assets/preview.png`
3. 建立 `landing/index.html`
4. 在 `README.md` 的頂部加入 Landing Page 連結（選擇性）

部署：直接提交 `landing/` 到 main branch，GitHub Pages 會自動提供 `https://zedotech.github.io/git-folio/landing/`。

## Open Questions

（無，設計已足夠明確可實作）
