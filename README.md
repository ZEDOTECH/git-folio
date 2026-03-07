# git-folio

從 GitHub 自動生成 AI 驅動的個人作品集網站。抓取所有 repos、用 GPT-5-mini 撰寫描述、生成完整可部署的 Astro + Tailwind CSS 靜態網站。

---

## 必要條件

- **Node.js 18+**
- **GitHub Personal Access Token**（必填，取得方式見下方）
- **OpenAI API Key**（選填，不需要 AI 分析可跳過）

---

## 安裝

```bash
git clone <this-repo>
cd git-folio
npm install
npm run build
```

---

## 快速開始：網頁版

安裝完成後，啟動內建管理介面：

```bash
npm run ui
```

瀏覽器開啟 **http://localhost:3000**，依序操作以下四個分頁：

### 1. Settings — 設定環境變數

填入以下欄位，填完後點 **Save**：

- **GITHUB_PAT**（必填）：GitHub Personal Access Token。取得方式見[下方說明](#取得-github-personal-access-token)。若只需展示 public repos，申請時 scope 只需勾選 `public_repo` 即可。
- **OPENAI_API_KEY**（選填）：OpenAI API Key。不需要 AI 分析的話，此欄位可留空，並在 Generate 分頁勾選 **Skip AI enrichment**。
- **OPENAI_MODEL**（選填）：自訂 AI 模型名稱，預設為 `gpt-5-mini`。

### 2. Visibility — 選擇要 Generate 的 Repos

點 **Load Repos** 從 GitHub 載入 repo 清單，勾選想要包含在作品集的 repos。**勾選狀態自動儲存**，不需要額外點 Save。

Generate 時會依照此處的勾選結果，只處理被選中的 repos。可隨時修改後重新 Generate。

### 3. Generate — 生成作品集

設定好選項後點 **▶ Generate**，右側 Log 視窗會即時顯示進度：

- **Skip AI enrichment**：跳過 AI 分析，使用 GitHub 原始描述（不需填 OPENAI_API_KEY）
- **No cache (force re-fetch)**：忽略快取，強制重新從 GitHub 抓取

### 4. Preview — 預覽作品集

點 **Start Preview** 啟動本機預覽伺服器，再點 **Open ↗** 在新分頁開啟你的作品集網站（http://localhost:4321）。包含三個頁面：

- `/`：首頁（個人介紹 + 精選 6 個 repos + 技能概覽）
- `/projects`：所有 repos 列表，支援即時搜尋與語言篩選
- `/skills`：語言比例圖 + AI 技能分析

---

## 部署

`output/` 是純靜態 HTML，不需要 build 步驟，可直接部署到任何靜態托管服務。

### Vercel

```bash
# 在 output/ 目錄執行
npx vercel
```

### Netlify

把 `output/` 資料夾拖曳到 [app.netlify.com](https://app.netlify.com)。

### GitHub Pages

GitHub Pages 會把指定 branch 的靜態檔案直接當作網站 serve，網址為 `https://<帳號>.github.io/<repo名稱>/`。

**步驟：**

```bash
cd output

# 初始化一個獨立的 git repo（只包含靜態檔案）
git init
git add index.html projects.html skills.html favicon.svg projects/ README.md
git commit -m "Deploy portfolio"

# 推到你的 GitHub repo 的 gh-pages branch
git remote add origin https://github.com/<你的帳號>/<repo名稱>.git
git push -f origin HEAD:gh-pages
```

推完後到 GitHub repo 頁面：**Settings → Pages → Source**，選擇 `gh-pages` branch、`/ (root)`，按 Save。幾分鐘後網站即上線。

> **日後更新**：重新 Generate 後，進入 `output/` 再執行一次上面的 `git add / commit / push` 即可更新網站。`node_modules/` 和 `src/data/` 不需要推上去。

---

## 取得 GitHub Personal Access Token

1. 前往 [github.com/settings/tokens](https://github.com/settings/tokens) → **Generate new token (classic)**
2. 填寫名稱（如 `git-folio`），設定過期時間
3. 勾選權限：
   - **`repo`**（含所有 sub-items）—— 可抓 public + private repos
   - **只需展示 public repos**：只勾選 **`public_repo`** 即可，不需要完整的 `repo` 權限
4. 點 **Generate token**，複製後貼到 `.env` 的 `GITHUB_PAT=` 後面

> **注意**：建議使用 Classic Token，不要用 Fine-grained Token（Fine-grained 有時在 GraphQL API 上有相容性問題）

---

## 費用估算

| 規模 | GitHub API | OpenAI (gpt-5-mini) |
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

# 選填
OPENAI_API_KEY=sk-...       # OpenAI API Key（不需 AI 分析時可不填，搭配 Skip AI enrichment 使用）
OPENAI_MODEL=gpt-5-mini     # AI 模型（預設 gpt-5-mini，可改用其他 OpenAI 模型）
AUTHOR_NAME=                # 覆蓋作品集顯示名稱
SITE_URL=                   # 網站 URL（如 https://yourname.github.io）
```
