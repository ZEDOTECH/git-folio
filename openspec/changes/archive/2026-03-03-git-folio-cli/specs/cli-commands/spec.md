## ADDED Requirements

### Requirement: generate Command
CLI SHALL 提供 `git-folio generate` 命令作為主要入口，執行完整的資料抓取 → AI 分析 → 網站生成流程。

支援以下選項：
- `-o, --output <dir>`：output 目錄，預設 `./output`
- `--public-only`：只抓 public repos（預設包含 public + private）
- `--skip-private-descriptions`：private repos 不生成 AI 描述
- `--no-cache`：跳過 cache，強制重抓
- `--cache-ttl <hours>`：cache TTL（小時），預設 `24`
- `--max-repos <n>`：最多抓幾個 repos，預設 `100`
- `--skip-ai`：跳過 AI 分析
- `--theme <name>`：網站主題（目前只有 `default`）
- `--author <name>`：覆蓋顯示名稱

#### Scenario: 基本執行
- **WHEN** 使用者執行 `git-folio generate`
- **THEN** 系統依序：讀取 `.env`、抓取 public + private repos、AI 分析、生成 `./output` 目錄，最後印出成功訊息及下一步提示

#### Scenario: 只抓 public repos
- **WHEN** `git-folio generate --public-only --output ./my-portfolio`
- **THEN** 只抓取 public repos，輸出到 `./my-portfolio`

#### Scenario: 缺少必要環境變數
- **WHEN** `.env` 不存在或缺少 `GITHUB_PAT`
- **THEN** 顯示清楚的錯誤訊息，exit code 非零，不進行任何 API 請求

---

### Requirement: clear-cache Command
CLI SHALL 提供 `git-folio clear-cache` 命令，刪除 `.git-folio-cache/` 目錄。

#### Scenario: 刪除 cache
- **WHEN** 使用者執行 `git-folio clear-cache`
- **THEN** `.git-folio-cache/` 目錄及其所有內容被刪除，印出「Cache cleared.」

#### Scenario: Cache 不存在
- **WHEN** `.git-folio-cache/` 不存在
- **THEN** 命令成功結束（無錯誤），印出「No cache found.」

---

### Requirement: CLI Progress Feedback
CLI SHALL 在每個重要階段顯示進度：使用 `ora` spinner 表示進行中的操作，每個階段完成後顯示 ✓ 符號和說明。

#### Scenario: 正常執行進度輸出
- **WHEN** `generate` 命令執行中
- **THEN** 依序顯示（各帶 spinner 和完成符號）：
  「Fetching GitHub profile...」→「Fetching repositories (page N/N)...」→「Generating AI summaries (X/Y)...」→「Analyzing skills...」→「Generating bio...」→「Generating site...」→「Done! Portfolio generated at: ./portfolio」

---

### Requirement: .env.example and Onboarding
CLI 套件 SHALL 在文件中（README）說明 `.env` 設定，`.env.example` 列出所有支援的環境變數及其說明和取得方式。

#### Scenario: 使用者首次設定
- **WHEN** 使用者閱讀 `.env.example`
- **THEN** 能清楚知道需要哪些 token、如何取得、各有什麼作用

---

### Requirement: Entry Point and Binary
CLI SHALL 以 `#!/usr/bin/env node` 為 entry point，並在 `package.json` 的 `bin` 欄位註冊 `git-folio` 命令，使安裝後可直接執行 `git-folio` 或透過 `npx git-folio` 使用。

#### Scenario: 全域安裝後執行
- **WHEN** 使用者執行 `npm install -g git-folio` 後執行 `git-folio generate`
- **THEN** 命令正常執行

#### Scenario: npx 執行
- **WHEN** 使用者執行 `npx git-folio generate`
- **THEN** 自動下載最新版本並執行
