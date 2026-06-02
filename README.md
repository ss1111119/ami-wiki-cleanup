# 阿美語 Wikipedia 整理計畫

**'Amis Wikipedia Cleanup Project**

整理 [ami.wikipedia.org](https://ami.wikipedia.org) 的條目，消除重複、建立分類、補充內容、連結 Wikidata。

🌐 **網站：** https://ss1111119.github.io/ami-wiki-cleanup/

---

## 現況（2026-06-01）

| 項目 | 數字 |
|------|------|
| 總條目數 | 1,149 篇 |
| 活躍編輯者（近 30 天） | 16 位 |
| 管理員 | 1 位 |

---

## 進度

| 工作 | 狀態 | 說明 |
|------|------|------|
| 重複條目清單 | ✅ 完成 | 約 45 組、60～80 條可 redirect |
| 分類架構草稿 | ✅ 完成 | 五大分類：Fonga、Tamdaw、Pangcah、Taywan、Roma |
| Wikidata 連結（國家） | ✅ 完成 | ~150 條國家條目完成連結，含本次新增 64 條 |
| Wikidata 連結（美國總統） | ⚠️ 部分 | 8 位有實際內容已連結，其餘 37 位為轉址頁面 |
| 執行 redirect | 🔄 進行中 | 依重複條目清單操作 |
| 建立分類頁面 | ⏳ 待開始 | |
| 擴充文化條目 | ⏳ 待開始 | 部落、豐年祭、傳統知識 |

---

## 發現的問題

### 1. 重複條目（~45 組）
同一人物或地點有多個版本，例如 JFK 有 5 個版本、剛果有 8 個版本。
👉 [查看完整清單](https://ss1111119.github.io/ami-wiki-cleanup/duplicates/)

### 2. 美國總統條目大多是空殼
ami Wikipedia 裡 45 位總統中，37 位只是重定向到 `[[Amilika]]`（美國），沒有任何個人內容，也無法加 Wikidata 連結。
需要有人去建立實際條目。

### 3. 國家條目內容很薄
幾乎所有國家條目只有首都、面積、國家元首等基本資料，缺乏歷史、地理、文化描述。

### 4. 分類幾乎空白
大多數條目未加入任何分類，難以瀏覽。

---

## 頁面導覽

| 頁面 | 說明 |
|------|------|
| [首頁](https://ss1111119.github.io/ami-wiki-cleanup/) | 總覽與進度 |
| [重複條目清單](https://ss1111119.github.io/ami-wiki-cleanup/duplicates/) | 需合併的條目，附操作說明 |
| [分類架構草稿](https://ss1111119.github.io/ami-wiki-cleanup/categories/) | 五大分類與實際條目清單 |
| [Wikidata 連結指南](https://ss1111119.github.io/ami-wiki-cleanup/wikidata/) | 阿美語 ↔ 中文維基對照表 |
| [短條目清單](https://ss1111119.github.io/ami-wiki-cleanup/stubs/) | 需補充內容的條目 |

---

## 如何參與

1. 前往 [ami.wikipedia.org](https://ami.wikipedia.org) 註冊帳號（免費）
2. 選一件事開始做：
   - **合併重複條目**：編輯頁面，內容改為 `#REDIRECT [[正確條目名]]`
   - **加分類標籤**：在條目底部加 `[[Kasizengil:Fonga]]` 等標籤
   - **補充條目內容**：參考中文 Wikipedia，用阿美語補充 2～3 段
   - **加 Wikidata 連結**：讓阿美語條目在其他語言 Wikipedia 出現語言切換

有問題或建議歡迎開 [Issue](https://github.com/ss1111119/ami-wiki-cleanup/issues)。

---

---

## 翻譯優先順序討論（待社群決定）

### 美國總統 37 位空殼條目
目前 37 位總統在 ami Wikipedia 只是轉址到 `[[Amilika]]`，中文 Wikipedia 都有完整條目可以參考翻譯。

**但建議優先順序：先做與阿美族文化相關的條目，美國總統放後面。**

理由：美國總統與阿美族的文化連結較弱，對社群讀者的實用性不如本族文化條目。

### 建議翻譯優先順序

| 優先度 | 條目 | 理由 |
|--------|------|------|
| ⭐⭐⭐ | Taywan（台灣） | 最重要的地理條目 |
| ⭐⭐⭐ | O Pangcah（阿美族） | 核心族群介紹 |
| ⭐⭐⭐ | Sowal no Pangcah（阿美語） | 語言本身的介紹 |
| ⭐⭐⭐ | Ilisin（豐年祭） | 最重要的文化條目 |
| ⭐⭐ | Fata'an、Tafalong 等部落 | 各部落詳細介紹 |
| ⭐⭐ | 台灣原住民族各族 | Puyuma、Paiwan… |
| ⭐ | 美國總統（37位） | 有中文可翻，但優先度較低 |
| ⭐ | 各國國家條目補充 | 目前只有基本資料 |

### 翻譯工具（已完成）
- AI 翻譯：[族語基礎翻譯系統](https://ai-labs.ilrdf.org.tw/kari-seejiq-tnpusu-ai-hmjil/)（支援海岸、秀姑巒等方言）
- 詞彙查核：[阿美語萌典](https://new-amis.moedict.tw/)
- 校對平台：[ami-wiki-review.web.app](https://ami-wiki-review.web.app)（老師用 Gmail 登入）
- 翻譯規範：[translations/翻譯規範.md](translations/翻譯規範.md)（⚠️ 數字一律用阿拉伯數字等約定）

---

## 待社群討論的事項

1. **重複條目 redirect** — 清單已整理，需社群同意後執行
2. **翻譯優先順序** — 美國總統 vs 阿美族文化條目，哪個先做？
3. **方言選擇** — 翻譯時以哪種方言為主（目前測試海岸與秀姑巒皆有問題）
4. **分類架構** — 草稿已完成，需社群確認後在 wiki 建立

---

*資料截至 2026-06-02*
