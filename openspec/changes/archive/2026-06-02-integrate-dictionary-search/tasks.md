<!--
Each task description MUST state:
- the behavior or contract being delivered (what is observably true when the
  task is complete), and
- the verification target that proves completion (test, CLI invocation,
  analyzer check, manual assertion, or content review).

File paths are supporting context for locating the work, never the task
itself. "Edit file X" is not a valid task — it is missing both behavior and
verification.
-->

## 1. 資料處理與建置腳本開發 (Data Processing & Build Script)

- [x] 1.1 實作文字正規化演算法，轉換為小寫並移除大小寫、變音符號（如 `^`）與喉塞音符號（如 `’`、`ʼ`、`'`），以實現 diacritic normalization。本任務對應 `### 決定 4：文字正規化（Diacritic Normalization）演算法`。驗收標準：在建置腳本中加入單元比對測試，驗證 `tosa^` 正規化為 `tosa`、`polo’` 正規化為 `polo` 且符合預期。
- [x] 1.2 實作建置腳本 `review-app/build-dict.mjs` 程式，解析 `glossary/corpus/klokah-wordlist.csv` 教育部學習詞表（欄位包括方言、類別、級別、中文、阿美語、備註）。本任務對應 `### 決定 2：實作建置腳本 build-dict.mjs` 與 `dictionary-data-generation`。驗收標準：執行 `node review-app/build-dict.mjs` 後，能讀取 CSV 並於輸出 JSON 中正確包含對應的詞條欄位與結構。
- [x] 1.3 於建置腳本 `review-app/build-dict.mjs` 中，新增解析 `glossary/corpus/klokah-cu-amis-vocab.md` 與 `glossary/corpus/klokah-readingtext-vocab.md` 表格，並與 CSV 解析出的單字依相同阿美語拼寫進行合併與排重，附加對應的例句與方言定義。本任務對應 `### 決定 2：實作建置腳本 build-dict.mjs` 與 `dictionary-data-generation`。驗收標準：執行建置腳本後，產生的 JSON 檔案中，同一拼寫單字（如 `cecay`）在 `dictionary` 陣列中只有一個元素，且包含合併後的所有方言定義與例句。
- [x] 1.4 於建置腳本 `review-app/build-dict.mjs` 中，新增解析 `glossary/corpus/news-ilrdf-2021-2022.md` 與 `glossary/corpus/news-ilrdf-2021-2022-b.md` 平行語料庫，提取阿美語及中文段落。本任務對應 `### 決定 2：實作建置腳本 build-dict.mjs` 與 `corpus-data-generation`。驗收標準：執行建置腳本後，產生的 JSON 檔案中應包含 `corpus` 陣列，內含所有的阿美語新聞對照段落。
- [x] 1.5 將前述所有整理好的字典單字定義、例句以及語料庫段落彙整，建置輸出為單一 JSON 格式檔案 `review-app/public/dict-database.json`。本任務對應 `### 決定 1：整合單一 JSON 資料庫格式`、`dictionary-data-generation` 與 `corpus-data-generation`。驗收標準：驗證 `review-app/public/dict-database.json` 檔案成功生成，檔案大小大於 0B，且 JSON 語法格式正確。

## 2. 編輯器搜尋面板 UI 與搜尋功能開發 (UI & Search Implementation)

- [x] 2.1 修改 `review-app/public/editor.html` 與 `review-app/public/style.css`，在右側新增一個可收合的「詞彙與語料搜尋」面板 UI。本任務對應 `### 決定 3：前端搜尋面板 UI 整合與搜尋邏輯`。驗收標準：於瀏覽器開啟 `review-app/public/editor.html`，可在畫面右側看到美觀的搜尋面板，且點擊收合按鈕能正常展開與折疊。
- [x] 2.2 實作搜尋面板的 JSON 資料非同步載入功能。驗收標準：編輯器頁面載入時，透過 `fetch` 載入 `dict-database.json` 到記憶體中；若載入失敗或尚未載入完成，輸入框顯示為 disabled 且顯示載入中提示；載入成功後輸入框解鎖。
- [x] 2.3 實作詞彙搜尋與變音符號忽略比對邏輯，支援同時搜尋阿美語和中文定義。本任務對應 `### 決定 4：文字正規化（Diacritic Normalization）演算法` 與 `word-query-and-matching`。驗收標準：在搜尋框輸入帶有或不帶有變音/喉塞音的字元（如輸入 "tosa" 或 "tosa^"），均能精確匹配到 "tosa^" 這個詞條。
- [x] 2.4 實作平行語料庫全文搜尋與忽略變音符號比對邏輯。本任務對應 `### 決定 4：文字正規化（Diacritic Normalization）演算法` 與 `corpus-fulltext-search`。驗收標準：在搜尋框輸入 "Biden" 或 "美國"，能篩選並回傳符合的新聞平行語句。
- [x] 2.5 實作搜尋結果的高亮顯示（Highlighting）與渲染。本任務對應 `query-results-rendering` 與 `corpus-results-rendering`。驗收標準：在搜尋面板中將匹配到的關鍵字以醒目樣式標示，並提供「點擊例句即可複製」的互動功能。
- [x] 2.6 整合字典搜尋與語料搜尋的頁籤切換（Tab Navigation） UI，並針對無搜尋結果進行防呆顯示。本任務對應 `query-results-rendering` 與 `corpus-results-rendering`。驗收標準：輸入查無資料的字詞時，結果區顯示「未找到相關詞彙或語料」提示。

