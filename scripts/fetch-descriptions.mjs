/**
 * Fetch short Chinese descriptions for all wiki articles.
 * Uses MediaWiki extracts API in batches of 50.
 * Output: scripts/wiki-descriptions.json  { "title": "中文說明" }
 */
import fs from 'fs';

const pages = JSON.parse(fs.readFileSync('all-pages.json', 'utf8'));
const API = 'https://ami.wikipedia.org/w/api.php';
const BATCH = 50;
const DELAY_MS = 300; // be polite

const outPath = 'scripts/wiki-descriptions.json';
// Resume from existing output if interrupted
let result = {};
if (fs.existsSync(outPath)) {
  result = JSON.parse(fs.readFileSync(outPath, 'utf8'));
  console.log(`已有 ${Object.keys(result).length} 筆，繼續抓剩下的...`);
}

const remaining = pages.filter(p => !(p in result));
console.log(`還需抓取：${remaining.length} 筆（共 ${pages.length} 筆）`);

// Extract Chinese description from article extract text
function extractChinese(text, title) {
  if (!text) return '';
  // Normalize: remove wiki markup leftovers
  text = text.replace(/=+[^=]+=+/g, ' ').replace(/\s+/g, ' ').trim();

  // Pattern 1: （中文）in full-width parens near start (first 200 chars)
  const head = text.slice(0, 300);
  const m1 = head.match(/[（(]([^\s（(）)]{1,20}[一-鿿＀-￯][^）)]{0,20})[）)]/);
  if (m1) {
    const inner = m1[1];
    // Must contain at least one Chinese char
    if (/[一-鿿]/.test(inner)) return inner.trim();
  }

  // Pattern 2: Chinese chars directly following the title at the start
  // e.g. "Taywan 台灣係..." or title immediately followed by Chinese
  const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m2 = text.match(new RegExp(escaped + '[\\s\\u2019\']*([\\u4e00-\\u9fff]{1,20})'));
  if (m2) return m2[1];

  // Pattern 3: First cluster of 2+ Chinese characters in first 200 chars
  const m3 = head.match(/[一-鿿]{2,15}/);
  if (m3) return m3[0];

  return '';
}

async function fetchBatch(titles) {
  const params = new URLSearchParams({
    action: 'query',
    prop: 'extracts',
    exintro: '1',
    explaintext: '1',
    exsentences: '2',
    titles: titles.join('|'),
    format: 'json',
    origin: '*',
  });
  const url = `${API}?${params}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

let done = 0;
const total = remaining.length;

for (let i = 0; i < remaining.length; i += BATCH) {
  const batch = remaining.slice(i, i + BATCH);
  try {
    const data = await fetchBatch(batch);
    const pages_data = data.query?.pages ?? {};
    for (const page of Object.values(pages_data)) {
      const title = page.title;
      const desc = extractChinese(page.extract ?? '', title);
      result[title] = desc;
    }
    done += batch.length;
    process.stdout.write(`\r  進度：${done}/${total} (${Math.round(done/total*100)}%)`);
    // Save incrementally every batch
    fs.writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf8');
  } catch (e) {
    console.error(`\n批次錯誤 (${i}–${i+BATCH}):`, e.message);
    // Save what we have
    fs.writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf8');
    await sleep(2000);
    i -= BATCH; // retry this batch
    continue;
  }
  if (i + BATCH < remaining.length) await sleep(DELAY_MS);
}

console.log(`\n✓ 完成！共 ${Object.keys(result).length} 筆`);
const withDesc = Object.values(result).filter(v => v).length;
console.log(`  有中文說明：${withDesc} 筆`);
console.log(`  無中文說明：${Object.keys(result).length - withDesc} 筆`);
