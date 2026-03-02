# git-folio

從 GitHub 自動生成 AI 驅動的個人作品集網站。抓取所有 repos、用 GPT-4o-mini 撰寫描述、生成完整可部署的 Astro + Tailwind CSS 靜態網站。

---

## 必要條件

- **Node.js 18+**
- **GitHub Personal Access Token**（取得方式見下方）
- **OpenAI API Key**（若不需要 AI 分析可用 `--skip-ai` 跳過）

---

## 安裝

```bash
git clone <this-repo>
cd git-folio
npm install
npm run build
```

---

## 設定環境變數

```bash
cp .env.example .env
```

用文字編輯器開啟 `.env`，填入兩個必填欄位：

```bash
GITHUB_PAT=ghp_your_token_here
OPENAI_API_KEY=sk-your-key-here
```

---

## 完整使用流程

### 步驟 1：生成作品集

在 `git-folio` 根目錄執行：

```bash
node dist/index.js generate
```

這個命令會依序：
1. 從 GitHub 抓取你所有的 repos（**預設包含 public + private**，含 README、語言統計、commit 紀錄）
2. 呼叫 OpenAI 為每個 repo 生成 AI 描述、分析技能分布、撰寫個人 Bio
3. 在 `./output/` 建立完整的 Astro 網站，並寫入 `src/data/portfolio.json`
4. 自動執行 `npm install` 安裝 Astro 的依賴

完成後你會看到：
```
✓ Portfolio generated → ./output
  cd ./output && npm run dev
```

### 步驟 2：本機預覽

```bash
cd output
npm run dev
```

瀏覽器開啟 `http://localhost:4321` 預覽網站。包含三個頁面：
- `/`：首頁（個人介紹 + 精選 6 個 repos + 技能概覽）
- `/projects`：所有 repos 列表，支援即時搜尋與語言篩選
- `/skills`：語言比例圖 + AI 技能分析

### 步驟 3：Build 靜態網站

確認內容無誤後，在 `output/` 目錄執行：

```bash
npm run build
```

這會在 `output/dist/` 生成完整的靜態 HTML/CSS/JS。

> **注意**：不要直接用瀏覽器開啟 `dist/` 裡的 HTML 檔案——Astro 產生的路徑是絕對路徑（`/` 開頭），用 `file://` 開啟會找不到 CSS/JS。請用以下命令透過本機伺服器預覽：

```bash
npm run preview
# 瀏覽器開啟 http://localhost:4321
```

確認沒問題後再部署。

### 步驟 4：部署

```bash
# Vercel（在 output/ 目錄執行）
npx vercel

# Netlify：把 output/dist/ 資料夾拖曳到 app.netlify.com

# GitHub Pages：把 output/dist/ 的內容推到 gh-pages branch
```

---

## 取得 GitHub Personal Access Token

1. 前往 [github.com/settings/tokens](https://github.com/settings/tokens) → **Generate new token (classic)**
2. 填寫名稱（如 `git-folio`），設定過期時間
3. 勾選權限：
   - **`repo`**（含所有 sub-items）—— 可抓 public + private repos（建議）
   - 若只需要 public repos：勾選 **`public_repo`** 即可
4. 點 **Generate token**，複製後貼到 `.env` 的 `GITHUB_PAT=` 後面

> **注意**：建議使用 Classic Token，不要用 Fine-grained Token（Fine-grained 有時在 GraphQL API 上有相容性問題）

---

## 管理要展示的 Repos

生成後，開啟 `output/src/data/portfolio.json`，每個 repo 有一個 `enable` 欄位：

```json
{
  "repos": [
    { "name": "awesome-project", "enable": true, ... },
    { "name": "old-experiment",  "enable": true, ... }
  ]
}
```

**隱藏某個 repo**：把 `enable` 改成 `false`，存檔即生效——

```json
{ "name": "old-experiment", "enable": false, ... }
```

- 在 `npm run dev` 開發模式下：頁面**立刻**更新，不需要重跑任何命令
- 在正式環境：重跑 `npm run build` 即可

重新執行 `git-folio generate` 不會覆蓋你的 `enable` 設定，工具會讀取現有值並保留。

---

## generate 命令選項

```
node dist/index.js generate [options]
```

| 選項 | 說明 | 預設值 |
|------|------|--------|
| `-o, --output <dir>` | 輸出目錄路徑 | `./output` |
| `--public-only` | 只抓 public repos（預設含 private） | 否 |
| `--skip-private-descriptions` | Private repos 不呼叫 AI（節省費用） | 否 |
| `--no-cache` | 忽略快取，強制重新從 GitHub 抓取 | 否 |
| `--cache-ttl <hours>` | 快取有效時間（小時） | `24` |
| `--max-repos <n>` | 最多抓幾個 repos | `100` |
| `--skip-ai` | 跳過所有 AI 分析，使用 GitHub 原始描述 | 否 |
| `--author <name>` | 覆蓋顯示名稱 | 從 GitHub 個人資料取得 |

**範例：**

```bash
# 預設：含 public + private repos
node dist/index.js generate

# 只抓 public repos
node dist/index.js generate --public-only

# 輸出到自訂目錄
node dist/index.js generate --output ./my-portfolio

# 不用 AI（免費，速度快）
node dist/index.js generate --skip-ai

# Private repos 不跑 AI 描述（節省費用）
node dist/index.js generate --skip-private-descriptions

# 強制重新抓取（不用快取）
node dist/index.js generate --no-cache
```

---

## 快取機制

第一次執行時會把 GitHub 資料寫入 `.git-folio-cache/github-data.json`。
之後重跑預設會用快取（24 小時內有效），不會重複打 GitHub API。

```bash
# 清除快取
node dist/index.js clear-cache

# 強制重新抓（這次跳過快取）
node dist/index.js generate --no-cache
```

---

## 更新資料

```bash
# 在 git-folio 根目錄執行（有快取就用快取）
node dist/index.js generate

# 強制重新抓 GitHub + 重跑 AI
node dist/index.js generate --no-cache
```

更新完成後在 `output/` 重跑 `npm run build` 即可刷新靜態網站。

> AI 分析每次重跑都會重新呼叫 OpenAI。50 個 repos 約 $0.007 美金。

---

## 費用估算

| 規模 | GitHub API | OpenAI (gpt-4o-mini) |
|------|-----------|----------------------|
| 20 repos | 免費 | ~$0.003 |
| 50 repos | 免費 | ~$0.007 |
| 100 repos | 免費 | ~$0.015 |

重新生成時若使用快取，GitHub API 費用為 $0。AI 分析每次重跑都會計費。

---

## .env 完整說明

```bash
# 必填
GITHUB_PAT=ghp_...          # GitHub Personal Access Token
OPENAI_API_KEY=sk-...       # OpenAI API Key（--skip-ai 時可不填）

# 選填
AUTHOR_NAME=                # 覆蓋作品集顯示名稱
SITE_URL=                   # 網站 URL（如 https://yourname.github.io）
```
