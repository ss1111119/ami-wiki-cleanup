/**
 * Re-fetch articles with empty descriptions and try improved extraction.
 */
import fs from 'fs';

const descs = JSON.parse(fs.readFileSync('scripts/wiki-descriptions.json', 'utf8'));
const empty = Object.keys(descs).filter(k => !descs[k]);
console.log(`有 ${empty.length} 筆空白，重新抓取...`);

const API = 'https://ami.wikipedia.org/w/api.php';
const BATCH = 50;
const DELAY_MS = 400;

function extractChinese(text, title) {
  if (!text) return '';
  text = text.replace(/\s+/g, ' ').trim();
  const head = text.slice(0, 500);

  // Pattern A: （中文）full-width parens
  const mA = head.match(/[（(]([^（(）)]{1,30}[一-鿿][^（(）)]{0,20})[）)]/);
  if (mA) {
    const inner = mA[1];
    if (/[一-鿿]/.test(inner) && !/[a-z]{3}/i.test(inner.replace(/[一-鿿·、。，！？]/g,''))) {
      const chinese = inner.replace(/[^一-鿿··]/g, '').trim();
      if (chinese.length >= 2) return chinese;
    }
  }

  // Pattern B: "Ripong sowal: .../漢字" — Japanese person name format
  // e.g. "(Ripong sowal: やないはら ただお/矢内原 忠雄, 1893...)"
  const mB = head.match(/[Rr]ipong sowal[^)）]*\/([一-鿿\s]{2,20})[,，\s]/);
  if (mB) {
    const cn = mB[1].replace(/\s/g, '');
    if (cn.length >= 2) return cn;
  }

  // Pattern C: title followed directly by Chinese in parens
  // e.g. "Zhang Qilang（張七郎）"
  const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const mC = head.match(new RegExp(escaped + '\\s*[（(]([一-鿿]{2,15})[）)]'));
  if (mC) return mC[1];

  // Pattern D: first 2+ Chinese char cluster in first 200 chars
  const mD = head.slice(0, 200).match(/[一-鿿]{2,15}/);
  if (mD && mD[0] !== '出生' && mD[0] !== '死亡') return mD[0];

  return '';
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

let updated = 0;
for (let i = 0; i < empty.length; i += BATCH) {
  const batch = empty.slice(i, i + BATCH);
  const params = new URLSearchParams({
    action: 'query', prop: 'extracts',
    exintro: '1', explaintext: '1', exsentences: '3',
    titles: batch.join('|'), format: 'json', origin: '*',
  });
  try {
    const res = await fetch(`${API}?${params}`);
    const data = await res.json();
    for (const page of Object.values(data.query?.pages ?? {})) {
      const desc = extractChinese(page.extract ?? '', page.title);
      if (desc && desc !== descs[page.title]) {
        descs[page.title] = desc;
        updated++;
      }
    }
    process.stdout.write(`\r  ${Math.min(i+BATCH, empty.length)}/${empty.length} (更新 ${updated} 筆)`);
    fs.writeFileSync('scripts/wiki-descriptions.json', JSON.stringify(descs, null, 2), 'utf8');
  } catch(e) {
    console.error('\n錯誤:', e.message);
    await sleep(3000);
    i -= BATCH;
    continue;
  }
  if (i + BATCH < empty.length) await sleep(DELAY_MS);
}

console.log(`\n✓ 完成，共更新 ${updated} 筆`);
const withDesc = Object.values(descs).filter(v=>v).length;
console.log(`有說明：${withDesc} / ${Object.keys(descs).length} 筆`);
