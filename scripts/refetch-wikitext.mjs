/**
 * For articles where exintro returns empty, fetch wikitext and extract Chinese
 * from section headings like "== Title (中文) ==" or bold text '''中文'''.
 * Batch size = 20, delay = 1200ms to avoid 429.
 */
import fs from 'fs';

const descs = JSON.parse(fs.readFileSync('scripts/wiki-descriptions.json', 'utf8'));
const empty = Object.keys(descs).filter(k => !descs[k]);
console.log(`空白條目：${empty.length} 筆，開始抓 wikitext...`);

const API = 'https://ami.wikipedia.org/w/api.php';
const BATCH = 20;
const DELAY_MS = 1200;
const bad = new Set(['出生','死亡','是','是的','出生年','生於','概要']);

function extractFromWikitext(wt) {
  if (!wt) return '';

  // Pattern 1: section heading with Chinese "== ... (中文) =="
  const m1 = wt.match(/==\s*[^=\n]*[（(]([一-鿿]{2,15}[^）)]{0,10})[）)][^=\n]*==/);
  if (m1) {
    const cn = m1[1].replace(/[^一-鿿]/g, '');
    if (cn.length >= 2) return cn;
  }

  // Pattern 2: bold text with Chinese "'''中文'''" near start
  const m2 = wt.slice(0, 500).match(/'''([一-鿿]{2,15})'''/);
  if (m2) return m2[1];

  // Pattern 3: Chinese in parens near start of wikitext
  const head = wt.slice(0, 400);
  const m3 = head.match(/[（(]([^（(）)\n]{1,20}[一-鿿][^（(）)\n]{0,15})[）)]/);
  if (m3) {
    const inner = m3[1];
    if (/[一-鿿]/.test(inner) && !/[a-z]{3}/i.test(inner.replace(/[一-鿿·、。，！？]/g,''))) {
      const cn = inner.replace(/[^一-鿿·]/g,'').trim();
      if (cn.length >= 2) return cn;
    }
  }

  // Pattern 4: first Chinese cluster 2+ chars
  const m4 = head.match(/[一-鿿]{2,12}/);
  if (m4 && !bad.has(m4[0])) return m4[0];

  return '';
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

let updated = 0;
let tries = 0;

for (let i = 0; i < empty.length; i += BATCH) {
  const batch = empty.slice(i, i + BATCH);
  const params = new URLSearchParams({
    action: 'query',
    prop: 'revisions',
    rvprop: 'content',
    rvslots: 'main',
    titles: batch.join('|'),
    format: 'json',
    origin: '*',
    formatversion: '2',
  });
  try {
    const res = await fetch(`${API}?${params}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    for (const page of (data.query?.pages ?? [])) {
      const wt = page.revisions?.[0]?.slots?.main?.content ?? '';
      const desc = extractFromWikitext(wt);
      if (desc && !bad.has(desc)) {
        descs[page.title] = desc;
        updated++;
      }
    }
    tries = 0;
    process.stdout.write(`\r  ${Math.min(i+BATCH, empty.length)}/${empty.length}  更新 ${updated} 筆`);
    fs.writeFileSync('scripts/wiki-descriptions.json', JSON.stringify(descs, null, 2), 'utf8');
  } catch (e) {
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
