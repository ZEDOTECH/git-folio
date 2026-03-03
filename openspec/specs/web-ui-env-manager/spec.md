## Requirements

### Requirement: Read .env File
`GET /api/env` SHALL 讀取專案根目錄的 `.env` 檔案，解析所有 key=value 對，並回傳 JSON。Token 類欄位（含 `PAT`、`KEY`、`TOKEN` 的 key）SHALL 遮罩：僅顯示前 4 + 後 4 字元，中間以 `●●●●●●●●` 取代；若值長度 ≤ 8 則完全遮罩。非 token 欄位（如 `OPENAI_MODEL`、`AUTHOR_NAME`、`SITE_URL`）回傳原始值。回傳 JSON 包含 `masked: true` 旗標。

#### Scenario: .env 存在且含 token
- **WHEN** `GET /api/env`，`.env` 含 `GITHUB_PAT=ghp_abc123xyz789`
- **THEN** 回傳 `{ "GITHUB_PAT": "ghp_●●●●●●●●789", "masked": true }`

#### Scenario: .env 不存在
- **WHEN** `GET /api/env`，`.env` 檔案不存在
- **THEN** 回傳空物件 `{}`，HTTP 200（不報錯）

#### Scenario: 非 token 欄位
- **WHEN** `GET /api/env`，`.env` 含 `OPENAI_MODEL=gpt-4o-mini`
- **THEN** 回傳 `{ "OPENAI_MODEL": "gpt-4o-mini" }`（不遮罩）

---

### Requirement: Write .env File
`PUT /api/env` SHALL 接受 JSON body `{ "key": "value", ... }`，將這些值合併寫入 `.env` 檔案（保留既有的非更新欄位）。若收到的值是遮罩格式（含 `●`），SHALL 忽略該欄位（不覆寫原始值）。

#### Scenario: 更新 token
- **WHEN** `PUT /api/env` body 含 `{ "GITHUB_PAT": "ghp_newtoken123" }`
- **THEN** `.env` 中的 `GITHUB_PAT` 被更新，其他欄位不變，回傳 `{ "ok": true }`

#### Scenario: 遮罩值不覆寫
- **WHEN** `PUT /api/env` body 含 `{ "GITHUB_PAT": "ghp_●●●●●●●●789" }`
- **THEN** `.env` 中的 `GITHUB_PAT` 不被修改（保留原始值）

#### Scenario: 新增欄位
- **WHEN** `PUT /api/env` body 含 `.env` 中原本不存在的 key
- **THEN** 該 key=value 被 append 到 `.env` 末尾

#### Scenario: 空值欄位
- **WHEN** `PUT /api/env` body 含 `{ "SITE_URL": "" }`
- **THEN** `.env` 中的 `SITE_URL` 設為空字串（`SITE_URL=`），或從 `.env` 移除該行（擇一）
