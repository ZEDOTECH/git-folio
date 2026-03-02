## Context

全新 TypeScript ESM CLI 專案，從零開始建立。技術選型主要考量：Node.js 生態成熟、GitHub/OpenAI 都有官方 JS SDK、Astro 非常適合生成完全靜態的內容網站。專案目前目錄為空，無任何現有程式碼需要相容。

## Goals / Non-Goals

**Goals:**
- CLI 工具以 TypeScript + ESM 撰寫，可 `npm link` 或 `npx` 執行
- GitHub GraphQL API 分頁抓取（含 private repos），含快取與 rate limit 保護
- OpenAI gpt-4o-mini 三類分析（repo 摘要、技能分析、Bio），以 `p-limit` 控制並發
- 生成完整獨立的 Astro + Tailwind CSS 靜態網站，包含主題（stone + amber 色系）
- `git-folio.config.json` 保存每個 repo 的 `visible` 狀態，重新生成時不被蓋掉
- 本機快取（24 小時 TTL），支援 `--no-cache` 強制重抓

**Non-Goals:**
- 部署整合（Vercel / GitHub Pages CLI 整合）
- Web UI（純 CLI，無本機伺服器 UI）
- 支援多個 GitHub 帳號同時處理
- 組織（Organization）的 repos（只處理使用者自己的 repos）
- 深度程式碼分析（不逐行讀取 source code，只讀 README + commit headlines）

## Decisions

### D1：TypeScript ESM + NodeNext 模組解析

**選擇**: `"module": "NodeNext"`, `"moduleResolution": "NodeNext"`, `"target": "ES2022"`

**理由**: `p-limit` v6+ 是純 ESM 套件，必須使用 ESM 才能 import。`ora` v8 同樣是純 ESM。用 CommonJS 的話需要 dynamic import workaround，增加複雜度。

**替代方案排除**: CommonJS（需要 esm shim）、Bun（使用者環境未確認有 Bun）

---

### D2：GitHub 資料抓取用 `@octokit/graphql`，不用 REST

**選擇**: `@octokit/graphql` + 兩份查詢字串（`PUBLIC_ONLY` 和 `ALL`，分別對應有無 private）

**理由**: GraphQL 一次請求取得所有需要欄位（語言比例、README blob、commit history），REST API 需要多次請求才能拿到同樣資料。GraphQL 不支援 query 內的 conditional，所以用兩份分離的 query string，避免 runtime 動態拼接 query 的 bug。

**替代方案排除**: GitHub REST API（request 次數多）、動態 query 組裝（難以 type-safe）

---

### D3：AI 分析用 `gpt-4o-mini`，全部使用 `json_object` response format

**選擇**: OpenAI `gpt-4o-mini`，temperature 0.3（摘要）/ 0.4（技能）/ 0.5（Bio），全部帶 `response_format: { type: "json_object" }` + JSON schema prompt

**理由**: `gpt-4o-mini` 成本極低（50 repos 約 $0.007），速度快，JSON mode 確保輸出可直接 `JSON.parse()`，不需要正則萃取。每個 repo 的 README 截取前 1500 字元，控制 token 成本。

**替代方案排除**: `gpt-4o`（成本高 20x，無顯著品質差異）、本機 Ollama（使用者選擇 OpenAI）

---

### D4：portfolio 資料以靜態 JSON 注入 Astro，不用 API routes

**選擇**: CLI 生成時將所有資料序列化為 `output/src/data/portfolio.json`，Astro 頁面在 build time 直接 `import portfolio from '../data/portfolio.json'`

**理由**: 生成的網站零 runtime secrets、零 serverless function、可部署到任何靜態 hosting（GitHub Pages 不支援 server-side）。使用者 build 一次就有完全靜態的 HTML。

**替代方案排除**: Astro content collections（多了額外設定步驟）、Astro API endpoints（需要 server mode，不能 fully static）

---

### D5：Visibility 設定直接寫在 `portfolio.json` 的 `enable` 欄位

**選擇**: 每個 repo 在 `portfolio.json` 中帶有 `enable: boolean` 欄位（預設 `true`）。使用者直接編輯此欄位，`npm run dev` 即時反映，無須重新執行 CLI。重新生成時，系統讀取既有 `portfolio.json` 的 `enable` 值並保留。

```
output/
└── src/data/portfolio.json   ← 直接編輯 enable: false 即可隱藏 repo
```

Astro 頁面在 render 時過濾：`repos.filter(r => r.enable !== false)`

**理由**: 相較於另設 `git-folio.config.json`，此方案讓使用者只需管理一個檔案，且修改後**不需要重新執行 CLI**，`npm run dev` 的 hot reload 立即生效。開發體驗更直覺。

**替代方案排除**: 獨立 `git-folio.config.json`（要編輯兩個檔案；更新可見性後須重跑 CLI 才生效）

---

### D6：Astro 模板打包在 CLI 套件的 `src/template/` 目錄

**選擇**: 模板作為 CLI npm 套件的一部份，透過 `"files": ["dist", "src/template"]` 發布。`SiteGenerator` 在生成時用 `fs.cp()` 複製到 output 目錄。

**理由**: 使用者不需要另外安裝模板。`npx git-folio generate` 一個命令搞定全部。

**替代方案排除**: 獨立 npm 套件（使用者需要管兩個套件）、GitHub template repo（需要網路 clone）

---

### D7：主題色系（stone + amber）

**選擇**: Tailwind 的 `stone`（暖黑/暖灰）搭配 `amber`（琥珀橘）作為強調色。深色主題為主（`stone-950` 背景）。

```
stone-950  #0c0a09   主背景
stone-900  #1c1917   卡片背景
stone-100  #f5f5f4   主文字
amber-500  #f59e0b   強調色（標籤、連結、border hover）
orange-400 #fb923c   次要強調
```

字體：Geist（body）+ JetBrains Mono（code element、標題點綴）

## Risks / Trade-offs

**[Rate Limit] GitHub API 請求過多** → Mitigation: 每頁請求後檢查 `rateLimit.remaining`，若低於 10 則等待至 `resetAt` + 1 秒

**[Token Cost] README 太長導致 OpenAI 費用暴增** → Mitigation: README 截取前 1500 字元，commit 只取最新 10 條

**[Private Repo 洩漏] 使用者誤將含 private repo 的 portfolio 部署到公開網站** → Mitigation: 文件清楚說明預設含 private repos；portfolio.json 中 private repos 的 `enable` 預設為 `true`，使用者需主動設為 `false` 或審查後再部署

**[模板更新] CLI 升級後模板改變，但 output 目錄仍是舊版** → Mitigation: 重新生成時自動更新模板檔案（僅保留 `portfolio.json`，其餘模板全部更新）

**[OpenAI 失敗] 某個 repo 的 AI 摘要生成失敗** → Mitigation: 每個 repo 獨立 try/catch，失敗時 fallback 為 GitHub 原始 description，不中斷整體流程

## Open Questions

- **Q**: `git-folio preview` 命令是否需要在本機啟動 `astro dev`？需要使用者在 output 目錄已有 `node_modules`。
  - 暫定：`preview` 命令在 output 目錄執行 `npm install && npx astro dev`，或直接印出提示讓使用者自己跑

- **Q**: 是否支援 `--lang` 旗標讓使用者指定 AI 輸出語言（英文 or 中文）？
  - 暫定：不在此次範圍，Bio/摘要語言跟隨 prompt，預設英文
