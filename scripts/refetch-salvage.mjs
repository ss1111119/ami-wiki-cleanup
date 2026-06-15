/**
 * Re-fetch wikitext for empty entries.
 * Improved extraction: strip 由來/概略/歷史/國名 section-heading artifacts,
 * keep the actual place/concept name.
 */
import fs from 'fs';

const descs = JSON.parse(fs.readFileSync('scripts/wiki-descriptions.json', 'utf8'));
const empty = Object.keys(descs).filter(k => !descs[k]);
console.log(`空白條目：${empty.length} 筆`);

const API = 'https://ami.wikipedia.org/w/api.php';
const BATCH = 20;
const DELAY_MS = 1200;

const junk = new Set(['縮圖','歷史','國名','重新導向','概略','出生','死亡','是','是的','概要','臺灣','台灣','國名語源','的漁獲']);

function extractFromWikitext(wt) {
  if (!wt) return '';

  // Pattern 1: section heading == ... ==
  // Extract Chinese from headings, strip trailing noise words
  const headings = [...wt.matchAll(/==+\s*([^=\n]+?)\s*==+/g)].map(m => m[1].trim());
  for (const h of headings) {
    // Must contain Chinese
    if (!/[一-鿿]/.test(h)) continue;
    // Skip pure noise
    if (junk.has(h)) continue;
    // Strip trailing 由來/概略/歷史/之歌/語源 etc.
    let cleaned = h
      .replace(/[（(][^）)]*[）)]/g, '') // remove parens
      .replace(/(由來|概略|歷史|語源|之歌|之舞|之由來|的由來|的歷史|的概略)$/,'')
      .trim();
    if (!cleaned || junk.has(cleaned)) continue;
    if (!/[一-鿿]/.test(cleaned)) continue;
    // Keep only Chinese chars + common punctuation
    const cnOnly = cleaned.replace(/[A-Za-z0-9\s\-_.,!?]/g,'').trim();
    if (cnOnly.length >= 2) return cnOnly;
  }

  // Pattern 2: bold '''中文''' near start
  const m2 = wt.slice(0,500).match(/'''([一-鿿]{2,15})'''/);
  if (m2) return m2[1];

  // Pattern 3: （中文）in first 400 chars
  const m3 = wt.slice(0,400).match(/[（(]([^（(）)\n]{1,20}[一-鿿][^（(）)\n]{0,15})[）)]/);
  if (m3) {
    const inner = m3[1];
    if (/[一-鿿]/.test(inner) && !/[a-z]{3}/i.test(inner.replace(/[一-鿿·、。，！？]/g,''))) {
      const cn = inner.replace(/[^一-鿿·]/g,'').trim();
      if (cn.length >= 2 && !junk.has(cn)) return cn;
    }
  }

  // Pattern 4: Ripong sowal .../漢字
  const m4 = wt.match(/[Rr]ipong sowal[^)）]*\/([一-鿿\s]{2,20})[,，\s]/);
  if (m4) {
    const cn = m4[1].replace(/\s/g,'');
    if (cn.length >= 2) return cn;
  }

  return '';
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
let updated = 0, tries = 0;

for (let i = 0; i < empty.length; i += BATCH) {
  const batch = empty.slice(i, i + BATCH);
  const params = new URLSearchParams({
    action: 'query', prop: 'revisions',
    rvprop: 'content', rvslots: 'main',
    titles: batch.join('|'),
    format: 'json', origin: '*', formatversion: '2',
  });
  try {
    const res = await fetch(`${API}?${params}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    for (const page of (data.query?.pages ?? [])) {
      const wt = page.revisions?.[0]?.slots?.main?.content ?? '';
      const desc = extractFromWikitext(wt);
      if (desc && !junk.has(desc)) {
        descs[page.title] = desc;
        updated++;
      }
    }
    tries = 0;
    process.stdout.write(`\r  ${Math.min(i+BATCH,empty.length)}/${empty.length}  更新 ${updated} 筆`);
    fs.writeFileSync('scripts/wiki-descriptions.json', JSON.stringify(descs, null, 2), 'utf8');
  } catch(e) {
    tries++;
    const wait = Math.min(5000 * tries, 30000);
    process.stdout.write(`\n  錯誤(${e.message.slice(0,20)})，等 ${wait/1000}s...\n`);
    await sleep(wait);
    i -= BATCH;
    continue;
  }
  await sleep(DELAY_MS);
}

console.log(`\n✓ 完成，共更新 ${updated} 筆`);
const withDesc = Object.values(descs).filter(v => v).length;
console.log(`有說明：${withDesc} / ${Object.keys(descs).length} 筆`);
