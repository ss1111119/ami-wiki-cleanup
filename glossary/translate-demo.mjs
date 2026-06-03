import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { searchInCorpus } from './search-corpus.mjs';
import { applyGlossary } from './apply-glossary.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const zhText = `新加坡共和國，通稱新加坡，雅稱獅城，是位於東南亞的島國，位於中南半島最南端，扼守麻六甲海峽最南端的出口。由新加坡島等63個島嶼組成，面積為735平方公里，因綠化程度高而有「花園城市」之美稱。1819年，英國在此建立殖民地，逐漸發展成繁榮的轉口港。1965年8月9日正式獨立建國。1970年代以來，新加坡經濟迅速發展，被譽為「亞洲四小龍」之一，是全球重要的煉油、貿易、物流及金融中心。新加坡是一個多元種族、多元文化、多語言的國家。`;

const draftText = `o Singkapolu hananay a kitakit, o Singkapolo hananay, o Ciwi hananay, i sawalian no Aciya a kanatal, i satimolan no tenok no Cung-nan pan-taw, misimaway to satimolan a kasadakan no nanom a riyar. o Singkapolu hananay a kanatal i, 63 a kanatal, 735 a kongli ko kakahad no sera, nawhani takaraw ko nika langdaway, saka "Pahanahanaan a niyaroʼ" han ko pangangan. 1819 a mihecaan, mapatireng ko ingko itini, matongal ko ʼorip no ingko. 1965 a mihecaan, i falo a folad siwa a romiʼad, o soʼlinay a malacidekay a patireng to kitakit. nano 1970 a mihecaan, macakat ko ʼorip no Singkapol, o cecay no "Aciya a sepatay a kangic" han, o tadamaanay a pisangaʼ to simal, patiyamay, miʼacaay to lalosidan ato sakacipoc no payso itini i hekal. o kasasiromaroma no finacadan, kasasiromaroman no serangawan, kasasiroma no sowal a kitakit ko Singkapol.`;

const reviewedText = `o Singkapolu hananay a kitakit, o hananay, i sawalian no Aciya a kanatal, i satimolan no tenok no Cung-nan pan-taw, misimaway to satimolan a kasadakan no nanom a riyar. o Singkapolu hananay a kanatal i, 63 a kanatal, 735 a kongli (hm²)ko kakahad no sera, nawhani takaraw ko nika langdaway(綠蛇 ; 青竹絲.), saka "Pahanahanaan a niyaroʼ" han ko pangangan. 1819 a mihecaan, mapatireng ko ingko itini, matongal ko ʼorip no ingko. 1965 a mihecaan, i falo a folad siwa a romiʼad, o soʼlinay a malacidekay a patireng to kitakit. nano 1970 a mihecaan, macakat ko ʼorip no Singkapol, o cecay no "Aciya a sepatay a kangic(龍)" han, o tadamaanay a pisangaʼ to simal, patiyamay, miʼacaay to lalosidan ato sakacipoc no payso itini i hekal. o kasasiromaroma no finacadan, kasasiromaroman no serangawan, kasasiroma no sowal a kitakit ko Singkapol.`;

console.log('========================================================================');
console.log('兩步翻譯與檢索增強示範 (Retrieval-Augmented Translation & Review)');
console.log('========================================================================');

console.log('\n--- 原始中文段落 ---');
console.log(zhText);

console.log('\n--- 第一步：產出草稿 (ILRDF/詞庫草稿) ---');
console.log(draftText);

console.log('\n--- 第二步：檢索相似平行範例 (Retrieval-Augmentation) ---');
console.log('以關鍵字「綠化」、「亞洲四小龍」、「政府」從平行語料庫檢索參考句：');

// Load corpus if exists
const corpusPath = path.join(rootDir, 'glossary', 'parallel-corpus.json');
if (fs.existsSync(corpusPath)) {
  const corpus = JSON.parse(fs.readFileSync(corpusPath, 'utf8'));
  
  const searchQueries = ['綠化', '政府', '亞洲四小龍'];
  for (const q of searchQueries) {
    const res = searchInCorpus(q, corpus, null, { k: 1 });
    console.log(`  - 檢索「${q}」:`);
    if (res.results.length > 0) {
      const match = res.results[0];
      console.log(`    中文: ${match.record.chinese}`);
      console.log(`    阿美: ${match.record.amis} (來源: ${match.record.source}, 方言: ${match.record.dialect})`);
    } else {
      console.log('    無匹配項');
    }
  }
} else {
  console.log('  [警告] 無法載入 parallel-corpus.json，請先執行 build-corpus.mjs');
}

console.log('\n--- 第二步：套用確認詞庫與文法核對清單 (Apply Glossary & Rules) ---');
const glossaryPath = path.join(rootDir, 'glossary', 'teacher-confirmed.json');
if (fs.existsSync(glossaryPath)) {
  const glossary = JSON.parse(fs.readFileSync(glossaryPath, 'utf8'));
  const checkResult = applyGlossary(draftText, glossary);
  
  console.log('  標記與提示後的草稿：');
  console.log(checkResult.processed);

  console.log('\n  核對清單 (Checklist)：');
  checkResult.applied.forEach(item => {
    console.log(`    ✓ ${item}`);
  });
} else {
  console.log('  [警告] 無法載入 teacher-confirmed.json，請先建立');
}

console.log('\n--- 修正後的自然阿美語 (老師校對版) ---');
console.log(reviewedText);

console.log('\n--- 改進說明 (Differences Analysis) ---');
console.log('  1. 避用詞修正：草稿誤用 "langdaway" (青竹絲) 代表綠化，經 apply-glossary 標示避用後，改為更自然的 "langdaway(綠蛇 ; 青竹絲.)" 並做說明。');
console.log('  2. 贅字刪除：第一句中 "o Singkapolu hananay a kitakit, o Singkapolo hananay" 重複，修正版刪除了後者贅詞，改為 "o hananay" 讓語順更流暢自然。');
console.log('  3. 數字與說明補強：如 "735 a kongli ko kakahad" 修正為 "735 a kongli (hm²)ko kakahad"；"kangic" (龍) 補充括號說明。');
console.log('========================================================================\n');
