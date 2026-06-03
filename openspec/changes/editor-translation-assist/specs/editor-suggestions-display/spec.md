## ADDED Requirements

### Requirement: section-suggestions-display

editor.html 在載入某 section 時,若該 section 含 `suggestions`,SHALL 於該段下方渲染三區:相似句、詞庫提示(glossary_hits)、文法待核對清單(grammar_checklist)。若該 section 無 `suggestions`,系統 MUST NOT 顯示這三區且 MUST NOT 報錯。三區之顯示 MUST NOT 改動既有 `ami_reviewed`/`ami_baseline` 的存檔行為。

#### Scenario: 有建議的段顯示三區

- **WHEN** 老師於 editor 載入一個含非空 `suggestions` 的 section
- **THEN** 該段下方顯示相似句、詞庫提示、文法待核對清單三區,內容取自該 section 的 `suggestions`

#### Scenario: 無建議的段不顯示三區

- **WHEN** 老師載入一個無 `suggestions` 欄位的 section
- **THEN** 不顯示三區,且頁面不報錯、其餘審稿功能照常

### Requirement: license-aware-similar-actions

相似句區呈現每筆句子時 SHALL 顯示其 `dialect` 與 `license`。對 `license` 為 `CC-BY-NC-SA` 或 `fair-use` 的句子,介面 MUST 僅以「參考」樣式呈現,MUST NOT 提供把該原句寫入 `ami_reviewed` 的動作(按鈕/拖放/一鍵插入)。對 `license` 為 `CC0` 的句子,介面 MAY 提供「插入參考」之類動作。

#### Scenario: NC 句不得提供插入動作

- **GIVEN** 相似句區有一筆 `license` 為 `"CC-BY-NC-SA"` 的句子
- **WHEN** 老師檢視該筆
- **THEN** 該筆顯示授權標籤且僅供參考,畫面無把其原句寫入 `ami_reviewed` 的動作

#### Scenario: CC0 句可提供插入動作

- **GIVEN** 相似句區有一筆 `license` 為 `"CC0"` 的句子
- **WHEN** 老師檢視該筆
- **THEN** 該筆 MAY 顯示「插入參考」動作

### Requirement: non-coast-dialect-labeling

相似句若 `dialect` 非海岸,介面 SHALL 明確標示其方言,提示老師該句僅作跨方言語順參考、非海岸標準寫法。

#### Scenario: 跨方言句標註方言

- **GIVEN** 相似句區有一筆 `dialect` 為 `"秀姑巒"` 的句子
- **WHEN** 老師檢視該筆
- **THEN** 該筆顯示「秀姑巒」方言標示,提示為跨方言參考
