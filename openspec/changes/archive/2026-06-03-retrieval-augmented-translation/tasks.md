## 0. 語料抓取(klokah 來源)

- [x] 0.1 實作 `200族語e樂園/句法演練/scrape_grmpts.py`(grmpts):由 `grmpts/json/{did}.json` 展開 level×句法分類→tid,經站根 `/text/read_embed.php?tid=&mode=1` 解析 `read-sentence Ab/Ch`,輸出帶 `方言/級別/句法分類/tid/族語/中文` 的 CSV。已對海岸(did=3)跑出 `3_海岸阿美語.csv`(2,018 句)。
- [x] 0.2 實作 `200族語e樂園/族語新聞/scrape_readnews.py`(readnews):分頁抓 `readnews/php/getNews.php?d={did}&t=&p=`,輸出 `方言/日期/news_id/標題族語/標題中文/族語內文/出處`。已對海岸跑出 `3_海岸阿美語.csv`(19 篇)。
- [x] 0.3 [P] 以 `scrape_grmpts.py amis` 與 `scrape_readnews.py amis` 抓阿美五方言(1–5),供句級方言對照。驗證:`200族語e樂園/句法演練/` 與 `族語新聞/` 各出現 1–5 號五個 CSV、每檔列數 > 0。(可延後到 dialect-diff 需要時再跑)

## 1. 平行句語料 translation-memory

- [x] 1.1 實作 `glossary/build-corpus.mjs` 滿足 `parallel-corpus-build`:依設計決策 D2(平行句語料統一 schema 並標記授權、方言與句法)與 D7(grmpts 為海岸主力來源,萌典降為跨方言參考),解析 grmpts CSV(帶 grammar_cat/level)、文化篇/情境/短文 CSV、readnews 標題、萌典 `example`、news md,成 `glossary/parallel-corpus.json`,每筆含 `{amis,chinese,source,license,dialect}`,grmpts 另含 `grammar_cat`/`level`。klokah 族語欄尾隨中文須於首個中文字切除。驗證:總筆數 ≥ 30000、海岸來源合計 ≥ 3500;抽查一筆 grmpts 列(如 `3371,hini katin.,這是牛。`)輸出 `{...,"source":"grmpts","dialect":"海岸","grammar_cat":"名詞","level":"初級"}`;抽查萌典例句正確切成無 `` ` ``/`~`。
- [x] 1.2 在 build-corpus 為每筆標記 `license` 與 `dialect` 滿足 `corpus-license-tagging`:grmpts/文化篇等→CC-BY-NC-SA、moedict→CC0、readnews→fair-use。驗證:`node -e` 統計各 license/各方言筆數皆 > 0,且無 license 或 dialect 為空者。
- [x] 1.3 [P] 依設計決策 D1 — 嵌入模型採可離線的本機多語句向量,API 為選配;實作 `glossary/search-corpus.mjs` 滿足 `parallel-corpus-similarity-search`:以中文 query 回傳 top-k(預設 5)依分數遞減排序,支援 `--dialect`/`--grammar` 過濾、海岸優先;無索引時退化關鍵字並標 `degraded`。驗證:對樣本中文句回傳 k 筆且分數遞減;`--dialect 海岸` 只回海岸;移除索引後仍回傳並標 degraded、不報錯。
- [x] 1.4 [P] 依設計決策 D6(輸出目標維持海岸,非海岸語料標 dialect 當語順參考),實作 `glossary/build-dialect-diff.mjs` 滿足 `dialect-difference-map`:以 `klokah-wordlist.csv` 海岸/秀姑巒兩欄(及五方言同題文化篇/grmpts)比對,輸出 `glossary/dialect-diff.json`,印出整體差異比率與功能詞差異統計。驗證:對詞表執行後 dialect-diff.json 含拼法不同詞對、功能詞類(代名詞/指示詞/助詞/助動詞)差異筆數 > 0(實測整體約 44.7%)。

## 2. 確認詞庫 teacher-glossary

- [x] 2.1 建立 `glossary/teacher-confirmed.json` 與其讀寫,滿足 `glossary-store`:結構含 `terms`/`avoid`/`rules`,並放入第 1 段已確認種子(數字規範、刪重複、政府待統一、langdaway 避用)。驗證:JSON 通過 schema 檢查,terms 條目含 `zh,ami,by,date`。
- [x] 2.2 實作 `glossary/extract-from-edits.mjs` 滿足 `glossary-extract-from-edits`:依設計決策 D4「詞庫從 baseline vs reviewed 差異自動抽取候選,人工篩選後入庫」,讀 Firestore `ami_baseline` vs `ami_reviewed` 逐詞 diff,輸出 `glossary/edit-candidates.json`;候選不直接入庫、缺 baseline 段落跳過。驗證:對 Singapore 執行後 edit-candidates 至少 1 筆 term 候選,且 teacher-confirmed.json 未被改動。
- [x] 2.3 實作 `glossary/apply-glossary.mjs` 滿足 `glossary-apply`:對輸入文字標記 `avoid` 詞(附原因+替代)、可替換 `terms`,並輸出套用清單。驗證:對含 `langdaway` 的句子執行,輸出標記 langdaway 為避用並建議 makofakof。

## 3. 文法規則 amis-grammar-rules

- [x] 3.1 撰寫 `glossary/amis-grammar-rules.md` 滿足 `grammar-rules-document`:依設計決策 D5「文法規則以人類可讀 + 機器可套的 checklist 表示」,涵蓋 VSO 語序、格位標記 o/ko/to/no、焦點系統、數字阿拉伯,每條含判準/正反例。驗證:內容審查確認每條規則具敘述與至少一組正/反例。
- [x] 3.2 提供「待核對規則清單」產出滿足 `grammar-rules-applicable-in-revision`:對一句草稿列出相關規則項、不覆寫原文。驗證:對含多個格位標記的草稿執行,輸出規則清單且原草稿不變。

## 4. 兩步翻譯試點與回饋循環

- [x] 4.1 串接設計決策 D3「兩步翻譯流程(草稿 → 修語順),檢索與規則只在第二步介入」:以腳本/流程文件示範第一步 ILRDF/詞庫草稿、第二步注入 search-corpus 範例 + 文法規則 + 詞庫做語順修整。驗證:對 Singapore 一段中文跑通兩步,產出較原草稿語順更自然的版本供人工判讀。
- [x] 4.2 以 Singapore 為試點跑通「校對 → extract-from-edits → 篩選入庫」一輪正循環。驗證:老師(或測試)在平台改一段後,extract-from-edits 抽出候選、人工篩選後 1 筆寫入 teacher-confirmed.json,再次 apply-glossary 對其他段生效。
