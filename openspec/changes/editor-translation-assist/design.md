## Context

校對平台編輯器 `review-app/public/editor.html` 為純前端:Firebase Hosting + Firestore + Google Auth,無自建後端(見專案 config)。它讀 `translations/{id}` 的 `vocab` 與 `translations/{id}/sections/{sid}` 的 `ami_ai`/`ami_reviewed`/`ami_baseline`,存檔時寫 `ami_reviewed`/`ami_baseline`/`comments`/`reviewed_by`/`reviewed_at`。RAT(retrieval-augmented-translation)已規劃產出 `glossary/parallel-corpus.json`(平行句,帶 dialect/source/license,grmpts 另帶 grammar_cat/level)、`glossary/teacher-confirmed.json`(terms/avoid/rules)、`glossary/amis-grammar-rules.md`、`glossary/search-corpus.mjs`(相似度檢索 CLI)。老師審稿在 editor 進行,但這些產出目前只有 CLI 介面,老師無法即時使用。

## Goals / Non-Goals

**Goals:**

- 讓老師在 editor 審稿當下即時看到:該段的相似真實阿美語例句、避用/確認詞提示、文法待核對清單。
- 維持現有純前端架構,不新增後端服務或前端重運算。
- UI 落實授權守則:NC/合理使用句僅供參考,不提供一鍵貼入發布內容。

**Non-Goals:**

- 不在前端即時跑相似度檢索;不新增 Cloud Function。
- 不改動 RAT 既有腳本行為;不自動改寫/發布譯文。

## Decisions

### Decision: D1 — 採「預先計算 + 寫 Firestore」而非前端即時查或新增後端

editor 無後端、語料 3 萬+句,前端即時相似度檢索不可行。三方案:(a)建置階段以 RAT CLI 預算每段建議寫入 Firestore、(b)Firebase Cloud Function callable 即時查、(c)前端載入精簡索引本機查。採 **(a) 預先計算**:符合「純前端、不增後端、離線可重現」現況,成本最低;每段建議於匯入/建置時算好,editor 只讀。代價是建議非即時(條目內容或詞庫更新後需重跑建置腳本),可接受,因條目翻譯與校對為批次節奏。
- 替代方案 (b) Cloud Function:即時但新增 infra/部署/費用,且超出現有架構;列為日後若需即時性再評估。
- 替代方案 (c) 前端索引:3 萬+句索引下載與本機計算對瀏覽器負擔大,且嵌入模型上前端複雜,不採。

### Decision: D2 — suggestions 以 section 為單位、結構固定,並逐筆帶授權與方言

於 `translations/{id}/sections/{sid}` 新增欄位 `suggestions`,結構:`{ similar: [{amis, chinese, source, license, dialect, grammar_cat?, score}], glossary_hits: [{term, type: "avoid"|"term", reason?, suggest?, span?}], grammar_checklist: [{rule, note?}], built_at }`。`similar` 每筆帶 `license`/`dialect`,前端據以決定顯示樣式與互動限制;`glossary_hits` 標出草稿中命中的避用/確認詞;`grammar_checklist` 為該段相關規則項。固定結構讓 editor 顯示邏輯單純、且與 RAT schema 對齊。

### Decision: D3 — 相似句查詢以 section 的中文為 query,預設方言過濾海岸

build-suggestions 對每段以其 `zh_text`(或中文來源)為 query 呼叫 `search-corpus.mjs --dialect 海岸`,取 top-k(預設 5);若海岸不足可補跨方言但保留 dialect 標記由前端標示。理由:輸出目標為海岸,優先給海岸範本;跨方言僅作語順參考(對齊 RAT 的 D6 方言策略)。

### Decision: D4 — UI 對 NC/fair-use 句封鎖「貼入發布內容」捷徑

