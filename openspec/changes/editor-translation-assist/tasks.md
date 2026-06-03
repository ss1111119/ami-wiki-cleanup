## 1. 建議計算 editor-suggestions-precompute

- [ ] 1.1 實作 `review-app/build-suggestions.mjs <articleId> [--k N]` 核心,滿足 `suggestions-build-script`:依設計決策 D1(採「預先計算 + 寫 Firestore」而非前端即時查或新增後端)與 D2(suggestions 以 section 為單位、結構固定,並逐筆帶授權與方言),讀 RAT 產物,對每個 section 組出 `{ similar, glossary_hits, grammar_checklist, built_at }` 並以 updateDoc 寫入 `translations/{id}/sections/{sid}.suggestions`;缺 RAT 產物則報明缺檔並中止、不寫半成品。驗證:對 Singapore 執行後至少一段取得非空 suggestions.similar(每筆含 amis/chinese/source/license/dialect/score);把 `parallel-corpus.json` 暫移走後執行會印缺檔錯誤且未寫入。
- [ ] 1.2 在 build-suggestions 實作相似句計算,滿足 `suggestions-similar-by-section-chinese`:依設計決策 D3,以 section 中文為 query 呼叫 `glossary/search-corpus.mjs --dialect 海岸` 取 top-k(預設 5),保留每筆 dialect/license、海岸優先;無中文來源的段跳過相似句並提示。驗證:有中文的段 similar 依分數遞減且海岸優先;構造一個無中文段,其 similar 為空但 glossary_hits/grammar_checklist 仍產生。
- [ ] 1.3 在 build-suggestions 實作詞庫與文法計算,滿足 `suggestions-glossary-and-grammar`:比對 `teacher-confirmed.json` 標 avoid/term 命中(avoid 帶 reason/suggest)寫 glossary_hits、依 `amis-grammar-rules.md` 列相關規則寫 grammar_checklist,且不改寫譯文。驗證:對含 `langdaway` 的段執行,glossary_hits 含該 avoid 詞與建議 makofakof,且該段 ami_ai/ami_reviewed 未變。

## 2. 編輯器顯示 editor-suggestions-display

- [ ] 2.1 在 `review-app/public/editor.html` 渲染三區,滿足 `section-suggestions-display`:section 有 suggestions 時於該段下方顯示相似句/詞庫提示/文法清單,無 suggestions 則不顯示且不報錯,且不更動既有 ami_reviewed/ami_baseline 存檔邏輯。驗證:載入有 suggestions 的段顯示三區;載入無 suggestions 的段不顯示三區、console 無錯;存檔行為與改前一致。
- [ ] 2.2 依設計決策 D4(UI 對 NC/fair-use 句封鎖「貼入發布內容」捷徑),在 editor.html 實作授權感知互動,滿足 `license-aware-similar-actions`:相似句顯示 dialect/license;license 為 CC-BY-NC-SA 或 fair-use 者僅供參考、不提供寫入 ami_reviewed 的動作,CC0 者可提供「插入參考」。驗證:對一筆 license=CC-BY-NC-SA 的相似句,畫面無插入到 ami_reviewed 的動作;對一筆 CC0 句有該動作。
- [ ] 2.3 在 editor.html 實作跨方言標示,滿足 `non-coast-dialect-labeling`:相似句 dialect 非海岸時明確標示方言並提示為跨方言參考。驗證:對一筆 dialect=秀姑巒 的句子,畫面顯示「秀姑巒」標示與跨方言參考提示。
- [ ] 2.4 [P] 在 `review-app/public/style.css` 新增三區樣式:摺疊、license 標籤、避用詞紅標、跨方言標示。驗證:三區於 editor 呈現符合樣式且不破壞既有版面。

## 3. 試點與驗收

- [ ] 3.1 以 Singapore 為試點跑通「build-suggestions 寫入 → editor 顯示」全鏈,滿足設計 Acceptance criteria。驗證:對 Singapore 執行 build-suggestions 後於 editor 載入,含 suggestions 的段顯示三區、NC 句無插入動作、跨方言句有方言標示;無 suggestions 的段不顯示三區且不報錯。
