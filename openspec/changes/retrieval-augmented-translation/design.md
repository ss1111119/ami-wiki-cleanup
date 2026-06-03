## Context

校對平台已上線(Firestore + 編輯器追蹤修訂),翻譯流程為「ILRDF/萌典出草稿 → 老師校對」。實務觀察到老師最大、最難代勞的負擔是**語順自然化**;客觀錯誤(數字、用錯詞、亂碼)已可由腳本與萌典查證大幅先處理。

**語料盤點(本變更期間實測確認):**

- **klokah 句法演練(grmpts)** — 端點 `web.klokah.tw/grmpts/json/{did}.json`(課程索引,level×句法分類→tid)+ 站根 `/text/read_embed.php?tid=&mode=1`(每課 ~14 句 `read-sentence Ab/Ch` 平行句)。**海岸(did=3)已抓 2,018 句**(`200族語e樂園/句法演練/3_海岸阿美語.csv`),每句帶句法分類與級別。CC BY-NC-SA。為**海岸目標下最優主力**(目標方言 + 句法標籤)。
- **本地 `200族語e樂園/`** — klokah 各單元既抓:文化篇海岸 240 句(百科文體,平行)、情境族語課文 919、族語短文課文 463、十二階詞表、wawa 單詞等。CC BY-NC-SA。
- **klokah 族語新聞(readnews)** — `readnews/php/getNews.php?d={did}&t=&p=` 回 JSON;**標題族語↔中文平行、內文為單語族語**。海岸已抓 19 篇。授權為著作權法第 52/65 條合理使用轉載(非 CC),標題與內文皆不得貼維基。
- **g0v 萌典** — `dict/dict-amis-safolu.json`(39,505 詞,~32,890 組 CC0 例句,**秀姑巒系**)、`dict-amis.json`(~2,012 例句)、`dict/lookup.mjs`。CC0、規模大,但屬秀姑巒,列為**跨方言語順參考**,非海岸主力。
- **既有** `glossary/corpus/` klokah 例句與 ILRDF 新聞(秀姑巒)。

**方言事實**:輸出目標為海岸(Pasawalian)。實測 klokah 詞表海岸 vs 秀姑巒 1,094 對可配對詞中 44.7% 拼法不同,差異集中於功能詞(代名詞/指示詞/助詞/助動詞 70%+),實詞(數字/身體/動物)僅 20–26%。故跨方言語料可作語順範本,但功能詞需以方言對照校正。低資源 MT 研究指出:檢索增強 in-context 翻譯 + 相似度選範例 + 文法規則 + 兩步翻譯為當前最佳實踐,瓶頸「缺平行示範句」由 grmpts/文化篇(海岸)+ 萌典(跨方言)+「老師校對回饋」三路補足。

## Goals / Non-Goals

**Goals:**

- 把既有資產轉成可檢索的**平行句語料**與**確認詞庫**,在草稿階段就提升用詞一致與語順自然度。
- 提供翻譯時的**相似範例檢索**與**文法 checklist**,讓草稿更接近自然阿美語。
- 建立**老師校對 → 語料/詞庫成長**的正循環,使同類修正不需重複做。
- 全程離線可重現(資料與索引存 repo),不依賴付費服務即可運作。

**Non-Goals:**

- 不微調/訓練模型;不自動發布;不取代老師的母語判斷。
- 不更動既有 `corpus-search`、`dictionary-lookup` 的需求,本變更為附加層。
- 不把 CC BY-NC-SA 例句原句輸出到維基(僅作翻譯/校對參考)。

## Decisions

### Decision: D1 — 嵌入模型採可離線的本機多語句向量,API 為選配

相似度檢索需句向量。選**本機輕量多語模型**(如 `multilingual-e5-small`/`paraphrase-multilingual-MiniLM` 類,透過 transformers.js 或預先批次計算)為預設,理由:語料 3 萬+ 句但屬一次性建索引、查詢量小,本機即可;且符合「離線可重現、不依賴付費服務」的 Goal。**API 嵌入**(如 OpenAI/Cohere)列為選配以求更高品質,但不作為必要依賴。中文 query 對阿美語句檢索採「以中文側比對」:語料每句存中文翻譯,query 為中文,故在**中文語意空間**做相似度即可,避免阿美語零資源嵌入品質不足的問題。
- 替代方案:純關鍵字/TF-IDF(已有 corpus-search 做關鍵字,語意覆蓋不足)→ 不採為主力,但作為無嵌入時的退化備援。

### Decision: D2 — 平行句語料統一 schema 並標記授權、方言與句法

