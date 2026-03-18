## ADDED Requirements

### Requirement: Landing Page 檔案結構

`landing/index.html` SHALL 存在於專案根目錄的 `landing/` 子目錄，為完全自包含的純靜態 HTML 檔案。`landing/assets/preview.png` SHALL 存放作品集截圖供 Hero 區使用。

#### Scenario: 直接開啟無依賴

- **WHEN** 使用者直接在瀏覽器開啟 `landing/index.html`（file:// 協定）
- **THEN** 頁面完整顯示，所有 icon、字型、樣式正常載入（MDI 來自 CDN）

---

### Requirement: Hero 區塊

Landing Page SHALL 包含 Hero 區塊，以大標題傳達工具核心價值，並展示作品集截圖。

#### Scenario: Hero 顯示主要訊息

- **WHEN** 使用者載入頁面
- **THEN** 可見到主標「把你的 GitHub 變成精美作品集」、副標說明（AI 描述、技能分析、純靜態、一鍵部署）、以及兩個 CTA 按鈕（立即開始、查看範例）

#### Scenario: 截圖 browser mockup

- **WHEN** 在桌面版（≥ 768px）瀏覽器載入頁面
- **THEN** Hero 區顯示 browser mockup 外框，內含 `assets/preview.png` 截圖

#### Scenario: 行動版截圖

- **WHEN** 在行動裝置（< 768px）瀏覽器載入頁面
- **THEN** browser mockup 外框隱藏，截圖以全寬圖片顯示（或截圖整體隱藏以保持簡潔）

---

### Requirement: How it Works 流程區

Landing Page SHALL 包含 3 步驟橫向流程說明，涵蓋工具的完整執行路徑。

#### Scenario: 流程步驟顯示

- **WHEN** 使用者捲動到「如何使用」區塊
- **THEN** 顯示三個步驟：① 連接 GitHub（GraphQL 抓取 repos）、② AI 分析（GPT 生成描述與技能）、③ 部署上線（純靜態 HTML 網站 → GitHub Pages）

---

### Requirement: Features 功能卡片區

Landing Page SHALL 以 glass morphism card grid 展示至少 8 個核心功能。

#### Scenario: 功能卡片完整性

- **WHEN** 使用者瀏覽 Features 區
- **THEN** 至少顯示以下功能卡片：AI 自動描述、技能分析、Repo 篩選、智慧快取、SSE 即時進度、純靜態輸出、Web UI 操作介面、一鍵部署

#### Scenario: Hover 動畫

- **WHEN** 使用者 hover 任一功能卡片
- **THEN** 卡片向上位移 5px 並加深陰影（與官方站 `.glass:hover` 效果一致）

---

### Requirement: Quick Start 程式碼區

Landing Page SHALL 包含 terminal 風格的 Quick Start 區塊，展示安裝與啟動指令。

#### Scenario: 指令完整顯示

- **WHEN** 使用者瀏覽 Quick Start 區
- **THEN** 以深色背景（#1a1a1a）橙黃文字顯示以下指令序列：git clone、npm install && npm run build、npm run ui，並標示每行指令的說明

---

### Requirement: 費用估算區

Landing Page SHALL 包含費用估算區塊，說明 GitHub API 免費及 OpenAI 費用極低。

#### Scenario: 費用表顯示

- **WHEN** 使用者瀏覽費用區
- **THEN** 顯示對照表：20 repos ≈ $0.005、50 repos ≈ $0.011、100 repos ≈ $0.020（OpenAI gpt-5-mini），並強調 GitHub API 完全免費

---

### Requirement: 視覺設計系統

Landing Page SHALL 沿用 ZEDOTECH 官方站的 Fresh & Soft Glass Morphism 設計語言。

#### Scenario: 背景動畫

- **WHEN** 頁面載入
- **THEN** 背景顯示 #f8f9fc 底色加上兩個緩慢浮動的漸層 blob（粉色 + 青色），與官方站 `.animated-bg` 效果相同

#### Scenario: 配色一致性

- **WHEN** 頁面完整渲染
- **THEN** 主色使用 #667eea / #764ba2 紫色漸層，文字使用 #2d3748（主）/ #718096（次），字型為 Inter

#### Scenario: 導覽列固定

- **WHEN** 使用者捲動頁面
- **THEN** 導覽列固定在頂部，帶有毛玻璃效果（backdrop-filter blur）
