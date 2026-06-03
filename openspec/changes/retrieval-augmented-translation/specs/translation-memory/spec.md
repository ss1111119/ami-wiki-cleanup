## ADDED Requirements

### Requirement: parallel-corpus-build

建置系統 SHALL 從下列來源抽出阿美語↔中文平行句,正規化成統一結構並輸出至 `glossary/parallel-corpus.json`:klokah 句法演練(`200族語e樂園/句法演練/*.csv`,海岸主力)、klokah 文化篇/情境族語/族語短文(`200族語e樂園/**/*.csv`)、klokah 族語新聞標題(`200族語e樂園/族語新聞/*.csv` 的標題族語↔中文)、萌典例句(`dict/dict-amis-safolu.json`、`dict/dict-amis.json` 的 `example` 欄位,跨方言參考)、既有新聞語料(`glossary/corpus/news-ilrdf-*.md`)。每筆 MUST 含非空 `amis`、`chinese`、`source`、`license` 與 `dialect`;來自 grmpts 句法演練者 MUST 另含非空 `grammar_cat` 與 `level`。萌典例句格式 `￹...Amis...￺￻...中文...` MUST 被解析:取 `￹` 與 `￺` 之間為阿美語、`￻` 之後為中文,並移除 `` ` `` 與 `~` 標記。klokah CSV 之族語欄若內含尾隨中文,MUST 於首個中文字切除,只留族語。

#### Scenario: 解析萌典例句並標記 CC0

- **WHEN** 執行 `node glossary/build-corpus.mjs`
- **THEN** 萌典每筆 `example` 被解析為一組平行句,`source` 為 `"moedict"`、`license` 為 `"CC0"`、`dialect` 為 `"秀姑巒"`,且阿美語不含 `` ` `` 或 `~`

#### Scenario: 句法演練句帶分類與級別標籤

- **WHEN** build-corpus 處理 `200族語e樂園/句法演練/3_海岸阿美語.csv`
- **THEN** 每筆輸出 `source` 為 `"grmpts"`、`license` 為 `"CC-BY-NC-SA"`、`dialect` 為 `"海岸"`,且 `grammar_cat`(如「焦點系統」)與 `level`(如「初級」)非空

##### Example: 一筆句法演練平行句

- **GIVEN** CSV 列 `海岸阿美語,初級,名詞,3371,hini katin.,這是牛。`
- **WHEN** build-corpus 解析該列
- **THEN** 輸出 `{ "amis": "hini katin.", "chinese": "這是牛。", "source": "grmpts", "license": "CC-BY-NC-SA", "dialect": "海岸", "grammar_cat": "名詞", "level": "初級" }`

##### Example: 單句解析

- **GIVEN** 萌典例句字串 `￹`Mapereday~ `ko~ `paenan~.￺￻地板塌陷下去了。`
- **WHEN** build-corpus 解析該句
- **THEN** 輸出 `{ "amis": "Mapereday ko paenan.", "chinese": "地板塌陷下去了。", "source": "moedict", "license": "CC0" }`

#### Scenario: 多來源彙整與計數

- **WHEN** build-corpus 執行完成
- **THEN** 產出語料總筆數 ≥ 30000,並於輸出印出各來源(grmpts / klokah-culture / klokah-situational / klokah-shortread / readnews-title / moedict / news)與各方言(海岸/秀姑巒/…)的筆數與總數;海岸來源合計 ≥ 3500

### Requirement: parallel-corpus-similarity-search

系統 SHALL 提供以中文 query 檢索最相近平行句的功能 `node glossary/search-corpus.mjs "<中文句>" [--k N] [--dialect <方言>] [--grammar <句法分類>]`,預設回傳 top-5,結果 MUST 依相似度分數由高到低排序,每筆含分數、`amis`、`chinese`、`source`、`license`、`dialect`(及 grmpts 之 `grammar_cat`/`level`)。提供 `--dialect` 時 MUST 僅回傳該方言(預設不過濾,但海岸句 SHALL 排序優先於跨方言句);提供 `--grammar` 時 MUST 僅回傳該句法分類。當無可用句向量索引時,系統 SHALL 退化為關鍵字比對並於輸出標明 `degraded`,且 MUST NOT 報錯中止。

#### Scenario: 相似度檢索回傳排序結果

- **WHEN** 使用者執行 `node glossary/search-corpus.mjs "地板塌下去了" --k 3`
- **THEN** 回傳 3 筆平行句,依分數遞減排序,且語意相近者(含「塌陷/地板」)分數較高

##### Example: 三筆依分數排序

- **GIVEN** 候選 A(score=0.92)、B(score=0.40)、C(score=0.71)
- **WHEN** 檢索並取 top-3
- **THEN** 回傳順序為 A、C、B

#### Scenario: 無嵌入索引時退化

- **WHEN** 嵌入索引不存在而執行檢索
- **THEN** 系統以關鍵字比對回傳結果,並在輸出標示 `degraded`,流程不中斷

### Requirement: corpus-license-tagging

語料中每筆 MUST 帶 `license` 欄位以驅動下游用途。標記為 `CC-BY-NC-SA`(klokah grmpts/文化篇等)或 `fair-use`(readnews 合理使用轉載)的句子僅供翻譯/校對之內部檢索參考,系統與其使用者 MUST NOT 將其原句輸出至維基百科內容。標記為 `CC0`(萌典)的句子可自由使用。

#### Scenario: NC 授權句不得原句外洩

- **WHEN** 下游流程取用一筆 `license` 為 `"CC-BY-NC-SA"` 的句子
- **THEN** 該句僅作為翻譯參考,系統 MUST NOT 將其原文直接寫入要發布的維基內容

#### Scenario: 合理使用轉載句不得外洩

- **WHEN** 下游流程取用一筆 `license` 為 `"fair-use"` 的 readnews 句(含標題)
- **THEN** 該句僅作為翻譯參考,系統 MUST NOT 將其原文直接寫入要發布的維基內容

### Requirement: dialect-difference-map

系統 SHALL 提供 `node glossary/build-dialect-diff.mjs` 產出 `glossary/dialect-diff.json`,以 klokah 詞表(`glossary/corpus/klokah-wordlist.csv` 的海岸/秀姑巒兩欄)與五方言同題文化篇/句法演練對齊,標出海岸與秀姑巒拼法不同之詞/句。輸出 MUST 印出整體差異比率與功能詞(代名詞/指示詞/助詞/助動詞)的差異統計。此對照用於跨方言句作為海岸語順範本時,提示需替換的功能詞,MUST NOT 自動改寫語料。

#### Scenario: 標出方言差異並統計功能詞

- **WHEN** 執行 `node glossary/build-dialect-diff.mjs`
- **THEN** `dialect-diff.json` 含拼法不同的詞對(海岸/秀姑巒),且輸出印出整體差異比率與功能詞類差異筆數(> 0)

##### Example: 功能詞差異條目

- **GIVEN** klokah 詞表「我們」海岸作 `kami`、秀姑巒作 `kita`
- **WHEN** build-dialect-diff 比對該詞
- **THEN** `dialect-diff.json` 含 `{ "zh": "我們", "coast": "kami", "xiuguluan": "kita", "category": "代名詞、指示詞" }`
