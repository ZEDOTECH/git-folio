## 1. 準備資產

- [x] 1.1 建立 `landing/` 目錄
- [x] 1.2 建立 `landing/assets/` 目錄
- [x] 1.3 將 `C:/Users/Administrator/Downloads/git-folio-hero.png` 複製到 `landing/assets/preview.png`

## 2. 建立 landing/index.html 基礎架構

- [x] 2.1 建立 `landing/index.html`，加入 `<head>` 區塊：charset、viewport、title、description、Inter 字型（Google Fonts）、MDI icon font（jsDelivr CDN）
- [x] 2.2 加入 CSS design tokens（複製官方站 `:root` 變數：顏色、間距、blur、transition）
- [x] 2.3 加入 base styles（body、`*` reset、`line-height`）
- [x] 2.4 加入 `.animated-bg` 動態背景（兩個 blob：pink + cyan，float keyframe）
- [x] 2.5 加入 `.glass` card 樣式（backdrop-filter、border-radius: 24px、hover 動畫）
- [x] 2.6 加入固定導覽列（`.navbar`：毛玻璃效果、logo、nav links）

## 3. Hero 區塊

- [x] 3.1 實作 Hero 兩欄版面（左欄：標題+副標+CTA，右欄：browser mockup）
- [x] 3.2 主標題：「把你的 GitHub 變成精美作品集」（gradient 文字效果）
- [x] 3.3 副標說明 badge chips：AI 生成描述、技能分析、純靜態輸出、一鍵部署
- [x] 3.4 CTA 按鈕：「立即開始」（btn-primary，錨點到 #quick-start）、「查看範例 ↗」（btn-secondary，連結到 demo）
- [x] 3.5 Browser mockup：白底圓角 card + 三個圓點 + `assets/preview.png`
- [x] 3.6 Mobile RWD：< 768px 時 mockup 隱藏，截圖以全寬顯示

## 4. How it Works 區塊

- [x] 4.1 三步驟橫向排列：① 連接 GitHub → ② AI 分析 → ③ 部署上線
- [x] 4.2 每步驟：圓形數字 badge + 標題 + 說明文字 + MDI icon
- [x] 4.3 步驟間加入箭頭連接符號

## 5. Features 功能卡片區

- [x] 5.1 使用 `.features-grid`（CSS grid，3欄）排列 glass cards
- [x] 5.2 實作 8 個 feature cards：AI 自動描述、技能分析、Repo 篩選、智慧快取、SSE 即時進度、純靜態輸出、Web UI、一鍵部署
- [x] 5.3 每張卡片：MDI icon + 標題 + 說明文字

## 6. Quick Start 區塊

- [x] 6.1 terminal 風格 code block（`<pre>`，背景 #1a1a1a，橙黃文字 #f59e0b）
- [x] 6.2 四行指令：git clone、cd git-folio、npm install && npm run build、npm run ui
- [x] 6.3 每行前加 `$` 提示符，右側加灰色說明文字

## 7. 費用估算區塊

- [x] 7.1 建立費用對照表（3 欄：規模、GitHub API、OpenAI gpt-5-mini）
- [x] 7.2 強調 GitHub API 完全免費，OpenAI 費用極低

## 8. Footer 與收尾

- [x] 8.1 加入 Footer：版權聲明、GitHub 連結、ZEDOTECH 連結
- [x] 8.2 加入「回到頂部」按鈕（`.back-to-top`，固定右下角）
- [x] 8.3 加入 smooth scroll JavaScript（導覽連結 + 回頂部按鈕）
- [x] 8.4 加入 scroll spy：捲動時 navbar 加深背景陰影
- [x] 8.5 加入 animate-in：IntersectionObserver 讓 cards 進場時有淡入動畫
- [x] 8.6 驗證頁面在桌面（1440px）、平板（768px）、手機（375px）三個尺寸的顯示
