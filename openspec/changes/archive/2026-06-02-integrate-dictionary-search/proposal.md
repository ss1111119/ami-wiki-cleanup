## Why

在目前的翻譯校對流程中，校對人員在遇到不熟悉的詞彙或想確認真實語境用法時，必須頻繁跳轉至外部網站（如阿美語萌典或 klokah 族語 E 樂園）查詢。同時，專案現有的 2188 詞教育部學習詞表與新聞/課文語料庫都只是靜態檔案，尚未整理成線上平台可用的查詢工具。本變更旨在將現有詞彙與語料打包成輕量的前端資料庫，並在校對編輯器中整合即時搜尋面板，以加速校對流程並提升翻譯準確度。

## What Changes

- 新增一個建置腳本 `review-app/build-dict.mjs`，用於解析 `glossary/corpus/klokah-wordlist.csv` 與 `glossary/corpus/` 下的平行語料 Markdown 檔案，將其對齊並整合為前端可快速查詢的靜態 JSON 檔案 `review-app/public/dict-database.json`。
- 修改 `review-app/public/editor.html` 以整合「即時字典與語料搜尋面板」UI，支援在校對時於瀏覽器端即時搜尋中文或阿美語，過濾出教育部學習詞彙、方言對照、萌典釋義及語料庫中的真實例句。
- 修改 `review-app/public/style.css`，為搜尋面板與搜尋結果列表添加美觀的樣式與動態效果。

## Non-Goals (optional)

- 不在此階段實作線上的字典編輯或語料新增功能，僅提供唯讀查詢。
- 不使用任何複雜的後端搜尋引擎或外部 API，完全依賴前端載入 `dict-database.json` 進行記憶體內（in-memory）檢索，以確保離線與靜態部署之相容性。

## Capabilities

### New Capabilities

- `dictionary-lookup`: 提供在校對編輯器中即時查詢阿美語基本詞彙、雙方言對照（海岸阿美語/秀姑巒阿美語）與定義的能力。
- `corpus-search`: 提供在校對編輯器中即時檢索平行語料庫中真實例句與上下文對照的能力。

### Modified Capabilities

(none)

## Impact

- Affected specs: dictionary-lookup, corpus-search
- Affected code:
  - New:
    - `review-app/build-dict.mjs`
    - `review-app/public/dict-database.json`
  - Modified:
    - `review-app/public/editor.html`
    - `review-app/public/style.css`