所有來源正規化成統一物件 `{ amis, chinese, source, license, dialect, grammar_cat?, level? }`。`source` ∈ `"grmpts"|"klokah-culture"|"klokah-situational"|"klokah-shortread"|"readnews-title"|"moedict"|"news"`;`license` ∈ `"CC0"|"CC-BY-NC-SA"|"fair-use"`;`dialect` 記方言(海岸/秀姑巒/…),供檢索時依目標方言過濾或加權。grmpts 來源另帶 `grammar_cat`(12 類句法分類)與 `level`(初/中/高/高階)。解析兩種格式:klokah `read-sentence Ab/Ch`(族語 div 內含尾隨中文,於首個中文字切除)、萌典 `￹...Amis...￺￻...中文...`(去除 `` ` `` 與 `~`)。授權驅動用途:`CC0` 可自由用;`CC-BY-NC-SA`/`fair-use` 僅供檢索參考、輸出時不得原句外洩到維基。
- 替代方案:把例句塞回 dict-database.json(現狀,被當詞彙附屬,無法當句語料用)→ 不採。

### Decision: D6 — 輸出目標維持海岸,非海岸語料標 dialect 當語順參考

翻譯/校對輸出目標方言固定為海岸(Pasawalian),不因萌典秀姑巒語料規模大而改變目標。非海岸語料(萌典秀姑巒、其他方言 grmpts/文化篇)以 `dialect` 標記,檢索時可優先海岸、跨方言句僅作**語順範本**參考而非直接輸出。依據:實測海岸 vs 秀姑巒功能詞差異 70%+,直接挪用會露出他方言口音;但語序(VSO/格位/焦點)跨方言共通,故語順範本仍有效。另建 `glossary/dialect-diff.json`(海岸↔秀姑巒對照,功能詞優先,來源為五方言同題文化篇/grmpts 與 klokah 詞表兩欄),供「跨方言句套用時的功能詞校正」。
- 替代方案:全面改以秀姑巒為輸出(對齊萌典 3 萬句)→ 與既有海岸 AI 翻譯系統、Singapore 校對成果、config 目標衝突,等於轉向,不採。
- 替代方案:嚴格排除非海岸語料 → 海岸整句量不足、RAT 檢索效益大減,不採。

### Decision: D7 — grmpts 為海岸主力來源,萌典降為跨方言參考

主力平行句來源由「萌典例句(秀姑巒,CC0)」改為 **klokah 句法演練 grmpts(海岸,CC BY-NC-SA)**。理由:grmpts 為目標方言海岸、句級全對齊、且每句帶句法分類與級別標籤,可直接支援「按句法現象檢索」並佐證 `amis-grammar-rules`,品質對本專案優於萌典日常字典例句。萌典 3 萬句仍納入語料(CC0、可發布、規模大)但定位為跨方言語順參考。
- 替代方案:仍以萌典為主 → 方言不符目標、且無句法標籤,檢索範本對海岸百科文體幫助有限,不採。

### Decision: D3 — 兩步翻譯流程(草稿 → 修語順),檢索與規則只在第二步介入

第一步維持既有 ILRDF/萌典草稿;第二步以 LLM 在 in-context 注入「該句的相似平行範例(top-k)+ 相關文法規則 + 已確認詞庫」做語順修整。理由:符合研究「retrieve-then-apply」與「兩步翻譯」,且不破壞既有第一步。
- 替代方案:一步到位(直接讓 LLM 翻)→ 阿美語零資源下幻覺高,已驗證 ILRDF 用詞較穩,故保留其為第一步。

### Decision: D4 — 詞庫從 baseline vs reviewed 差異自動抽取候選,人工篩選後入庫

利用平台既有 `ami_baseline`(草稿)與 `ami_reviewed`(老師版)做逐詞 diff,抽出「刪除/替換/新增」作為詞庫候選(詞對應、避用詞、規則),候選需經篩選(通用 vs 一次性)才寫入 `glossary/teacher-confirmed.json`。理由:平台已存這兩欄,回饋資料免費取得;這是研究最缺的「黃金示範」來源。
- 替代方案:全自動入庫 → 會收進一次性/錯誤對應,污染詞庫,故保留篩選關卡。

### Decision: D5 — 文法規則以人類可讀 + 機器可套的 checklist 表示

阿美語核心(VSO 語序、格位標記 o/ko/to/no、焦點系統、數字阿拉伯)寫成 `glossary/amis-grammar-rules.md`,每條含「規則 + 可檢查的判準/反例」,供第二步 LLM 套用與人工核對。
- 替代方案:把文法寫成形式化 code(研究的 grammar-as-code)→ 阿美語形態複雜、投入大且研究尚無確證收益,先以 checklist 起步,保留日後升級空間。

## Implementation Contract

**Behavior / 介面(以 node 腳本與資料檔為主,沿用現有 repo 慣例):**

- `node glossary/build-corpus.mjs` → 產出 `glossary/parallel-corpus.json`:陣列,元素 `{ amis, chinese, source, license, dialect, grammar_cat?, level? }`(見 D2)。解析來源:grmpts CSV(`200族語e樂園/句法演練/*.csv`,帶 grammar_cat/level)、文化篇/情境/短文 CSV(`200族語e樂園/`)、readnews 標題(`200族語e樂園/族語新聞/*.csv` 的標題族語↔中文)、萌典 `example`(去 `` ` ``/`~`、切 `￹`/`￺`/`￻`)、既有 `glossary/corpus/` news md。輸出須印出各來源/各方言計數與總數。
- `node glossary/build-dialect-diff.mjs` → 產出 `glossary/dialect-diff.json`:海岸↔秀姑巒對照,來源為 klokah 詞表(`klokah-wordlist.csv` 海岸/秀姑巒兩欄)與五方言同題文化篇/grmpts 對齊;標出拼法不同者(功能詞優先),供跨方言句套用時的功能詞校正。輸出須印出差異比率與功能詞差異統計。
- `node glossary/search-corpus.mjs "<中文句>" [--k N]` → 回傳 top-k 最相近平行句(預設 k=5),每筆含相似度分數、amis、chinese、source、license。無嵌入索引時退化為關鍵字比對並標明 degraded。
- `node glossary/extract-from-edits.mjs <articleId>` → 讀 Firestore 該文章各 section 的 `ami_baseline` vs `ami_reviewed`,逐詞 diff,輸出候選 `{type: "term"|"avoid"|"sentence", zh?, from?, to?, sectionId}`,寫到 `glossary/edit-candidates.json`(不直接入庫)。
- `node glossary/apply-glossary.mjs <文字或檔>` → 依 `teacher-confirmed.json` 的 terms/avoid/rules 對輸入做替換/標記,輸出處理後文字 + 套用了哪些規則的清單。
- `glossary/teacher-confirmed.json` schema:`{ terms: [{zh, ami, note, by, date}], avoid: [{ami, reason, use}], rules: [{rule, example?}] }`。
- `glossary/amis-grammar-rules.md`:每條規則含標題、敘述、判準/反例。

**Failure modes:** 來源檔缺失 → 該來源計 0 並警告、不中斷其他來源;Firestore 無 `ami_baseline` → 該 section 跳過並提示;無嵌入模型 → search 退化關鍵字並標 degraded(不報錯)。

**Acceptance criteria:**
- build-corpus 產出語料筆數 ≥ 30,000,且每筆有非空 amis/chinese、合法 license 與 dialect;grmpts 來源筆數有非空 grammar_cat/level。海岸來源(grmpts/文化篇/情境/短文)合計 ≥ 3,500 句。
- build-dialect-diff 產出海岸↔秀姑巒對照,印出整體差異比率與功能詞差異統計,且功能詞類(代名詞/指示詞/助詞/助動詞)差異筆數 > 0。
- search-corpus 對一個樣本中文句能回傳 k 筆、分數遞減排序。
- extract-from-edits 對 Singapore 既有 baseline/reviewed 能抽出 ≥1 個 term 候選。
- apply-glossary 能把 `avoid` 詞標出、`terms` 對應替換。

**Scope boundaries:** 本變更只建「資料 + 檢索/抽取/套用腳本 + 文法 checklist」。**不**改動編輯器 UI、**不**自動把候選入庫(人工篩選)、**不**把第二步 LLM 流程接成全自動服務(先提供可手動執行的腳本與流程文件)。

## Risks / Trade-offs

- [萌典例句可能含方言混雜或與秀姑巒不一致] → schema 標 source,檢索可按 dialect/source 過濾;第二步由老師把關。
- [本機嵌入對中文短句語意區辨有限] → 提供關鍵字退化備援;k 取大一點再由規則/老師篩。
- [diff 抽取產生雜訊候選] → 候選不直接入庫,人工篩選關卡;只收可重用者。
- [LLM 第二步仍可能改壞語順] → 維持兩步、第二步輸出仍進校對平台由老師接受/拒絕(沿用追蹤修訂)。
- [NC 授權外洩風險] → license 欄位 + 「僅檢索參考、不原句輸出」規則,apply/search 對 NC 句僅作內部參考。

## Migration Plan

1. 純新增,不動既有產物;先建語料與詞庫種子(可離線執行)。
2. 先以腳本手動跑通「檢索 → 兩步翻譯 → 校對 → 回饋」一輪(以 Singapore 為試點)。
3. 驗證有效後再考慮把流程文件化/半自動化(後續變更)。
- 回退:刪除 `glossary/*.json` 與新腳本即可,無資料庫 schema 變更、不影響平台。

## Open Questions

- 嵌入模型最終選型(本機模型具體型號 / 是否接受 API 選配)待 apply 階段以實測決定。
- 詞庫候選的「通用 vs 一次性」篩選由人工或加啟發式規則,初期人工。
- 方言索引已定(D6):輸出海岸、非海岸標 dialect 當參考;檢索時是否要對非海岸句加距離懲罰,視試點品質再定。
- grmpts/文化篇等是否需全量抓五方言(amis)以擴充句級方言對照,視 dialect-diff 覆蓋率再定;現以海岸為主已可起步。
