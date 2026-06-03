## Why

AI 翻譯初稿(ILRDF/萌典)用詞大致可用,但**語順不自然**,而語順正是族語老師花最多力氣、且工具最難代勞的校對項目。我們手上其實已有 ~500 組真人撰寫的阿美語↔中文平行例句(族語E樂園 klokah 例句 + 新聞語料),以及 4 萬詞萌典,但目前只當「詞彙」用,平行句被埋在字典裡未善用。低資源語言翻譯的近期最佳做法(檢索增強 in-context 翻譯、相似度選範例、文法規則檢索、兩步翻譯)正好能把這些既有資產轉成「降低老師校對量」的槓桿;而我們獨有的「族語老師在線校對」更是研究公認最缺的黃金示範來源——每次校對都能回饋成新的平行句。

## What Changes

- 抽出平行句建成獨立的**翻譯記憶語料**(非編輯器關鍵字搜尋,而是供翻譯參考的語意檢索)。**海岸方言**為輸出目標,故主力來源改採 **klokah 句法演練(grmpts)**——海岸已抓 2,018 句、句級全對齊,且每句自帶**句法分類**(名詞/靜態動詞/靜態動詞完成式/動態動詞/存在擁有/焦點系統/時間描述詞/空間方位/代名詞/連動結構/否定句/疑問詞)與**級別**(初/中/高/高階)標籤,可按句法現象檢索並直接餵 `amis-grammar-rules`。輔以本地 `200族語e樂園/` 既抓 klokah 單元(文化篇海岸 240 句百科文體、情境族語課文 919、族語短文課文 463)、klokah 族語新聞(readnews,標題平行)、以及 **g0v 萌典例句(`dict/dict-amis-safolu.json` 等 `example`,約 32,890 組,CC0,屬秀姑巒系)** 作**跨方言語順參考**。
- **方言策略**:輸出維持海岸(Pasawalian);非海岸語料(萌典秀姑巒、其他方言)標 `dialect` 當「語順範本」參考,**不**直接當海岸輸出。實測 klokah 詞表海岸 vs 秀姑巒 44.7% 拼法不同,且差異集中在**功能詞**(代名詞/指示詞/助詞/助動詞 70%+)、**實詞較相近**(數字/身體/動物 20–26%),故須建**句級方言對照**(用五方言同題文化篇/grmpts 對齊)、功能詞優先,作為跨方言參考的校正依據。方言編號 1–43(12 空號)三系統(文化篇/cu_data/grmpts)共用,海岸=3。
- 提供**相似度檢索**:給一句中文,回傳語料中結構/語意最相近的真實阿美語句,當翻譯範本(few-shot)。
- 建立**老師確認詞庫**(詞對應 / 避用詞 / 規則),並以**自動成長**機制從老師每次修改抽取(比對 Firestore `ami_baseline` 與 `ami_reviewed` 的差異)。
- 將阿美語**核心文法規則**(VSO 語序、格位標記 o/ko/to/no、焦點系統、數字用阿拉伯)編成**可套用的 checklist**。
- 以上組成**兩步翻譯**流程:① ILRDF/詞庫出草稿 → ② 用檢索範例 + 文法規則修語順,輸出更接近自然語順的草稿給老師。

## Non-Goals

- 不訓練/微調模型(維持使用 ILRDF API + LLM in-context,無自建訓練)。
- 不取代老師;母語驗證仍是品質天花板,系統目標是「讓老師只剩語順與拍板要做」。
- 不自動發布;一切仍經校對平台由老師確認後才上線。
- 不把 CC BY-NC-SA 例句原句貼入維基(僅作翻譯/校對參考)。
- 詳細演算法、嵌入模型選型、檢索與兩步流程編排寫在 design.md。

## Capabilities

### New Capabilities

- `translation-memory`: 從 klokah 句法演練(grmpts,海岸 2,018+ 句,主力)、klokah 文化篇/情境/短文(`200族語e樂園/`)、klokah 族語新聞標題、萌典例句(~32,890,CC0,跨方言參考)抽出平行句,建成翻譯記憶語料並提供相似度檢索(給中文句 → 取最相近的阿美語平行句當範本)。每筆標 `dialect`、`source`、`license`,grmpts 另帶 `grammar_cat`/`level`。需解析 klokah `read-sentence Ab/Ch` 與萌典 `￹...Amis...￺￻...中文...` 兩種格式。
- `teacher-glossary`: 老師確認詞庫(詞對應 / 避用詞 / 規則),具備從 `ami_baseline` vs `ami_reviewed` 差異自動抽取候選、經篩選後累積的成長機制,翻譯前自動套用。
- `amis-grammar-rules`: 將阿美語核心語法(語序、格位、焦點、數字規範)結構化成可在「修語順」步驟套用的 checklist。

### Modified Capabilities

<!-- 既有 corpus-search(關鍵字搜尋)與 dictionary-lookup(詞彙)之需求不變;本變更僅新增上層檢索/詞庫/規則能力,沿用其產出的資料,不更動其既有需求。 -->

## Impact

- **新增**:`glossary/parallel-corpus.json`(平行句語料)、`glossary/dialect-diff.json`(海岸↔秀姑巒句級/詞級方言對照)、`glossary/teacher-confirmed.json`(詞庫)、`glossary/amis-grammar-rules.md`(文法 checklist);node 腳本 `build-corpus.mjs`、`search-corpus.mjs`(相似度檢索)、`build-dialect-diff.mjs`(建方言對照)、`extract-from-edits.mjs`(從 Firestore 差異抽詞/句)、`apply-glossary.mjs`。
- **已新增(抓取腳本,本變更已落地)**:`200族語e樂園/句法演練/scrape_grmpts.py`(grmpts;海岸已產 `3_海岸阿美語.csv` 2,018 句)、`200族語e樂園/族語新聞/scrape_readnews.py`(readnews;海岸已產 19 篇)。
- **沿用**:既有 `dict/dict-amis-safolu.json`/`dict-amis.json`(萌典,CC0,秀姑巒系)、`200族語e樂園/`(klokah 文化篇/情境/短文/十二階/wawa 已抓 csv/xlsx)、`glossary/corpus/` klokah 與新聞來源檔、Firestore `translations/*/sections`(讀 baseline/reviewed 做回饋)。
- **授權分層**:語料每句須標來源/授權/方言;CC0(萌典)可自由用;CC BY-NC-SA(klokah grmpts/文化篇等)僅供翻譯參考、不得原句貼維基;readnews 為著作權法合理使用轉載(非 CC),標題與內文皆不得貼維基。
- **外部依賴**:句向量(嵌入)以供相似度檢索——選型於 design.md 決定(本機輕量模型 vs API),需評估離線可用性與成本。
- **不破壞**:不更動既有校對平台行為、不更動既有 build-dict 產物;為附加層。
