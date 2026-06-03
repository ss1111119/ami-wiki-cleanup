## ADDED Requirements

### Requirement: suggestions-build-script

系統 SHALL 提供 `node review-app/build-suggestions.mjs <articleId> [--k N]`,對該條目每個 section 計算審稿建議並寫入 Firestore `translations/{articleId}/sections/{sid}` 的 `suggestions` 欄位。`suggestions` MUST 為物件,含 `similar`(陣列)、`glossary_hits`(陣列)、`grammar_checklist`(陣列)與 `built_at`。`similar` 每筆 MUST 含非空 `amis`、`chinese`、`source`、`license`、`dialect` 與 `score`。當任一 RAT 產物(`glossary/parallel-corpus.json`、`glossary/teacher-confirmed.json`、`glossary/amis-grammar-rules.md`)缺失時,系統 MUST 報明缺哪個檔並中止,MUST NOT 寫入半成品。

#### Scenario: 對條目產生各段建議

- **WHEN** RAT 產物齊備且執行 `node review-app/build-suggestions.mjs Singapore`
- **THEN** 至少一個 section 的 Firestore 文件取得非空 `suggestions.similar`(每筆含 amis/chinese/source/license/dialect/score)與 `suggestions.grammar_checklist`,並於輸出印出各 section 寫入的筆數

#### Scenario: RAT 產物缺失時中止

- **WHEN** `glossary/parallel-corpus.json` 不存在而執行 build-suggestions
- **THEN** 系統印出缺少該檔的錯誤並中止,Firestore 的 `suggestions` 未被寫入

### Requirement: suggestions-similar-by-section-chinese

建議的相似句 SHALL 以該 section 的中文為 query,透過 `glossary/search-corpus.mjs --dialect 海岸` 取 top-k(預設 5),結果保留每筆的 `dialect` 與 `license`。海岸句 SHALL 優先;若以跨方言句補足,該筆 `dialect` MUST 仍標其原方言。某 section 無中文來源時 MUST 跳過其相似句計算並提示,其 `glossary_hits` 與 `grammar_checklist` 仍照常產生。

#### Scenario: 以海岸優先取相似句

- **WHEN** 對一個有中文的 section 執行相似句計算
- **THEN** `suggestions.similar` 依分數遞減排序,海岸句排序優先,每筆保留 dialect 與 license

#### Scenario: 無中文來源的段跳過相似句

- **WHEN** 某 section 無中文來源
- **THEN** 該段 `suggestions.similar` 為空並提示,`glossary_hits` 與 `grammar_checklist` 仍照常產生

### Requirement: suggestions-glossary-and-grammar

建議 SHALL 比對 `glossary/teacher-confirmed.json` 標出該段草稿(ami_ai 或 ami_reviewed)命中的避用詞與已確認詞,寫入 `glossary_hits`(每筆含 `term`、`type` 為 `"avoid"` 或 `"term"`,avoid 另含 `reason` 與 `suggest`);並依 `glossary/amis-grammar-rules.md` 列出該段相關規則項寫入 `grammar_checklist`(每筆含 `rule`)。此計算 MUST NOT 改寫該段譯文。

#### Scenario: 標出避用詞與建議替代

- **GIVEN** `teacher-confirmed.json` 的 avoid 含 `{ "ami": "langdaway", "reason": "綠蛇,勿用於『綠化』", "use": "makofakof" }`,且某段草稿含 `langdaway`
- **WHEN** build-suggestions 處理該段
- **THEN** `suggestions.glossary_hits` 含 `{ "term": "langdaway", "type": "avoid", "reason": "綠蛇,勿用於『綠化』", "suggest": "makofakof" }`,且該段譯文未被改寫