editor 顯示 `similar` 時,license 為 CC-BY-NC-SA 或 fair-use 的句子 MUST 僅以「參考」樣式呈現,且 MUST NOT 提供把該原句寫入 `ami_reviewed` 的按鈕/拖放;license 為 CC0 的句子可提供「插入參考」之類動作。理由:把 RAT 的授權守則從資料層延伸到互動層,避免老師不慎讓 NC 原句進入會發布到維基的欄位。

## Implementation Contract

**介面(沿用 node 腳本 + Firestore + 既有 editor 前端慣例):**

- `node review-app/build-suggestions.mjs <articleId> [--k N]` → 對該條目每個 section:讀其中文,呼叫 `glossary/search-corpus.mjs` 取相似句、比對 `glossary/teacher-confirmed.json` 標避用/確認詞、依 `glossary/amis-grammar-rules.md` 列相關規則,組成 D2 的 `suggestions` 物件,以 `updateDoc` 寫入 `translations/{articleId}/sections/{sid}.suggestions`。輸出印出各 section 寫入的 similar/glossary_hits/checklist 筆數。RAT 產物缺失時 MUST 報明缺哪個檔並中止(不寫半成品)。
- editor.html 載入 section 時,若該 section 有 `suggestions`,於該段下方渲染三區(相似句、詞庫提示、文法清單);無 `suggestions` 時不顯示該區、不報錯。相似句區對非 CC0 句不顯示「插入」動作。
- style.css 新增三區樣式(摺疊、license 標籤、避用詞紅標)。

**Failure modes:** 某 section 無中文來源 → 跳過該段相似句、仍可出詞庫/文法提示並提示;search-corpus 退化 degraded → suggestions.similar 標 degraded,前端照顯示並標示;Firestore 寫入失敗 → 該段報錯、其餘段續做。

**Acceptance criteria:**

- 對 Singapore 執行 build-suggestions 後,至少一個 section 的 Firestore 文件含非空 `suggestions.similar`(每筆有 amis/chinese/license/dialect)與 `suggestions.grammar_checklist`。
- editor 載入 Singapore 時,有 suggestions 的段顯示三區;對一筆 license=CC-BY-NC-SA 的相似句,畫面無「插入到 ami_reviewed」動作。
- editor 對無 suggestions 的段不顯示三區且不報錯。

**Scope boundaries:** 本變更只動 `review-app`(新增 build-suggestions.mjs、改 editor.html/style.css)與 Firestore section 的 suggestions 欄位。**不**改 RAT 腳本、**不**新增後端服務、**不**改既有存檔(ami_reviewed/ami_baseline)邏輯。

## Risks / Trade-offs

- [建議非即時,內容/詞庫更新後需重跑] → 接受批次節奏;build-suggestions 可隨匯入流程一併跑。
- [老師仍可手動把 NC 句敲進 ami_reviewed] → UI 只能擋捷徑,無法擋手打;以顯示授權標籤與提示降低風險,守則仍靠人。
- [search-corpus 對短中文句語意區辨有限] → 取 top-k 較大、保留 score 由老師判讀;對齊 RAT 既有風險處置。
- [Firestore section 文件變大] → suggestions 控制 k 與欄位精簡,僅存顯示所需。

## Migration Plan

1. 純新增 suggestions 欄位與一支建置腳本,不動既有存檔/顯示邏輯;先以 Singapore 試點。
2. 待 RAT 產物就緒後跑 build-suggestions,於 editor 驗證三區顯示與授權封鎖。
3. 驗證後再考慮把 build-suggestions 併入既有匯入流程。
- 回退:移除 editor 三區渲染與 build-suggestions.mjs、忽略 suggestions 欄位即可,不影響既有校對行為。

## Open Questions

- top-k 與「海岸不足是否補跨方言」的門檻,待試點檢索品質決定。
- grammar_checklist 的「該段相關規則」如何挑選(關鍵字/格位標記偵測 vs 全列),初期可全列核心規則,後續再精準化。
- suggestions 重算時機(每次匯入 vs 手動)待併流程時定。
