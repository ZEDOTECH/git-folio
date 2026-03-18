## Why

git-folio 目前缺乏對外介紹工具本身的頁面——使用者在 GitHub 或 YouTube 頻道看到工具時，沒有一個能清楚說明「這是什麼、怎麼用、能產出什麼」的單一入口。需要一個獨立的 Landing Page 讓中文開發者（ZEDOTECH 頻道觀眾）快速理解並上手。

## What Changes

- 新增 `landing/index.html`：獨立的純靜態 Landing Page，介紹 git-folio 工具
- 視覺風格沿用 ZEDOTECH 官方站的 Fresh & Soft Glass Morphism 設計語言（淡色背景、紫色漸層、MDI icons）
- 頁面包含：Hero（含作品集截圖 browser mockup）、How it Works 流程、Features 卡片、Quick Start 指令區、費用估算、Footer

## Capabilities

### New Capabilities

- `landing-page`：git-folio 工具的對外介紹頁，包含完整的功能說明、視覺 demo、安裝指引，以繁體中文為主要語言，風格參考 ZEDOTECH 官方站

### Modified Capabilities

（無）

## Impact

- 新增 `landing/` 目錄及 `landing/index.html`（standalone，不依賴任何 build 工具）
- 無現有功能變動，不影響 CLI、Web UI、generate pipeline
- 可直接部署到 GitHub Pages 作為 `git-folio` 工具的介紹頁
