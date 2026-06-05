# teacher-glossary Specification

## Purpose

TBD - created by archiving change 'retrieval-augmented-translation'. Update Purpose after archive.

## Requirements

### Requirement: glossary-store

系統 SHALL 維護一份確認詞庫 `glossary/teacher-confirmed.json`,結構為 `{ terms: [{zh, ami, note, by, date}], avoid: [{ami, reason, use}], rules: [{rule, example}] }`。`terms` 記錄中文概念對應到已確認的阿美語詞;`avoid` 記錄不可使用(或不可用於某語境)的詞及建議替代;`rules` 記錄通用規範。

#### Scenario: 詞庫條目結構

- **WHEN** 新增一筆已確認詞對應
- **THEN** 該筆寫入 `terms` 並含 `zh`、`ami`、`by`、`date` 欄位

##### Example: 政府用詞統一

- **GIVEN** 老師確認「政府」統一用 `seyfo`、不用 `ceng fo`
- **WHEN** 寫入詞庫
- **THEN** `terms` 含 `{ "zh": "政府", "ami": "seyfo", "note": "統一用 seyfo,不用 ceng fo", "by": "teacher", "date": "2026-06-03" }`,且 `avoid` 含 `{ "ami": "ceng fo", "reason": "政府改用 seyfo", "use": "seyfo" }`


<!-- @trace
source: retrieval-augmented-translation
updated: 2026-06-03
code:
  - .agents/skills/spectra-ingest/SKILL.md
  - CLAUDE.md
  - glossary/amis-grammar-rules.md
  - .antigravitycli/49f8961b-d94f-421d-9367-55c5685cc444.json
  - glossary/test-extract-from-edits.mjs
  - glossary/apply-glossary.mjs
  - 200族語e樂園/句法演練/scrape_grmpts.py
  - glossary/build-dialect-diff.mjs
  - glossary/test-build-corpus.mjs
  - glossary/test-search-corpus.mjs
  - glossary/translate-demo.mjs
  - .agents/skills/spectra-apply/SKILL.md
  - .agents/skills/spectra-discuss/SKILL.md
  - .agents/skills/spectra-propose/SKILL.md
  - .agents/skills/spectra-audit/SKILL.md
  - 200族語e樂園/閱讀書寫篇/閱讀書寫篇.py
  - dict/build-index.mjs
  - review-app/public/editor.html
  - singapore-ILRDF-review.md
  - review-app/build-dict.mjs
  - glossary/test-dialect-diff.mjs
  - glossary/test-apply-glossary.mjs
  - glossary/extract-from-edits.mjs
  - .agents/skills/spectra-commit/SKILL.md
  - review-app/public/style.css
  - review-app/corpus-reference.json
  - glossary/build-corpus.mjs
  - .agents/skills/spectra-drift/SKILL.md
  - AGENTS.md
  - node_modules
  - singapore-ILRDF-final.md
  - dict/lookup.mjs
  - glossary/two-step-translation.md
  - .agents/skills/spectra-ask/SKILL.md
  - .agents/skills/spectra-archive/SKILL.md
  - .spectra.yaml
  - review-app/public/dict-database.json
  - glossary/search-corpus.mjs
  - 200族語e樂園/族語新聞/scrape_readnews.py
  - glossary/teacher-confirmed.json
  - .agents/skills/spectra-debug/SKILL.md
-->

---
### Requirement: glossary-extract-from-edits

系統 SHALL 提供 `node glossary/extract-from-edits.mjs <articleId>`,讀取 Firestore 各 section 的 `ami_baseline` 與 `ami_reviewed`,以逐詞 diff 抽出老師的刪除/替換/新增作為詞庫候選,輸出至 `glossary/edit-candidates.json`。候選 MUST NOT 直接寫入 `teacher-confirmed.json`,須經人工篩選後才入庫。缺少 `ami_baseline` 的 section MUST 被跳過並提示。

#### Scenario: 從修改抽出替換候選

- **WHEN** 某 section 的 baseline 含 `ceng fo`、reviewed 改為 `seyfo`,執行 extract-from-edits
- **THEN** `edit-candidates.json` 產生一筆 `{ "type": "term", "from": "ceng fo", "to": "seyfo", "sectionId": "<id>" }`

#### Scenario: 候選不自動入庫

- **WHEN** extract-from-edits 產生候選
- **THEN** `teacher-confirmed.json` 未被修改,候選僅存於 `edit-candidates.json`

#### Scenario: 缺 baseline 的段落跳過

- **WHEN** 某 section 無 `ami_baseline`
- **THEN** 該 section 被跳過並輸出提示,其他 section 照常處理


