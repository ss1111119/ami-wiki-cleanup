# 阿美語詞庫體系（glossary/）

讓詞彙資料只有**一個真實來源**，避免「同一個詞在多處手動同步」。

## 檔案

| 檔案 | 角色 | 可否手改 |
|------|------|----------|
| `terms.json` | **唯一真實來源**：中文→阿美語＋變體＋來源＋狀態＋例句＋備註 | ✅ 改這裡 |
| `glossary.md` | 由 `terms.json` 自動生成的人類可讀詞表 | ❌ 自動生成 |
| `corpus/` | 平行語料（阿美＋中文新聞），供 grep 真實用法 | ✅ 新增語料檔 |

## 工作流程

1. 查到/修正一個詞 → 改 `terms.json`
2. 跑生成器：
   ```
   cd review-app
   node build-vocab.mjs            # 生成 glossary.md 並推送校對平台(Firestore)
   node build-vocab.mjs --no-push  # 只生成 glossary.md，不碰 Firestore
   ```
3. 校對平台與 `glossary.md` 同步更新，不必再分別改 `import-vocab.mjs` / HTML。

## terms.json 欄位

| 欄位 | 說明 |
|------|------|
| `zh` | 中文詞 |
| `ami` | 主要阿美語詞（海岸方言為主） |
| `ami_xiuguluan` | 秀姑巒若不同才填，否則沿用 `ami` |
| `gloss` / `gloss_xiuguluan` | 萌典／語料定義 |
| `variants` | 拼法變體或同義詞 |
| `source` | 來源（moedict / corpus / 辭典名） |
| `status` | `ok` 正確 / `warn` 偏差待確認 / `err` 不對 / `missing` 未收錄 |
| `examples` | `[{ami, zh}]` 例句（語料佐證） |
| `note` | 校對備註 |
| `articles` | 用於哪些條目（如 `["Singapore"]`）；空陣列＝通用詞庫，不進特定條目的 vocab |

## 語料 corpus/

存放阿美語平行新聞等真實文本。比對某中文詞的真實說法時，直接搜尋：

```
# 例：找「文化」「政府」在語料怎麼說
grep -n "文化\|政府" glossary/corpus/*.md
```

## 參考資源（查詞優先序）

1. **阿美語萌典** <https://new-amis.moedict.tw/> — 多部辭典匯集（蔡中涵、吳明義…），單一辭典非按方言分版。查詞網址：`new-amis.moedict.tw/terms/<word>`
2. **klokah 族語E樂園**（原民會官方）<https://web.klokah.tw/> — 單詞查詢、**分方言學習詞表**、句型篇、情境會話、**族語新聞**（可作平行語料）。權威、可補萌典。
3. **本地語料** `corpus/` — 已存的平行新聞，grep 最快。

> 查詞流程：先 grep `terms.json` + `corpus/`（已知的最快）→ 再查萌典／klokah → 查到就回寫 `terms.json` 累積。

### 已收錄語料

| 檔案 | 內容 | 授權 |
|------|------|------|
| `corpus/news-ilrdf-2021-2022.md`、`-b.md` | 18 則族語新聞（秀姑巒），時事文體 | 使用者提供 |
| `corpus/klokah-cu-amis-vocab.md` | klokah 文化篇 30 課 ×（海岸＋秀姑巒）詞彙＋例句，百科/文化文體 | CC BY-NC-SA 4.0 |
| `corpus/klokah-readingtext-vocab.md` | klokah 閱讀文本 6 篇 ×（海岸＋秀姑巒）詞彙＋例句（全文未開放，僅詞表） | CC BY-NC-SA 4.0 |

> ⚠️ klokah 例句／全文為 **CC BY-NC-SA**：可作校對參考，但**勿原文貼入 ami 維基**（維基為 CC BY-SA，NC 不相容）。詞彙對照（詞＝中文）為事實，可自由使用。

### 再抓 klokah 文化篇的方法

資料端點（免登入）：`https://web.klokah.tw/extension/cu_data/get_data.php?did=<方言id>`
回傳整套 30 課 JSON（含 `article_ab/article_ch` 平行全文、`word` 詞表＋例句）。方言 id：**南勢=1、秀姑巒=2、海岸=3、馬蘭=4、恆春=5**。

> 數字／日期書寫慣例見 [`../translations/翻譯規範.md`](../translations/翻譯規範.md)。
