## Context

在目前的翻譯校對流程中，校對人員在遇到不熟悉的詞彙或想確認真實語境用法時，必須頻繁跳轉至外部網站（如阿美語萌典或 klokah 族語 E 樂園）查詢。同時，專案現有的 2188 詞教育部學習詞表與新聞/課文語料庫都只是靜態檔案，尚未整理成線上平台可用的查詢工具。本設計旨在將這些資源整合為單一前端 JSON 資料庫，並在 Firebase 部署的校對編輯器中整合即時搜尋面板，以加速校對流程並提升翻譯準確度。

## Goals / Non-Goals

**Goals:**
- 提供無縫的即時搜尋體驗，支援在翻譯編輯器中同時查詢單字與語料庫例句。
- 支援忽略大小寫、變音符號（如 `^`）與喉塞音符號（如 `’`、`ʼ`、`'`）的模糊比對。
- 將建置字典/語料資料庫的過程自動化，透過單一建置腳本產生前端可直接使用的靜態檔案。

**Non-Goals:**
- 不在此階段實作字典的線上編輯、新增或刪除功能。
- 不使用任何伺服器端搜尋引擎，所有搜尋邏輯均在瀏覽器端（In-Memory）執行。

## Decisions

### 決定 1：整合單一 JSON 資料庫格式
我們將所有的教育部學習詞表（來自 CSV）、文化篇與閱讀文本詞彙例句（來自 Markdown）、以及族語新聞平行語料（來自 Markdown）整合至單一靜態 JSON 檔案 `dict-database.json`。這能避免前端發起多次 HTTP 請求，並簡化資料載入流程。
JSON 的格式設計如下：
```json
{
  "dictionary": [
    {
      "word": "cecay",
      "normalized": "cecay",
      "definitions": [
        { "dialect": "海岸", "category": "01數字計量", "level": "初級", "chinese": "一", "remarks": "" }
      ],
      "examples": [
        { "amis": "Masolinga’ to no mako...", "chinese": "我已經把所有的東西..." }
      ]
    }
  ],
  "corpus": [
    {
      "amis": "Ni Pasadak a Miketon ko Amirika...",
      "chinese": "美國正式發布公告..."
    }
  ]
}
```
- **替代方案評估**：拆分成多個 JSON 檔案。不採用的原因在於本專案資料總量極小（小於 1MB），單一請求載入更為單純，且能保證搜尋面板載入後的所有查詢均為即時回應。

### 決定 2：實作建置腳本 `build-dict.mjs`
我們將建立一個 Node.js 腳本 `review-app/build-dict.mjs`：
1. 解析 `glossary/corpus/klokah-wordlist.csv`，將其轉換為結構化的單字定義。
2. 解析 `glossary/corpus/klokah-cu-amis-vocab.md` 與 `glossary/corpus/klokah-readingtext-vocab.md` 中的 Markdown 表格，提取單字、中文、例句（阿美語與中文對照），並與 CSV 中已有的單字合併（若單字相同，則將例句與額外定義附加至該單字項下）。
3. 解析 `glossary/corpus/news-ilrdf-2021-2022.md` 與 `glossary/corpus/news-ilrdf-2021-2022-b.md`，提取阿美語與中文對照的平行語句段落，存入 `corpus` 陣列。
最終將結果寫入 `review-app/public/dict-database.json`。
- **替代方案評估**：手動整理或在前端動態解析 Markdown/CSV。不採用的原因在於這會極大增加前端載入時間與瀏覽器端解析的程式碼複雜度，預先建置是更好的做法。

### 決定 3：前端搜尋面板 UI 整合與搜尋邏輯
在 `review-app/public/editor.html` 中新增一個可折疊或固定在右側的「搜尋面板」：
1. 包含輸入框、清除按鈕，以及「詞彙結果」與「語料例句」兩個頁籤或分區。
2. 當使用者輸入查詢詞時，使用 JavaScript 執行 filter 過濾：
   - 對於 `dictionary`：比對單字（忽略變音符號）或中文定義。
   - 對於 `corpus`：比對阿美語段落（忽略變音符號）或中文對照段落。
3. 搜尋結果中高亮（Highlight）匹配的關鍵字，並提供點擊例句即可複製到剪貼簿的功能，以方便校對老師參考。
- **替代方案評估**：整合外部 API（如萌典 API）。不採用的原因在於外部請求可能受限於網路連線、跨網域限制（CORS），且無法包含我們自有的新聞語料庫。

### 決定 4：文字正規化（Diacritic Normalization）演算法
為了處理阿美語拼寫中常見的音標與變音符號變異，我們實作一個 `normalizeText` 函數：
1. 將所有英文字母轉為小寫。
2. 使用正規表達式移除變音符號 `^`。
3. 將多種不同的喉塞音符號統一移除（包括 `’`、`ʼ`、`'` 等）。
例如：`tosa^` 被正規化為 `tosa`；`polo’` 被正規化為 `polo`。
此演算法將同時用於 `build-dict.mjs`（產生單字的 `normalized` 屬性）以及前端搜尋過濾邏輯（對使用者輸入的關鍵字進行相同的正規化處理後再比對）。
- **替代方案評估**：精確匹配。不採用的原因在於校對人員輸入時可能不會輸入變音符號或會使用不同的單引號字元，精確比對會導致許多相關詞彙無法被搜尋到。

## Implementation Contract

### 觀察行為 (Observable Behavior)
- 建置階段：執行 `node build-dict.mjs` 後，在 `review-app/public/` 下成功產生 `dict-database.json` 檔案。
- 編輯器頁面：在 `editor.html` 的右側會出現一個「詞彙與語料搜尋」面板。使用者輸入關鍵字後，系統即時列出匹配的教育部詞彙（標示方言、難易度、備註與例句）與平行語料句對。

### 介面與資料格式 (Interface & Data Shape)
產生的 JSON 格式必須符合：
- 根物件包含 `dictionary` 與 `corpus` 兩個鍵。
- `dictionary` 陣列中的物件包含：`word` (string), `normalized` (string), `definitions` (array of definition objects), `examples` (array of example objects)。
- `corpus` 陣列中的物件包含：`amis` (string), `chinese` (string)。

### 錯誤與容錯處理 (Failure Modes)
- 若 `dict-database.json` 載入失敗或尚未產生，編輯器介面應在搜尋面板顯示「資料庫載入中或未完成建置...」的提示，且搜尋輸入框應處於 disabled 狀態。
- 搜尋時若無匹配結果，應顯示「未找到相關詞彙或語料」。

### 驗收標準 (Acceptance Criteria)
1. 執行 `node build-dict.mjs` 無錯誤，並產生大於 0B 的 `review-app/public/dict-database.json`。
2. 在瀏覽器開啟 `editor.html`，輸入 "cecay"，搜尋結果應顯示 `cecay`（中文：一，海岸與秀姑巒方言）。
3. 輸入 "biden"，語料庫結果應顯示含有 "Biden" 總統名字的新聞對照句子。
4. 輸入 "tosa"，搜尋結果應正確匹配到 "tosa^"（秀姑巒）與 "tosa"（海岸）。

## Risks / Trade-offs

- [風險] 單一大 JSON 檔案在低階裝置上載入較慢。 → [緩解措施] 本專案總資料量預期在 1MB 以下，且 Firebase Hosting 支援 gzip/brotli 壓縮，傳輸體積非常小，載入後查詢均在記憶體中進行，體驗極佳。
- [風險] 拼寫不一致導致有些詞搜不到。 → [緩解措施] 實作 diacritic normalization 機制，移除了所有喉塞音與變音符號，大幅提高匹配成功率。