<!-- @trace
source: retrieval-augmented-translation
updated: 2026-06-03
code:
  - .agents/skills/spectra-ingest/SKILL.md
  - CLAUDE.md
  - glossary/amis-grammar-rules.md
  - .antigravitycli/49f8961b-d94f-421d-9367-55c5685cc444.json
  - glossary/test-extract-from-edits.mjs
  - glossary/apply-glossary.mjs
  - 200族語e樂園/句法演練/scrape_grmpts.py
  - glossary/build-dialect-diff.mjs
  - glossary/test-build-corpus.mjs
  - glossary/test-search-corpus.mjs
  - glossary/translate-demo.mjs
  - .agents/skills/spectra-apply/SKILL.md
  - .agents/skills/spectra-discuss/SKILL.md
  - .agents/skills/spectra-propose/SKILL.md
  - .agents/skills/spectra-audit/SKILL.md
  - 200族語e樂園/閱讀書寫篇/閱讀書寫篇.py
  - dict/build-index.mjs
  - review-app/public/editor.html
  - singapore-ILRDF-review.md
  - review-app/build-dict.mjs
  - glossary/test-dialect-diff.mjs
  - glossary/test-apply-glossary.mjs
  - glossary/extract-from-edits.mjs
  - .agents/skills/spectra-commit/SKILL.md
  - review-app/public/style.css
  - review-app/corpus-reference.json
  - glossary/build-corpus.mjs
  - .agents/skills/spectra-drift/SKILL.md
  - AGENTS.md
  - node_modules
  - singapore-ILRDF-final.md
  - dict/lookup.mjs
  - glossary/two-step-translation.md
  - .agents/skills/spectra-ask/SKILL.md
  - .agents/skills/spectra-archive/SKILL.md
  - .spectra.yaml
  - review-app/public/dict-database.json
  - glossary/search-corpus.mjs
  - 200族語e樂園/族語新聞/scrape_readnews.py
  - glossary/teacher-confirmed.json
  - .agents/skills/spectra-debug/SKILL.md
-->

---
### Requirement: glossary-apply

系統 SHALL 提供 `node glossary/apply-glossary.mjs <文字>`,依詞庫對輸入文字套用:`avoid` 詞被標記(含原因與建議替代)、`terms` 對應可被替換,並輸出「套用了哪些規則」的清單。此功能用於翻譯前先消除已知錯詞、統一已確認用詞。

#### Scenario: 套用避用詞標記

- **GIVEN** 詞庫 `avoid` 含 `{ "ami": "langdaway", "reason": "綠蛇/青竹絲,勿用於『綠化』", "use": "makofakof" }`
- **WHEN** 對含 `langdaway` 的句子執行 apply-glossary
- **THEN** 輸出標記該詞為避用、附原因與建議替代 `makofakof`,並列於套用清單中

<!-- @trace
source: retrieval-augmented-translation
updated: 2026-06-03
code:
  - .agents/skills/spectra-ingest/SKILL.md
  - CLAUDE.md
  - glossary/amis-grammar-rules.md
  - .antigravitycli/49f8961b-d94f-421d-9367-55c5685cc444.json
  - glossary/test-extract-from-edits.mjs
  - glossary/apply-glossary.mjs
  - 200族語e樂園/句法演練/scrape_grmpts.py
  - glossary/build-dialect-diff.mjs
  - glossary/test-build-corpus.mjs
  - glossary/test-search-corpus.mjs
  - glossary/translate-demo.mjs
  - .agents/skills/spectra-apply/SKILL.md
  - .agents/skills/spectra-discuss/SKILL.md
  - .agents/skills/spectra-propose/SKILL.md
  - .agents/skills/spectra-audit/SKILL.md
  - 200族語e樂園/閱讀書寫篇/閱讀書寫篇.py
  - dict/build-index.mjs
  - review-app/public/editor.html
  - singapore-ILRDF-review.md
  - review-app/build-dict.mjs
  - glossary/test-dialect-diff.mjs
  - glossary/test-apply-glossary.mjs
  - glossary/extract-from-edits.mjs
  - .agents/skills/spectra-commit/SKILL.md
  - review-app/public/style.css
  - review-app/corpus-reference.json
  - glossary/build-corpus.mjs
  - .agents/skills/spectra-drift/SKILL.md
  - AGENTS.md
  - node_modules
  - singapore-ILRDF-final.md
  - dict/lookup.mjs
  - glossary/two-step-translation.md
  - .agents/skills/spectra-ask/SKILL.md
  - .agents/skills/spectra-archive/SKILL.md
  - .spectra.yaml
  - review-app/public/dict-database.json
  - glossary/search-corpus.mjs
  - 200族語e樂園/族語新聞/scrape_readnews.py
  - glossary/teacher-confirmed.json
  - .agents/skills/spectra-debug/SKILL.md
-->