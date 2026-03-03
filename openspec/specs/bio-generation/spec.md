## Requirements

### Requirement: Bio is Never Empty After Generation
生成完成後，`portfolio.json` 中的 `profile.bio` SHALL 永遠不是空字串。無論 AI 是否啟用、GitHub 個人 bio 是否設定，系統 SHALL 保證最終 bio 有可顯示的內容。

#### Scenario: AI 成功生成 bio
- **WHEN** AI 成功解析並返回 `{ "bio": "..." }`
- **THEN** `profile.bio` 使用 AI 生成的內容

#### Scenario: AI 失敗，GitHub bio 存在
- **WHEN** AI 呼叫失敗或回傳空值，但 `viewer.bio` 不為 null
- **THEN** `profile.bio` 使用 `viewer.bio`

#### Scenario: AI 失敗，GitHub bio 也為空
- **WHEN** AI 失敗且 `viewer.bio` 為 null 或空字串
- **THEN** `profile.bio` 使用組合 fallback bio（非空）

#### Scenario: skip-AI 模式，GitHub bio 為空
- **WHEN** 使用者傳入 `--skip-ai`，且 `viewer.bio` 為 null 或空字串
- **THEN** `profile.bio` 使用組合 fallback bio（非空）

---

### Requirement: Composed Fallback Bio
當 AI 不可用或失敗時，系統 SHALL 從現有的個人資料欄位組合一段 fallback bio，格式為可讀的英文句子。組合素材 SHALL 包含：`viewer.name`、`viewer.company`（若有）、`viewer.location`（若有）、語言比例前 3 名、技能名稱前 2 名、repo 總數（public + private）。

#### Scenario: 完整資料組合
- **WHEN** viewer 有 name、company、location，且有語言比例和技能資料
- **THEN** 輸出類似「Software developer at ZEDOTECH, based in Taiwan. Works primarily in TypeScript, C#, and HTML across 11 repositories, with expertise in Full-Stack .NET Backend and Front-end UI development.」

#### Scenario: 部分資料缺失
- **WHEN** viewer 缺少 company 或 location
- **THEN** 省略缺失欄位，其餘欄位仍正常組合，bio 不為空

---

### Requirement: AI Bio Prompt Includes Private Repo Context
當抓取資料包含 private repos 時（即 `data.repos` 中存在 `isPrivate: true` 的項目），bio prompt SHALL 額外提供匿名化的 private repo 資訊，以幫助 AI 生成更準確的個人簡介。Private repo 的名稱、URL、描述 SHALL NOT 出現在 prompt 中。

#### Scenario: 有 private repos 且未使用 --public-only
- **WHEN** `data.repos` 包含 private repos
- **THEN** prompt 中附加：private repo 數量、private repos 的主要語言聚合（去重）、private repos 的 topics 聚合（去重）、所有 repos 的活躍年份跨度

#### Scenario: 無 private repos（pure public 帳號或使用 --public-only）
- **WHEN** `data.repos` 中沒有 `isPrivate: true` 的項目
- **THEN** prompt 不附加 private 資訊，僅使用公開資料

---

### Requirement: AI Bio Prompt Includes Language Breakdown and Full Skill Descriptions
bio prompt SHALL 包含：語言比例（前 5 名，格式：`TypeScript: 45.2%`）、技能完整描述（`name + description`，非僅名稱）。

#### Scenario: 語言比例加入 prompt
- **WHEN** `languageBreakdown` 有資料
- **THEN** prompt 中呈現前 5 名語言及其百分比

#### Scenario: 技能描述加入 prompt
- **WHEN** `skills` 陣列不為空
- **THEN** prompt 中包含每個技能的 name 和 description（一句話說明專業深度）
