## ADDED Requirements

### Requirement: grammar-rules-document

系統 SHALL 維護 `glossary/amis-grammar-rules.md`,以人類可讀、可逐條核對的 checklist 形式記錄阿美語核心語法,至少涵蓋:謂語在前的語序(VSO 傾向)、格位標記(`o`/`ko`/`to`/`no` 的用法)、焦點系統、以及數字採阿拉伯數字之規範。每條規則 MUST 含「規則敘述」與「可檢查的判準或正/反例」。規則之正/反例 SHALL 優先取自 klokah 句法演練(grmpts)同句法分類之海岸實例(其 `grammar_cat` 對應到對應規則,如焦點系統、否定句、代名詞),使規則有真實語料佐證。

#### Scenario: 規則含判準與反例

- **WHEN** 檢視某條語序規則
- **THEN** 該條同時提供規則敘述與至少一組正例/反例可供核對

##### Example: 格位標記規則

- **GIVEN** 規則「主格用 `ko`、斜格/受詞用 `to`、屬格用 `no`」
- **WHEN** 核對句子 `mafolaw ko Singkapol`
- **THEN** 可判定 `ko` 標記主語 Singkapol 為正確用法;若改用 `to Singkapol` 作主語則違反此規則

### Requirement: grammar-rules-applicable-in-revision

詞庫/文法規則 SHALL 可在「兩步翻譯」的第二步(修語順)被引用套用:對一句草稿,系統 SHALL 能列出與該句相關、需核對的規則項,供 LLM 或人工據以調整語序與標記。此引用 MUST NOT 自動覆寫譯文,僅產生「待核對規則清單」。

#### Scenario: 為草稿產生待核對規則清單

- **WHEN** 對一句含多個格位標記的草稿執行規則核對
- **THEN** 系統輸出該句相關的規則項(如語序、格位標記)清單,且不直接修改原草稿

##### Example: 一句草稿的待核對清單

- **GIVEN** 草稿 `mafolaw to no Ingko ko Singkapol`(含 `to`/`no`/`ko` 三個格位標記)
- **WHEN** 執行規則核對
- **THEN** 輸出清單含「格位標記:確認 ko 標主語、no 標屬格、to 標斜格是否正確」與「語序:謂語 mafolaw 在前是否合宜」兩項,且 `mafolaw to no Ingko ko Singkapol` 原文不變
