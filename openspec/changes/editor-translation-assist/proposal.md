## Why

retrieval-augmented-translation(RAT) 把語料、確認詞庫與文法規則做成了 node CLI 與資料檔,但族語老師審稿的場域是校對平台編輯器 `review-app/public/editor.html`——老師不會、也不該去跑命令列。目前 RAT 的價值只能間接透過「更好的 ami_ai 草稿」與「vocab 面板」傳到老師眼前;老師審稿當下無法即時查相似真實例句、看不到避用詞警示、也沒有逐段文法待核對清單。本變更把 RAT 三項產出搬到老師審稿現場,降低語順與用詞的校對負擔,同時讓老師的判斷成為 RAT 回饋循環的高品質輸入。

## What Changes

- 編輯器每個 section 顯示**相似句參考**:取 RAT 相似度檢索對該段中文的 top-k 真實阿美語平行句,預設只顯示海岸句、跨方言句標註 dialect 供參。
- 編輯器即時標出**避用詞與確認詞**:依 `teacher-confirmed.json` 在草稿(ami_ai/ami_reviewed)中標記 avoid 詞(附原因+建議替代)與已確認 terms。
- 編輯器逐段顯示**文法待核對清單**:依 `amis-grammar-rules.md` 列出該段相關規則項供老師核對,不自動改寫譯文。
- 因 editor 為靜態前端(Firebase Hosting + Firestore + Google Auth,無自建後端),採**預先計算**作法:於建置/匯入階段以既有 RAT CLI 算出每段的相似句/避用詞/文法清單,寫入 Firestore `translations/{id}/sections/{sid}` 的新欄位 `suggestions`;editor 只讀 `suggestions` 顯示,不在前端跑檢索。
- 授權守則落實到 UI:NC/合理使用句僅供老師參考,介面不得提供把這些原句一鍵寫入 `ami_reviewed` 發布內容的捷徑。

## Non-Goals

- 不在前端即時跑相似度檢索、不新增 Cloud Function 後端(本變更刻意走預先計算以維持純前端架構;即時查列為日後選項)。
- 不改動 RAT 既有腳本(`build-corpus.mjs`/`search-corpus.mjs`/`build-dialect-diff.mjs` 等)的行為,本變更為其下游消費端。
- 不自動改寫或自動發布譯文;老師仍是唯一拍板者,suggestions 僅供參考。
- 不把 NC/合理使用語料原句寫入會發布到維基的欄位。

## Capabilities

### New Capabilities

- `editor-suggestions-precompute`: 一支建置腳本,對指定條目各 section 用 RAT CLI 算出相似句(top-k)、避用詞/確認詞命中、文法待核對清單,組成 `suggestions` 物件並寫入 Firestore 該 section。每筆相似句保留 dialect/source/license,供前端依授權與方言決定顯示與互動。
- `editor-suggestions-display`: editor.html 讀取 section 的 `suggestions` 並呈現三區(相似句、詞庫提示、文法清單);對 license 為 CC-BY-NC-SA/fair-use 的相似句,UI 僅顯示供參、不提供一鍵貼入 ami_reviewed 的動作。

### Modified Capabilities

(none)

## Impact

- Affected specs: editor-suggestions-precompute、editor-suggestions-display
- Affected code:
  - New: review-app/build-suggestions.mjs
  - Modified: review-app/public/editor.html, review-app/public/style.css
  - Removed: (none)
- 相依:下游於 retrieval-augmented-translation(需其 glossary/parallel-corpus.json、glossary/teacher-confirmed.json、glossary/amis-grammar-rules.md、glossary/search-corpus.mjs 已產出)。
- 外部:Firestore translations/{id}/sections/{sid} 新增 suggestions 欄位;沿用既有 Firebase 專案與 Auth,不新增後端服務。
