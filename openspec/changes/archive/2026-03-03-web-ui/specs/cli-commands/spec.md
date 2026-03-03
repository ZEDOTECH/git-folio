## ADDED Requirements

### Requirement: serve Command
CLI SHALL 提供 `git-folio serve` 命令，啟動本機 Web UI server。

支援以下選項：
- `-p, --port <number>`：監聽 port，預設 `3000`
- `--open`：啟動後自動在預設瀏覽器開啟網址

#### Scenario: 基本啟動
- **WHEN** 使用者執行 `git-folio serve`
- **THEN** server 在 port 3000 啟動，印出「git-folio UI running at http://localhost:3000」

#### Scenario: 自訂 port
- **WHEN** 使用者執行 `git-folio serve --port 8080`
- **THEN** server 在 port 8080 啟動，印出對應網址

#### Scenario: --open 旗標
- **WHEN** 使用者執行 `git-folio serve --open`
- **THEN** server 啟動後，自動以系統預設瀏覽器開啟 `http://localhost:3000`
